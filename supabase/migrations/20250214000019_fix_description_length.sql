-- Drop dependent views first
DROP VIEW IF EXISTS public.bids_with_profiles;

-- Set maximum length for business_description
ALTER TABLE professional_profiles
ALTER COLUMN business_description TYPE VARCHAR(1000);

-- Recreate the view with correct join
CREATE OR REPLACE VIEW public.bids_with_profiles AS
SELECT 
    b.*,
    p.full_name as professional_name,
    p.avatar_url as professional_avatar,
    pp.business_name,
    pp.business_description,
    pp.service_area,
    pp.logo_url
FROM public.bids b
LEFT JOIN public.profiles p ON b.professional_id = p.id
LEFT JOIN public.professional_profiles pp ON pp.id = p.id;

-- Add check constraint for maximum length
ALTER TABLE professional_profiles 
ADD CONSTRAINT business_description_length 
CHECK (length(business_description) <= 1000); 