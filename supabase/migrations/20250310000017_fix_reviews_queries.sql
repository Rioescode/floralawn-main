-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_professional ON public.reviews(job_id, reviewed_id);

-- Add RLS policies for reviews
DROP POLICY IF EXISTS "professionals_can_view_own_reviews" ON public.reviews;
CREATE POLICY "professionals_can_view_own_reviews"
ON public.reviews
FOR SELECT
USING (
  reviewed_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.professional_id = auth.uid()
  )
);

-- Make sure RLS is enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY; 