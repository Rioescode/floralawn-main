const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initTable() {
  console.log('Checking for email_logs table...');
  
  // Try to query the table to see if it exists
  const { error } = await supabase.from('email_logs').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Table "email_logs" does not exist. Creating it...');
    
    // Since we can't run arbitrary SQL CREATE TABLE via JS client easily without a RPC
    // We will assume the user has to create it manually OR we try to insert a dummy record
    // and see what happens. 
    // Actually, I will just provide the SQL for the user if I can't create it.
    console.log('--- PLEASE RUN THIS SQL IN SUPABASE SQL EDITOR ---');
    console.log(`
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  type TEXT, -- 'QUOTE', 'INVOICE', 'REMINDER', etc.
  direction TEXT DEFAULT 'OUTBOUND', -- 'OUTBOUND' or 'INBOUND'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY \"Admin full access\" ON email_logs
  FOR ALL USING (auth.jwt() ->> 'email' = 'esckoofficial@gmail.com');
    `);
  } else if (!error) {
    console.log('Table "email_logs" already exists.');
  } else {
    console.error('Error checking table:', error);
  }
}

initTable();
