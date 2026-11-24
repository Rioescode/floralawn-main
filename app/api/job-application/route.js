import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import config from '@/config';
import { sendEmail } from '@/libs/resend';
import { supabaseAdmin } from '@/lib/supabase';
import { generalApiLimiter } from '@/lib/rate-limiter';
import {
  validateApplication,
  normalizeApplication,
  applicationText,
  applicationHtml,
  applicationSubject,
  applicationInsertRow,
  legacyApplicationInsertRow,
} from '@/libs/job-application';

export const dynamic = 'force-dynamic';

const BOTH_FAILED =
  'We could not send your application. Please call (401) 389-0913 and we will take it over the phone.';

function applicationRecipients() {
  const fromContactLeads = config.resend.supportEmail;
  const owner = 'info@floralawn-and-landscaping.com';
  return [...new Set([fromContactLeads, owner].filter(Boolean))];
}

function receivedLabel() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shouldTryLegacyInsert(error) {
  const code = error?.code || '';
  const message = error?.message || '';
  if (code === 'PGRST205' || code === '42P01') return false;
  if (code === 'PGRST204' || code === '42703' || code === '23502') return true;
  return /column/i.test(message) || /null value/i.test(message);
}

async function saveApplication(application) {
  if (process.env.JOB_APPLICATION_DB_DRY_RUN === '1') {
    console.log('JOB_APPLICATION_DB_DRY_RUN: skipped insert');
    return true;
  }

  if (!supabaseAdmin) {
    console.error('Job application was not saved: SUPABASE_SERVICE_ROLE_KEY is not set.');
    return false;
  }

  const row = applicationInsertRow(application);
  const { error } = await supabaseAdmin.from('job_applications').insert([row]);
  if (!error) return true;

  console.error('Job application insert failed:', error.message);
  if (!shouldTryLegacyInsert(error)) return false;

  const { error: legacyError } = await supabaseAdmin
    .from('job_applications')
    .insert([legacyApplicationInsertRow(application)]);

  if (legacyError) {
    console.error('Job application fallback insert failed:', legacyError.message);
    return false;
  }

  return true;
}

async function emailApplication(application, received) {
  const recipients = applicationRecipients();
  const subject = applicationSubject(application);
  const text = applicationText(application, received);
  const html = applicationHtml(application, received);

  if (process.env.EMAIL_DRY_RUN === '1') {
    const dir = '/tmp/job-application-dry-run';
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${dir}/latest.html`, html);
    await fs.writeFile(`${dir}/latest.txt`, text);
    await fs.writeFile(
      `${dir}/latest.json`,
      JSON.stringify({ to: recipients, subject, application, received }, null, 2)
    );
    console.log('EMAIL_DRY_RUN: wrote application email to /tmp/job-application-dry-run');
    return true;
  }

  await sendEmail({
    to: recipients,
    subject,
    text,
    html,
    replyTo: application.email || undefined,
    type: 'JOB_APPLICATION',
    recipientName: 'Flora Lawn',
  });
  return true;
}

export async function POST(request) {
  try {
    const limited = await generalApiLimiter(request);
    if (limited) return limited;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Something was wrong with that submission. Please try again.' },
        { status: 400 }
      );
    }

    if (body && typeof body.companyWebsite === 'string' && body.companyWebsite.trim()) {
      return NextResponse.json({ success: true });
    }

    const errors = validateApplication(body);
    if (errors.length) {
      return NextResponse.json({ error: errors[0].message, errors }, { status: 400 });
    }

    const application = normalizeApplication(body);
    const received = receivedLabel();
    console.log('Job application received:', {
      name: application.fullName,
      hasPhone: Boolean(application.phone),
      hasEmail: Boolean(application.email),
      city: application.city || null,
      position: application.position || null,
    });

    let saved = false;
    try {
      saved = await saveApplication(application);
    } catch (error) {
      console.error('Job application save threw:', error?.message || error);
      saved = false;
    }

    let emailed = false;
    try {
      emailed = await emailApplication(application, received);
    } catch (error) {
      console.error('Job application email failed:', error?.message || error);
      emailed = false;
    }

    if (!saved && !emailed) {
      return NextResponse.json({ error: BOTH_FAILED }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved, emailed });
  } catch (error) {
    console.error('Job application route failed:', error?.message || error);
    return NextResponse.json({ error: BOTH_FAILED }, { status: 500 });
  }
}
