-- Comprehensive fix for appointments status constraint
-- This will ensure 'pending' status is always allowed

-- First, drop ALL possible status constraints
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Find and drop all status-related constraints
    FOR constraint_name_var IN
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'appointments' 
        AND constraint_type = 'CHECK'
        AND (constraint_name LIKE '%status%' OR constraint_name LIKE '%check%')
    LOOP
        EXECUTE 'ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name_var) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', constraint_name_var;
    END LOOP;
END $$;

-- Now create a new, comprehensive constraint
DO $$
BEGIN
    -- Check if constraint already exists with correct values
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'appointments_status_check'
        AND check_clause LIKE '%pending%'
        AND check_clause LIKE '%confirmed%'
        AND check_clause LIKE '%cancelled%'
        AND check_clause LIKE '%completed%'
    ) THEN
        -- Drop if exists with wrong values
        ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
        
        -- Create new constraint with all valid statuses
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_status_check 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'));
        
        RAISE NOTICE 'Created appointments_status_check constraint';
    ELSE
        RAISE NOTICE 'Constraint already exists with correct values';
    END IF;
END $$;

-- Ensure default is 'pending'
ALTER TABLE public.appointments 
ALTER COLUMN status SET DEFAULT 'pending';

-- Update any invalid status values to 'pending' (safety measure)
UPDATE public.appointments 
SET status = 'pending' 
WHERE status IS NULL 
   OR status NOT IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled');

-- Make sure status column is NOT NULL
ALTER TABLE public.appointments 
ALTER COLUMN status SET NOT NULL;

-- Verify the constraint
DO $$
DECLARE
    constraint_info TEXT;
BEGIN
    SELECT check_clause INTO constraint_info
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'appointments_status_check';
    
    RAISE NOTICE 'Current constraint: %', constraint_info;
END $$;

