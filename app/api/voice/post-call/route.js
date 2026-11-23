import { NextResponse } from 'next/server';
import { verifyElevenLabsSignature } from '@/libs/elevenlabs-signature';
import { FLORA_AGENT_ID, escapeHtml, formatEastern, sendToInbox, subjectPiece } from '@/libs/flora-inbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIELDS = [
  ['caller_name', 'Name'],
  ['town', 'Town'],
  ['address', 'Address'],
  ['callback_phone', 'Callback phone'],
  ['jobs', 'Jobs'],
  ['timing', 'Timing'],
  ['notes', 'Notes'],
  ['email', 'Email'],
  ['confirmed', 'Confirmed'],
];

function collectedValue(results, key) {
  const entry = results?.[key];
  if (entry == null || entry === '') return null;
  if (typeof entry === 'object' && !Array.isArray(entry)) {
    if (!Object.prototype.hasOwnProperty.call(entry, 'value')) return null;
    if (entry.value == null || entry.value === '') return null;
    return entry.value;
  }
  return entry;
}

function displayValue(value) {
  if (value == null || value === '') return 'Not collected';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function callerNumber(data) {
  return (
    data?.metadata?.phone_call?.external_number ||
    data?.conversation_initiation_client_data?.dynamic_variables?.system__caller_id ||
    'Unknown'
  );
}

function calledNumber(data) {
  return (
    data?.metadata?.phone_call?.agent_number ||
    data?.conversation_initiation_client_data?.dynamic_variables?.system__called_number ||
    ''
  );
}

function languageLabel(data) {
  const main = data?.metadata?.main_language || 'Unknown';
  const switched = [];
  for (const turn of data?.transcript || []) {
    for (const call of turn?.tool_calls || []) {
      const name = call?.tool_name || call?.name;
      if (name !== 'language_detection') continue;
      let params = call.params_as_json || call.parameters || call.params;
      if (typeof params === 'string') {
        try {
          params = JSON.parse(params);
        } catch {
          params = null;
        }
      }
      if (params?.language) switched.push(String(params.language));
    }
  }
  const extra = [...new Set(switched)].filter((code) => code !== main);
  return extra.length ? `${main} (language tool: ${extra.join(', ')})` : String(main);
}

function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function transcriptLines(transcript) {
  const lines = [];
  for (const turn of transcript || []) {
    const who = turn?.role === 'agent' ? 'Flora' : turn?.role === 'user' ? 'Caller' : (turn?.role || 'Speaker');
    const stamp = formatClock(turn?.time_in_call_secs);
    if (turn?.message) lines.push(`[${stamp}] ${who}: ${turn.message}`);
    for (const call of turn?.tool_calls || []) {
      const name = call?.tool_name || call?.name;
      if (name) lines.push(`[${stamp}] ${who} used ${name}`);
    }
  }
  return lines;
}

function looksLikeEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request) {
  const secret = (process.env.ELEVENLABS_FLORA_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    console.error('ELEVENLABS_FLORA_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('elevenlabs-signature');
  if (!verifyElevenLabsSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event?.type !== 'post_call_transcription') {
    return NextResponse.json({ received: true, ignored: event?.type || 'unknown' });
  }

  const data = event.data || {};
  if (data.agent_id && data.agent_id !== FLORA_AGENT_ID) {
    return NextResponse.json({ received: true, ignored: 'other_agent' });
  }

  const results = data.analysis?.data_collection_results || {};
  const fields = FIELDS.map(([key, label]) => ({
    label,
    value: displayValue(collectedValue(results, key)),
  }));
  const name = displayValue(collectedValue(results, 'caller_name'));
  const town = displayValue(collectedValue(results, 'town'));
  const caller = callerNumber(data);
  const called = calledNumber(data);
  const when = formatEastern(data.metadata?.start_time_unix_secs || event.event_timestamp);
  const language = languageLabel(data);
  const summary = data.analysis?.transcript_summary || data.analysis?.call_summary_title || 'No summary';
  const lines = transcriptLines(data.transcript);
  const duration = data.metadata?.call_duration_secs;
  const conversationId = data.conversation_id || '';
  const email = collectedValue(results, 'email');

  const subject = `Llamada nueva Flora: ${subjectPiece(name === 'Not collected' ? '' : name, 'Sin nombre')} - ${subjectPiece(town === 'Not collected' ? '' : town, 'Sin pueblo')}`;

  const text = [
    `Caller: ${caller}`,
    called ? `Called: ${called}` : null,
    `When: ${when}`,
    `Language: ${language}`,
    duration != null ? `Duration: ${duration}s` : null,
    conversationId ? `Conversation: ${conversationId}` : null,
    '',
    ...fields.map((field) => `${field.label}: ${field.value}`),
    '',
    'Summary:',
    summary,
    '',
    'Transcript:',
    lines.join('\n') || '(empty)',
  ].filter((line) => line != null).join('\n');

  const rows = fields.map((field) => (
    `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-weight:700;vertical-align:top;">${escapeHtml(field.label)}</td><td style="padding:6px 0;color:#0f172a;">${escapeHtml(field.value)}</td></tr>`
  )).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.45;">
      <p style="margin:0 0 12px;"><strong>Caller:</strong> ${escapeHtml(caller)}</p>
      ${called ? `<p style="margin:0 0 12px;"><strong>Called:</strong> ${escapeHtml(called)}</p>` : ''}
      <p style="margin:0 0 12px;"><strong>When:</strong> ${escapeHtml(when)}</p>
      <p style="margin:0 0 12px;"><strong>Language:</strong> ${escapeHtml(language)}</p>
      ${duration != null ? `<p style="margin:0 0 12px;"><strong>Duration:</strong> ${escapeHtml(duration)}s</p>` : ''}
      ${conversationId ? `<p style="margin:0 0 16px;"><strong>Conversation:</strong> ${escapeHtml(conversationId)}</p>` : ''}
      <table style="border-collapse:collapse;margin:0 0 16px;">${rows}</table>
      <p style="margin:0 0 8px;"><strong>Summary</strong></p>
      <p style="margin:0 0 16px;">${escapeHtml(summary)}</p>
      <p style="margin:0 0 8px;"><strong>Transcript</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:13px;background:#f8fafc;padding:12px;border-radius:8px;">${escapeHtml(lines.join('\n') || '(empty)')}</pre>
    </div>
  `;

  try {
    await sendToInbox({
      subject,
      text,
      html,
      replyTo: looksLikeEmail(email) ? String(email).trim() : undefined,
      type: 'CALL',
    });
  } catch (error) {
    console.error('Failed to email Flora call summary:', error?.message || error);
    return NextResponse.json({ error: 'Failed to send summary email' }, { status: 500 });
  }

  console.log('Emailed Flora call summary', conversationId || '(no id)');
  return NextResponse.json({ received: true });
}
