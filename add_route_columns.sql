-- Add route optimization columns to customers table
ALTER TABLE customers 
ADD COLUMN route_order INTEGER,
ADD COLUMN travel_time_to_next VARCHAR(50),
ADD COLUMN distance_to_next VARCHAR(50),
ADD COLUMN route_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance when ordering by route
CREATE INDEX idx_customers_route_order ON customers(scheduled_day, route_order);

-- Add comments for documentation
COMMENT ON COLUMN customers.route_order IS 'Order in optimized route (1st, 2nd, 3rd customer to visit)';
COMMENT ON COLUMN customers.travel_time_to_next IS 'Travel time to next customer (e.g., "15 mins")';
COMMENT ON COLUMN customers.distance_to_next IS 'Distance to next customer (e.g., "2.5 miles")';
COMMENT ON COLUMN customers.route_updated_at IS 'When route optimization was last calculated';
