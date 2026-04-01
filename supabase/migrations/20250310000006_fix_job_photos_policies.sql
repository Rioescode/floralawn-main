-- Drop existing job photos policies
DROP POLICY IF EXISTS "view_job_photos" ON public.job_photos;
DROP POLICY IF EXISTS "Users can view job photos" ON public.job_photos;

-- Create comprehensive job photos policies
-- View policy
CREATE POLICY "view_job_photos"
ON public.job_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_professional = true
      )
    )
  )
);

-- Insert policy
CREATE POLICY "insert_job_photos"
ON public.job_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
    )
  )
);

-- Update policy
CREATE POLICY "update_job_photos"
ON public.job_photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
    )
  )
);

-- Delete policy
CREATE POLICY "delete_job_photos"
ON public.job_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
    )
  )
);

-- Make sure RLS is enabled
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY; 