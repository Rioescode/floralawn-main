-- Drop the column if it exists (to clear any potential schema cache issues)
ALTER TABLE appointments DROP COLUMN IF EXISTS city;

-- Add the column back
ALTER TABLE appointments ADD COLUMN city TEXT NOT NULL DEFAULT 'Unknown';

-- Add a comment to force schema cache refresh
COMMENT ON COLUMN appointments.city IS 'City where the service will be performed';

-- Create an index on the city column for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_city ON appointments(city);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for users" ON appointments;
DROP POLICY IF EXISTS "Enable insert for users" ON appointments;
DROP POLICY IF EXISTS "Enable update for users" ON appointments;

-- Create fresh policies
CREATE POLICY "Enable read access for users" ON appointments
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Enable insert for users" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Enable update for users" ON appointments
    FOR UPDATE USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id); 