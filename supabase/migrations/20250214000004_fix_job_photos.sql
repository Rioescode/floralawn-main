-- Drop existing job photos policies
DROP POLICY IF EXISTS "Job photos are viewable by everyone" ON job_photos;
DROP POLICY IF EXISTS "Job owners can add photos" ON job_photos;
DROP POLICY IF EXISTS "Job owners can delete photos" ON job_photos;

-- Create new comprehensive policies
CREATE POLICY "Job photos are viewable by everyone" 
ON job_photos FOR SELECT 
USING (true);

CREATE POLICY "Job participants can add photos" 
ON job_photos FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_id 
    AND (
      auth.uid() = customer_id 
      OR auth.uid() = professional_id
    )
  )
);

CREATE POLICY "Job participants can delete photos" 
ON job_photos FOR DELETE 
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