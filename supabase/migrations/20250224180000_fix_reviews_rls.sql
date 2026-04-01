-- First disable RLS
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "allow_review_creation"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      -- Customer can review completed jobs
      (jobs.customer_id = auth.uid() AND jobs.status = 'completed')
      OR
      -- Professional can review completed jobs
      (jobs.professional_id = auth.uid() AND jobs.status = 'completed')
    )
  )
  AND reviewer_id = auth.uid()  -- Ensure reviewer is the authenticated user
);

CREATE POLICY "allow_review_viewing"
ON reviews FOR SELECT
TO authenticated
USING (true);  -- Anyone can view reviews

CREATE POLICY "allow_review_updates"
ON reviews FOR UPDATE
TO authenticated
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "allow_review_deletion"
ON reviews FOR DELETE
TO authenticated
USING (reviewer_id = auth.uid()); 