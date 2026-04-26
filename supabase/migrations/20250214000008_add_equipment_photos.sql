-- Add equipment_photos column to professional_profiles table
ALTER TABLE professional_profiles 
ADD COLUMN IF NOT EXISTS equipment_photos JSONB DEFAULT '{"photos": []}'::jsonb;

-- Create equipment-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-photos', 'equipment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view equipment photos
CREATE POLICY "Equipment photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-photos');

-- Allow authenticated users to upload equipment photos
CREATE POLICY "Users can upload their equipment photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-photos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own equipment photos
CREATE POLICY "Users can update their own equipment photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipment-photos'
  AND owner = auth.uid()
);

-- Allow users to delete their own equipment photos
CREATE POLICY "Users can delete their own equipment photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-photos'
  AND owner = auth.uid()
); 