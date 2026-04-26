-- Add address column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create the policy with the correct syntax
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Make sure the updated_at column exists and has a trigger to update it
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or replace the function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

-- Create the trigger
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 