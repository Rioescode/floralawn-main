// Visible copy on the contact/quote form "Backup Coverage Assistance" checkbox.
// The API sends BACKUP_REFERRAL_CONSENT_TEXT with a consented lead. Keep these
// strings identical to the label the homeowner checks.

export const BACKUP_REFERRAL_CONSENT_TITLE = 'Backup Coverage Assistance';

export const BACKUP_REFERRAL_CONSENT_BADGE = 'No Extra Charge';

export const BACKUP_REFERRAL_CONSENT_BODY =
  "If our schedule is full or we cannot service your specific date/area, help connect me with a trusted local Rhode Island / MA partner so my property doesn't wait.";

export const BACKUP_REFERRAL_CONSENT_TEXT = [
  BACKUP_REFERRAL_CONSENT_TITLE,
  BACKUP_REFERRAL_CONSENT_BADGE,
  BACKUP_REFERRAL_CONSENT_BODY,
].join(' ');
