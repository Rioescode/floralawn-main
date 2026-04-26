-- Verify and fix professional_profiles table structure if needed
DO $$ 
BEGIN
  -- Add id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
    AND column_name = 'id'
  ) THEN
    ALTER TABLE public.professional_profiles 
    ADD COLUMN id UUID PRIMARY KEY REFERENCES auth.users(id);
  END IF;
END $$;

-- Make sure id is the primary key and references auth.users
ALTER TABLE public.professional_profiles 
DROP CONSTRAINT IF EXISTS professional_profiles_pkey;

ALTER TABLE public.professional_profiles 
ADD CONSTRAINT professional_profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.professional_profiles 
DROP CONSTRAINT IF EXISTS professional_profiles_id_fkey;

ALTER TABLE public.professional_profiles 
ADD CONSTRAINT professional_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; 