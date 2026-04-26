-- Add review-related columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS customer_review TEXT,
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_review BOOLEAN DEFAULT false;

-- Update jobs policies to allow review updates
DROP POLICY IF EXISTS "customer_update_own_jobs" ON public.jobs;
CREATE POLICY "customer_update_own_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
  auth.uid() = customer_id
);

-- Add specific policy for review updates
CREATE POLICY "customer_can_review_completed_jobs"
ON public.jobs
FOR UPDATE
USING (
  auth.uid() = customer_id 
  AND status = 'completed'
)
WITH CHECK (
  auth.uid() = customer_id 
  AND status = 'completed'
  AND (
    customer_review IS NOT NULL OR
    customer_rating IS NOT NULL OR
    reviewed_at IS NOT NULL OR
    has_review IS NOT NULL
  )
); 