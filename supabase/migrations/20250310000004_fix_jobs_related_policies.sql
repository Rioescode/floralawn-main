-- Drop ALL existing related policies
DROP POLICY IF EXISTS "Customers can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Professionals can view available jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can delete own jobs" ON public.jobs;

-- Jobs policies
CREATE POLICY "Customers can view own jobs"
ON public.jobs
FOR SELECT
USING (
  auth.uid() = customer_id 
  OR 
  auth.uid() = professional_id
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_professional = true
  )
);

CREATE POLICY "Customers can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own jobs"
ON public.jobs
FOR DELETE
USING (auth.uid() = customer_id);

-- Bids policies
DROP POLICY IF EXISTS "Users can view related bids" ON public.bids;
CREATE POLICY "Users can view related bids"
ON public.bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR
      professional_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_professional = true
      )
    )
  )
);

-- Job photos policies
DROP POLICY IF EXISTS "Users can view job photos" ON public.job_photos;
CREATE POLICY "Users can view job photos"
ON public.job_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR
      jobs.professional_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_professional = true
      )
    )
  )
);

-- Time suggestions policies
DROP POLICY IF EXISTS "Users can view time suggestions" ON public.time_suggestions;
CREATE POLICY "Users can view time suggestions"
ON public.time_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR
      jobs.professional_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_professional = true
      )
    )
  )
);

-- Enable RLS on all related tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_suggestions ENABLE ROW LEVEL SECURITY; 