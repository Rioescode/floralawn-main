-- First disable RLS
ALTER TABLE job_photos DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert job photos" ON job_photos;
DROP POLICY IF EXISTS "Users can view job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow all users to insert job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow all users to view job photos" ON job_photos;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON job_photos;

-- Enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Anyone can view job photos"
ON job_photos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Job participants can add photos"
ON job_photos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      -- Customer of the job
      jobs.customer_id = auth.uid()
      OR
      -- Professional assigned to the job
      jobs.professional_id = auth.uid()
      OR
      -- Professional who has bid on the job
      EXISTS (
        SELECT 1 FROM bids
        WHERE bids.job_id = jobs.id
        AND bids.professional_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Job participants can delete photos"
ON job_photos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      -- Customer of the job
      jobs.customer_id = auth.uid()
      OR
      -- Professional who uploaded the photo
      uploaded_by = auth.uid()
    )
  )
);

-- Also update storage policies
CREATE POLICY "Anyone can view job photos in storage"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

CREATE POLICY "Job participants can upload photos to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id::text = (storage.foldername(name))[1]
    AND (
      jobs.customer_id = auth.uid()
      OR jobs.professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM bids
        WHERE bids.job_id = jobs.id
        AND bids.professional_id = auth.uid()
      )
    )
  )
); 