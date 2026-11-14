import { supabase } from '@/lib/supabase';

const CSV_HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Address',
  'Service Type',
  'Frequency',
  'Price',
  'Status',
  'Scheduled Day',
  'Week',
  'Next Service',
  'Last Completed',
  'Payment Method',
  'Notes',
  'Safety Notes',
  'Created At',
];

function escapeCsvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Fetches every customer record from Supabase (paginated beyond the 1,000-row
 * default limit) and triggers a UTF-8 CSV download.
 */
export async function exportAllCustomersToCSV() {
  const pageSize = 1000;
  let from = 0;
  const allCustomers = [];

  while (true) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allCustomers.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  const rows = allCustomers.map((c) => [
    c.name || '',
    c.email || '',
    c.phone || '',
    c.address || '',
    c.service_type || '',
    c.frequency || '',
    c.price ?? '',
    c.status || '',
    c.scheduled_day || '',
    c.week || '',
    c.next_service || '',
    c.last_completed || '',
    c.payment_method || '',
    c.notes || '',
    c.safety_notes || '',
    c.created_at || '',
  ]);

  const csvContent =
    '\uFEFF' +
    [CSV_HEADERS, ...rows]
      .map((row) => row.map(escapeCsvField).join(','))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `all-customers-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return { count: allCustomers.length };
}
