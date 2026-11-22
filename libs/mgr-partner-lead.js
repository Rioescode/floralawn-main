// Server-only. Do not import this module from a client component.
// MGR_PARTNER_LEADS_SECRET must never be referenced in browser code.

const CANONICAL_MGR_PARTNER_LEADS_URL = 'https://mygreenrobot.com/api/partner-leads';

let loggedMissingEnv = false;

function logMissingEnvOnce() {
  if (loggedMissingEnv) return;
  loggedMissingEnv = true;
  console.warn(
    `Skipping My Green Robot partner lead forward: set both MGR_PARTNER_LEADS_URL and MGR_PARTNER_LEADS_SECRET. Canonical URL: ${CANONICAL_MGR_PARTNER_LEADS_URL}`
  );
}

/**
 * POST a consented Flora lead to My Green Robot.
 * Both env vars are required. An unset URL is not replaced at send time, so a
 * missing secret or a missing URL never leaves this server. Errors are logged
 * and swallowed so the contact form still succeeds.
 */
export async function forwardConsentedFloraLead(lead) {
  try {
    if (!lead || lead.consent_backup_referral !== true) return;
    if (lead.external_id == null || lead.external_id === '') return;

    const secret = String(process.env.MGR_PARTNER_LEADS_SECRET || '').trim();
    const url = String(process.env.MGR_PARTNER_LEADS_URL || '').trim();
    if (!secret || !url) {
      logMissingEnvOnce();
      return;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = (await response.text()).slice(0, 300);
      } catch {
        detail = '';
      }
      console.error(
        'My Green Robot partner lead forward failed:',
        response.status,
        lead.external_id,
        detail
      );
      return;
    }

    console.log('My Green Robot partner lead forwarded:', lead.external_id);
  } catch (error) {
    console.error(
      'My Green Robot partner lead forward error:',
      error && error.name ? error.name : 'Error',
      error && error.message ? error.message : error
    );
  }
}
