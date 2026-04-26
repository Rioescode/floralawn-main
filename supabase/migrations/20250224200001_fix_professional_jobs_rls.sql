-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "jobs_select_policy" ON jobs;
DROP POLICY IF EXISTS "Professionals can view open jobs" ON jobs;
DROP POLICY IF EXISTS "allow_job_viewing" ON jobs;

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create a single comprehensive select policy for jobs
CREATE POLICY "jobs_select_policy"
ON jobs FOR SELECT
TO authenticated
USING (
  -- Anyone can view open jobs if they are a professional
  (
    status = 'open' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_professional = true
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

-- Ensure all users with professional profiles are marked as professionals
UPDATE profiles 
SET is_professional = true 
WHERE id IN (
  SELECT id FROM professional_profiles
); 