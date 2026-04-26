-- Create service_areas table
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial service areas
INSERT INTO service_areas (name) VALUES
    ('Manhattan'),
    ('Brooklyn'),
    ('Queens'),
    ('Bronx'),
    ('Staten Island'),
    ('Long Island'),
    ('Westchester'),
    ('New Jersey'),
    ('Connecticut')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Allow public read access to service areas
CREATE POLICY "Service areas are viewable by everyone"
ON service_areas FOR SELECT
USING (true); 