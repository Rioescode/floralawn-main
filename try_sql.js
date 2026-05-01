
import { supabaseAdmin } from './lib/supabase.js';

async function trySql() {
  const sql = `
    ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS job_started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_job_duration_minutes INTEGER;
    
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
  `;
  
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.log('RPC_FAILED: exec_sql does not exist or failed');
    console.error(error.message);
  } else {
    console.log('RPC_SUCCESS: Columns added via exec_sql');
  }
}

trySql();
