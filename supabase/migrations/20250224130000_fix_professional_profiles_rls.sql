-- Drop existing policies if any
DROP POLICY IF EXISTS "Professionals can update their own profile" ON professional_profiles;
DROP POLICY IF EXISTS "Professionals can view their own profile" ON professional_profiles;
DROP POLICY IF EXISTS "Professionals can view other profiles" ON professional_profiles;

-- Enable RLS
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for professional_profiles table
CREATE POLICY "Professionals can update their own profile" 
ON professional_profiles 
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Professionals can insert their own profile" 
ON professional_profiles 
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Professionals can view their own profile" 
ON professional_profiles 
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Anyone can view professional profiles" 
ON professional_profiles 
FOR SELECT
USING (true);

-- Ensure the id column matches auth.uid()
ALTER TABLE professional_profiles 
DROP CONSTRAINT IF EXISTS professional_profiles_id_fkey;

ALTER TABLE professional_profiles 
ADD CONSTRAINT professional_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; 