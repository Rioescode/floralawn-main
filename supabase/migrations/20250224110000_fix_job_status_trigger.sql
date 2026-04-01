-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_job_on_bid_accept ON bids;
DROP FUNCTION IF EXISTS update_job_on_bid_accept();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION update_job_on_bid_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Bid status changed to: %, Job ID: %', NEW.status, NEW.job_id;

  IF NEW.status = 'accepted' THEN
    -- Update job status and professional
    UPDATE jobs
    SET 
      status = 'in_progress',
      professional_id = NEW.professional_id,
      updated_at = NOW()
    WHERE id = NEW.job_id;

    -- Log the job update
    RAISE NOTICE 'Updated job % status to in_progress', NEW.job_id;

    -- Update other bids to rejected
    UPDATE bids
    SET status = 'rejected'
    WHERE job_id = NEW.job_id
    AND id != NEW.id
    AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER update_job_on_bid_accept
AFTER UPDATE OF status ON bids
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION update_job_on_bid_accept();

-- Also ensure jobs table has the right RLS policy for status updates
CREATE POLICY "Allow job status updates"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR professional_id = auth.uid()
)
WITH CHECK (
  customer_id = auth.uid()
  OR professional_id = auth.uid()
); 