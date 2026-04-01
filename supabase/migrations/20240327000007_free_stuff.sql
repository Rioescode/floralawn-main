-- Create free stuff listing status enum
CREATE TYPE item_status AS ENUM ('available', 'taken');

-- Create free items table
CREATE TABLE IF NOT EXISTS community_free_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    condition TEXT NOT NULL,
    location TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status item_status DEFAULT 'available',
    reserved_by UUID REFERENCES profiles(id),
    reservation_expires_at TIMESTAMPTZ,
    pickup_photo TEXT,
    pickup_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for items with profiles
CREATE OR REPLACE VIEW community_free_items_with_profiles AS
SELECT 
    i.*,
    p.full_name,
    p.avatar_url,
    rp.full_name as reserver_name,
    rp.avatar_url as reserver_avatar
FROM community_free_items i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN profiles rp ON i.reserved_by = rp.id;

-- Create indexes
CREATE INDEX idx_community_free_items_user ON community_free_items(user_id);
CREATE INDEX idx_community_free_items_status ON community_free_items(status);
CREATE INDEX idx_community_free_items_reserved_by ON community_free_items(reserved_by);

-- Enable RLS
ALTER TABLE community_free_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Free items are viewable by everyone" 
ON community_free_items FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own free items" 
ON community_free_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own free items" 
ON community_free_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own free items" 
ON community_free_items FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE community_free_items; 