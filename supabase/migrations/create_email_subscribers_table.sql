-- Create email_subscribers table for marketing opt-ins
CREATE TABLE IF NOT EXISTS public.email_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    city TEXT,
    source TEXT NOT NULL DEFAULT 'contact_form',
    preferences JSONB NOT NULL DEFAULT '{}',
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON public.email_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON public.email_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed_at ON public.email_subscribers(subscribed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (only admin can view/manage email subscribers)
CREATE POLICY "Admin can manage email subscribers" ON public.email_subscribers
    FOR ALL USING (auth.jwt() ->> 'email' = 'esckoofficial@gmail.com');

-- Create policy for public inserts (contact form submissions)
CREATE POLICY "Allow public inserts for contact form" ON public.email_subscribers
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_subscribers TO authenticated;
GRANT SELECT, INSERT ON public.email_subscribers TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_subscribers_updated_at
    BEFORE UPDATE ON public.email_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO public.email_subscribers (name, email, phone, city, source, preferences) VALUES
('Test Subscriber', 'test@example.com', '(401) 555-0123', 'Providence', 'contact_form', 
 '{"coupons": true, "seasonal": true, "updates": false, "newsletter": true}')
ON CONFLICT (email) DO NOTHING; 