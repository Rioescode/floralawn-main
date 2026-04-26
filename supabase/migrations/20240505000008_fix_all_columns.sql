-- Drop the table if it exists
DROP TABLE IF EXISTS appointments;

-- Recreate the table with all required columns
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_id UUID REFERENCES auth.users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    city TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    booking_type TEXT,
    street_address TEXT,
    reschedule_reason TEXT,
    previous_date TIMESTAMP WITH TIME ZONE
);

-- Add helpful comments to force schema cache refresh
COMMENT ON TABLE appointments IS 'Table storing all customer appointments';
COMMENT ON COLUMN appointments.customer_id IS 'Reference to auth.users for registered customers';
COMMENT ON COLUMN appointments.customer_name IS 'Name of the customer';
COMMENT ON COLUMN appointments.customer_email IS 'Email of the customer';
COMMENT ON COLUMN appointments.customer_phone IS 'Phone number of the customer';
COMMENT ON COLUMN appointments.service_type IS 'Type of service requested';
COMMENT ON COLUMN appointments.city IS 'City where the service will be performed';
COMMENT ON COLUMN appointments.date IS 'Scheduled date and time of the appointment';
COMMENT ON COLUMN appointments.notes IS 'Additional notes or requirements';
COMMENT ON COLUMN appointments.status IS 'Current status of the appointment';
COMMENT ON COLUMN appointments.booking_type IS 'Type of booking (e.g., Free Consultation, Ready to Hire)';
COMMENT ON COLUMN appointments.street_address IS 'Street address where the service will be performed';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason provided for rescheduling the appointment';
COMMENT ON COLUMN appointments.previous_date IS 'Previous date before rescheduling';

-- Create indexes for better performance
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_city ON appointments(city);
CREATE INDEX idx_appointments_status ON appointments(status);

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