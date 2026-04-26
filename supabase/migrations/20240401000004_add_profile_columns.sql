-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add comment for address column
COMMENT ON COLUMN public.profiles.address IS 'User''s physical address';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user''s avatar image in storage'; 