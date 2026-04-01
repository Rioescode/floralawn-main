-- Create dump location type enum
CREATE TYPE dump_location_type AS ENUM ('landfill', 'transfer_station', 'recycling_center', 'composting', 'other');

-- Create dump locations table
CREATE TABLE IF NOT EXISTS dump_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipcode TEXT NOT NULL,
    type dump_location_type NOT NULL,
    hours TEXT,
    fees TEXT,
    notes TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_dump_locations_city ON dump_locations(city);
CREATE INDEX idx_dump_locations_state ON dump_locations(state);
CREATE INDEX idx_dump_locations_type ON dump_locations(type);
CREATE INDEX idx_dump_locations_verified ON dump_locations(verified);

-- Enable RLS
ALTER TABLE dump_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Dump locations are viewable by everyone" 
ON dump_locations FOR SELECT 
USING (true);

-- Only authenticated users can add locations
CREATE POLICY "Authenticated users can add locations" 
ON dump_locations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update locations
CREATE POLICY "Only admins can update locations" 
ON dump_locations FOR UPDATE 
USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'service_role'
);

-- Only admins can delete locations
CREATE POLICY "Only admins can delete locations" 
ON dump_locations FOR DELETE 
USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'service_role'
);

-- Create function to update a dump location
CREATE OR REPLACE FUNCTION public.update_dump_location(
    p_location_id UUID,
    p_name TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_zipcode TEXT DEFAULT NULL,
    p_type dump_location_type DEFAULT NULL,
    p_hours TEXT DEFAULT NULL,
    p_fees TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_verified BOOLEAN DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_updated_location JSONB;
BEGIN
    -- Check if location exists
    IF NOT EXISTS (SELECT 1 FROM dump_locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location not found';
    END IF;

    -- Update only the provided fields
    UPDATE dump_locations
    SET
        name = COALESCE(p_name, name),
        address = COALESCE(p_address, address),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        zipcode = COALESCE(p_zipcode, zipcode),
        type = COALESCE(p_type, type),
        hours = COALESCE(p_hours, hours),
        fees = COALESCE(p_fees, fees),
        notes = COALESCE(p_notes, notes),
        verified = COALESCE(p_verified, verified),
        updated_at = NOW()
    WHERE id = p_location_id
    RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'address', address,
        'city', city,
        'state', state,
        'zipcode', zipcode,
        'type', type,
        'hours', hours,
        'fees', fees,
        'notes', notes,
        'verified', verified,
        'updated_at', updated_at
    ) INTO v_updated_location;

    RETURN v_updated_location;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating location: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete a dump location
CREATE OR REPLACE FUNCTION public.delete_dump_location(
    p_location_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if location exists
    IF NOT EXISTS (SELECT 1 FROM dump_locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location not found';
    END IF;

    -- Delete the location
    DELETE FROM dump_locations
    WHERE id = p_location_id;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting location: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE dump_locations; 