
import { supabaseAdmin } from './lib/supabase.js';

async function checkJobStartedAt() {
  console.log('Checking for job_started_at column...');
  
  // Try to select the column specifically
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('job_started_at')
    .limit(1);
    
  if (error) {
    if (error.message.includes('column "job_started_at" does not exist')) {
      console.log('COLUMN_MISSING: job_started_at');
    } else {
      console.error('Database Error:', error.message);
    }
  } else {
    console.log('COLUMN_EXISTS: job_started_at');
  }
  
  // Also check for last_job_duration_minutes
  const { error: error2 } = await supabaseAdmin
    .from('customers')
    .select('last_job_duration_minutes')
    .limit(1);
    
  if (error2) {
    if (error2.message.includes('column "last_job_duration_minutes" does not exist')) {
      console.log('COLUMN_MISSING: last_job_duration_minutes');
    }
  } else {
    console.log('COLUMN_EXISTS: last_job_duration_minutes');
  }
}

checkJobStartedAt();
