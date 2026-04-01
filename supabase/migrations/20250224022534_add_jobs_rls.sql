-- Drop existing policies
DROP POLICY IF EXISTS "Professionals can view open jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can create jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can delete own jobs" ON jobs;

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Allow professionals to view open jobs
CREATE POLICY "Professionals can view open jobs"
ON jobs FOR SELECT
TO authenticated
USING (
  (status = 'open' AND EXISTS (
    SELECT 1 FROM professional_profiles
    WHERE professional_profiles.id = auth.uid()
  ))
  OR
  (auth.uid() = customer_id)
  OR
  (auth.uid() = professional_id)
);

-- Allow customers to create jobs
CREATE POLICY "Customers can create jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to view their own jobs
CREATE POLICY "Customers can view own jobs"
ON jobs FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Allow customers to update their own jobs
CREATE POLICY "Customers can update own jobs"
ON jobs FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to delete their own jobs
CREATE POLICY "Customers can delete own jobs"
ON jobs FOR DELETE
TO authenticated
USING (auth.uid() = customer_id);

-- Drop existing job_photos policies
DROP POLICY IF EXISTS "Users can insert their own job photos" ON job_photos;
DROP POLICY IF EXISTS "Users can view job photos they're involved with" ON job_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON job_photos;

-- Enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

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
