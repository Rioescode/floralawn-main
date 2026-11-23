import crypto from 'crypto';

// ElevenLabs signs `${timestamp}.${rawBody}` with HMAC-SHA256 and sends
// `ElevenLabs-Signature: t=<unix>,v0=<hex>`. Reject signatures older than
// the window their SDK uses (30 minutes) so a captured delivery cannot be replayed.
const MAX_AGE_SECONDS = 30 * 60;

export function verifyElevenLabsSignature(rawBody, signatureHeader, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!rawBody && rawBody !== '') return false;
  if (!signatureHeader || !secret) return false;

  const parts = String(signatureHeader).split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith('v0='))
    .map((part) => part.slice(3).trim().toLowerCase());

  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;

  // Match the ElevenLabs SDK: reject a timestamp older than 30 minutes.
  // A few seconds of clock skew into the future still verifies.
  if (nowSeconds - Number(timestamp) > MAX_AGE_SECONDS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  return signatures.some((signature) => {
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (signatureBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(signatureBuf, expectedBuf);
  });
}
