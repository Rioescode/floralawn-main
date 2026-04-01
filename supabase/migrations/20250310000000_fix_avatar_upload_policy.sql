-- Allow users to upload files to their own folder in the avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = SPLIT_PART(name, '/', 1) OR SPLIT_PART(name, '-', 1) = auth.uid()::text)
);

-- Allow users to update their own avatar files
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = SPLIT_PART(name, '/', 1) OR SPLIT_PART(name, '-', 1) = auth.uid()::text)
);

-- Allow users to read any avatar
CREATE POLICY "Anyone can read avatars"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');

-- Make sure the avatars bucket exists
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING; 