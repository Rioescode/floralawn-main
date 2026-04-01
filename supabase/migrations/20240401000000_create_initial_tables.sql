-- Drop existing tables if they exist
DO $$ 
BEGIN
    -- Drop tables in reverse order of dependencies
    DROP TABLE IF EXISTS public.service_areas CASCADE;
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

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    is_customer BOOLEAN DEFAULT false,
    is_professional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional_profiles table
CREATE TABLE public.professional_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id),
    business_name TEXT,
    business_description TEXT,
    service_area TEXT[],
    logo_url TEXT,
    years_experience INTEGER,
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    insurance_info TEXT,
    license_number TEXT,
    social_media JSONB DEFAULT '{"facebook": "", "instagram": "", "linkedin": ""}',
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jobs table with proper relationships
CREATE TABLE public.jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL NOT NULL,
    date_needed DATE NOT NULL,
    location TEXT NOT NULL,
    property_size TEXT,
    service_type TEXT NOT NULL,
    lawn_condition TEXT,
    service_frequency TEXT,
    special_equipment TEXT,
    existing_issues TEXT,
    share_contact_info BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    customer_id UUID NOT NULL,
    professional_id UUID,
    has_review BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) 
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_professional FOREIGN KEY (professional_id) 
        REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create bids table
CREATE TABLE public.bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_photos table
CREATE TABLE public.job_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    reviewed_id UUID NOT NULL REFERENCES profiles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_suggestions table
CREATE TABLE public.time_suggestions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES profiles(id),
    suggested_date DATE NOT NULL,
    suggested_time TIME NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_areas table
CREATE TABLE public.service_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'RI',
    zipcode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    job_id UUID REFERENCES jobs(id),
    created_by UUID REFERENCES profiles(id),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create explicit indexes for foreign keys
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_professional_id ON jobs(professional_id);
CREATE INDEX idx_bids_job_id ON bids(job_id);
CREATE INDEX idx_bids_professional_id ON bids(professional_id);
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_time_suggestions_job_id ON time_suggestions(job_id);
CREATE INDEX idx_time_suggestions_professional_id ON time_suggestions(professional_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_job_id ON notifications(job_id); 