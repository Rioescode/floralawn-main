-- Add 'in_progress' status to appointments table
-- This allows tracking work that is currently being performed

-- Drop existing status constraint
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_status_check' 
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
        RAISE NOTICE 'Dropped appointments_status_check constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status' 
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE public.appointments DROP CONSTRAINT check_status;
        RAISE NOTICE 'Dropped check_status constraint';
    END IF;
END $$;

-- Create new constraint with 'in_progress' status included
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'cancelled', 'completed', 'rescheduled'));

-- Ensure default is 'pending'
ALTER TABLE public.appointments 
ALTER COLUMN status SET DEFAULT 'pending';

-- Make sure status column is NOT NULL
ALTER TABLE public.appointments 
ALTER COLUMN status SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.appointments.status IS 'Current status: pending, confirmed, in_progress, cancelled, completed, or rescheduled';

