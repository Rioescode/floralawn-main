-- First disable RLS
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_job_creation" ON jobs;
DROP POLICY IF EXISTS "allow_job_viewing" ON jobs;
DROP POLICY IF EXISTS "allow_job_updates" ON jobs;
DROP POLICY IF EXISTS "allow_job_deletion" ON jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_select_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_delete_policy" ON jobs;

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create basic job policies
CREATE POLICY "enable_all_select"
ON jobs FOR SELECT
TO authenticated
USING (true);  -- Everyone can view all jobs

CREATE POLICY "enable_insert_for_customers"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "enable_update_for_owners"
ON jobs FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id
  OR auth.uid() = professional_id
);

CREATE POLICY "enable_delete_for_customers"
ON jobs FOR DELETE
TO authenticated
USING (auth.uid() = customer_id);

-- Create basic bid policies
CREATE POLICY "enable_bid_select"
ON bids FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_bid_insert"
ON bids FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "enable_bid_update"
ON bids FOR UPDATE
TO authenticated
USING (auth.uid() = professional_id); 