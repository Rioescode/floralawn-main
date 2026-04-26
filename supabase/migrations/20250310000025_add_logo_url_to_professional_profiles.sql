-- Add logo_url column to professional_profiles
ALTER TABLE public.professional_profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('public', 'public')
ON CONFLICT (id) DO NOTHING;

-- Add storage policy for logos
CREATE POLICY "Anyone can view business logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'public' AND (storage.foldername(name))[1] = 'business-logos' );

CREATE POLICY "Authenticated users can upload business logos"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'public' AND 
  (storage.foldername(name))[1] = 'business-logos' AND
  (storage.foldername(name))[2] LIKE (auth.uid() || '%')
);

CREATE POLICY "Users can update own business logos"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'public' AND 
  (storage.foldername(name))[1] = 'business-logos' AND
  (storage.foldername(name))[2] LIKE (auth.uid() || '%')
);

CREATE POLICY "Users can delete own business logos"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'public' AND 
  (storage.foldername(name))[1] = 'business-logos' AND
  (storage.foldername(name))[2] LIKE (auth.uid() || '%')
); 