import { NextResponse } from 'next/server';

// Shared anti-spam checks for public forms that send email or notifications.
// No paid service or secret is needed.

const SITE_HOSTS = [
  'floralawn-and-landscaping.com',
  'www.floralawn-and-landscaping.com',
  'riyardworks.com',
  'www.riyardworks.com',
  'localhost:3000',
];

// The hidden "website" field on the forms. People never see it, bots fill it.
export const HONEYPOT_FIELD = 'website';

// A person needs more than a few seconds to fill these forms.
export const MIN_FORM_MS = 3000;

const hits = new Map();

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded ? forwarded.split(',')[0].trim() : '';
  return first || request.headers.get('x-real-ip') || 'unknown';
}

function hostOf(value) {
  if (!value) return '';
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return '';
  }
}

function extraHosts() {
  return String(process.env.ALLOWED_FORM_ORIGINS || '')
    .split(',')
    .map((item) => hostOf(item.trim()) || item.trim().toLowerCase())
    .filter(Boolean);
}

// True when the request came from a page on this site. Browsers always send
// Origin on a POST from fetch; scripts that post straight to the API usually
// send neither Origin nor Referer, or send a foreign one.
export function isSameOrigin(request) {
  const origin = hostOf(request.headers.get('origin'));
  const referer = hostOf(request.headers.get('referer'));
  const source = origin || referer;
  if (!source) return false;
  const ownHosts = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
  ]
    .filter(Boolean)
    .map((item) => item.split(',')[0].trim().toLowerCase());
  const allowed = new Set([...SITE_HOSTS, ...extraHosts(), ...ownHosts]);
  return allowed.has(source);
}

// Sliding window limiter kept in memory. Good enough for one server; it resets
// on redeploy.
export function overLimit(key, max, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10000) {
    for (const [k, times] of hits) {
      if (!times.some((time) => now - time < windowMs)) hits.delete(k);
    }
  }
  return false;
}

// Remove line breaks and control characters so a value is safe in a subject
// line or any other email header.
export function headerSafe(value, max = 120) {
  return String(value || '')
    .replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

export function honeypotTripped(body) {
  const value = body ? body[HONEYPOT_FIELD] : '';
  return typeof value === 'string' ? value.trim() !== '' : Boolean(value);
}

// formElapsedMs is measured in the browser, so clock differences between the
// visitor and the server do not matter.
export function tooFast(body) {
  const elapsed = Number(body ? body.formElapsedMs : NaN);
  return !Number.isFinite(elapsed) || elapsed < MIN_FORM_MS;
}

const URL_PATTERN = /(https?:\/\/|www\.|\[url|<a\s|\b[a-z0-9-]+\.(ru|cn|xyz|top|click|online|site|shop|biz|info|io)\b)/gi;

const SPAM_WORDS = [
  'seo services', 'seo agency', 'seo expert', 'backlink', 'guest post', 'crypto', 'bitcoin', 'casino', 'viagra',
  'cialis', 'porn', 'escort', 'loan offer', 'forex', 'web design services',
  'rank your website', 'first page of google', 'increase your traffic',
  'lead generation services', 'virtual assistant services', 'whatsapp me',
  'telegram me', 'business funding',
];

function linkCount(text) {
  return (String(text || '').match(URL_PATTERN) || []).length;
}

// Random-looking words like "uFJRtKdmXqZ" or "HjkdfLwqTyb".
function looksRandom(word) {
  if (word.length < 8) return false;
  const letters = word.replace(/[^A-Za-z]/g, '');
  if (letters.length < 8) return false;
  let caseFlips = 0;
  for (let i = 1; i < letters.length; i += 1) {
    const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase();
    const upper = letters[i] === letters[i].toUpperCase();
    if (!prevUpper && upper) caseFlips += 1;
  }
  if (caseFlips >= 3) return true;
  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  return vowels / letters.length < 0.15;
}

// Returns a reason string when the text looks like spam, otherwise ''.
export function spamReason({ name = '', message = '', extra = '' } = {}) {
  const nameText = String(name || '');
  const all = `${nameText}\n${message || ''}\n${extra || ''}`;
  const lower = all.toLowerCase();

  if (linkCount(nameText) > 0) return 'link in name';
  if (/[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF\u0E00-\u0E7F\uAC00-\uD7AF]/.test(all)) return 'foreign script';
  if (linkCount(all) > 1) return 'too many links';
  if (nameText.split(/\s+/).some(looksRandom)) return 'random name';
  const words = String(message || '').split(/\s+/).filter(Boolean);
  if (words.length >= 3 && words.filter(looksRandom).length / words.length > 0.4) return 'random text';
  for (const word of SPAM_WORDS) {
    const pattern = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (pattern.test(lower)) return `spam word: ${word}`;
  }
  return '';
}

// A quiet success for bots, so they do not learn which check stopped them.
export function silentDrop(reason, request) {
  console.warn(`Spam dropped (${reason}) from ${clientIp(request)}`);
  return NextResponse.json({ success: true, accepted: false });
}

export function rejectJson(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
