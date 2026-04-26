-- First drop ALL existing job policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs as professional" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs as customer" ON public.jobs;
DROP POLICY IF EXISTS "Customers can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Professionals can view available jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Customers can delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.jobs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.jobs;
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.jobs;
DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.jobs;

-- Recreate all job policies
CREATE POLICY "Customers can view own jobs"
ON public.jobs
FOR SELECT
USING (auth.uid() = customer_id);

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

-- Make sure RLS is enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY; 