-- First, enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage tables
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('job-photos', 'job-photos', true),
    ('business-logos', 'business-logos', true),
    ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for job photos
CREATE POLICY "Job photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-photos');

CREATE POLICY "Anyone can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'job-photos' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their job photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'job-photos' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their job photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'job-photos' AND
    auth.role() = 'authenticated'
);

-- Add storage policies for business logos
CREATE POLICY "Business logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

CREATE POLICY "Professionals can upload their logos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'business-logos' AND
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM professional_profiles
        WHERE id = auth.uid()
    )
);

-- Add storage policies for profile avatars
CREATE POLICY "Profile avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-avatars' AND
    auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Add additional foreign key constraints
ALTER TABLE jobs
ADD CONSTRAINT fk_jobs_customer_profile
    FOREIGN KEY (customer_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_jobs_professional_profile
    FOREIGN KEY (professional_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;

ALTER TABLE bids
ADD CONSTRAINT fk_bids_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_bids_professional
    FOREIGN KEY (professional_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

ALTER TABLE job_photos
ADD CONSTRAINT fk_job_photos_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_job_photos_uploader
    FOREIGN KEY (uploaded_by)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

ALTER TABLE reviews
ADD CONSTRAINT fk_reviews_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_reviews_reviewed
    FOREIGN KEY (reviewed_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

ALTER TABLE time_suggestions
ADD CONSTRAINT fk_time_suggestions_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_time_suggestions_professional
    FOREIGN KEY (professional_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Add deletion policies for storage
CREATE OR REPLACE FUNCTION delete_storage_object(bucket text, object_path text)
RETURNS void AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = bucket 
    AND name = object_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to delete job photos when job is deleted
CREATE OR REPLACE FUNCTION delete_job_photos()
RETURNS trigger AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = 'job-photos'
    AND name LIKE OLD.id || '/%';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_job_delete
    BEFORE DELETE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION delete_job_photos();

-- Add trigger to delete business logo when professional profile is deleted
CREATE OR REPLACE FUNCTION delete_business_logo()
RETURNS trigger AS $$
BEGIN
    IF OLD.logo_url IS NOT NULL THEN
        PERFORM delete_storage_object('business-logos', OLD.id || '/' || split_part(OLD.logo_url, '/', -1));
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_professional_profile_delete
    BEFORE DELETE ON professional_profiles
    FOR EACH ROW
    EXECUTE FUNCTION delete_business_logo();

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;

-- Create schema for storage
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage tables and functions
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 