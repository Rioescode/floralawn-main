-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS job_views CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS bids CASCADE;

-- Create jobs table
CREATE TABLE jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'open',
    poster_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_bid_id UUID,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create bids table
CREATE TABLE bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_bidder_per_job UNIQUE (job_id, bidder_id)
);

-- Create job_views table
CREATE TABLE job_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add foreign key constraint for accepted_bid_id after bids table is created
ALTER TABLE jobs
ADD CONSTRAINT jobs_accepted_bid_id_fkey
FOREIGN KEY (accepted_bid_id) REFERENCES bids(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_jobs_poster_id ON jobs(poster_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_bids_job_id ON bids(job_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_viewer_id ON job_views(viewer_id);
CREATE INDEX idx_messages_job_id ON messages(job_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs table
CREATE POLICY "Jobs are viewable by everyone"
    ON jobs FOR SELECT
    USING (true);

CREATE POLICY "Users can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update their own jobs"
    ON jobs FOR UPDATE
    USING (auth.uid() = poster_id);

CREATE POLICY "Users can delete their own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = poster_id);

-- Create policies for bids table
CREATE POLICY "Bids are viewable by job poster and bidder"
    ON bids FOR SELECT
    USING (
        auth.uid() IN (
            SELECT poster_id FROM jobs WHERE jobs.id = job_id
            UNION
            SELECT bidder_id WHERE bidder_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bids"
    ON bids FOR INSERT
    WITH CHECK (
        auth.uid() = bidder_id AND
        auth.uid() NOT IN (
            SELECT poster_id FROM jobs WHERE jobs.id = job_id
        )
    );

CREATE POLICY "Users can update their own bids"
    ON bids FOR UPDATE
    USING (auth.uid() = bidder_id);

CREATE POLICY "Users can delete their own bids"
    ON bids FOR DELETE
    USING (auth.uid() = bidder_id);

-- Create policies for job_views table
CREATE POLICY "Job views are viewable by everyone"
    ON job_views FOR SELECT
    USING (true);

CREATE POLICY "Users can create job views"
    ON job_views FOR INSERT
    WITH CHECK (auth.uid() = viewer_id);

-- Create policies for messages table
CREATE POLICY "Messages are viewable by job poster and message participants"
    ON messages FOR SELECT
    USING (
        auth.uid() IN (
            SELECT poster_id FROM jobs WHERE jobs.id = job_id
            UNION
            SELECT sender_id WHERE sender_id = auth.uid()
            UNION
            SELECT bidder_id FROM bids WHERE bids.job_id = job_id AND bidder_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        (
            auth.uid() IN (
                SELECT poster_id FROM jobs WHERE jobs.id = job_id
                UNION
                SELECT bidder_id FROM bids WHERE bids.job_id = job_id
            ) OR
            is_system_message = true
        )
    );

-- Add comment to clarify the relationships
COMMENT ON TABLE jobs IS 'Jobs posted by users';
COMMENT ON TABLE bids IS 'Bids placed on jobs by professionals';
COMMENT ON TABLE job_views IS 'Track when users view jobs';
COMMENT ON TABLE messages IS 'Messages between job posters and bidders'; 