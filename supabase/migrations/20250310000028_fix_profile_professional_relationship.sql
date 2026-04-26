-- Drop existing foreign key if it exists
ALTER TABLE public.professional_profiles
DROP CONSTRAINT IF EXISTS fk_user;

-- Drop existing constraints
ALTER TABLE public.professional_profiles
DROP CONSTRAINT IF EXISTS professional_profiles_pkey;

-- Recreate the table with proper relationships
ALTER TABLE public.professional_profiles
ADD CONSTRAINT professional_profiles_pkey PRIMARY KEY (id),
ADD CONSTRAINT fk_profile_id FOREIGN KEY (id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- Add explicit reference for the relationship
COMMENT ON CONSTRAINT fk_profile_id ON public.professional_profiles IS 
'@foreignKey (id) references public.profiles(id)';

-- Add comment to establish the relationship for PostgREST
COMMENT ON TABLE public.professional_profiles IS 
'@foreignKey (id) references public.profiles(id)';

-- Add RLS policies to ensure proper access
CREATE POLICY "Enable read access for all users"
ON public.professional_profiles FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON public.professional_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON public.professional_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
ON public.professional_profiles FOR DELETE
USING (auth.uid() = id); 