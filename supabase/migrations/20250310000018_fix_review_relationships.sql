-- Drop existing reviews table and recreate with explicit relationships
DROP TABLE IF EXISTS public.reviews;

CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    CONSTRAINT fk_reviewer_profile FOREIGN KEY (reviewer_id) 
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviewed_profile FOREIGN KEY (reviewed_id) 
        REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON public.reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "anyone_can_view_reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "reviewers_can_insert_reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviewers_can_update_own_reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

CREATE POLICY "reviewers_can_delete_own_reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = reviewer_id); 