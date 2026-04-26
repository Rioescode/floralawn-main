-- Drop all existing storage policies
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

-- Delete existing buckets
DELETE FROM storage.buckets WHERE id IN ('profile-avatars', 'avatars');

-- Create fresh bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create fresh policies with simpler conditions
CREATE POLICY "Avatar insert policy" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (auth.uid()::text = (SPLIT_PART(name, '/', 1)))
    );

CREATE POLICY "Avatar update policy" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (auth.uid()::text = (SPLIT_PART(name, '/', 1)))
    );

CREATE POLICY "Avatar delete policy" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (auth.uid()::text = (SPLIT_PART(name, '/', 1)))
    );

CREATE POLICY "Avatar public select policy" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'avatars'); 