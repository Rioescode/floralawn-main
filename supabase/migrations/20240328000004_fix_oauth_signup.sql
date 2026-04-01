-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _full_name TEXT;
    _avatar_url TEXT;
BEGIN
    -- Get full_name from different possible metadata locations
    _full_name := 
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->'user_metadata'->>'full_name',
            NEW.raw_user_meta_data->'user_metadata'->>'name',
            split_part(NEW.email, '@', 1)
        );

    -- Get avatar_url from different possible metadata locations
    _avatar_url := 
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            NEW.raw_user_meta_data->'user_metadata'->>'avatar_url',
            NEW.raw_user_meta_data->'user_metadata'->>'picture'
        );

    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        email
    ) VALUES (
        NEW.id,
        _full_name,
        _avatar_url,
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 