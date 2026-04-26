-- Update job_photos table to use photo_url instead of url
ALTER TABLE public.job_photos 
DROP COLUMN IF EXISTS url,
ADD COLUMN IF NOT EXISTS photo_url TEXT; 