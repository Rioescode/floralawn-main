-- Update the current user to be a professional if not already
UPDATE public.profiles 
SET is_professional = true 
WHERE id = 'b30d05e3-694d-4ed6-860e-506e8921abe0';  -- Your actual user ID

-- Also ensure they have a professional profile
INSERT INTO public.professional_profiles (id)
SELECT id FROM public.profiles
WHERE id = 'b30d05e3-694d-4ed6-860e-506e8921abe0'  -- Your actual user ID
AND is_professional = true
AND NOT EXISTS (
  SELECT 1 FROM public.professional_profiles WHERE id = 'b30d05e3-694d-4ed6-860e-506e8921abe0'
)
ON CONFLICT (id) DO NOTHING; 