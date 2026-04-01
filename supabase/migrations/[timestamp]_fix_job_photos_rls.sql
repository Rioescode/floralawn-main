-- Drop existing job_photos policies if they exist
DROP POLICY IF EXISTS "Users can insert their own job photos" ON job_photos;
DROP POLICY IF EXISTS "Users can view job photos they're involved with" ON job_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON job_photos;
DROP POLICY IF EXISTS "Allow all users to insert job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow all users to view job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON job_photos;

-- Simple policies for job_photos
CREATE POLICY "Allow all users to insert job photos"
ON public.job_photos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all users to view job photos"
ON public.job_photos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to delete their own photos"
ON public.job_photos
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());