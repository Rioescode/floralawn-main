-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Professionals can view open jobs" ON jobs;
    DROP POLICY IF EXISTS "Customers can create jobs" ON jobs;
    DROP POLICY IF EXISTS "Customers can view own jobs" ON jobs;
    DROP POLICY IF EXISTS "Customers can update own jobs" ON jobs;
    DROP POLICY IF EXISTS "Customers can delete own jobs" ON jobs;
    DROP POLICY IF EXISTS "Professionals can insert bids" ON public.bids;
    DROP POLICY IF EXISTS "Users can read their own bids" ON public.bids;
    DROP POLICY IF EXISTS "Professionals can update their own bids" ON public.bids;
    DROP POLICY IF EXISTS "Professionals can delete their own pending bids" ON public.bids;
EXCEPTION
    WHEN OTHERS THEN 
    NULL;
END $$;

-- Then create policies
-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Allow professionals to view open jobs
CREATE POLICY "Professionals can view open jobs"
ON jobs FOR SELECT
TO authenticated
USING (
  (status = 'open' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_professional = true
  ))
  OR
  (auth.uid() = customer_id)
  OR
  (auth.uid() = professional_id)
);

-- Allow customers to create jobs
CREATE POLICY "Customers can create jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to view their own jobs
CREATE POLICY "Customers can view own jobs"
ON jobs FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Allow customers to update their own jobs
CREATE POLICY "Customers can update own jobs"
ON jobs FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to delete their own jobs
CREATE POLICY "Customers can delete own jobs"
ON jobs FOR DELETE
TO authenticated
USING (auth.uid() = customer_id);

-- Enable RLS on bids table
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Policy for professionals to insert bids
CREATE POLICY "Professionals can insert bids"
ON public.bids
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_professional = true
  )
);

-- Policy for users to read their own bids
CREATE POLICY "Users can read their own bids"
ON public.bids
FOR SELECT
TO authenticated
USING (
  professional_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = bids.job_id
    AND jobs.customer_id = auth.uid()
  )
);

-- Policy for professionals to update their own bids
CREATE POLICY "Professionals can update their own bids"
ON public.bids
FOR UPDATE
TO authenticated
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- Policy for professionals to delete their own pending bids
CREATE POLICY "Professionals can delete their own pending bids"
ON public.bids
FOR DELETE
TO authenticated
USING (
  professional_id = auth.uid() AND
  status = 'pending'
);
