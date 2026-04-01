-- First clean up everything
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar modify access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar owner access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar insert policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public select policy" ON storage.objects;

-- Delete all avatar buckets
DELETE FROM storage.buckets WHERE id IN ('profile-avatars', 'avatars');

-- Create one bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Just two simple policies:
-- 1. Authenticated users can do anything in their own folder
CREATE POLICY "Avatar authenticated user access" ON storage.objects
    FOR ALL
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = SPLIT_PART(name, '/', 1)
    );

-- 2. Everyone can read
CREATE POLICY "Avatar public read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars'); 