-- Make customer_id nullable in appointments table to allow guest bookings
-- This allows customers to book without being logged in

-- Drop NOT NULL constraint if it exists
DO $$
BEGIN
    -- Check if column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'customer_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.appointments 
        ALTER COLUMN customer_id DROP NOT NULL;
        
        RAISE NOTICE 'Removed NOT NULL constraint from customer_id';
    ELSE
        RAISE NOTICE 'customer_id is already nullable or does not exist';
    END IF;
END $$;

-- Update comment to reflect that it's optional
COMMENT ON COLUMN public.appointments.customer_id IS 'Optional reference to auth.users(id) for registered customers. NULL for guest bookings.';

