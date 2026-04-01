CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bids_job_id ON bids(job_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- Add RLS policies
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Allow professionals to insert bids
CREATE POLICY insert_bid ON bids FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'professional'
  )
);

-- Allow users to view their own bids
CREATE POLICY view_own_bids ON bids FOR SELECT TO authenticated
USING (
  bidder_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = bids.job_id
    AND jobs.customer_id = auth.uid()
  )
);

-- Allow customers to update bid status for their jobs
CREATE POLICY update_bid_status ON bids FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = bids.job_id
    AND jobs.customer_id = auth.uid()
  )
)
WITH CHECK (
  status IN ('accepted', 'rejected', 'pending')
); 