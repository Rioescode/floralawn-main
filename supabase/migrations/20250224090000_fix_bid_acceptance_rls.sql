-- First disable RLS
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Customers can accept or reject bids" ON bids;
DROP POLICY IF EXISTS "Customers can update job status when accepting bid" ON jobs;
DROP POLICY IF EXISTS "Allow customers to update bids on their jobs" ON bids;

-- Create bid_status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bid_status') THEN
    CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create simpler policies
CREATE POLICY "Allow customers to update bids on their jobs"
ON bids FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
  )
);

-- Simpler job update policy
CREATE POLICY "Allow customers to update their jobs"
ON jobs FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
)
WITH CHECK (
  customer_id = auth.uid()
);

-- Add trigger to update job status when bid is accepted
CREATE OR REPLACE FUNCTION update_job_on_bid_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE jobs
    SET 
      status = 'in_progress',
      professional_id = NEW.professional_id
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_on_bid_accept ON bids;
CREATE TRIGGER update_job_on_bid_accept
  AFTER UPDATE ON bids
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION update_job_on_bid_accept(); 