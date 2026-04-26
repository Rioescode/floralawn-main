-- Add uploaded_by column to job_photos
ALTER TABLE job_photos 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id);

-- Create index for uploaded_by
CREATE INDEX IF NOT EXISTS idx_job_photos_uploaded_by ON job_photos(uploaded_by); 