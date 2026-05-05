const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load env from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
  console.log('Attempting to check/add service_count column to customers table...');
  
  const { data, error } = await supabase
    .from('customers')
    .select('service_count')
    .limit(1);
    
  if (error && error.code === '42703') { // undefined_column
    console.log('Column "service_count" does not exist.');
    console.log('Since we cannot run ALTER TABLE via the JS client easily, please run this in your Supabase SQL Editor:');
    console.log('ALTER TABLE customers ADD COLUMN service_count INTEGER DEFAULT 0;');
  } else if (error) {
    console.error('Error checking column:', error);
  } else {
    console.log('Column "service_count" already exists!');
  }
}

addColumn();
