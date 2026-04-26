-- Add claimed column to professional_profiles table
ALTER TABLE professional_profiles 
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false;

-- Create index for claimed status to optimize filtering
CREATE INDEX IF NOT EXISTS idx_professional_profiles_claimed ON professional_profiles(claimed);

-- Set claimed to true for existing profiles that were created by professionals
UPDATE professional_profiles
SET claimed = true
FROM profiles
WHERE professional_profiles.profile_id = profiles.id
AND profiles.is_professional = true; 