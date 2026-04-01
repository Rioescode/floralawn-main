-- First, drop ALL existing job-related policies
DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can read own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "Professionals can read all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Professionals can update assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Professionals can view available jobs" ON public.jobs;

-- Create fresh policies
-- Allow customers to view their own jobs
CREATE POLICY "customer_read_own_jobs"
ON public.jobs
FOR SELECT
USING (auth.uid() = customer_id);

-- Allow professionals to view all jobs
CREATE POLICY "professional_read_all_jobs"
ON public.jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_professional = true
  )
);

-- Allow customers to create jobs
CREATE POLICY "customer_create_jobs"
ON public.jobs
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to update their own jobs
CREATE POLICY "customer_update_own_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Allow professionals to update jobs assigned to them
CREATE POLICY "professional_update_assigned_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Allow customers to delete their own jobs
CREATE POLICY "customer_delete_own_jobs"
ON public.jobs
FOR DELETE
USING (auth.uid() = customer_id);

-- Make sure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Add policies for related tables
-- Bids
DROP POLICY IF EXISTS "Users can view related bids" ON public.bids;
CREATE POLICY "view_related_bids"
ON public.bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR auth.uid() = professional_id
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_professional = true
      )
    )
  )
);

-- Job Photos
DROP POLICY IF EXISTS "Users can view job photos" ON public.job_photos;
CREATE POLICY "view_job_photos"
ON public.job_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR auth.uid() = professional_id
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_professional = true
      )
    )
  )
);

-- Enable RLS on related tables
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY; 