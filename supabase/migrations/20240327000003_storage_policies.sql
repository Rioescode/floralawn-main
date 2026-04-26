-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('dumpster-images', 'dumpster-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
CREATE POLICY "Dumpster images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'dumpster-images');

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload dumpster images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dumpster-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own dumpster images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dumpster-images'
  AND owner = auth.uid()
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own dumpster images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dumpster-images'
  AND owner = auth.uid()
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
); 