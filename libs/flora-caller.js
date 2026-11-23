// Read-only caller recognition for the Flora phone line.
// Dynamic variable values are strings. ElevenLabs passes them straight into the prompt.

export const CALLER_LOOKUP_MS = 800;

const OPEN_APPOINTMENT = new Set([
  'pending',
  'confirmed',
  'scheduled',
  'booked',
  'in_progress',
  'in progress',
  'new',
  'open',
]);

export function emptyCallerVariables() {
  return {
    is_known_customer: 'false',
    customer_first_name: '',
    customer_name: '',
    customer_address: '',
    recent_jobs_summary: '',
    open_order_status: '',
    last_contact_date: '',
  };
}

export function lastTenDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  if (digits.length >= 10) return digits.slice(-10);
  return '';
}

export function phoneMatches(stored, digits10) {
  if (!digits10) return false;
  return lastTenDigits(stored) === digits10;
}

function clean(value) {
  return String(value || '')
    .replace(/\$\s?\d[\d,]*(?:\.\d{2})?/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function label(value) {
  return clean(value).replace(/_/g, ' ');
}

function dayKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function firstName(name) {
  const word = clean(name).split(' ')[0] || '';
  return word.replace(/[.,]+$/g, '');
}

function joinAddress(street, town) {
  const streetText = clean(street);
  const townText = clean(town);
  if (!streetText) return townText;
  if (!townText) return streetText;
  if (streetText.toLowerCase().includes(townText.toLowerCase())) return streetText;
  return `${streetText}, ${townText}`;
}

function latestDate(values) {
  const today = dayKey(new Date());
  let bestPast = '';
  let bestAny = '';
  for (const value of values) {
    const key = dayKey(value);
    if (!key) continue;
    if (key > bestAny) bestAny = key;
    if (key <= today && key > bestPast) bestPast = key;
  }
  return bestPast || bestAny;
}

export function summarizeCaller({ customers = [], leads = [], appointments = [], completedJobs = [] } = {}) {
  const known = customers.length + leads.length + appointments.length + completedJobs.length > 0;
  if (!known) return emptyCallerVariables();

  const customer = customers[0];
  const lead = leads[0];
  const visit = appointments[0];
  const job = completedJobs[0];

  const name = clean(customer?.name || visit?.customer_name || job?.customer_name || lead?.name);
  const address = joinAddress(
    customer?.address || visit?.street_address || job?.customer_address || lead?.address,
    visit?.city
  );

  const jobs = [
    ...appointments.map((row) => ({
      service: label(row.service_type) || 'service',
      status: label(row.status) || 'scheduled',
      when: dayKey(row.date || row.created_at),
      kind: 'scheduled',
    })),
    ...completedJobs.map((row) => ({
      service: label(row.service_type) || 'service',
      status: 'completed',
      when: dayKey(row.completed_date || row.job_date),
      kind: 'completed',
    })),
  ]
    .filter((row) => row.service)
    .sort((a, b) => (b.when || '').localeCompare(a.when || ''))
    .slice(0, 3);

  const recent = jobs
    .map((row) => (
      row.kind === 'completed'
        ? `${row.service}, completed ${row.when || 'date unknown'}`
        : `${row.service}, ${row.status}, scheduled ${row.when || 'date unknown'}`
    ))
    .join('; ')
    .slice(0, 400);

  const openVisit = appointments.find((row) => OPEN_APPOINTMENT.has(label(row.status).toLowerCase()));
  const openInvoice = completedJobs.find((row) => {
    const status = label(row.payment_status).toLowerCase();
    return status === 'unpaid' || status === 'partial';
  });
  const openLead = leads.find((row) => !/lost|closed|won|booked|cancelled|canceled/i.test(row.status || ''));

  let open = 'none';
  if (openVisit) {
    open = `Open: ${label(openVisit.service_type) || 'service'}, ${label(openVisit.status) || 'open'}${openVisit.date ? `, ${dayKey(openVisit.date)}` : ''}`;
  } else if (customer?.next_service && /active|pending/i.test(customer.status || '')) {
    open = `Open: ${label(customer.service_type) || 'service'}, ${label(customer.status)}, ${dayKey(customer.next_service)}`;
  } else if (openInvoice) {
    open = `Open invoice: ${label(openInvoice.service_type) || 'service'}, ${label(openInvoice.payment_status)}`;
  } else if (openLead) {
    open = `Open quote${openLead.status ? `, ${label(openLead.status)}` : ''}`;
  }

  const lastContact = latestDate([
    customer?.updated_at,
    customer?.last_service,
    customer?.created_at,
    ...appointments.flatMap((row) => [row.date, row.created_at]),
    ...completedJobs.flatMap((row) => [row.completed_date, row.job_date, row.created_at]),
    ...leads.flatMap((row) => [row.preferred_date, row.created_at]),
  ]);

  return {
    is_known_customer: 'true',
    customer_first_name: firstName(name),
    customer_name: name,
    customer_address: address,
    recent_jobs_summary: recent,
    open_order_status: open,
    last_contact_date: lastContact,
  };
}

function phoneFilter(column, digits10) {
  const area = digits10.slice(0, 3);
  const prefix = digits10.slice(3, 6);
  const line = digits10.slice(6);
  const values = [
    digits10,
    `1${digits10}`,
    `+1${digits10}`,
    `(${area}) ${prefix}-${line}`,
    `${area}-${prefix}-${line}`,
    `${area}.${prefix}.${line}`,
  ];
  const exact = values.map((value) => `${column}.eq."${value.replace(/"/g, '')}"`);
  return [...exact, `${column}.ilike."%${line}"`].join(',');
}

async function readTable(client, table, column, digits10, columns) {
  const { data, error } = await client
    .from(table)
    .select(columns)
    .or(phoneFilter(column, digits10))
    .limit(25);
  if (error) {
    console.error(`Caller lookup skipped ${table}:`, error.message);
    return [];
  }
  return (data || []).filter((row) => phoneMatches(row[column], digits10));
}

function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        console.error('Caller lookup failed:', error?.message || error);
        resolve(null);
      }
    );
  });
}

async function fetchGroups(digits10) {
  const { supabaseAdmin } = await import('@/lib/supabase');
  if (!supabaseAdmin) return null;
  const [customers, leads, appointments, completedJobs] = await Promise.all([
    readTable(
      supabaseAdmin,
      'customers',
      'phone',
      digits10,
      'name, phone, address, service_type, status, next_service, last_service, updated_at, created_at'
    ),
    readTable(
      supabaseAdmin,
      'leads',
      'phone',
      digits10,
      'name, phone, address, status, preferred_date, created_at'
    ),
    readTable(
      supabaseAdmin,
      'appointments',
      'customer_phone',
      digits10,
      'customer_name, customer_phone, street_address, city, service_type, status, date, created_at'
    ),
    readTable(
      supabaseAdmin,
      'completed_jobs',
      'customer_phone',
      digits10,
      'customer_name, customer_phone, customer_address, service_type, job_date, completed_date, payment_status, created_at'
    ),
  ]);
  return { customers, leads, appointments, completedJobs };
}

export async function lookupCaller(phone) {
  const empty = emptyCallerVariables();
  const digits10 = lastTenDigits(phone);
  if (!digits10) return { variables: empty };
  const groups = await withTimeout(fetchGroups(digits10), CALLER_LOOKUP_MS);
  if (!groups) return { variables: empty };
  return { variables: summarizeCaller(groups) };
}
