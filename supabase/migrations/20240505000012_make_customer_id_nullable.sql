-- Make customer_id nullable
ALTER TABLE appointments ALTER COLUMN customer_id DROP NOT NULL;

-- Add comment to force schema cache refresh
COMMENT ON COLUMN appointments.customer_id IS 'Optional reference to auth.users for registered customers'; 