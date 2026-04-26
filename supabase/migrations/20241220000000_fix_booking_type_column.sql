-- Fix booking_type column in appointments table
-- This migration ensures the booking_type column exists and forces schema cache refresh

-- Add booking_type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'booking_type'
    ) THEN
        ALTER TABLE appointments ADD COLUMN booking_type TEXT;
        
        -- Set default value for existing records
        UPDATE appointments SET booking_type = 'Ready to Hire' WHERE booking_type IS NULL;
        
        -- Add constraint for valid booking types
        ALTER TABLE appointments ADD CONSTRAINT check_booking_type 
            CHECK (booking_type IN ('Free Consultation', 'Ready to Hire'));
    END IF;
END $$;

-- Force schema cache refresh with comments
COMMENT ON TABLE appointments IS 'Table storing all customer appointments with booking types';
COMMENT ON COLUMN appointments.booking_type IS 'Type of booking: Free Consultation or Ready to Hire';

-- Refresh the schema cache by updating table statistics
ANALYZE appointments;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON appointments TO anon; 