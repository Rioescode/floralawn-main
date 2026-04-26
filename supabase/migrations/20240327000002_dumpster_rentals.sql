-- Create dumpster rentals table
CREATE TABLE IF NOT EXISTS dumpster_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    size TEXT NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL,
    location TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    availability_status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dumpster bookings table
CREATE TABLE IF NOT EXISTS dumpster_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dumpster_id UUID REFERENCES dumpster_rentals(id) ON DELETE CASCADE NOT NULL,
    renter_id UUID REFERENCES profiles(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_dumpster_rentals_owner ON dumpster_rentals(owner_id);
CREATE INDEX idx_dumpster_bookings_dumpster ON dumpster_bookings(dumpster_id);
CREATE INDEX idx_dumpster_bookings_renter ON dumpster_bookings(renter_id);

-- Enable RLS
ALTER TABLE dumpster_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumpster_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dumpster_rentals
CREATE POLICY "Dumpster rentals are viewable by everyone" 
ON dumpster_rentals FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own dumpster listings" 
ON dumpster_rentals FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own dumpster listings" 
ON dumpster_rentals FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own dumpster listings" 
ON dumpster_rentals FOR DELETE 
USING (auth.uid() = owner_id);

-- Create RLS policies for dumpster_bookings
CREATE POLICY "Bookings are viewable by the renter and dumpster owner" 
ON dumpster_bookings FOR SELECT 
USING (
    auth.uid() = renter_id OR 
    auth.uid() IN (
        SELECT owner_id FROM dumpster_rentals WHERE id = dumpster_id
    )
);

CREATE POLICY "Users can create their own bookings" 
ON dumpster_bookings FOR INSERT 
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their own bookings" 
ON dumpster_bookings FOR UPDATE 
USING (auth.uid() = renter_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE dumpster_rentals;
ALTER PUBLICATION supabase_realtime ADD TABLE dumpster_bookings; 