-- Drop existing tables if they exist
DO $$ 
BEGIN
    -- Drop existing tables in reverse order of dependencies
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

-- Now create tables
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  avatar_url text,
  is_professional boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create professional_profiles table
create table public.professional_profiles (
  id uuid not null primary key,
  business_name text,
  business_description text,
  service_area text,
  logo_url text,
  years_experience integer,
  contact_email text,
  contact_phone text,
  website_url text,
  social_media jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_profile
    FOREIGN KEY (id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create jobs table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  budget decimal not null,
  date_needed date not null,
  location text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  customer_id uuid not null,
  professional_id uuid,
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

-- Create bids table
create table public.bids (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null,
  professional_id uuid not null,
  amount decimal not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_job
    FOREIGN KEY (job_id) 
    REFERENCES public.jobs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_professional_profile
    FOREIGN KEY (professional_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS jobs_customer_id_idx ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS jobs_professional_id_idx ON jobs(professional_id);
CREATE INDEX IF NOT EXISTS bids_professional_id_idx ON bids(professional_id);
CREATE INDEX IF NOT EXISTS bids_job_id_idx ON bids(job_id);

-- Create job_photos table
create table public.job_photos (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null,
  photo_url text not null,
  uploaded_by uuid not null,
  created_at timestamptz default now(),
  CONSTRAINT fk_job
    FOREIGN KEY (job_id) 
    REFERENCES public.jobs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_uploader_profile
    FOREIGN KEY (uploaded_by) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null,
  reviewer_id uuid not null,
  reviewed_id uuid not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz default now(),
  CONSTRAINT fk_job
    FOREIGN KEY (job_id) 
    REFERENCES public.jobs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviewer_profile
    FOREIGN KEY (reviewer_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviewed_profile
    FOREIGN KEY (reviewed_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create time_suggestions table
create table public.time_suggestions (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null,
  professional_id uuid not null,
  suggested_date date not null,
  suggested_time time not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  CONSTRAINT fk_job
    FOREIGN KEY (job_id) 
    REFERENCES public.jobs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_professional_profile
    FOREIGN KEY (professional_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE
);

-- Create document_acceptances table
create table public.document_acceptances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  document_type text check (document_type in ('waiver', 'privacy', 'terms')) not null,
  job_id uuid not null,
  created_at timestamptz default now(),
  CONSTRAINT fk_user_profile
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_job
    FOREIGN KEY (job_id) 
    REFERENCES public.jobs(id)
    ON DELETE CASCADE
);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS job_photos_job_id_idx ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS job_photos_uploaded_by_idx ON job_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS reviews_job_id_idx ON reviews(job_id);
CREATE INDEX IF NOT EXISTS reviews_reviewer_id_idx ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS reviews_reviewed_id_idx ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS time_suggestions_job_id_idx ON time_suggestions(job_id);
CREATE INDEX IF NOT EXISTS time_suggestions_professional_id_idx ON time_suggestions(professional_id);
CREATE INDEX IF NOT EXISTS document_acceptances_user_id_idx ON document_acceptances(user_id);
CREATE INDEX IF NOT EXISTS document_acceptances_job_id_idx ON document_acceptances(job_id);

-- Add RLS policies
alter table public.profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.bids enable row level security;
alter table public.job_photos enable row level security;
alter table public.reviews enable row level security;
alter table public.time_suggestions enable row level security;
alter table public.document_acceptances enable row level security;

-- Basic RLS policies (you may want to customize these based on your needs)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Similar policies for other tables...

-- Create index for performance
CREATE INDEX IF NOT EXISTS professional_profiles_id_idx ON professional_profiles(id); 