// Small checks for public endpoints that send email: the request must come
// from a page on this site, and each key gets a limited number of calls.

const SITE_HOSTS = [
  'floralawn-and-landscaping.com',
  'www.floralawn-and-landscaping.com',
  'riyardworks.com',
  'www.riyardworks.com',
  'localhost:3000',
];

const hits = new Map();

function hostOf(value) {
  if (!value) return '';
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return '';
  }
}

export function requestIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded ? forwarded.split(',')[0].trim() : '';
  return first || request.headers.get('x-real-ip') || 'unknown';
}

export function fromOwnSite(request) {
  const source = hostOf(request.headers.get('origin')) || hostOf(request.headers.get('referer'));
  if (!source) return false;
  const own = [request.headers.get('x-forwarded-host'), request.headers.get('host')]
    .filter(Boolean)
    .map((item) => item.split(',')[0].trim().toLowerCase());
  const extra = String(process.env.ALLOWED_FORM_ORIGINS || '')
    .split(',')
    .map((item) => hostOf(item.trim()) || item.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...SITE_HOSTS, ...extra, ...own]).has(source);
}

export function tooManyCalls(key, max, windowMs) {
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

export function escapeForEmail(value, max = 500) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, max)
    .replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export const SIMPLE_EMAIL = /^[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+\.[^\s@<>"'(),;:]+$/;
