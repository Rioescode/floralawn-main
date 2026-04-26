-- Add location column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT; 