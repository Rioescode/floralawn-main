-- First disable RLS and drop existing policies
ALTER TABLE public.professional_profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professionals_can_update_own_profile" ON public.professional_profiles;
DROP POLICY IF EXISTS "professionals_can_insert_own_profile" ON public.professional_profiles;
DROP POLICY IF EXISTS "anyone_can_view_professional_profiles" ON public.professional_profiles;

-- Enable RLS
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies for professional_profiles
CREATE POLICY "professional_profiles_select"
ON public.professional_profiles
FOR SELECT
USING (true);  -- Anyone can view professional profiles

CREATE POLICY "professional_profiles_insert"
ON public.professional_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id AND  -- Must be their own profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_professional = true
  )
);

CREATE POLICY "professional_profiles_update"
ON public.professional_profiles
FOR UPDATE
USING (
  auth.uid() = id AND  -- Must be their own profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_professional = true
  )
);

CREATE POLICY "professional_profiles_delete"
ON public.professional_profiles
FOR DELETE
USING (auth.uid() = id);  -- Can only delete their own profile

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_professional_profiles_id 
ON public.professional_profiles(id); 