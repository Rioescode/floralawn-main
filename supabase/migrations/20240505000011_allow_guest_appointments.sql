-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users" ON appointments;
DROP POLICY IF EXISTS "Enable insert for users" ON appointments;
DROP POLICY IF EXISTS "Enable update for users" ON appointments;

-- Create new policies that allow guest appointments
CREATE POLICY "Enable read access for all" ON appointments
    FOR SELECT USING (
        customer_id IS NULL OR 
        auth.uid() = customer_id
    );

CREATE POLICY "Enable insert for all" ON appointments
    FOR INSERT WITH CHECK (
        (customer_id IS NULL AND booking_type = 'Free Consultation') OR 
        (auth.uid() = customer_id)
    );

CREATE POLICY "Enable update for users" ON appointments
    FOR UPDATE USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id);

-- Add comment to force schema cache refresh
COMMENT ON TABLE appointments IS 'Table storing all appointments including guest consultations'; 