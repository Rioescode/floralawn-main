-- Add new columns for user types
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_helper BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT false;

-- Update existing profiles to be customers by default
UPDATE profiles 
SET is_customer = true 
WHERE is_customer IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_types ON profiles(is_helper, is_customer, is_professional);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id); 