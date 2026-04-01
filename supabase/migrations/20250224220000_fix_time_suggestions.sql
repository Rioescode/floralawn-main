-- First disable RLS
ALTER TABLE time_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Professionals can suggest times" ON time_suggestions;
DROP POLICY IF EXISTS "Users can view time suggestions they're involved with" ON time_suggestions;

-- Enable RLS
ALTER TABLE time_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "time_suggestions_select"
ON time_suggestions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
      OR professional_id = auth.uid()
    )
  )
);

CREATE POLICY "time_suggestions_insert"
ON time_suggestions FOR INSERT
TO authenticated
WITH CHECK (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.status IN ('open', 'in_progress')
  )
);

CREATE POLICY "time_suggestions_update"
ON time_suggestions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      jobs.customer_id = auth.uid()  -- Customer can update status
      OR professional_id = auth.uid() -- Professional can update their suggestions
    )
  )
);

-- Create trigger function to handle time suggestion acceptance
CREATE OR REPLACE FUNCTION handle_time_suggestion_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When a time suggestion is accepted
  IF NEW.status = 'accepted' THEN
    -- Update other suggestions for the same job to rejected
    UPDATE time_suggestions
    SET 
      status = 'rejected',
      updated_at = NOW()
    WHERE 
      job_id = NEW.job_id 
      AND id != NEW.id 
      AND status = 'pending';
      
    -- Update the job with the accepted time
    UPDATE jobs
    SET 
      date_needed = NEW.suggested_date,
      updated_at = NOW()
    WHERE id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_time_suggestion_accept ON time_suggestions;
CREATE TRIGGER on_time_suggestion_accept
  AFTER UPDATE OF status ON time_suggestions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION handle_time_suggestion_acceptance(); 