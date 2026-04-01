-- Drop old policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Drop old buckets if they exist
DELETE FROM storage.buckets WHERE id IN ('profile-avatars', 'avatars');

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-avatars', 'profile-avatars', true);

-- Create avatar-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-uploads', 'avatar-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create unified policies
CREATE POLICY "Avatar public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Avatar upload access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars' AND
    (SPLIT_PART(name, '/', 1))::uuid = auth.uid()
  );

CREATE POLICY "Avatar modify access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'profile-avatars' AND
    (SPLIT_PART(name, '/', 1))::uuid = auth.uid()
  ); 