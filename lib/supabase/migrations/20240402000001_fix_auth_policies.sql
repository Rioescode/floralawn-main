-- First, ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Only admins can delete appointments" ON appointments;

-- Create more permissive policies for appointments
CREATE POLICY "Anyone can create appointments"
ON appointments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view appointments"
ON appointments FOR SELECT
USING (true);

CREATE POLICY "Owners and admins can update appointments"
ON appointments FOR UPDATE
USING (
  customer_id = auth.uid() OR
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

-- Ensure profiles policies are correct
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status); 