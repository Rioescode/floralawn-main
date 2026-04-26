-- First, let's make sure the table structure is correct
CREATE TABLE IF NOT EXISTS public.professional_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    business_name TEXT,
    business_description TEXT,
    service_area TEXT[],
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,
    years_experience INTEGER,
    insurance_info TEXT,
    license_number TEXT,
    social_media JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT fk_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Drop existing policies
ALTER TABLE public.professional_profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "professional_profiles_select" ON public.professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_insert" ON public.professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_update" ON public.professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_delete" ON public.professional_profiles;

-- Enable RLS
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "allow_read"
ON public.professional_profiles
FOR SELECT USING (true);

CREATE POLICY "allow_insert"
ON public.professional_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update"
ON public.professional_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "allow_delete"
ON public.professional_profiles
FOR DELETE
USING (auth.uid() = id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_professional_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_professional_profiles_updated_at_trigger ON public.professional_profiles;
CREATE TRIGGER update_professional_profiles_updated_at_trigger
    BEFORE UPDATE ON public.professional_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_profiles_updated_at(); 