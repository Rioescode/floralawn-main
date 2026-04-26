-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;
DROP POLICY IF EXISTS "customers_can_update_jobs" ON jobs;
DROP POLICY IF EXISTS "professionals_can_update_jobs" ON jobs;
DROP POLICY IF EXISTS "professionals_can_complete_jobs" ON jobs;
DROP POLICY IF EXISTS "Allow job status updates" ON jobs;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_bid_accept ON bids;
DROP TRIGGER IF EXISTS update_job_on_bid_accept ON bids;
DROP TRIGGER IF EXISTS job_completed_notification ON jobs;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_bid_acceptance();
DROP FUNCTION IF EXISTS update_job_on_bid_accept();
DROP FUNCTION IF EXISTS notify_job_completed();

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create job update policy
CREATE POLICY "allow_job_updates"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid() 
  OR 
  professional_id = auth.uid()
);

-- Create bid acceptance trigger
CREATE FUNCTION handle_bid_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE jobs
    SET 
      status = 'in_progress',
      professional_id = NEW.professional_id,
      updated_at = NOW()
    WHERE id = NEW.job_id;

    UPDATE bids
    SET status = 'rejected'
    WHERE job_id = NEW.job_id
    AND id != NEW.id
    AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bid_accept
  AFTER UPDATE OF status ON bids
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION handle_bid_acceptance(); 