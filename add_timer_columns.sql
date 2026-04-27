
-- Add timer columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS job_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_job_duration_minutes INTEGER;

-- Add duration tracking to history tables
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

ALTER TABLE completed_jobs
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
