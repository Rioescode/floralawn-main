-- Add new columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS accepted_bid_id UUID REFERENCES bids(id),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add new columns to bids table if they don't exist
ALTER TABLE bids 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add new column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT false; 