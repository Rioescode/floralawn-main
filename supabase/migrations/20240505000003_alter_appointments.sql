-- Rename appointment_date column to date if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'appointment_date'
    ) THEN
        ALTER TABLE appointments RENAME COLUMN appointment_date TO date;
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'start_time') THEN
        ALTER TABLE appointments ADD COLUMN start_time TIME WITHOUT TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'end_time') THEN
        ALTER TABLE appointments ADD COLUMN end_time TIME WITHOUT TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'user_id') THEN
        ALTER TABLE appointments ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'customer_id') THEN
        ALTER TABLE appointments ADD COLUMN customer_id UUID;
    END IF;
END $$; 