-- Add services column to professional_profiles table
ALTER TABLE professional_profiles 
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing professional profiles to have empty arrays for services if NULL
UPDATE professional_profiles 
SET services = ARRAY[]::TEXT[] 
WHERE services IS NULL;

-- Ensure services is not null
ALTER TABLE professional_profiles 
ALTER COLUMN services SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN services SET NOT NULL; 