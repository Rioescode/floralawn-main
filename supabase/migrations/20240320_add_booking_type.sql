ALTER TABLE appointments 
ADD COLUMN booking_type VARCHAR(50) NOT NULL DEFAULT 'Ready to Hire';

-- Backfill existing rows to have 'Ready to Hire' as default
UPDATE appointments 
SET booking_type = 'Ready to Hire' 
WHERE booking_type IS NULL; 