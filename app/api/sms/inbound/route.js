import { NextResponse } from 'next/server';
import { lookupCaller } from '@/libs/flora-caller';
import { escapeHtml, formatEastern, sendToInbox } from '@/libs/flora-inbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twiml(status = 200) {
  return new NextResponse(EMPTY_TWIML, {
    status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

function smsWebhookUrl(request) {
  const explicit = (process.env.TWILIO_SMS_WEBHOOK_URL || '').trim();
  const search = request.nextUrl?.search || '';
  if (explicit) {
    if (search && !explicit.includes('?')) return `${explicit}${search}`;
    return explicit;
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://floralawn-and-landscaping.com').replace(/\/$/, '');
  return `${base}/api/sms/inbound${search}`;
}

function mediaItems(params) {
  const count = Number(params.NumMedia || 0);
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const url = params[`MediaUrl${i}`];
    if (!url) continue;
    items.push({ url, type: params[`MediaContentType${i}`] || '' });
  }
  return items;
}

export async function POST(request) {
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN is not set');
    return NextResponse.json({ error: 'Twilio auth token is not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-twilio-signature') || '';
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const url = smsWebhookUrl(request);

  let twilio;
  try {
    // Same server-only require as libs/twilio.js. The package is externalized in next.config.js.
    twilio = require('twilio');
  } catch (error) {
    console.error('Twilio SDK failed to load:', error?.message || error);
    return NextResponse.json({ error: 'Twilio SDK is not available' }, { status: 500 });
  }

  let valid = false;
  try {
    valid = twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Twilio signature check failed:', error?.message || error);
    valid = false;
  }

  if (!valid) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  const from = params.From || 'Unknown';
  const body = params.Body || '';
  const when = formatEastern(Date.now() / 1000);
  const media = mediaItems(params);
  const to = params.To || '';
  const sid = params.MessageSid || params.SmsSid || '';
  const onFile = (await lookupCaller(from)).variables;
  const knownName = onFile.is_known_customer === 'true' ? onFile.customer_name : '';

  const text = [
    `From: ${from}`,
    `On file: ${knownName || 'not on file'}`,
    to ? `To: ${to}` : null,
    `When: ${when}`,
    sid ? `Message: ${sid}` : null,
    '',
    body || '(empty)',
    '',
    media.length ? `Media:\n${media.map((item) => item.type ? `${item.url} (${item.type})` : item.url).join('\n')}` : 'Media: none',
  ].filter((line) => line != null).join('\n');

  const mediaHtml = media.length
    ? `<ul>${media.map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.type ? `${item.url} (${item.type})` : item.url)}</a></li>`).join('')}</ul>`
    : '<p>None</p>';

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.45;">
      <p style="margin:0 0 12px;"><strong>From:</strong> ${escapeHtml(from)}</p>
      <p style="margin:0 0 12px;"><strong>On file:</strong> ${escapeHtml(knownName || 'not on file')}</p>
      ${to ? `<p style="margin:0 0 12px;"><strong>To:</strong> ${escapeHtml(to)}</p>` : ''}
      <p style="margin:0 0 12px;"><strong>When:</strong> ${escapeHtml(when)}</p>
      ${sid ? `<p style="margin:0 0 16px;"><strong>Message:</strong> ${escapeHtml(sid)}</p>` : ''}
      <p style="margin:0 0 8px;"><strong>Text</strong></p>
      <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:15px;">${escapeHtml(body || '(empty)')}</pre>
      <p style="margin:16px 0 8px;"><strong>Media</strong></p>
      ${mediaHtml}
    </div>
  `;

  try {
    await sendToInbox({
      subject: `Texto nuevo Flora: ${knownName ? `${knownName} ` : ''}${from}`.replace(/[\r\n]+/g, ' ').slice(0, 180),
      text,
      html,
      type: 'SMS',
    });
  } catch (error) {
    console.error('Failed to email inbound Flora SMS:', error?.message || error);
    return NextResponse.json({ error: 'Failed to send SMS email' }, { status: 500 });
  }

  console.log('Emailed inbound Flora SMS', sid || from);
  return twiml(200);
}
