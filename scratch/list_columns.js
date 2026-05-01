const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gkfyapscbtcvrvtrvfus.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZnlhcHNjYnRjdnJ2dHJ2ZnVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDM1NTMyNCwiZXhwIjoyMDU1OTMxMzI0fQ.5BCrfbYPxnrsy9hEcQF_n18qeSCbq23eYBMVkLdc9i4'
);

async function listColumns() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('Columns in customers table:', Object.keys(data[0]));
}

listColumns();
