-- Drop existing policies first
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their job photos" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can manage their logos" ON storage.objects;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create storage tables
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner uuid REFERENCES auth.users(id),
  file_size_limit bigint,
  allowed_mime_types text[]
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
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS bname ON storage.buckets (name);
CREATE INDEX IF NOT EXISTS objects_path_tokens_idx ON storage.objects USING gin (path_tokens);
CREATE UNIQUE INDEX IF NOT EXISTS objects_bucket_id_name_key ON storage.objects (bucket_id, name);

-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']),
  ('job-photos', 'job-photos', true, 10485760, ARRAY['image/jpeg', 'image/png']),
  ('business-logos', 'business-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY IF NOT EXISTS "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('profile-avatars', 'job-photos', 'business-logos'));

CREATE POLICY IF NOT EXISTS "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-avatars' 
  AND (SPLIT_PART(name, '/', 1))::uuid = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Users can manage their own avatar" 
ON storage.objects 
FOR ALL USING (
  bucket_id = 'profile-avatars' 
  AND owner = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Authenticated users can upload job photos" 
ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can manage their job photos" 
ON storage.objects 
FOR ALL USING (
  bucket_id = 'job-photos' 
  AND owner = auth.uid()
);

CREATE POLICY IF NOT EXISTS "Professionals can upload logos" 
ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'business-logos' 
  AND EXISTS (SELECT 1 FROM professional_profiles WHERE id = auth.uid())
);

CREATE POLICY IF NOT EXISTS "Professionals can manage their logos" 
ON storage.objects 
FOR ALL USING (
  bucket_id = 'business-logos' 
  AND owner = auth.uid()
); 