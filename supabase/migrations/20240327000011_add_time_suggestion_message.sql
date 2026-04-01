-- Add message column to time_suggestions table
ALTER TABLE time_suggestions
ADD COLUMN IF NOT EXISTS message TEXT;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Time suggestions are viewable by job owner and suggesting professional" ON time_suggestions;
DROP POLICY IF EXISTS "Professionals can create time suggestions" ON time_suggestions;
DROP POLICY IF EXISTS "Time suggestions can be updated by job owner or suggesting professional" ON time_suggestions;
DROP POLICY IF EXISTS "Time suggestions can be deleted by job owner or suggesting professional" ON time_suggestions;

-- Create comprehensive RLS policies
-- SELECT policy
CREATE POLICY "Time suggestions are viewable by job owner and suggesting professional" 
ON time_suggestions FOR SELECT 
USING (
  auth.uid() IN (
    SELECT customer_id FROM jobs WHERE jobs.id = job_id
    UNION
    SELECT professional_id
  )
);

-- INSERT policy
CREATE POLICY "Professionals can create time suggestions"
ON time_suggestions FOR INSERT
WITH CHECK (
  auth.uid() = professional_id
);

-- UPDATE policy
CREATE POLICY "Time suggestions can be updated by job owner or suggesting professional"
ON time_suggestions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = time_suggestions.job_id 
    AND (
      auth.uid() = jobs.customer_id 
      OR auth.uid() = time_suggestions.professional_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = time_suggestions.job_id 
    AND (
      auth.uid() = jobs.customer_id 
      OR auth.uid() = time_suggestions.professional_id
    )
  )
);

-- DELETE policy
CREATE POLICY "Time suggestions can be deleted by job owner or suggesting professional"
ON time_suggestions FOR DELETE
USING (
  auth.uid() IN (
    SELECT customer_id FROM jobs WHERE jobs.id = job_id
    UNION
    SELECT professional_id
  )
);

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_time_suggestions_status ON time_suggestions(status);

-- Enable realtime for time_suggestions
ALTER PUBLICATION supabase_realtime ADD TABLE time_suggestions; 