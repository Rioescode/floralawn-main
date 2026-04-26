-- Drop existing update policies for jobs
DROP POLICY IF EXISTS "customer_update_own_jobs" ON public.jobs;
DROP POLICY IF EXISTS "professional_update_assigned_jobs" ON public.jobs;

-- Create more specific update policies
-- Allow customers to update their own jobs
CREATE POLICY "customer_update_own_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
  auth.uid() = customer_id 
  AND (
    -- Allow status updates to 'completed' or other status changes
    (OLD.status IS DISTINCT FROM NEW.status) OR
    -- Allow other field updates when job is not completed
    (status != 'completed')
  )
);

-- Allow professionals to update jobs assigned to them
CREATE POLICY "professional_update_assigned_jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = professional_id)
WITH CHECK (
  auth.uid() = professional_id
  AND (
    -- Allow status updates to 'completed'
    (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') OR
    -- Allow other field updates when job is in progress
    (status = 'in_progress')
  )
);

-- Add policy for job completion photos
CREATE POLICY "insert_completion_photos"
ON public.job_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      -- Allow both customer and professional to add completion photos
      (jobs.customer_id = auth.uid() AND jobs.status = 'completed') OR
      (jobs.professional_id = auth.uid() AND jobs.status IN ('in_progress', 'completed'))
    )
  )
);

-- Make sure we can update completion_photos and completion_notes
CREATE POLICY "update_job_completion"
ON public.jobs
FOR UPDATE
USING (
  (auth.uid() = customer_id AND status = 'completed') OR
  (auth.uid() = professional_id AND status IN ('in_progress', 'completed'))
)
WITH CHECK (
  (auth.uid() = customer_id AND status = 'completed') OR
  (auth.uid() = professional_id AND status IN ('in_progress', 'completed'))
); 