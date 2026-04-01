-- Create avatars bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('avatars', 'avatars');
    END IF;
END $$;

-- Drop all existing policies for avatars bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create all policies with error handling
DO $$
BEGIN
    -- Public access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Avatars are publicly accessible'
    ) THEN
        CREATE POLICY "Avatars are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;

    -- Upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own avatars'
    ) THEN
        CREATE POLICY "Users can upload their own avatars"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
        );
    END IF;

    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own avatars'
    ) THEN
        CREATE POLICY "Users can update their own avatars"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'avatars'
            AND owner = auth.uid()
        );
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own avatars'
    ) THEN
        CREATE POLICY "Users can delete their own avatars"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'avatars'
            AND owner = auth.uid()
        );
    END IF;

    -- Ensure avatars bucket is public
    UPDATE storage.buckets
    SET public = true
    WHERE id = 'avatars';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$; 