-- First drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read professional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read professional_profiles" ON public.professional_profiles;

-- Recreate policies
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Anyone can read professional profiles"
ON public.profiles
FOR SELECT
USING (is_professional = true);

CREATE POLICY "Anyone can read professional_profiles"
ON public.professional_profiles
FOR SELECT
USING (true); 