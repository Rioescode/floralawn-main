-- Create a function to check if a view exists
CREATE OR REPLACE FUNCTION public.check_view_exists(view_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = view_name
  ) INTO view_exists;
  
  RETURN view_exists;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.check_view_exists TO anon, authenticated; 