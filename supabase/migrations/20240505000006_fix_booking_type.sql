-- Drop the column if it exists (to clear any potential schema cache issues)
ALTER TABLE appointments DROP COLUMN IF EXISTS booking_type;

-- Add the column back
ALTER TABLE appointments ADD COLUMN booking_type TEXT;

-- Add a comment to force schema cache refresh
COMMENT ON COLUMN appointments.booking_type IS 'Type of booking (e.g., Free Consultation, Ready to Hire)';

-- Update RLS policies to include the new column
ALTER POLICY "Enable read access for users" ON appointments USING (auth.uid() = customer_id);
ALTER POLICY "Enable insert for users" ON appointments WITH CHECK (auth.uid() = customer_id);
ALTER POLICY "Enable update for users" ON appointments USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id); 