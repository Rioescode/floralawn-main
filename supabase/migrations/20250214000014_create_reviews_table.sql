-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) NOT NULL,
    reviewed_id UUID REFERENCES profiles(id) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their own jobs" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Create RLS policies
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their own jobs"
ON reviews FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jobs
        WHERE jobs.id = job_id
        AND (
            -- Customer can review professional
            (auth.uid() = jobs.customer_id AND reviewed_id = jobs.professional_id)
            OR
            -- Professional can review customer
            (auth.uid() = jobs.professional_id AND reviewed_id = jobs.customer_id)
        )
        AND jobs.status = 'completed'
    )
);

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
USING (auth.uid() = reviewer_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_timestamp ON reviews;
CREATE TRIGGER update_review_timestamp
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_updated_at();

-- Handle constraints for reviews table
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS unique_job_reviewer;
ALTER TABLE reviews ADD CONSTRAINT unique_job_reviewer UNIQUE (job_id, reviewer_id);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS different_users;
ALTER TABLE reviews ADD CONSTRAINT different_users CHECK (reviewer_id != reviewed_id); 