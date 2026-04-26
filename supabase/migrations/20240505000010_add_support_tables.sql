-- Create support requests table
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create property photos table
CREATE TABLE IF NOT EXISTS property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) NOT NULL,
    photo_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add helpful comments
COMMENT ON TABLE support_requests IS 'Stores customer support requests and inquiries';
COMMENT ON TABLE property_photos IS 'Stores photos uploaded by customers for their properties';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_requests_customer_id ON support_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_property_photos_customer_id ON property_photos(customer_id);

-- Enable RLS
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can insert own support requests" ON support_requests;
DROP POLICY IF EXISTS "Users can view own property photos" ON property_photos;
DROP POLICY IF EXISTS "Users can insert own property photos" ON property_photos;
DROP POLICY IF EXISTS "Users can delete own property photos" ON property_photos;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;

-- Create RLS policies
CREATE POLICY "Users can view own support requests"
    ON support_requests FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own support requests"
    ON support_requests FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can view own property photos"
    ON property_photos FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own property photos"
    ON property_photos FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete own property photos"
    ON property_photos FOR DELETE
    USING (auth.uid() = customer_id);

-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload their own photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'property-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own photos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'property-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    ); 