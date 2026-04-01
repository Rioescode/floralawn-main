-- First disable RLS temporarily
ALTER TABLE job_photos DISABLE ROW LEVEL SECURITY;

-- Drop existing job_photos policies
DROP POLICY IF EXISTS "Users can insert their own job photos" ON job_photos;
DROP POLICY IF EXISTS "Users can view job photos they're involved with" ON job_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON job_photos;
DROP POLICY IF EXISTS "Allow all users to insert job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow all users to view job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON job_photos;

-- Re-enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Create a single permissive policy for all operations
CREATE POLICY "Allow authenticated users full access to job photos"
ON public.job_photos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
