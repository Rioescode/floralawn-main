-- Drop existing policies
DROP POLICY IF EXISTS "View appointments" ON appointments;
DROP POLICY IF EXISTS "Update appointments" ON appointments;
DROP POLICY IF EXISTS "Create appointments" ON appointments;
DROP POLICY IF EXISTS "Delete appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can view appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Public can create appointments"
ON appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (
  auth.uid() = customer_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (
  auth.uid() = customer_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete appointments"
ON appointments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
); 