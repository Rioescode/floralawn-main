-- Update existing professional profiles to have empty arrays for service_area if NULL
UPDATE professional_profiles 
SET service_area = ARRAY[]::TEXT[] 
WHERE service_area IS NULL;

-- Ensure service_area is not null
ALTER TABLE professional_profiles 
ALTER COLUMN service_area SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN service_area SET NOT NULL;

-- Ensure business_description is not null
ALTER TABLE professional_profiles 
ALTER COLUMN business_description SET DEFAULT '',
ALTER COLUMN business_description SET NOT NULL; 