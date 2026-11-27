// Optional Cloudflare Turnstile. Stays off unless a site key and the secret
// are both set, so forms behave exactly as before when the vars are missing.

// The public key is published by next.config only when a site key and
// TURNSTILE_SECRET_KEY were both present at build time. Checking that same
// value here keeps the widget and the server check on or off together.
export function turnstileActive() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token, ip) {
  if (!turnstileActive()) return { ok: true, skipped: true };

  const responseToken = typeof token === 'string' ? token.trim() : '';
  if (!responseToken) {
    return { ok: false, error: 'Please complete the security check and try again.' };
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: responseToken,
  });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  let payload;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    payload = await response.json();
  } catch (error) {
    console.error('Turnstile verification request failed:', error?.message || error);
    return { ok: false, error: 'Security check could not be completed. Please try again.' };
  }

  if (!payload?.success) {
    console.warn('Turnstile rejected a submission:', payload?.['error-codes'] || 'unknown');
    return { ok: false, error: 'Security check failed. Please try again.' };
  }

  return { ok: true };
}
