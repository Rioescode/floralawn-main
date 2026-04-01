-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create avatars bucket
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars');

-- Create storage policy to allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update/delete their own avatar
create policy "Users can update/delete their own avatar"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to avatars
create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;

-- Allow public access to view avatars
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-avatars'
  );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars' AND
    (SPLIT_PART(name, '/', 1))::uuid = auth.uid()
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-avatars' AND
    (SPLIT_PART(name, '/', 1))::uuid = auth.uid()
  );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-avatars' AND
    (SPLIT_PART(name, '/', 1))::uuid = auth.uid()
  ); 