-- Fix admin access using a helper function
-- This is more reliable than checking email directly in policies

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'esckoofficial@gmail.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Drop all existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'customers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.customers';
    END LOOP;
END $$;

-- Now create clean policies using the function
CREATE POLICY "admin_can_select_all" ON public.customers
    FOR SELECT 
    USING (
        public.is_admin() = true
        OR 
        user_id = auth.uid()
    );

CREATE POLICY "admin_can_update_all" ON public.customers
    FOR UPDATE 
    USING (
        public.is_admin() = true
        OR 
        user_id = auth.uid()
    );

CREATE POLICY "admin_can_insert" ON public.customers
    FOR INSERT 
    WITH CHECK (
        public.is_admin() = true
    );

CREATE POLICY "admin_can_delete" ON public.customers
    FOR DELETE 
    USING (
        public.is_admin() = true
    );

-- Ensure RLS is enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

-- Test: Show current policies
SELECT 'Current policies on customers table:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customers';

