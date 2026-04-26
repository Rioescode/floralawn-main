-- Create appointments table
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    city TEXT NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_areas table
CREATE TABLE service_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    zip_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_city ON appointments(city);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_areas_updated_at
    BEFORE UPDATE ON service_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial services
INSERT INTO services (name, description) VALUES
('Lawn Mowing', 'Professional lawn mowing service'),
('Landscaping', 'Complete landscaping solutions'),
('Tree Services', 'Tree trimming and removal'),
('Garden Maintenance', 'Regular garden upkeep'),
('Irrigation', 'Sprinkler system installation and repair'),
('Hardscaping', 'Patio, walkway, and retaining wall installation');

-- Insert initial service areas
INSERT INTO service_areas (city, state, zip_code) VALUES
('San Jose', 'CA', '95112'),
('Santa Clara', 'CA', '95050'),
('Sunnyvale', 'CA', '94085'),
('Mountain View', 'CA', '94040'),
('Palo Alto', 'CA', '94301'),
('Los Altos', 'CA', '94022'),
('Cupertino', 'CA', '95014'),
('Milpitas', 'CA', '95035'),
('Campbell', 'CA', '95008'),
('Saratoga', 'CA', '95070');

-- Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Allow public read access to appointments" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to appointments" ON appointments
    FOR INSERT WITH CHECK (true);

-- Create policies for services
CREATE POLICY "Allow public read access to services" ON services
    FOR SELECT USING (true);

-- Create policies for service areas
CREATE POLICY "Allow public read access to service areas" ON service_areas
    FOR SELECT USING (true); 