-- Add any missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing rows with timestamps if they're null
UPDATE profiles 
SET 
  updated_at = now(),
  created_at = now()
WHERE updated_at IS NULL OR created_at IS NULL; 