-- First drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "insert_job_photos" ON public.job_photos;
DROP POLICY IF EXISTS "view_job_photos" ON public.job_photos;
DROP POLICY IF EXISTS "update_job_photos" ON public.job_photos;
DROP POLICY IF EXISTS "delete_job_photos" ON public.job_photos;
DROP POLICY IF EXISTS "insert_completion_photos" ON public.job_photos;

-- Create single comprehensive insert policy for job photos
CREATE POLICY "insert_job_photos"
ON public.job_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      -- Allow customers to add photos to their jobs
      (jobs.customer_id = auth.uid()) OR
      -- Allow professionals to add photos to assigned jobs
      (jobs.professional_id = auth.uid() AND jobs.status IN ('in_progress', 'completed'))
    )
  )
);

-- Recreate other necessary policies
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
);

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