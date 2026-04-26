-- First disable RLS
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Professionals can insert bids" ON bids;
DROP POLICY IF EXISTS "Users can read their own bids" ON bids;
DROP POLICY IF EXISTS "Professionals can update their own bids" ON bids;
DROP POLICY IF EXISTS "Professionals can delete their own pending bids" ON bids;

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create policies for bids
CREATE POLICY "Professionals can submit bids"
ON bids FOR INSERT 
TO authenticated
WITH CHECK (
  -- Must be a professional
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_professional = true
  )
  AND
  -- Can't bid on own jobs
  NOT EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
  AND
  professional_id = auth.uid()
);

CREATE POLICY "Users can view bids they're involved with"
ON bids FOR SELECT
TO authenticated
USING (
  -- Can see bids on jobs you created
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
  OR
  -- Can see your own bids
  professional_id = auth.uid()
);

CREATE POLICY "Professionals can update their pending bids"
ON bids FOR UPDATE
TO authenticated
USING (
  professional_id = auth.uid()
  AND status = 'pending'
)
WITH CHECK (
  professional_id = auth.uid()
  AND status = 'pending'
);

CREATE POLICY "Professionals can delete their pending bids"
ON bids FOR DELETE
TO authenticated
USING (
  professional_id = auth.uid()
  AND status = 'pending'
); 