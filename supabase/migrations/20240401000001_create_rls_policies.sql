-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Professional profiles policies
CREATE POLICY "Public professional profiles are viewable by everyone"
ON professional_profiles FOR SELECT
USING (true);

CREATE POLICY "Professionals can update own profile"
ON professional_profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Professionals can insert own profile"
ON professional_profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Jobs policies
CREATE POLICY "Jobs are viewable by everyone"
ON jobs FOR SELECT
USING (true);

CREATE POLICY "Customers can create jobs"
ON jobs FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own jobs"
ON jobs FOR UPDATE
USING (auth.uid() = customer_id);

-- Bids policies
CREATE POLICY "Bids are viewable by involved parties"
ON bids FOR SELECT
USING (
    auth.uid() = professional_id OR 
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_id 
        AND jobs.customer_id = auth.uid()
    )
);

CREATE POLICY "Professionals can create bids"
ON bids FOR INSERT
WITH CHECK (auth.uid() = professional_id);

-- Job photos policies
CREATE POLICY "Photos are viewable by everyone"
ON job_photos FOR SELECT
USING (true);

CREATE POLICY "Users can upload photos to their jobs"
ON job_photos FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, email)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        new.email
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies for time_suggestions
CREATE POLICY "Professionals can create time suggestions"
ON time_suggestions FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = professional_id AND
    EXISTS (
        SELECT 1 FROM jobs
        WHERE id = job_id AND status = 'open'
    )
);

CREATE POLICY "Users can view time suggestions for their jobs"
ON time_suggestions FOR SELECT
TO authenticated
USING (
    auth.uid() = professional_id OR
    EXISTS (
        SELECT 1 FROM jobs
        WHERE id = job_id AND customer_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own time suggestions"
ON time_suggestions FOR UPDATE
TO authenticated
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id); 