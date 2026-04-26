-- First disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view business logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload business logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own business logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own business logos" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simpler policies
CREATE POLICY "Give users access to own folder"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'public' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
)
WITH CHECK (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);

-- Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true; 