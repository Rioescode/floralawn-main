-- Add work timer tracking columns to customers table
-- work_started_at: tracks when the crew actually starts the job (after driving)
-- last_drive_duration_minutes: stores drive time from the last completed job

ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_drive_duration_minutes INTEGER;
