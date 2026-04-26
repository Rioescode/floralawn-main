-- Make customer_id optional in appointments table
ALTER TABLE appointments 
ALTER COLUMN customer_id DROP NOT NULL;

-- Update RLS policies to allow guest bookings
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;

CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (
  (customer_id IS NULL) OR
  (auth.uid() = customer_id) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (
  (customer_id IS NULL) OR
  (auth.uid() = customer_id) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
); 