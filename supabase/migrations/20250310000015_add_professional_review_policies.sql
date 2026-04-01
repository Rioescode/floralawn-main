-- Add policy for professionals to view reviews of their jobs
DROP POLICY IF EXISTS "professionals_can_view_reviews" ON public.reviews;
CREATE POLICY "professionals_can_view_reviews"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM bids
        WHERE bids.job_id = jobs.id
        AND bids.professional_id = auth.uid()
      )
    )
  )
);

-- Add index to improve review queries
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON public.reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id); 