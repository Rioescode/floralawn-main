-- First drop ALL existing policies for bids table
DROP POLICY IF EXISTS "Bids are viewable by job owner and bidder" ON bids;
DROP POLICY IF EXISTS "Professionals can create bids" ON bids;
DROP POLICY IF EXISTS "Professionals can update their own bids" ON bids;
DROP POLICY IF EXISTS "Users can update bid status" ON bids;
DROP POLICY IF EXISTS "Users can update bids" ON bids;

-- Create new comprehensive policies
-- SELECT policy - Allow job owner and bidder to view bids
CREATE POLICY "Bids are viewable by job owner and bidder" 
ON bids FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_id 
    AND (
      auth.uid() = customer_id 
      OR auth.uid() = professional_id
    )
  )
);

-- INSERT policy - Allow professionals to create bids
CREATE POLICY "Professionals can create bids" 
ON bids FOR INSERT 
WITH CHECK (
  auth.uid() = professional_id AND
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_id 
    AND jobs.status = 'open'
  )
);

-- UPDATE policy - Allow both customers and professionals to update bids
CREATE POLICY "Users can update bids"
ON bids FOR UPDATE
USING (
  -- Customer can update any bid status for their job
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_id 
    AND jobs.customer_id = auth.uid()
  )
  OR
  -- Professional can only update their own bid if job is open
  (
    auth.uid() = professional_id AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_id 
      AND jobs.status = 'open'
    )
  )
); 