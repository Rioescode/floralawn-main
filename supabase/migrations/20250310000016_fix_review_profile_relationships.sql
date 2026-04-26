-- Drop existing reviews table and recreate with proper relationships
DROP TABLE IF EXISTS public.reviews;

CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
);

-- Add foreign key relationships
ALTER TABLE public.reviews
ADD CONSTRAINT fk_reviewer_profile
FOREIGN KEY (reviewer_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.reviews
ADD CONSTRAINT fk_reviewed_profile
FOREIGN KEY (reviewed_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Update the query in ProfessionalDashboard to use the correct relationship 