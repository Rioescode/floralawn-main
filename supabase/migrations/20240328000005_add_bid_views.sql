-- Create a view for bids with professional profiles
CREATE OR REPLACE VIEW public.bids_with_profiles AS
SELECT 
    b.*,
    p.full_name as professional_name,
    p.avatar_url as professional_avatar,
    pp.business_name,
    pp.business_description,
    pp.service_area
FROM public.bids b
LEFT JOIN public.profiles p ON b.professional_id = p.id
LEFT JOIN public.professional_profiles pp ON b.professional_id = pp.id;

-- Add necessary view ownership
ALTER VIEW public.bids_with_profiles OWNER TO postgres; 