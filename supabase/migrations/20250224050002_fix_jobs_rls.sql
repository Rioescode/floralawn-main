-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Professionals can view open jobs" ON jobs;
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON jobs;
DROP POLICY IF EXISTS "Customers can create jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can delete own jobs" ON jobs;

-- Re-enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Allow professionals to view jobs"
ON jobs FOR SELECT
TO authenticated
USING (
  -- Professional can view open jobs
  (status = 'open' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_professional = true
  ))
  OR
  -- Or if they're involved with the job
  auth.uid() = customer_id
  OR
  auth.uid() = professional_id
);

-- Let's also verify the professional status
UPDATE profiles 
SET is_professional = true 
WHERE id IN (
  SELECT id FROM professional_profiles
);

-- Insert a test job if none exist
INSERT INTO jobs (
  title,
  description,
  budget,
  date_needed,
  location,
  status,
  customer_id
)
SELECT
  'Test Job',
  'This is a test job description',
  100,
  CURRENT_DATE + INTERVAL '7 days',
  'Test Location',
  'open',
  (SELECT id FROM profiles WHERE is_professional = false LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM jobs WHERE status = 'open'
); 