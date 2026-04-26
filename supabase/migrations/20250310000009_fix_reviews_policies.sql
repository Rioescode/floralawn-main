-- Drop existing review policies if any
DROP POLICY IF EXISTS "customers_can_create_reviews" ON public.reviews;
DROP POLICY IF EXISTS "users_can_view_reviews" ON public.reviews;
DROP POLICY IF EXISTS "customers_can_update_own_reviews" ON public.reviews;
DROP POLICY IF EXISTS "customers_can_delete_own_reviews" ON public.reviews;

-- Create review policies
-- Allow customers to create reviews for completed jobs
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
      -- Ensure no review exists for this job
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

-- Update jobs policies to ensure proper completion flow
DROP POLICY IF EXISTS "customer_update_own_jobs" ON public.jobs;
CREATE POLICY "customer_update_own_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
  auth.uid() = customer_id 
  AND (
    -- Allow any updates when job is not completed
    status != 'completed'
    OR
    -- Allow marking as completed
    (OLD.status != 'completed' AND NEW.status = 'completed')
    OR
    -- Allow updating review-related fields after completion
    (
      status = 'completed' 
      AND (
        NEW.customer_review IS DISTINCT FROM OLD.customer_review
        OR NEW.customer_rating IS DISTINCT FROM OLD.customer_rating
      )
    )
  )
); 