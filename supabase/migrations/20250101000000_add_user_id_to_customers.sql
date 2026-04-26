-- Add user_id column to customers table to link to auth.users
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Add skipped_services table to track skipped service dates
CREATE TABLE IF NOT EXISTS public.skipped_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(customer_id, service_date)
);

CREATE INDEX IF NOT EXISTS idx_skipped_services_customer_id ON public.skipped_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_skipped_services_service_date ON public.skipped_services(service_date);

-- Enable RLS on skipped_services
ALTER TABLE public.skipped_services ENABLE ROW LEVEL SECURITY;

-- RLS policy: customers can view their own skipped services
CREATE POLICY "Customers can view own skipped services" ON public.skipped_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.id = skipped_services.customer_id 
            AND customers.user_id = auth.uid()
        )
    );

-- RLS policy: customers can insert their own skipped services
CREATE POLICY "Customers can insert own skipped services" ON public.skipped_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.id = skipped_services.customer_id 
            AND customers.user_id = auth.uid()
        )
    );

-- Update RLS policies on customers table to allow customers to view/edit their own records
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.customers;

-- Customers can view their own records
CREATE POLICY "Customers can view own records" ON public.customers
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

-- Customers can update their own records (for skip/cancel operations)
CREATE POLICY "Customers can update own records" ON public.customers
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

-- Admin can still insert/delete
CREATE POLICY "Admin can insert customers" ON public.customers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

CREATE POLICY "Admin can delete customers" ON public.customers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

COMMENT ON COLUMN public.customers.user_id IS 'Links customer record to auth.users for customer self-service';
COMMENT ON TABLE public.skipped_services IS 'Tracks dates when customers skip their scheduled services';

