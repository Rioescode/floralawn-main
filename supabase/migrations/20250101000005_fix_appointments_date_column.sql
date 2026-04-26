-- Fix appointments table date column issue
-- The error suggests there's a scheduled_date column that requires a value
-- This migration ensures the date column exists and handles any column name mismatches

-- Check if scheduled_date column exists and handle it
DO $$
BEGIN
    -- If scheduled_date exists but date doesn't, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'scheduled_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'date'
    ) THEN
        ALTER TABLE appointments RENAME COLUMN scheduled_date TO date;
        RAISE NOTICE 'Renamed scheduled_date to date';
    END IF;
    
    -- If both exist, drop scheduled_date and use date
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'scheduled_date'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'date'
    ) THEN
        ALTER TABLE appointments DROP COLUMN scheduled_date;
        RAISE NOTICE 'Dropped duplicate scheduled_date column';
    END IF;
    
    -- If scheduled_date exists but date doesn't exist, create date from scheduled_date data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'scheduled_date'
    ) THEN
        -- Copy data from scheduled_date to date if date doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'date'
        ) THEN
            ALTER TABLE appointments ADD COLUMN date TIMESTAMP WITH TIME ZONE;
            UPDATE appointments SET date = scheduled_date WHERE scheduled_date IS NOT NULL;
            ALTER TABLE appointments ALTER COLUMN date SET NOT NULL;
            ALTER TABLE appointments DROP COLUMN scheduled_date;
            RAISE NOTICE 'Migrated scheduled_date to date column';
        END IF;
    END IF;
    
    -- Ensure date column exists and is NOT NULL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'date'
    ) THEN
        ALTER TABLE appointments ADD COLUMN date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added date column with default';
    ELSE
        -- Make sure it's NOT NULL (but allow existing NULLs temporarily)
        ALTER TABLE appointments ALTER COLUMN date DROP NOT NULL;
        -- Set default for any NULL values
        UPDATE appointments SET date = COALESCE(date, NOW()) WHERE date IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE appointments ALTER COLUMN date SET NOT NULL;
        RAISE NOTICE 'Ensured date column is NOT NULL';
    END IF;
END $$;

-- Also check for appointment_date and handle it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'appointment_date'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'date'
    ) THEN
        -- If both exist, copy data and drop appointment_date
        UPDATE appointments SET date = appointment_date WHERE date IS NULL AND appointment_date IS NOT NULL;
        ALTER TABLE appointments DROP COLUMN appointment_date;
        RAISE NOTICE 'Merged appointment_date into date column';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'appointment_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'date'
    ) THEN
        ALTER TABLE appointments RENAME COLUMN appointment_date TO date;
        RAISE NOTICE 'Renamed appointment_date to date';
    END IF;
END $$;

-- Create index on date column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Show final column structure
SELECT 'Final appointments table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

