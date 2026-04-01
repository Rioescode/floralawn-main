-- Drop all existing job update policies
DROP POLICY IF EXISTS "Allow job status updates" ON jobs;
DROP POLICY IF EXISTS "Allow customers to update their jobs" ON jobs;
DROP POLICY IF EXISTS "Allow professionals to mark jobs as completed" ON jobs;
DROP POLICY IF EXISTS "Customers can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Customers can update job status when accepting bid" ON jobs;

-- Create new job update policies
CREATE POLICY "customers_can_update_jobs"
ON jobs FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "professionals_can_update_jobs"
ON jobs FOR UPDATE
TO authenticated
USING (
  professional_id = auth.uid() 
  AND status = 'in_progress'
)
WITH CHECK (
  professional_id = auth.uid() 
  AND status = 'in_progress'
);

-- Add trigger to notify customer when job is marked complete
CREATE OR REPLACE FUNCTION notify_job_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    -- Here you could add notification logic
    RAISE NOTICE 'Job % marked as completed by professional %', NEW.id, NEW.professional_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_completed_notification ON jobs;
CREATE TRIGGER job_completed_notification
  AFTER UPDATE OF status ON jobs
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status = 'in_progress')
  EXECUTE FUNCTION notify_job_completed(); 