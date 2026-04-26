-- Comprehensive fix for appointments table schema cache issues
-- This migration ensures ALL required columns exist and forces complete schema refresh

-- First, let's see what we have
DO $$ 
DECLARE
    col_exists boolean;
BEGIN
    -- Add booking_type column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'booking_type'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN booking_type TEXT;
        RAISE NOTICE 'Added booking_type column';
    END IF;

    -- Add city column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'city'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column';
    END IF;

    -- Add street_address column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'street_address'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN street_address TEXT;
        RAISE NOTICE 'Added street_address column';
    END IF;

    -- Add customer_name column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'customer_name'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN customer_name TEXT;
        RAISE NOTICE 'Added customer_name column';
    END IF;

    -- Add customer_email column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'customer_email'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN customer_email TEXT;
        RAISE NOTICE 'Added customer_email column';
    END IF;

    -- Add customer_phone column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'customer_phone'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN customer_phone TEXT;
        RAISE NOTICE 'Added customer_phone column';
    END IF;

    -- Add service_type column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'service_type'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN service_type TEXT;
        RAISE NOTICE 'Added service_type column';
    END IF;

    -- Add date column if it doesn't exist (might be appointment_date)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'date'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        -- Check if appointment_date exists and rename it
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'appointment_date'
        ) INTO col_exists;
        
        IF col_exists THEN
            ALTER TABLE appointments RENAME COLUMN appointment_date TO date;
            RAISE NOTICE 'Renamed appointment_date to date';
        ELSE
            ALTER TABLE appointments ADD COLUMN date TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added date column';
        END IF;
    END IF;

    -- Add status column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'status'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;

    -- Add notes column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'notes'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Add customer_id column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'customer_id'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE appointments ADD COLUMN customer_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added customer_id column';
    END IF;

END $$;

-- Set default values for existing records
UPDATE appointments SET booking_type = 'Ready to Hire' WHERE booking_type IS NULL;
UPDATE appointments SET status = 'pending' WHERE status IS NULL;

-- Drop existing constraints if they exist and recreate them
DO $$
BEGIN
    -- Drop constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_booking_type' AND table_name = 'appointments') THEN
        ALTER TABLE appointments DROP CONSTRAINT check_booking_type;
    END IF;
    
    -- Add constraint for booking types
    ALTER TABLE appointments ADD CONSTRAINT check_booking_type 
        CHECK (booking_type IN ('Free Consultation', 'Ready to Hire'));
        
    -- Drop constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_status' AND table_name = 'appointments') THEN
        ALTER TABLE appointments DROP CONSTRAINT check_status;
    END IF;
    
    -- Add constraint for status
    ALTER TABLE appointments ADD CONSTRAINT check_status 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
END $$;

-- Force complete schema cache refresh with detailed comments
COMMENT ON TABLE appointments IS 'Table storing all customer appointments with complete schema - refreshed on 2024-12-20';
COMMENT ON COLUMN appointments.id IS 'Primary key for appointments';
COMMENT ON COLUMN appointments.booking_type IS 'Type of booking: Free Consultation or Ready to Hire';
COMMENT ON COLUMN appointments.city IS 'City where the service will be performed';
COMMENT ON COLUMN appointments.street_address IS 'Street address where the service will be performed';
COMMENT ON COLUMN appointments.customer_name IS 'Name of the customer';
COMMENT ON COLUMN appointments.customer_email IS 'Email of the customer';
COMMENT ON COLUMN appointments.customer_phone IS 'Phone number of the customer';
COMMENT ON COLUMN appointments.service_type IS 'Type of service requested';
COMMENT ON COLUMN appointments.date IS 'Scheduled date and time of the appointment';
COMMENT ON COLUMN appointments.status IS 'Current status of the appointment';
COMMENT ON COLUMN appointments.notes IS 'Additional notes or requirements';
COMMENT ON COLUMN appointments.customer_id IS 'Optional reference to auth.users for registered customers';

-- Refresh the schema cache by updating table statistics
ANALYZE appointments;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_booking_type ON appointments(booking_type);
CREATE INDEX IF NOT EXISTS idx_appointments_city ON appointments(city);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);

-- Enable RLS if not already enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON appointments TO anon;

-- Force one more schema refresh
SELECT pg_stat_reset_single_table_counters('public'::regclass, 'appointments'::regclass); 