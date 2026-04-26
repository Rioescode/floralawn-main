-- Create business-logos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view business logos
CREATE POLICY "Business logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

-- Allow authenticated users to upload business logos
CREATE POLICY "Users can upload their own business logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own business logos
CREATE POLICY "Users can update their own business logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-logos'
  AND owner = auth.uid()
);

-- Allow users to delete their own business logos
CREATE POLICY "Users can delete their own business logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-logos'
  AND owner = auth.uid()
);
