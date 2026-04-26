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
        COMMENT ON COLUMN appointments.booking_type IS 'Type of booking (e.g., Free Consultation, Ready to Hire)';
    END IF;
END $$; 