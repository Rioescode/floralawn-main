-- Fix customers table - Drop and recreate with correct structure
-- This script will completely recreate the customers table

-- Drop existing table and dependencies
DROP VIEW IF EXISTS public.customer_earnings CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;

-- Create customers table with correct structure
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Customer Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    
    -- Service Details
    service_type VARCHAR(100) NOT NULL DEFAULT 'lawn_mowing',
    frequency VARCHAR(50) NOT NULL DEFAULT 'weekly',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Scheduling
    next_service DATE,
    last_service DATE,
    
    -- Status and Notes
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    notes TEXT,
    
    -- Constraints
    CONSTRAINT customers_service_type_check CHECK (
        service_type IN ('lawn_mowing', 'lawn_care', 'landscaping', 'mulch_installation', 'spring_cleanup', 'fall_cleanup')
    ),
    CONSTRAINT customers_frequency_check CHECK (
        frequency IN ('weekly', 'bi_weekly', 'monthly', 'seasonal', 'one_time')
    ),
    CONSTRAINT customers_status_check CHECK (
        status IN ('active', 'pending', 'completed', 'cancelled')
    ),
    CONSTRAINT customers_price_check CHECK (price >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_next_service ON public.customers(next_service);
CREATE INDEX idx_customers_service_type ON public.customers(service_type);
CREATE INDEX idx_customers_created_at ON public.customers(created_at);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Insert sample data (each row on single line to avoid quote issues)
INSERT INTO public.customers (name, email, phone, address, service_type, frequency, price, next_service, status, notes) VALUES
('John Smith', 'john.smith@email.com', '(401) 555-0101', '123 Main St Providence RI', 'lawn_mowing', 'weekly', 45.00, '2024-12-25', 'active', 'Prefers early morning service'),
('Sarah Johnson', 'sarah.johnson@email.com', '(401) 555-0102', '456 Oak Ave Warwick RI', 'landscaping', 'bi_weekly', 120.00, '2024-12-26', 'pending', 'Has two dogs please close gate'),
('Mike Davis', 'mike.davis@email.com', '(401) 555-0103', '789 Pine St Cranston RI', 'mulch_installation', 'one_time', 200.00, '2024-12-27', 'active', 'Red mulch preferred'),
('Lisa Wilson', 'lisa.wilson@email.com', '(401) 555-0104', '321 Elm Dr Pawtucket RI', 'spring_cleanup', 'monthly', 75.00, '2024-12-28', 'completed', 'Seasonal cleanup only'),
('Tom Brown', 'tom.brown@email.com', '(401) 555-0105', '654 Maple Ln East Providence RI', 'fall_cleanup', 'one_time', 85.00, '2024-12-29', 'cancelled', 'Call before arrival');

-- Create earnings view
CREATE VIEW public.customer_earnings AS
SELECT 
    COUNT(*) as total_customers,
    SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as total_earnings,
    SUM(CASE WHEN status = 'completed' AND next_service >= date_trunc('month', CURRENT_DATE) THEN price ELSE 0 END) as monthly_earnings,
    SUM(CASE WHEN status = 'completed' AND next_service >= date_trunc('week', CURRENT_DATE) THEN price ELSE 0 END) as weekly_earnings,
    AVG(price) as avg_price,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_customers,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_services
FROM public.customers;

-- Grant access to the view
GRANT SELECT ON public.customer_earnings TO authenticated;
GRANT SELECT ON public.customer_earnings TO service_role;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position; 