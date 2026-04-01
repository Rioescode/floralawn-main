-- Create job-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Job photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their job photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their job photos" ON storage.objects;

-- Allow public access to view job photos
CREATE POLICY "Job photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-photos');

-- Allow job participants to upload photos
CREATE POLICY "Job participants can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id::text = (storage.foldername(name))[1]
      AND (
        auth.uid() = customer_id 
        OR auth.uid() = professional_id
      )
    )
  )
);

-- Allow job participants to update photos
CREATE POLICY "Job participants can update job photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'job-photos'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id::text = (storage.foldername(name))[1]
      AND (
        auth.uid() = customer_id 
        OR auth.uid() = professional_id
      )
    )
  )
);

-- Allow job participants to delete photos
CREATE POLICY "Job participants can delete job photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-photos'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id::text = (storage.foldername(name))[1]
      AND (
        auth.uid() = customer_id 
        OR auth.uid() = professional_id
      )
    )
  )
); 