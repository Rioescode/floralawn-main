-- Fix appointments status check constraint
-- Ensure it allows all valid status values used in the application

-- Drop existing status constraints
DO $$
BEGIN
    -- Drop constraint if it exists with different names
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_status_check' 
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
        RAISE NOTICE 'Dropped appointments_status_check constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status' 
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT check_status;
        RAISE NOTICE 'Dropped check_status constraint';
    END IF;
    
    -- Also check for inline CHECK constraints in table definition
    -- This is trickier, but we'll handle it by recreating if needed
END $$;

-- Create a comprehensive status constraint that allows all valid values
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN (
    'pending',
    'confirmed', 
    'cancelled',
    'completed',
    'rescheduled'
));

-- Update any invalid status values to 'pending'
UPDATE appointments 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled');

-- Ensure default is set
ALTER TABLE appointments 
ALTER COLUMN status SET DEFAULT 'pending';

-- Show current constraint
SELECT 'Status constraint updated. Allowed values:' as info;
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'appointments_status_check';

-- Show current status distribution
SELECT 'Current status distribution:' as info;
SELECT status, COUNT(*) as count 
FROM appointments 
GROUP BY status;

