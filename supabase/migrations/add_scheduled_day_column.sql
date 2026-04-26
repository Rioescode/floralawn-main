-- Add scheduled_day column to customers table

-- Check current table structure
SELECT 'Current customers table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public';

-- Add scheduled_day column
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS scheduled_day VARCHAR(20);

-- Add comment to explain the column
COMMENT ON COLUMN public.customers.scheduled_day IS 'Day of the week when service is scheduled (Monday, Tuesday, etc.)';

-- Check updated table structure
SELECT 'Updated customers table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current customers with their scheduled days
SELECT 'Current customers and their scheduled days:' as info;
SELECT name, frequency, scheduled_day, status 
FROM public.customers 
WHERE frequency IN ('weekly', 'bi_weekly')
ORDER BY scheduled_day NULLS FIRST, name; 