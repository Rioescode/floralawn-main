-- Drop and recreate reviews table with correct structure
DROP TABLE IF EXISTS public.reviews;

CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    UNIQUE(job_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "customers_can_create_reviews" ON public.reviews;
CREATE POLICY "customers_can_create_reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND jobs.customer_id = auth.uid()
    AND jobs.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM reviews r2
      WHERE r2.job_id = jobs.id
    )
  )
);

DROP POLICY IF EXISTS "users_can_view_reviews" ON public.reviews;
CREATE POLICY "users_can_view_reviews"
ON public.reviews
FOR SELECT
USING (true); 