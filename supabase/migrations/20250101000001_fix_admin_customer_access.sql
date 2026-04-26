-- Fix admin access to customers table
-- This ensures admin can always see all customers

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Customers can view own records" ON public.customers;
DROP POLICY IF EXISTS "Admin read access" ON public.customers;
DROP POLICY IF EXISTS "Admin full access" ON public.customers;
DROP POLICY IF EXISTS "Admin only access" ON public.customers;

-- Create a comprehensive SELECT policy that allows:
-- 1. Admin to see all customers
-- 2. Customers to see their own records
CREATE POLICY "Admin and customer view access" ON public.customers
    FOR SELECT USING (
        -- Admin can see everything
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
        OR
        -- Customers can see their own records
        user_id = auth.uid()
    );

-- Ensure admin can update all customers
DROP POLICY IF EXISTS "Customers can update own records" ON public.customers;
DROP POLICY IF EXISTS "Admin update access" ON public.customers;

CREATE POLICY "Admin and customer update access" ON public.customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
        OR
        user_id = auth.uid()
    );

-- Ensure admin can insert
DROP POLICY IF EXISTS "Admin can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admin insert access" ON public.customers;

CREATE POLICY "Admin insert access" ON public.customers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

-- Ensure admin can delete
DROP POLICY IF EXISTS "Admin can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Admin delete access" ON public.customers;

CREATE POLICY "Admin delete access" ON public.customers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

-- Grant explicit permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Verify RLS is enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Admin and customer view access" ON public.customers IS 'Allows admin to see all customers and customers to see their own records';

