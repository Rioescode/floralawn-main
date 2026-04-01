-- First disable RLS
ALTER TABLE time_suggestions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert time suggestions" ON time_suggestions;
DROP POLICY IF EXISTS "Users can view time suggestions" ON time_suggestions;

-- Enable RLS
ALTER TABLE time_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Professionals can suggest times"
ON time_suggestions FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be a professional
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_professional = true
  )
  AND
  professional_id = auth.uid()
);

CREATE POLICY "Users can view time suggestions they're involved with"
ON time_suggestions FOR SELECT
TO authenticated
USING (
  -- Can see suggestions for jobs you created
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
  OR
  -- Can see your own suggestions
  professional_id = auth.uid()
); 