-- First disable RLS and drop ALL existing policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow reading is_professional field" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read professional profiles" ON public.profiles;
DROP POLICY IF EXISTS "Professionals can read customer profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ONE simple policy for each operation type
CREATE POLICY "profiles_select"
ON public.profiles 
FOR SELECT
USING (true);  -- Everyone can read all profiles

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);  -- Users can only insert their own profile

CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);  -- Users can only update their own profile

CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);  -- Users can only delete their own profile 