-- First drop existing policies
DROP POLICY IF EXISTS "View appointments" ON appointments;
DROP POLICY IF EXISTS "Update appointments" ON appointments;
DROP POLICY IF EXISTS "Create appointments" ON appointments;
DROP POLICY IF EXISTS "Delete appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public read access to appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public insert access to appointments" ON appointments;

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Anyone can create appointments"
ON appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view appointments"
ON appointments FOR SELECT
USING (true);

CREATE POLICY "Admins can update appointments"
ON appointments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete appointments"
ON appointments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
); 