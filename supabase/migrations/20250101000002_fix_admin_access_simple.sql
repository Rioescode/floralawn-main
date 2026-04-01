-- Simple fix for admin customer access
-- This will ensure admin can always access customers

-- First, let's see what policies exist
DO $$
BEGIN
    RAISE NOTICE 'Dropping all existing policies on customers table...';
END $$;

-- Drop ALL existing policies on customers table
DROP POLICY IF EXISTS "Admin and customer view access" ON public.customers;
DROP POLICY IF EXISTS "Customers can view own records" ON public.customers;
DROP POLICY IF EXISTS "Admin read access" ON public.customers;
DROP POLICY IF EXISTS "Admin full access" ON public.customers;
DROP POLICY IF EXISTS "Admin only access" ON public.customers;
DROP POLICY IF EXISTS "Admin and customer update access" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own records" ON public.customers;
DROP POLICY IF EXISTS "Admin update access" ON public.customers;
DROP POLICY IF EXISTS "Admin can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admin insert access" ON public.customers;
DROP POLICY IF EXISTS "Admin can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Admin delete access" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.customers;

-- Now create simple, working policies
-- SELECT: Admin sees all, customers see their own
CREATE POLICY "admin_select_all" ON public.customers
    FOR SELECT 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'esckoofficial@gmail.com'
        OR 
        user_id = auth.uid()
    );

-- UPDATE: Admin can update all, customers can update their own
CREATE POLICY "admin_update_all" ON public.customers
    FOR UPDATE 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'esckoofficial@gmail.com'
        OR 
        user_id = auth.uid()
    );

-- INSERT: Only admin can insert
CREATE POLICY "admin_insert_only" ON public.customers
    FOR INSERT 
    WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'esckoofficial@gmail.com'
    );

-- DELETE: Only admin can delete
CREATE POLICY "admin_delete_only" ON public.customers
    FOR DELETE 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'esckoofficial@gmail.com'
    );

-- Ensure RLS is enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Test query (this will show if admin can see customers)
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    -- This will only work if run as admin, but we can't test that here
    SELECT COUNT(*) INTO customer_count FROM public.customers;
    RAISE NOTICE 'Total customers in table: %', customer_count;
END $$;

