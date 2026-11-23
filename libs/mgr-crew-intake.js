// Server-only. Do not import this module from a client component.
// MGR_CREW_INTAKE_KEY must never be referenced in browser code or logs.

import crypto from 'crypto';

export const MGR_CREW_INTAKE_TIMEOUT_MS = 5000;

let loggedMissingEnv = false;

function logMissingEnvOnce() {
  if (loggedMissingEnv) return;
  loggedMissingEnv = true;
  console.warn('MGR crew intake skipped: set MGR_CREW_INTAKE_URL and MGR_CREW_INTAKE_KEY');
}

export function resetMgrCrewIntakeStateForTests() {
  loggedMissingEnv = false;
}

function str(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => str(item)).filter(Boolean).join(', ');
  return '';
}

function hasClockTime(value) {
  return /\d:\d{2}/.test(value);
}

function withTime(base, time) {
  if (!base) return '';
  if (time && !hasClockTime(base)) return `${base} ${time}`.trim();
  return base;
}

export function visitWhenFromRecord(record) {
  const source = record && typeof record === 'object' ? record : {};
  const time = str(source.time);
  const scheduled = withTime(str(source.scheduled_date), time);
  if (scheduled) return scheduled;
  const dated = withTime(str(source.date), time);
  if (dated) return dated;
  const visit = withTime(str(source.visit_date), time);
  if (visit) return visit;
  return time;
}

function recordId(record) {
  if (!record || typeof record !== 'object') return '';
  return str(record.id);
}

function crewPayload(fields) {
  return {
    kind: fields.kind,
    external_id: fields.external_id,
    name: fields.name || '',
    email: fields.email || '',
    phone: fields.phone || '',
    address: fields.address || '',
    town: fields.town || '',
    service: fields.service || '',
    visit_when: fields.visit_when || '',
    notes: fields.notes || '',
    summary: fields.summary || '',
    transcript: fields.transcript || '',
    status: fields.status || '',
    raw: fields.raw ?? null,
  };
}

export function contactLeadIntakePayload(record) {
  const source = record && typeof record === 'object' ? record : {};
  const id = recordId(source);
  return crewPayload({
    kind: 'lead',
    external_id: `contact_leads:${id}`,
    name: str(source.customer_name) || str(source.name),
    email: str(source.customer_email) || str(source.email),
    phone: str(source.customer_phone) || str(source.phone),
    address: str(source.address),
    town: str(source.city) || str(source.town),
    service: str(source.service_type) || str(source.service),
    visit_when: visitWhenFromRecord(source),
    notes: str(source.notes),
    summary: str(source.summary),
    transcript: str(source.transcript),
    status: str(source.status),
    raw: source,
  });
}

export function appointmentIntakePayload(record) {
  const source = record && typeof record === 'object' ? record : {};
  const id = recordId(source);
  return crewPayload({
    kind: 'appointment',
    external_id: `appointments:${id}`,
    name: str(source.customer_name) || str(source.name),
    email: str(source.customer_email) || str(source.email),
    phone: str(source.customer_phone) || str(source.phone),
    address: str(source.street_address) || str(source.address),
    town: str(source.city) || str(source.town),
    service: str(source.service_type) || str(source.service),
    visit_when: visitWhenFromRecord(source),
    notes: str(source.notes),
    summary: str(source.summary),
    transcript: str(source.transcript),
    status: str(source.status),
    raw: source,
  });
}

export function callIntakePayload({ conversationId, callerPhone, summary, transcript, collected, status } = {}) {
  const fields = collected && typeof collected === 'object' && !Array.isArray(collected) ? collected : {};
  const id = str(conversationId);
  return crewPayload({
    kind: 'call',
    external_id: `call:${id}`,
    name: str(fields.caller_name),
    email: str(fields.email),
    phone: str(callerPhone),
    address: str(fields.address),
    town: str(fields.town),
    service: str(fields.jobs),
    visit_when: str(fields.timing),
    notes: str(fields.notes),
    summary: str(summary),
    transcript: str(transcript),
    status: str(status) || str(fields.confirmed),
    raw: {
      conversation_id: id,
      caller_phone: str(callerPhone),
      data_collection: fields,
      summary: str(summary),
    },
  });
}

export function textIntakePayload({ messageSid, from, body } = {}) {
  const sid = str(messageSid);
  const phone = str(from);
  const text = str(body);
  return crewPayload({
    kind: 'text',
    external_id: `sms:${sid}`,
    name: '',
    email: '',
    phone,
    address: '',
    town: '',
    service: '',
    visit_when: '',
    notes: text,
    summary: '',
    transcript: text,
    status: '',
    raw: {
      MessageSid: sid,
      From: phone,
      Body: text,
    },
  });
}

