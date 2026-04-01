-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    
    -- Drop existing tables if they exist
    DROP TABLE IF EXISTS public.document_acceptances CASCADE;
    DROP TABLE IF EXISTS public.time_suggestions CASCADE;
    DROP TABLE IF EXISTS public.reviews CASCADE;
    DROP TABLE IF EXISTS public.job_photos CASCADE;
    DROP TABLE IF EXISTS public.bids CASCADE;
    DROP TABLE IF EXISTS public.jobs CASCADE;
    DROP TABLE IF EXISTS public.professional_profiles CASCADE;
    DROP TABLE IF EXISTS public.profiles CASCADE;
EXCEPTION
    WHEN OTHERS THEN 
    NULL;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  is_professional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    email
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Index for performance
CREATE INDEX IF NOT EXISTS profiles_id_index ON public.profiles(id);

-- Set up Storage for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner);

-- Create professional_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  business_name text,
  business_description text,
  service_area text[],
  logo_url text,
  years_experience integer,
  license_number text,
  insurance_info text,
  website_url text,
  contact_email text,
  contact_phone text,
  social_media jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_profile
    FOREIGN KEY (id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS professional_profiles_id_idx ON professional_profiles(id);

-- Create jobs table if not exists
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  budget decimal not null,
  date_needed date not null,
  location text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  customer_id uuid references auth.users not null,
  professional_id uuid references auth.users,
  has_review boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_customer_profile
    FOREIGN KEY (customer_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_professional_profile
    FOREIGN KEY (professional_id) 
    REFERENCES public.profiles(id)
    ON DELETE SET NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS jobs_customer_id_idx ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS jobs_professional_id_idx ON jobs(professional_id);

-- Create bids table if not exists
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  professional_id uuid references auth.users not null,
  amount decimal not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_professional_profile
    FOREIGN KEY (professional_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS bids_professional_id_idx ON public.bids(professional_id);

-- Create job_photos table if not exists
CREATE TABLE IF NOT EXISTS public.job_photos (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  photo_url text not null,
  uploaded_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  reviewer_id uuid references auth.users not null,
  reviewed_id uuid references auth.users not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz default now(),
  CONSTRAINT fk_reviewer_profile
    FOREIGN KEY (reviewer_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviewed_profile
    FOREIGN KEY (reviewed_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  UNIQUE(job_id, reviewer_id, reviewed_id)
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS reviews_job_id_idx ON reviews(job_id);
CREATE INDEX IF NOT EXISTS reviews_reviewer_id_idx ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS reviews_reviewed_id_idx ON reviews(reviewed_id);

-- Create time_suggestions table if not exists
CREATE TABLE IF NOT EXISTS public.time_suggestions (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  professional_id uuid references auth.users not null,
  suggested_date date not null,
  suggested_time time not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_professional_profile
    FOREIGN KEY (professional_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create indexes for time suggestions
CREATE INDEX IF NOT EXISTS time_suggestions_job_id_idx ON time_suggestions(job_id);
CREATE INDEX IF NOT EXISTS time_suggestions_professional_id_idx ON time_suggestions(professional_id);

-- Create document_acceptances table if not exists
CREATE TABLE IF NOT EXISTS public.document_acceptances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  document_type text check (document_type in ('waiver', 'privacy', 'terms')) not null,
  job_id uuid references public.jobs on delete cascade not null,
  created_at timestamptz default now()
);

-- Enable RLS on tables
DO $$ 
BEGIN
    ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.professional_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.bids ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.job_photos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.time_suggestions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.document_acceptances ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN 
    NULL;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone"
        ON public.profiles FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON public.profiles FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
    END IF;
END $$;
