-- First disable RLS temporarily to reset policies
ALTER TABLE job_photos DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users full access to job photos" ON job_photos;

-- Re-enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Create more specific policies
CREATE POLICY "Users can insert job photos"
ON job_photos FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can view job photos"
ON job_photos FOR SELECT
TO authenticated
USING (true); 