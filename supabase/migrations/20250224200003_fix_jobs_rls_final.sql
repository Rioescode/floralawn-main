-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "jobs_select_policy" ON jobs;
DROP POLICY IF EXISTS "Professionals can view open jobs" ON jobs;
DROP POLICY IF EXISTS "allow_job_viewing" ON jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;

-- Re-enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create a single comprehensive select policy for jobs
CREATE POLICY "jobs_select_policy"
ON jobs FOR SELECT
TO authenticated
USING (
  -- Professionals can view all open jobs
  (
    status = 'open' AND 
    EXISTS (
      SELECT 1 FROM professional_profiles 
      WHERE professional_profiles.profile_id = auth.uid()
    )
  )
  OR customer_id = auth.uid()  -- Customer can view their own jobs
  OR professional_id = auth.uid()  -- Professional can view jobs assigned to them
  OR EXISTS (  -- Professional can view jobs they've bid on
    SELECT 1 FROM bids 
    WHERE bids.job_id = id 
    AND bids.professional_id = auth.uid()
  )
);

-- Create update policy for jobs
CREATE POLICY "jobs_update_policy"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()  -- Customer can update their own jobs
  OR professional_id = auth.uid()  -- Professional can update jobs assigned to them
)
WITH CHECK (
  customer_id = auth.uid()  -- Customer can update their own jobs
  OR professional_id = auth.uid()  -- Professional can update jobs assigned to them
); 