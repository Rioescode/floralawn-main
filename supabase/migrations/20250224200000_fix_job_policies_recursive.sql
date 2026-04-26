-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_job_creation" ON jobs;
DROP POLICY IF EXISTS "allow_job_viewing" ON jobs;
DROP POLICY IF EXISTS "allow_job_updates" ON jobs;
DROP POLICY IF EXISTS "allow_job_deletion" ON jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "jobs_insert_policy"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "jobs_select_policy"
ON jobs FOR SELECT
TO authenticated
USING (
  status = 'open' 
  OR customer_id = auth.uid() 
  OR professional_id = auth.uid()
  OR id IN (
    SELECT job_id FROM bids 
    WHERE professional_id = auth.uid()
  )
);

CREATE POLICY "jobs_update_policy"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid() 
  OR professional_id = auth.uid()
);

CREATE POLICY "jobs_delete_policy"
ON jobs FOR DELETE
TO authenticated
USING (customer_id = auth.uid()); 