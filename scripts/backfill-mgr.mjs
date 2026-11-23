#!/usr/bin/env node
/**
 * Read contact_leads from the last 90 days and forward each one to My Green
 * Robot crew intake. SELECT only. Does not insert, update, or delete.
 *
 * Dry-run is the default. Pass --send to POST. --dry-run wins if both are set.
 * Not wired into CI or the app. Do not run it until MGR intake is live.
 *
 * Env (server only, never print these):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MGR_CREW_INTAKE_URL       (required only with --send)
 *   MGR_CREW_INTAKE_KEY       (required only with --send)
 *
 * Usage:
 *   node scripts/backfill-mgr.mjs
 *   node scripts/backfill-mgr.mjs --send
 */

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const PAGE = 200;

export function parseBackfillArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    return { help: true, send: false };
  }
  const send = args.includes('--send') && !args.includes('--dry-run');
  return { help: false, send };
}

async function loadEnv() {
  const loaded = await import('dotenv');
  const config = loaded.config || (loaded.default && loaded.default.config);
  if (typeof config !== 'function') throw new Error('dotenv config is unavailable');
  config({ path: path.join(root, '.env.local') });
  config({ path: path.join(root, '.env') });
}

async function loadCrewIntake() {
  const specifier = new URL('../libs/mgr-crew-intake.js', import.meta.url);
  try {
    return await import(specifier.href);
  } catch {
    // This repo is not "type": "module". Node 18 parses that .js file as
    // CommonJS and rejects the export syntax. Copy it to a temp .mjs module.
    const source = readFileSync(specifier, 'utf8');
    const dir = mkdtempSync(path.join(tmpdir(), 'flora-mgr-'));
    const file = path.join(dir, 'mgr-crew-intake.mjs');
    writeFileSync(file, source);
    return import(pathToFileURL(file).href);
  }
}

async function main() {
  const { help, send } = parseBackfillArgs(process.argv);
  if (help) {
    console.log('Usage: node scripts/backfill-mgr.mjs [--send] [--dry-run]');
    console.log('Dry-run is the default. --send POSTs each contact lead. SELECT only.');
    return;
  }

  await loadEnv();
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exitCode = 1;
    return;
  }
  if (send) {
    const intakeUrl = String(process.env.MGR_CREW_INTAKE_URL || '').trim();
    const intakeKey = String(process.env.MGR_CREW_INTAKE_KEY || '').trim();
    if (!intakeUrl || !intakeKey) {
      console.error('Refusing to send: set MGR_CREW_INTAKE_URL and MGR_CREW_INTAKE_KEY');
      process.exitCode = 1;
      return;
    }
  }

  const { contactLeadIntakePayload, sendToMgr } = await loadCrewIntake();
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const since = new Date(Date.now() - NINETY_DAYS_MS).toISOString();
  console.log(`${send ? 'Sending' : 'Dry-run'}: contact_leads created since ${since}`);

  let from = 0;
  let seen = 0;
  let failed = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('contact_leads')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error('contact_leads read failed:', error.message || 'unknown error');
      process.exitCode = 1;
      return;
    }

    const rows = data || [];
    if (!rows.length) break;

    for (const row of rows) {
      seen += 1;
      if (row?.id == null || row.id === '') {
        failed += 1;
        console.error('[skipped] contact lead missing id');
        continue;
      }
      const externalId = `contact_leads:${row.id}`;
      if (!send) {
        console.log(`[dry-run] ${externalId}`);
        continue;
      }
      const result = await sendToMgr(contactLeadIntakePayload(row));
      if (!result || !result.ok) {
        failed += 1;
        console.error(`[failed] ${externalId} status=${result && result.status != null ? result.status : 'none'}`);
      } else {
        console.log(`[sent] ${externalId} action=${result.action || ''} job_id=${result.job_id || ''}`);
      }
    }

    if (rows.length < PAGE) break;
    from += PAGE;
  }

  console.log(`${send ? 'Finished' : 'Dry-run finished'}: ${seen} contact_leads, ${failed} failed`);
  if (!send) console.log('No requests were sent. Re-run with --send to POST them.');
  if (failed) process.exitCode = 1;
}

function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (invokedDirectly()) {
  main().catch((error) => {
    console.error('Backfill stopped:', error && error.name ? error.name : 'Error');
    process.exitCode = 1;
  });
}
