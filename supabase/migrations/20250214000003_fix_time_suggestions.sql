-- Drop existing time suggestions policies
DROP POLICY IF EXISTS "Time suggestions are viewable by job owner and suggesting professional" ON time_suggestions;
DROP POLICY IF EXISTS "Professionals can create time suggestions" ON time_suggestions;
DROP POLICY IF EXISTS "Time suggestions can be updated by job owner or suggesting professional" ON time_suggestions;
DROP POLICY IF EXISTS "Professionals can update their own time suggestions" ON time_suggestions;

-- Create new comprehensive policies
-- SELECT policy
CREATE POLICY "Time suggestions are viewable by job owner and suggesting professional" 
ON time_suggestions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = time_suggestions.job_id 
    AND (
      auth.uid() = jobs.customer_id 
      OR auth.uid() = time_suggestions.professional_id
    )
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
);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_time_suggestion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_time_suggestion_timestamp ON time_suggestions;
CREATE TRIGGER update_time_suggestion_timestamp
  BEFORE UPDATE ON time_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_time_suggestion_updated_at(); 