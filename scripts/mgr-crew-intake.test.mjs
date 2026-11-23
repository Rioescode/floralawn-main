import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import {
  MGR_CREW_INTAKE_TIMEOUT_MS,
  appointmentIntakePayload,
  callIntakePayload,
  contactLeadIntakePayload,
  handleSupabaseWebhook,
  mapDeskStatus,
  prepareCrewIntakePayload,
  resetMgrCrewIntakeStateForTests,
  sendToMgr,
  textIntakePayload,
  timingSafeSecretMatch,
} from '../libs/mgr-crew-intake.js';
import { parseBackfillArgs } from './backfill-mgr.mjs';

const SECRET = 'flora-webhook-test-secret';
const KEY = 'mgr-crew-test-key-not-real';
const EMAIL = 'hidden.person@example.com';
const PHONE = '401-555-0199';

const originalFetch = global.fetch;
const originalSetTimeout = global.setTimeout;
const envKeys = ['MGR_CREW_INTAKE_URL', 'MGR_CREW_INTAKE_KEY'];
const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of envKeys) {
    if (savedEnv[key] == null) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
}

function captureConsole() {
  const lines = [];
  const methods = ['log', 'warn', 'error', 'info'];
  const saved = {};
  for (const method of methods) {
    saved[method] = console[method];
    console[method] = (...args) => {
      lines.push(args.map((part) => String(part)).join(' '));
    };
  }
  return {
    lines,
    restore() {
      for (const method of methods) console[method] = saved[method];
    },
  };
}

afterEach(() => {
  global.fetch = originalFetch;
  global.setTimeout = originalSetTimeout;
  restoreEnv();
  resetMgrCrewIntakeStateForTests();
});

