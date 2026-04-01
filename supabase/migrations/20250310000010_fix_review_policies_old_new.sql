-- Drop existing review policies if any
DROP POLICY IF EXISTS "customers_can_create_reviews" ON public.reviews;
DROP POLICY IF EXISTS "users_can_view_reviews" ON public.reviews;
DROP POLICY IF EXISTS "customers_can_update_own_reviews" ON public.reviews;
DROP POLICY IF EXISTS "customers_can_delete_own_reviews" ON public.reviews;
DROP POLICY IF EXISTS "customer_update_own_jobs" ON public.jobs;

-- Create review policies
CREATE POLICY "customers_can_create_reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
    AND jobs.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM reviews r2
      WHERE r2.job_id = job_id
    )
  )
);

-- Allow anyone to view reviews
CREATE POLICY "users_can_view_reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Allow customers to update their own reviews
CREATE POLICY "customers_can_update_own_reviews"
ON public.reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
    AND jobs.status = 'completed'
  )
);

-- Allow customers to delete their own reviews
CREATE POLICY "customers_can_delete_own_reviews"
ON public.reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
);

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Simpler jobs update policy that allows customers to manage their jobs
CREATE POLICY "customer_update_own_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
  auth.uid() = customer_id
);

-- Add specific policy for job completion
CREATE POLICY "customer_complete_own_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
  auth.uid() = customer_id
  AND status = 'completed'
); 