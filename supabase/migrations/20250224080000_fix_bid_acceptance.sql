-- First disable RLS temporarily
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;

-- Drop existing update policies
DROP POLICY IF EXISTS "Customers can accept bids" ON bids;
DROP POLICY IF EXISTS "Professionals can update their own bids" ON bids;

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create policies for bid updates
CREATE POLICY "Customers can accept or reject bids"
ON bids FOR UPDATE
TO authenticated
USING (
  -- Must be the customer of the job
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
)
WITH CHECK (
  -- Can only update status field
  (
    CASE WHEN status = 'accepted' THEN
      -- When accepting, ensure no other bid is accepted
      NOT EXISTS (
        SELECT 1 FROM bids b2
        WHERE b2.job_id = job_id
        AND b2.id != id
        AND b2.status = 'accepted'
      )
    ELSE true
    END
  )
);

-- Also update jobs table policy to allow status updates
CREATE POLICY "Customers can update job status when accepting bid"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
)
WITH CHECK (
  customer_id = auth.uid()
  AND (
    -- Allow updating professional_id when accepting bid
    CASE WHEN professional_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM bids
        WHERE bids.job_id = id
        AND bids.professional_id = professional_id
        AND bids.status = 'accepted'
      )
    ELSE true
    END
  )
); 