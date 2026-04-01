-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_job_updates" ON jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive job policies
CREATE POLICY "allow_job_creation"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
);

CREATE POLICY "allow_job_viewing"
ON jobs FOR SELECT
TO authenticated
USING (
  -- Can view if:
  status = 'open'  -- Job is open
  OR customer_id = auth.uid()  -- You're the customer
  OR professional_id = auth.uid()  -- You're the assigned professional
  OR EXISTS (  -- You've placed a bid
    SELECT 1 FROM bids 
    WHERE bids.job_id = id 
    AND bids.professional_id = auth.uid()
  )
);

CREATE POLICY "allow_job_updates"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()  -- Customer can update their jobs
  OR 
  (professional_id = auth.uid() AND status = 'in_progress')  -- Professional can update assigned jobs
)
WITH CHECK (
  customer_id = auth.uid()  -- Customer can update their jobs
  OR 
  (professional_id = auth.uid() AND status = 'completed')  -- Professional can only mark as completed
);

CREATE POLICY "allow_job_deletion"
ON jobs FOR DELETE
TO authenticated
USING (
  customer_id = auth.uid()  -- Only customer can delete their jobs
  AND status = 'open'  -- Can only delete open jobs
); 