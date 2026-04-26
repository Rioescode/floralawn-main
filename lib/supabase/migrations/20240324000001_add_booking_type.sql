-- Add booking_type column to appointments table
ALTER TABLE appointments ADD COLUMN booking_type TEXT CHECK (booking_type IN ('Free Consultation', 'Ready to Hire'));

-- Set default value for existing records
UPDATE appointments SET booking_type = 'Ready to Hire' WHERE booking_type IS NULL; 