describe('mgr crew intake', { concurrency: 1 }, () => {
  test('sendToMgr no-ops without env and never throws or calls fetch', async () => {
    delete process.env.MGR_CREW_INTAKE_URL;
    delete process.env.MGR_CREW_INTAKE_KEY;
    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      throw new Error('should not be called');
    };
    const logs = captureConsole();
    try {
      const first = await sendToMgr({ kind: 'lead', email: EMAIL, phone: PHONE });
      const second = await sendToMgr(null);
      assert.equal(first.ok, false);
      assert.equal(first.skipped, true);
      assert.equal(second.skipped, true);
      assert.equal(calls, 0);
      const text = logs.lines.join('\n');
      assert.match(text, /MGR_CREW_INTAKE_URL/);
      assert.equal(text.includes(EMAIL), false);
      assert.equal(text.includes(PHONE), false);
      assert.equal(logs.lines.filter((line) => line.includes('MGR crew intake skipped: set')).length, 1);
    } finally {
      logs.restore();
    }
  });

  test('sendToMgr posts the bearer JSON and swallows failures without logging PII or the key', async () => {
    process.env.MGR_CREW_INTAKE_URL = 'https://intake.example.test/api/crew-intake';
    process.env.MGR_CREW_INTAKE_KEY = KEY;
    const seen = [];
    const timers = [];
    global.setTimeout = (fn, ms, ...args) => {
      timers.push(ms);
      return originalSetTimeout(fn, ms, ...args);
    };
    global.fetch = async (url, options) => {
      seen.push({ url, options });
      if (seen.length === 1) {
        return new Response(JSON.stringify({ ok: true, job_id: 'job-1', action: 'created' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (seen.length === 2) {
        return new Response(JSON.stringify({ email: EMAIL, key: KEY }), { status: 503 });
      }
      const error = new Error(`network ${KEY} ${EMAIL}`);
      error.name = 'TypeError';
      throw error;
    };

    const payload = contactLeadIntakePayload({
      id: 'lead-1',
      customer_name: 'Hidden Person',
      customer_email: EMAIL,
      customer_phone: PHONE,
      address: '1 Secret St',
      city: 'Providence',
      service_type: 'Mowing',
      notes: 'dog in yard',
      status: 'pending',
    });
    const logs = captureConsole();
    try {
      const ok = await sendToMgr(payload);
      const failed = await sendToMgr(payload);
      const thrown = await sendToMgr(payload);
      assert.equal(ok.ok, true);
      assert.equal(ok.job_id, 'job-1');
      assert.equal(ok.action, 'created');
      assert.equal(failed.ok, false);
      assert.equal(failed.status, 503);
      assert.equal(thrown.ok, false);
      assert.equal(thrown.skipped, false);

      assert.equal(seen[0].url, process.env.MGR_CREW_INTAKE_URL);
      assert.equal(seen[0].options.method, 'POST');
      assert.equal(seen[0].options.redirect, 'manual');
      assert.equal(seen[0].options.headers.Authorization, `Bearer ${KEY}`);
      assert.equal(seen[0].options.headers['Content-Type'], 'application/json');
      assert.ok(seen[0].options.signal);
      const posted = JSON.parse(seen[0].options.body);
      assert.equal(posted.external_id, 'contact_leads:lead-1');
      assert.equal(posted.kind, 'lead');
      assert.equal(posted.status, 'new');
      assert.equal(posted.phone, PHONE);
      assert.ok(timers.includes(MGR_CREW_INTAKE_TIMEOUT_MS));

      const text = logs.lines.join('\n');
      assert.equal(text.includes(KEY), false);
      assert.equal(text.includes(EMAIL), false);
      assert.equal(text.includes(PHONE), false);
      assert.equal(text.includes('1 Secret St'), false);
      assert.equal(text.includes('dog in yard'), false);
      assert.equal(text.includes('intake.example.test'), false);
      assert.match(text, /contact_leads:lead-1/);
    } finally {
      logs.restore();
    }
  });

  test('sendToMgr aborts after 5 seconds and still resolves', async () => {
    process.env.MGR_CREW_INTAKE_URL = 'https://intake.example.test/api/crew-intake';
    process.env.MGR_CREW_INTAKE_KEY = KEY;
    global.fetch = (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
    const logs = captureConsole();
    const started = Date.now();
    let abortWatch = null;
    try {
      const result = await Promise.race([
        sendToMgr({
          kind: 'text',
          external_id: 'sms:SM123',
          phone: PHONE,
          notes: 'secret body',
          email: EMAIL,
        }),
        new Promise((_resolve, reject) => {
          abortWatch = originalSetTimeout(() => reject(new Error('abort did not fire')), 12000);
        }),
      ]);
      const elapsed = Date.now() - started;
      assert.equal(result.ok, false);
      assert.equal(result.skipped, false);
      assert.ok(elapsed >= 4500, `elapsed ${elapsed}`);
      assert.ok(elapsed < 12000, `elapsed ${elapsed}`);
      const text = logs.lines.join('\n');
      assert.match(text, /AbortError/);
      assert.equal(text.includes(KEY), false);
      assert.equal(text.includes(EMAIL), false);
      assert.equal(text.includes(PHONE), false);
      assert.equal(text.includes('secret body'), false);
    } finally {
      if (abortWatch) clearTimeout(abortWatch);
      logs.restore();
    }
  });

  test('maps appointments and contact leads, including visit_when', () => {
    const scheduled = appointmentIntakePayload({
      id: 'apt-1',
      customer_name: 'Ada',
      customer_email: EMAIL,
      customer_phone: PHONE,
      street_address: '9 Oak',
      city: 'Cranston',
      service_type: 'Cleanup',
      scheduled_date: '2026-05-02',
      date: '2026-05-01',
      time: '09:15',
      notes: 'side gate',
      status: 'confirmed',
    });
    assert.equal(scheduled.kind, 'appointment');
    assert.equal(scheduled.external_id, 'appointments:apt-1');
    assert.equal(scheduled.visit_when, '2026-05-02 09:15');
    assert.equal(scheduled.town, 'Cranston');
    assert.equal(scheduled.address, '9 Oak');

    const dated = appointmentIntakePayload({
      id: 7,
      date: '2026-05-01T14:00:00.000Z',
      time: '09:00',
      address: '2 Pine',
    });
    assert.equal(dated.external_id, 'appointments:7');
    assert.equal(dated.visit_when, '2026-05-01T14:00:00.000Z');
    assert.equal(dated.address, '2 Pine');

    const lead = contactLeadIntakePayload({
      id: 'lead-9',
      customer_name: 'Bea',
      customer_email: EMAIL,
      visit_date: '2026-06-01',
      time: '11:00',
      status: 'pending',
    });
    assert.equal(lead.kind, 'lead');
    assert.equal(lead.external_id, 'contact_leads:lead-9');
    assert.equal(lead.visit_when, '2026-06-01 11:00');

    const visit = contactLeadIntakePayload({
      id: 'lead-visit',
      customer_email: 'ada@example.com',
      visit_date: '2026-06-01',
      visit_time: '10:00 AM',
      time: '08:00',
      status: 'pending',
    });
    assert.equal(visit.visit_when, '2026-06-01 10:00 AM');
  });

  test('maps calls and texts onto the intake contract', () => {
    const call = callIntakePayload({
      conversationId: 'conv-1',
      callerPhone: PHONE,
      summary: 'Wants mowing Friday',
      transcript: 'Caller: Friday works',
      collected: {
        caller_name: 'Cam',
        town: 'Warwick',
        address: '3 Elm',
        jobs: 'Mowing',
        timing: 'Friday',
        notes: 'back yard',
        email: EMAIL,
        confirmed: true,
      },
      status: 'successful',
    });
    assert.equal(call.kind, 'call');
    assert.equal(call.external_id, 'call:conv-1');
    assert.equal(call.phone, PHONE);
    assert.equal(call.summary, 'Wants mowing Friday');
    assert.equal(call.transcript, 'Caller: Friday works');
    assert.equal(call.name, 'Cam');
    assert.equal(call.town, 'Warwick');
    assert.equal(call.service, 'Mowing');
    assert.equal(call.visit_when, 'Friday');
    assert.equal(call.raw.caller_phone, PHONE);

    const text = textIntakePayload({ messageSid: 'SM999', from: PHONE, body: 'Can you come Tuesday?' });
    assert.equal(text.kind, 'text');
    assert.equal(text.external_id, 'sms:SM999');
    assert.equal(text.phone, PHONE);
    assert.equal(text.notes, 'Can you come Tuesday?');
    assert.equal(text.transcript, 'Can you come Tuesday?');
    assert.equal(text.raw.From, PHONE);
    assert.equal(text.raw.Body, 'Can you come Tuesday?');
  });

  test('webhook secret is timing-safe and the handler forwards only the two tables', async () => {
    assert.equal(timingSafeSecretMatch(SECRET, SECRET), true);
    assert.equal(timingSafeSecretMatch('short', SECRET), false);
    assert.equal(timingSafeSecretMatch('x'.repeat(513), SECRET), false);
    assert.equal(timingSafeSecretMatch('', SECRET), false);
    assert.equal(timingSafeSecretMatch(SECRET, ''), false);
    assert.equal(timingSafeSecretMatch(`${SECRET} `, SECRET), false);

    const record = {
      id: 'apt-2',
      customer_name: 'Dee',
      customer_email: EMAIL,
      customer_phone: PHONE,
      street_address: '4 Maple',
      city: 'Pawtucket',
      service_type: 'Mulch',
      date: '2026-07-04',
      time: '08:30',
      status: 'pending',
    };
    let sent = null;
    const logs = captureConsole();
    try {
      const missing = await handleSupabaseWebhook({
        configuredSecret: '',
        providedSecret: SECRET,
        body: { type: 'INSERT', table: 'appointments', record },
        send: async () => {
          throw new Error('should not send');
        },
      });
      assert.equal(missing.status, 500);

      const denied = await handleSupabaseWebhook({
        configuredSecret: SECRET,
        providedSecret: 'nope',
        body: { type: 'INSERT', table: 'appointments', schema: 'public', record },
        send: async () => {
          throw new Error('should not send');
        },
      });
      assert.equal(denied.status, 401);
      assert.equal(JSON.stringify(denied.body).includes(EMAIL), false);
      assert.equal(JSON.stringify(denied.body).includes(SECRET), false);

      const accepted = await handleSupabaseWebhook({
        configuredSecret: `  ${SECRET}  `,
        providedSecret: SECRET,
        body: { type: 'INSERT', table: 'appointments', schema: 'public', record },
        send: async (payload) => {
          sent = payload;
          return { ok: true, skipped: false, status: 200, job_id: 'job-9', action: 'created' };
        },
      });
      assert.equal(accepted.status, 200);
      assert.equal(accepted.body.job_id, 'job-9');
      assert.equal(sent.kind, 'appointment');
      assert.equal(sent.external_id, 'appointments:apt-2');
      assert.equal(sent.visit_when, '2026-07-04 08:30');

      sent = null;
      const lead = await handleSupabaseWebhook({
        configuredSecret: SECRET,
        providedSecret: SECRET,
        body: {
          type: 'update',
          table: 'public.contact_leads',
          schema: 'public',
          record: { id: 'lead-2', customer_name: 'Eve', customer_email: EMAIL, status: 'pending' },
        },
        send: async (payload) => {
          sent = payload;
          return { ok: true, skipped: false, status: 200, job_id: 'job-2', action: 'updated' };
        },
      });
      assert.equal(lead.status, 200);
      assert.equal(sent.kind, 'lead');
      assert.equal(sent.external_id, 'contact_leads:lead-2');

      for (const body of [
        { type: 'DELETE', table: 'appointments', record },
        { type: 'INSERT', table: 'customers', record },
        { type: 'INSERT', table: 'appointments', schema: 'auth', record },
        { type: 'INSERT', table: 'appointments', record: { customer_name: 'No Id' } },
      ]) {
        const ignored = await handleSupabaseWebhook({
          configuredSecret: SECRET,
          providedSecret: SECRET,
          body,
          send: async () => {
            throw new Error('should not send');
          },
        });
        assert.equal(ignored.status, 200);
        assert.equal(ignored.body.ignored, true);
      }

      const down = await handleSupabaseWebhook({
        configuredSecret: SECRET,
        providedSecret: SECRET,
        body: { type: 'INSERT', table: 'appointments', record },
        send: async () => ({ ok: false, skipped: false, status: 500, job_id: null, action: null }),
      });
      assert.equal(down.status, 502);
      assert.equal(JSON.stringify(down.body).includes(EMAIL), false);

      const skipped = await handleSupabaseWebhook({
        configuredSecret: SECRET,
        providedSecret: SECRET,
        body: { type: 'INSERT', table: 'contact_leads', record: { id: 'lead-3' } },
        send: async () => ({ ok: false, skipped: true, status: null, job_id: null, action: null }),
      });
      assert.equal(skipped.status, 200);
      assert.equal(skipped.body.forwarded, false);

      assert.deepEqual(parseBackfillArgs(['node', 'backfill-mgr.mjs']), { help: false, send: false });
      assert.deepEqual(parseBackfillArgs(['node', 'backfill-mgr.mjs', '--dry-run']), { help: false, send: false });
      assert.deepEqual(parseBackfillArgs(['node', 'backfill-mgr.mjs', '--send']), { help: false, send: true });
      assert.deepEqual(parseBackfillArgs(['node', 'backfill-mgr.mjs', '--send', '--dry-run']), { help: false, send: false });
      assert.equal(parseBackfillArgs(['node', 'backfill-mgr.mjs', '--help']).help, true);

      const text = logs.lines.join('\n');
      assert.equal(text.includes(SECRET), false);
      assert.equal(text.includes(EMAIL), false);
      assert.equal(text.includes(PHONE), false);
    } finally {
      logs.restore();
    }
  });

  test('prepareCrewIntakePayload matches MGR crew-intake limits', async () => {
    const desk = new Set([
      'new', 'awaiting_quote', 'open', 'visit_set', 'quoted', 'accepted',
      'won', 'declined', 'passed', 'visited', 'completed',
    ]);
    function mgrAccepts(body) {
      const limits = {
        name: 80, email: 120, phone: 40, address: 200, town: 80,
        service: 200, visit_when: 80, notes: 600, summary: 600, transcript: 4000,
      };
      for (const [key, max] of Object.entries(limits)) {
        const value = body[key];
        if (value == null || value === '') continue;
        if (typeof value !== 'string' || value.length > max) return false;
      }
      if (body.email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/.test(body.email)) return false;
      if (body.phone) {
        let digits = String(body.phone).replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
        if (digits.length < 10) return false;
      }
      if (!body.email && !body.phone) return false;
      if (body.status != null && body.status !== '' && !desk.has(body.status)) return false;
      if (body.raw != null) {
        if (typeof body.raw !== 'object' || Array.isArray(body.raw)) return false;
        const keys = Object.keys(body.raw);
        if (keys.length > 30) return false;
        for (const key of keys) {
          if (key.length > 40) return false;
          const value = body.raw[key];
          if (typeof value === 'string' && value.length > 300) return false;
          else if (typeof value === 'number' && !Number.isFinite(value)) return false;
          else if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return false;
        }
      }
      return true;
    }

    const expected = {
      pending: 'new',
      new: 'new',
      '': 'new',
      confirmed: 'visit_set',
      scheduled: 'visit_set',
      rescheduled: 'visit_set',
      completed: 'completed',
      done: 'completed',
      cancelled: 'declined',
      canceled: 'declined',
      quoted: 'quoted',
      scratched: 'declined',
      in_progress: 'visited',
      'in progress': 'visited',
      open: 'open',
      won: 'won',
    };
    for (const [input, output] of Object.entries(expected)) {
      assert.equal(mapDeskStatus(input), output, input);
    }
    assert.equal(mapDeskStatus(null), 'new');
    assert.equal(mapDeskStatus('successful'), '');
    assert.equal(mapDeskStatus('true'), '');

    const raw = {
      id: 'lead-55',
      media_urls: ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg'],
      nested: { secret: 'nope' },
      empty: null,
      has_media: true,
      discount_applied: false,
      long_note: 'L'.repeat(400),
    };
    for (let i = 0; i < 40; i += 1) raw[`extra_${i}`] = `value ${i}`;

    const prepared = prepareCrewIntakePayload({
      kind: 'lead',
      external_id: 'contact_leads:lead-55',
      name: 'N'.repeat(100),
      email: 'Ada@Example.com',
      phone: '12345',
      address: 'A'.repeat(250),
      town: 'T'.repeat(90),
      service: 'S'.repeat(250),
      visit_when: 'V'.repeat(90),
      notes: 'X'.repeat(756),
      summary: 'U'.repeat(700),
      transcript: 'R'.repeat(4100),
      status: 'pending',
      raw,
    });
    assert.equal(prepared.skip, false);
    const body = prepared.payload;
    assert.equal(mgrAccepts(body), true);
    assert.equal(body.name.length, 80);
    assert.equal(body.name.endsWith('...'), true);
    assert.equal(body.notes.length, 600);
    assert.equal(body.notes.endsWith('...'), true);
    assert.equal(body.address.length, 200);
    assert.equal(body.town.length, 80);
    assert.equal(body.service.length, 200);
    assert.equal(body.visit_when.length, 80);
    assert.equal(body.summary.length, 600);
    assert.equal(body.transcript.length, 4000);
    assert.equal(body.phone, '');
    assert.equal(body.email, 'ada@example.com');
    assert.equal(body.status, 'new');
    assert.equal(typeof body.raw.media_urls, 'string');
    assert.equal(body.raw.media_urls.includes('https://cdn.example/a.jpg'), true);
    assert.equal(body.raw.media_urls.includes('https://cdn.example/b.jpg'), true);
    assert.equal(body.raw.nested, undefined);
    assert.equal(body.raw.empty, undefined);
    assert.equal(body.raw.has_media, true);
    assert.equal(body.raw.discount_applied, false);
    assert.equal(body.raw.long_note.length, 300);
    assert.equal(body.raw.long_note.endsWith('...'), true);
    assert.ok(Object.keys(body.raw).length <= 30);
    assert.equal(body.raw.id, 'lead-55');

    const unknown = prepareCrewIntakePayload({
      kind: 'appointment',
      external_id: 'appointments:apt-9',
      email: 'ada@example.com',
      phone: '555-0100',
      status: 'successful',
      name: 'Ada',
    });
    assert.equal(unknown.skip, false);
    assert.equal(Object.prototype.hasOwnProperty.call(unknown.payload, 'status'), false);
    assert.equal(unknown.payload.phone, '');
    assert.equal(mgrAccepts(unknown.payload), true);

    const noContact = prepareCrewIntakePayload({
      kind: 'text',
      external_id: 'sms:SM1',
      phone: '555',
      email: 'not-an-email',
      notes: 'hello',
    });
    assert.equal(noContact.skip, true);
    assert.equal(noContact.reason, 'contact');

    const call = prepareCrewIntakePayload(callIntakePayload({
      conversationId: 'conv-9',
      callerPhone: '+1 (401) 555-0199',
      summary: 'S'.repeat(700),
      transcript: 'Caller: hello',
      collected: { caller_name: 'Cam', confirmed: true, jobs: ['Mow', 'Edge'] },
      status: 'successful',
    }));
    assert.equal(call.skip, false);
    assert.equal(call.payload.phone, '+1 (401) 555-0199');
    assert.equal(call.payload.summary.length, 600);
    assert.equal(call.payload.raw.data_collection, undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(call.payload, 'status'), false);
    assert.equal(mgrAccepts(call.payload), true);

    process.env.MGR_CREW_INTAKE_URL = 'https://intake.example.test/api/crew-intake';
    process.env.MGR_CREW_INTAKE_KEY = KEY;
    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ ok: true, job_id: 'job-1', action: 'created' }), { status: 200 });
    };
    const logs = captureConsole();
    try {
      const skippedSend = await sendToMgr({
        kind: 'lead',
        external_id: 'contact_leads:short-phone',
        email: 'bad',
        phone: '12345',
        name: 'Hidden Person',
        notes: 'dog in yard',
      });
      assert.equal(skippedSend.skipped, true);
      assert.equal(calls, 0);
      const text = logs.lines.join('\n');
      assert.equal(text.includes(KEY), false);
      assert.equal(text.includes('Hidden Person'), false);
      assert.equal(text.includes('dog in yard'), false);
      assert.match(text, /contact/);
    } finally {
      logs.restore();
    }
  });
});
