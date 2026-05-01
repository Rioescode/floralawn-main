const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gkfyapscbtcvrvtrvfus.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZnlhcHNjYnRjdnJ2dHJ2ZnVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDM1NTMyNCwiZXhwIjoyMDU1OTMxMzI0fQ.5BCrfbYPxnrsy9hEcQF_n18qeSCbq23eYBMVkLdc9i4'
);

async function debugPawtucket() {
  const { data, error } = await supabase
    .from('customers')
    .select('city, zipcode');
  
  if (error) {
    console.error(error);
    return;
  }
  
  const pawtucket = data.filter(c => c.city && c.city.toLowerCase().includes('pawtucket'));
  console.log('Pawtucket Entries Found:', pawtucket.length);
  if (pawtucket.length > 0) {
    console.log('Sample Entries:', pawtucket.slice(0, 5));
  }
}

debugPawtucket();
