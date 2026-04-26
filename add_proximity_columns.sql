-- Add proximity columns to customers table
ALTER TABLE customers 
ADD COLUMN distance_miles DECIMAL(10,2),
ADD COLUMN travel_time VARCHAR(50),
ADD COLUMN proximity_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance when querying by distance
CREATE INDEX idx_customers_distance ON customers(distance_miles);

-- Add comment for documentation
COMMENT ON COLUMN customers.distance_miles IS 'Distance from home base in miles';
COMMENT ON COLUMN customers.travel_time IS 'Travel time from home base (e.g., "15 mins")';
COMMENT ON COLUMN customers.proximity_updated_at IS 'When proximity data was last calculated';
