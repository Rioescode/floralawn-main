-- TEMPORARY: Disable RLS to allow admin to see customers
-- WARNING: This makes the table accessible to all authenticated users
-- Use this only for debugging, then apply the proper fix migration

-- Disable RLS temporarily
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Show status
SELECT 'RLS is now DISABLED on customers table' as status;
SELECT 'This is temporary - apply migration 20250101000003_fix_admin_with_function.sql to fix properly' as warning;

