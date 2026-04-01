-- Create the ready_to_work_status table
CREATE TABLE IF NOT EXISTS ready_to_work_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  service_types TEXT[] DEFAULT ARRAY['General Landscaping'],
  hourly_rate DECIMAL(10,2),
  availability_notes TEXT,
  
  -- Ensure only one status per profile
  UNIQUE(profile_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ready_to_work_status_profile ON ready_to_work_status(profile_id);
CREATE INDEX IF NOT EXISTS idx_ready_to_work_status_status ON ready_to_work_status(status);

-- Add RLS policies
ALTER TABLE ready_to_work_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read availability status
CREATE POLICY "Anyone can read availability status"
  ON ready_to_work_status
  FOR SELECT
  USING (true);

-- Allow authenticated users to update their own status
CREATE POLICY "Users can update their own status"
  ON ready_to_work_status
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id); 