-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin status
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Add featured column to professional_profiles table
ALTER TABLE professional_profiles 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create index for featured status
CREATE INDEX IF NOT EXISTS idx_professional_profiles_featured ON professional_profiles(featured);

-- Create policy to prevent users from setting their own featured status
CREATE POLICY "Only admins can update featured status"
ON professional_profiles
FOR UPDATE USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE is_admin = true
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles WHERE is_admin = true
    )
); 