function tableName(body) {
  return str(body?.table).split('.').pop().toLowerCase();
}

export function intakeFromDatabaseWebhook(body) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const type = str(source.type).toUpperCase();
  if (type !== 'INSERT' && type !== 'UPDATE') {
    return { ignored: true, reason: 'event' };
  }
  const schema = str(source.schema).toLowerCase();
  if (schema && schema !== 'public') {
    return { ignored: true, reason: 'schema' };
  }
  const record = source.record;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { ignored: true, reason: 'record' };
  }
  const table = tableName(source);
  if (table !== 'appointments' && table !== 'contact_leads') {
    return { ignored: true, reason: 'table' };
  }
  if (!recordId(record)) {
    return { ignored: true, reason: 'id' };
  }
  const payload = table === 'appointments'
    ? appointmentIntakePayload(record)
    : contactLeadIntakePayload(record);
  return { ignored: false, payload };
}

export function timingSafeSecretMatch(provided, expected) {
  const left = provided == null ? '' : String(provided);
  const right = expected == null ? '' : String(expected);
  if (!left || !right || left.length > 512 || right.length > 512) return false;
  const digest = (value) => crypto.createHash('sha256').update(value, 'utf8').digest();
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function safeToken(value) {
  if (value == null) return null;
  const text = String(value);
  if (!/^[A-Za-z0-9_.:|-]{1,160}$/.test(text)) return null;
  return text;
}

function logContext(payload) {
  const kind = safeToken(payload && payload.kind) || 'unknown';
  const externalId = safeToken(payload && payload.external_id) || '(redacted)';
  return `${kind} ${externalId}`;
}

function emptyResult(extra) {
  return {
    ok: false,
    skipped: false,
    status: null,
    job_id: null,
    action: null,
    ...extra,
  };
}

/**
 * POST one crew-intake event. Never throws.
 * No-ops when MGR_CREW_INTAKE_URL or MGR_CREW_INTAKE_KEY is missing.
 * Does not log the key, the URL, or payload contents.
 */
export async function sendToMgr(payload) {
  const controller = new AbortController();
  let timer = null;
  try {
    const url = String(process.env.MGR_CREW_INTAKE_URL || '').trim();
    const key = String(process.env.MGR_CREW_INTAKE_KEY || '').trim();
    if (!url || !key) {
      logMissingEnvOnce();
      return emptyResult({ skipped: true });
    }
    if (!payload || typeof payload !== 'object') {
      console.error('MGR crew intake skipped: payload missing');
      return emptyResult({ skipped: true });
    }

    timer = setTimeout(() => controller.abort(), MGR_CREW_INTAKE_TIMEOUT_MS);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'manual',
    });

    const status = response.status;
    if (status < 200 || status >= 300) {
      console.error('MGR crew intake failed', status, logContext(payload));
      return emptyResult({ status });
    }

    let jobId = null;
    let action = null;
    try {
      const data = await response.json();
      if (data && typeof data === 'object') {
        jobId = safeToken(data.job_id);
        action = safeToken(data.action);
      }
    } catch {
      jobId = null;
      action = null;
    }
    console.log('MGR crew intake forwarded', logContext(payload), action || '', jobId || '');
    return { ok: true, skipped: false, status, job_id: jobId, action };
  } catch (error) {
    const name = error && error.name ? error.name : 'Error';
    console.error('MGR crew intake error', name, logContext(payload));
    return emptyResult();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function handleSupabaseWebhook({
  configuredSecret,
  providedSecret,
  body,
  invalidJson = false,
  send = sendToMgr,
} = {}) {
  const expected = configuredSecret == null ? '' : String(configuredSecret).trim();
  if (!expected) {
    console.error('FLORA_DB_WEBHOOK_SECRET is not set');
    return { status: 500, body: { error: 'Webhook secret is not configured' } };
  }

  const provided = providedSecret == null ? '' : String(providedSecret).trim();
  if (!timingSafeSecretMatch(provided, expected)) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  if (invalidJson || body == null || typeof body !== 'object' || Array.isArray(body)) {
    return { status: 400, body: { error: 'Invalid JSON' } };
  }

  let decision;
  try {
    decision = intakeFromDatabaseWebhook(body);
  } catch {
    return { status: 400, body: { error: 'Invalid payload' } };
  }

  if (decision.ignored) {
    return { status: 200, body: { ok: true, ignored: true } };
  }

  let result;
  try {
    result = await send(decision.payload);
  } catch {
    result = emptyResult();
  }

  if (!result || result.skipped) {
    return { status: 200, body: { ok: true, forwarded: false } };
  }
  if (!result.ok) {
    return { status: 502, body: { ok: false } };
  }
  return {
    status: 200,
    body: { ok: true, job_id: result.job_id || null, action: result.action || null },
  };
}
