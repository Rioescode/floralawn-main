-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS preferred_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Update existing profiles with data from user metadata where available
UPDATE profiles
SET full_name = auth.users.raw_user_meta_data->>'full_name'
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.full_name IS NULL; 