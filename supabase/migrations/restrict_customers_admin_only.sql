-- Restrict customer management to admin only (esckoofficial@gmail.com)

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.customers;

-- Create admin-only policies
CREATE POLICY "Admin read access" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

CREATE POLICY "Admin insert access" ON public.customers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

CREATE POLICY "Admin update access" ON public.customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

CREATE POLICY "Admin delete access" ON public.customers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'esckoofficial@gmail.com'
        )
    );

-- Also restrict the earnings view to admin only
DROP POLICY IF EXISTS "Admin earnings view" ON public.customer_earnings;

-- Note: Views inherit table policies, so customer_earnings will automatically be restricted

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers'; 