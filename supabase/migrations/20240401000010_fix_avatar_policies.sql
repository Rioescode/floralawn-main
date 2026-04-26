-- Drop ALL existing storage policies
DROP POLICY IF EXISTS "Avatar authenticated user access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Business logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Profile avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar modify access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Create comprehensive policies for the avatars bucket
CREATE POLICY "Avatar public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated access"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (SPLIT_PART(name, '/', 1))
)
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (SPLIT_PART(name, '/', 1))
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 