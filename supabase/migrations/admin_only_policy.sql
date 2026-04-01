-- Enable admin-only access to customers table

-- Check current status
SELECT 'Before enabling RLS:' as info, COUNT(*) as count FROM public.customers;

-- Enable RLS on the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy using auth.email()
CREATE POLICY "Admin only access" ON public.customers
    FOR ALL 
    USING (auth.email() = 'esckoofficial@gmail.com')
    WITH CHECK (auth.email() = 'esckoofficial@gmail.com');

-- Grant permissions (still needed)
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Test the policy
SELECT 'After enabling RLS - should work for admin:' as info, COUNT(*) as count FROM public.customers;

-- Show current policies
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers';

SELECT 'RLS is now enabled - only admin can access customers' as status; 