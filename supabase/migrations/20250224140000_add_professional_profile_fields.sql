-- Add missing columns to professional_profiles table
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS business_description text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS service_area text[];
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS insurance_info text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{"facebook": "", "instagram": "", "linkedin": ""}';
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add comment to explain the social_media structure
COMMENT ON COLUMN professional_profiles.social_media IS 'JSON object containing social media links: {facebook, instagram, linkedin}'; 