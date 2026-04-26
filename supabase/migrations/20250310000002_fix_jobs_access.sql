-- Drop existing job policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs as professional" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs as customer" ON public.jobs;

-- Allow customers to view their own jobs
CREATE POLICY "Customers can view own jobs"
ON public.jobs
FOR SELECT
USING (auth.uid() = customer_id);

-- Allow professionals to view available jobs
CREATE POLICY "Professionals can view available jobs"
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
CREATE POLICY "Customers can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to update their own jobs
CREATE POLICY "Customers can update own jobs"
ON public.jobs
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to delete their own jobs
CREATE POLICY "Customers can delete own jobs"
ON public.jobs
FOR DELETE
USING (auth.uid() = customer_id);

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY; 