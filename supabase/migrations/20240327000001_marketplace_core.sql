-- Create job status enum
CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  date_needed DATE NOT NULL,
  location TEXT,
  status job_status DEFAULT 'open',
  customer_id UUID NOT NULL REFERENCES profiles(id),
  professional_id UUID REFERENCES profiles(id),
  has_review BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job photos table
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time suggestions table
CREATE TABLE IF NOT EXISTS time_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) NOT NULL,
  suggested_date DATE NOT NULL,
  suggested_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, professional_id, suggested_date, suggested_time)
);

-- Create index for job photos
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);

-- Create index for time suggestions
CREATE INDEX idx_time_suggestions_job_id ON time_suggestions(job_id);
CREATE INDEX idx_time_suggestions_professional_id ON time_suggestions(professional_id);

-- Enable RLS for job photos
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Enable RLS for time suggestions
ALTER TABLE time_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job photos
CREATE POLICY "Job photos are viewable by everyone" 
ON job_photos FOR SELECT 
USING (true);

CREATE POLICY "Job owners can add photos" 
ON job_photos FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT customer_id FROM jobs WHERE jobs.id = job_id
  )
);

CREATE POLICY "Job owners can delete photos" 
ON job_photos FOR DELETE 
USING (
  auth.uid() IN (
    SELECT customer_id FROM jobs WHERE jobs.id = job_id
  )
);

-- Create RLS policies for time suggestions
CREATE POLICY "Time suggestions are viewable by job owner and suggesting professional" 
ON time_suggestions FOR SELECT 
USING (
  auth.uid() IN (
    SELECT customer_id FROM jobs WHERE jobs.id = job_id
    UNION
    SELECT professional_id
  )
);

CREATE POLICY "Professionals can create time suggestions" 
ON time_suggestions FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their own time suggestions" 
ON time_suggestions FOR UPDATE 
USING (auth.uid() = professional_id);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, professional_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_id, reviewed_id)
);

-- Create indexes
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_professional_id ON jobs(professional_id);
CREATE INDEX idx_bids_job_id ON bids(job_id);
CREATE INDEX idx_bids_professional_id ON bids(professional_id);
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for jobs
CREATE POLICY "Jobs are viewable by everyone" 
ON jobs FOR SELECT 
USING (true);

CREATE POLICY "Users can create jobs" 
ON jobs FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Job owners can update their jobs" 
ON jobs FOR UPDATE 
USING (auth.uid() = customer_id);

-- Create RLS policies for bids
CREATE POLICY "Bids are viewable by job owner and bidder" 
ON bids FOR SELECT 
USING (
  auth.uid() IN (
    SELECT customer_id FROM jobs WHERE jobs.id = job_id
    UNION
    SELECT professional_id
  )
);

CREATE POLICY "Professionals can create bids" 
ON bids FOR INSERT 
WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their own bids" 
ON bids FOR UPDATE 
USING (auth.uid() = professional_id);

-- Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for completed jobs" 
ON reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_id 
    AND status = 'completed'
    AND (
      customer_id = auth.uid() OR 
      professional_id = auth.uid()
    )
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews; 