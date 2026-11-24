import { validateEmail, sanitizeText } from '@/lib/validation';
import {
  emailLayout,
  heading,
  section,
  detailsTable,
  button,
  buttonRow,
  callout,
  escapeHtml,
} from '@/libs/email-template';

export const APPLICATION_FIELDS = [
  ['fullName', 'Full name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['city', 'Town / city'],
  ['position', 'Position'],
  ['experience', 'Years of experience'],
  ['driversLicense', "Driver's license"],
  ['availability', 'Availability'],
  ['startDate', 'Start date'],
  ['languages', 'Languages'],
  ['message', 'Message'],
];

const ALLOWED_LANGUAGES = ['English', 'Spanish'];

export function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export function isReasonablePhone(phone) {
  const digits = phoneDigits(phone);
  return digits.length >= 10 && digits.length <= 15;
}

function clean(value, max) {
  return sanitizeText(typeof value === 'string' ? value : '', max);
}

function splitName(fullName) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || fullName,
    lastName: parts.slice(1).join(' '),
  };
}

function formatStartDate(iso) {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function validateApplication(body) {
  const source = body && typeof body === 'object' ? body : {};
  const errors = [];
  const fullName = clean(source.fullName, 100);
  const phone = clean(source.phone, 30);
  const email = clean(source.email, 254).toLowerCase();

  if (fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'Please enter your full name.' });
  }
  if (!phone && !email) {
    errors.push({ field: 'contact', message: 'Add a phone number or an email so we can reach you.' });
  }
  if (phone && !isReasonablePhone(phone)) {
    errors.push({ field: 'phone', message: 'That phone number does not look right. Include the area code.' });
  }
  if (email && !validateEmail(email)) {
    errors.push({ field: 'email', message: 'That email address does not look right.' });
  }

  return errors;
}

export function normalizeApplication(body) {
  const source = body && typeof body === 'object' ? body : {};
  const fullName = clean(source.fullName, 100);
  const { firstName, lastName } = splitName(fullName);
  const languages = (Array.isArray(source.languages) ? source.languages : [])
    .map((item) => clean(item, 20))
    .filter((item) => ALLOWED_LANGUAGES.includes(item));
  const uniqueLanguages = [...new Set(languages)];
  const startDate = /^(\d{4})-(\d{2})-(\d{2})$/.test(clean(source.startDate, 10))
    ? clean(source.startDate, 10)
    : '';
  const license = clean(source.driversLicense, 3).toLowerCase();

  return {
    fullName,
    firstName,
    lastName,
    phone: clean(source.phone, 30),
    email: clean(source.email, 254).toLowerCase(),
    city: clean(source.city, 100),
    position: clean(source.position, 120),
    experience: clean(source.experience, 80),
    driversLicense: license === 'yes' ? 'Yes' : license === 'no' ? 'No' : '',
    availability: clean(source.availability, 80),
    startDate,
    languages: uniqueLanguages.join(', '),
    message: clean(source.message, 2000),
  };
}

function shown(value) {
  const text = String(value || '').trim();
  return text || 'Not provided';
}

export function applicationRows(application) {
  return APPLICATION_FIELDS.map(([key, label]) => ({
    label,
    value: key === 'startDate' ? shown(formatStartDate(application.startDate)) : shown(application[key]),
  }));
}

export function applicationText(application, receivedLabel) {
  const lines = [
    'New job application',
    `Received: ${receivedLabel}`,
    '',
    ...applicationRows(application).map((row) => `${row.label}: ${row.value}`),
  ];
  return lines.join('\n');
}

export function applicationHtml(application, receivedLabel) {
  const place = [application.position, application.city].filter(Boolean).join(' · ');
  const digits = phoneDigits(application.phone);
  const speaksSpanish = application.languages.toLowerCase().includes('spanish');
  const rows = applicationRows(application);

  const body = [
    `<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#991B1B;">Job application · ${escapeHtml(receivedLabel)}</p>`,
    heading(application.fullName, escapeHtml(place || 'Crew application')),
    buttonRow([
      digits ? button(`tel:${digits}`, 'Call', 'primary') : '',
      application.email ? button(`mailto:${application.email}`, 'Email', 'outline') : '',
    ]),
    speaksSpanish
      ? callout('<strong>Spanish.</strong> This applicant marked Spanish as a language they speak.')
      : '',
    section('Application', detailsTable(rows)),
  ].join('');

  return emailLayout({
    preheader: `${application.fullName} applied${application.position ? ` for ${application.position}` : ''}${application.city ? ` in ${application.city}` : ''}.`,
    body,
    footerNote: application.email
      ? 'Reply to this email to reach the applicant.'
      : 'This applicant did not leave an email. Use the phone number above.',
  });
}

export function applicationSubject(application) {
  return [
    `Job application: ${application.fullName}`,
    application.position || 'Crew',
    application.city || 'Rhode Island',
  ].join(' · ');
}

export function applicationInsertRow(application) {
  return {
    full_name: application.fullName,
    first_name: application.firstName,
    last_name: application.lastName || null,
    email: application.email || null,
    phone: application.phone || null,
    city: application.city || null,
    state: 'RI',
    position: application.position || null,
    experience: application.experience || null,
    drivers_license: application.driversLicense || null,
    availability: application.availability || null,
    start_date: application.startDate || null,
    languages: application.languages || null,
    message: application.message || null,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function legacyApplicationInsertRow(application) {
  const dump = applicationRows(application).map((row) => `${row.label}: ${row.value}`).join('\n');
  return {
    first_name: application.firstName,
    last_name: application.lastName || application.firstName,
    email: application.email || 'not-provided',
    phone: application.phone || 'not-provided',
    address: application.city || 'Rhode Island',
    city: application.city || 'Not provided',
    state: 'RI',
    zip_code: '00000',
    position: application.position || 'General crew',
    experience: application.experience || 'Not provided',
    availability: [application.availability, application.startDate].filter(Boolean).join(' · ') || 'Not provided',
    start_date: application.startDate || null,
    why_interested: application.message || 'Application submitted from the careers page.',
    additional_info: dump,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}
