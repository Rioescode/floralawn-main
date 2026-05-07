const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('type', 'INBOUND');

  if (error) {
    console.error('Check Error:', error.message);
  } else {
    console.log(`Found ${data?.length || 0} INBOUND records.`);
    if (data && data.length > 0) {
      console.log('--- INBOUND BODY PREVIEW ---');
      console.log('Subject:', data[0].subject);
      console.log('Body (First 500 chars):', data[0].body_html?.substring(0, 500));
    }
  }
}

check();
