-- Debug and fix customers access issues

-- First, let's see what's currently in the customers table
SELECT 'Current customers count:' as info, COUNT(*) as count FROM public.customers;

-- Check current RLS policies
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers';

-- Check if RLS is enabled
SELECT 'RLS status:' as info, relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'customers';

-- Temporarily disable RLS to test
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Test insert without RLS
INSERT INTO public.customers (name, email, phone, address, service_type, frequency, price, status, notes) 
VALUES ('Debug Test Customer', 'debug@test.com', '401-555-9999', '999 Debug St', 'lawn_mowing', 'weekly', 25.00, 'active', 'Debug test entry');

-- Check if insert worked
SELECT 'After test insert:' as info, COUNT(*) as count FROM public.customers;

-- Re-enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin read access" ON public.customers;
DROP POLICY IF EXISTS "Admin insert access" ON public.customers;
DROP POLICY IF EXISTS "Admin update access" ON public.customers;
DROP POLICY IF EXISTS "Admin delete access" ON public.customers;

-- Create simpler, working policies for the admin user
CREATE POLICY "Admin full access" ON public.customers
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email = 'esckoofficial@gmail.com'
        )
    );

-- Grant explicit permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Test the new policy
SELECT 'Testing new policy - should show customers for admin:' as info;

-- Clean up debug customer
DELETE FROM public.customers WHERE email = 'debug@test.com';

-- Final check
SELECT 'Final customers count:' as info, COUNT(*) as count FROM public.customers; 