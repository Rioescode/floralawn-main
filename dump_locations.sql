-- Create dump_locations table
CREATE TABLE dump_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  type TEXT NOT NULL,
  hours TEXT,
  fees TEXT,
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE dump_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON dump_locations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert"
  ON dump_locations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own entries"
  ON dump_locations
  FOR UPDATE
  USING (auth.uid() = created_by); 