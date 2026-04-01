-- Drop existing policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Professionals can create their profile" ON public.professional_profiles;
    DROP POLICY IF EXISTS "Professionals can update own profile" ON public.professional_profiles;
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Professional profiles are viewable by everyone" ON public.professional_profiles;
    DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Professionals can delete own profile" ON public.professional_profiles;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create policies for profiles
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Create policies for professional_profiles
CREATE POLICY "Professionals can create their profile"
ON public.professional_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Professionals can update own profile"
ON public.professional_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Professional profiles are viewable by everyone"
ON public.professional_profiles
FOR SELECT
USING (true);

CREATE POLICY "Professionals can delete own profile"
ON public.professional_profiles
FOR DELETE
USING (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY; 