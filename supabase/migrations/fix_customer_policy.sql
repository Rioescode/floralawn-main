-- Fix existing customer policy

-- Check current customers count
SELECT 'Current customers count:' as info, COUNT(*) as count FROM public.customers;

-- Drop the existing policy and recreate it
DROP POLICY IF EXISTS "Admin full access" ON public.customers;

-- Create a working policy for the admin user
CREATE POLICY "Admin full access" ON public.customers
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email = 'esckoofficial@gmail.com'
        )
    );

-- Grant explicit permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Test query to verify access
SELECT 'Testing access - customers visible to admin:' as info, COUNT(*) as count FROM public.customers;

-- Show current policies
SELECT 'Current policies after fix:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers'; 