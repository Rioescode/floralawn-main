-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    is_customer BOOLEAN DEFAULT false,
    is_professional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional_profiles table
CREATE TABLE IF NOT EXISTS professional_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    business_description TEXT,
    service_area TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_profile UNIQUE (profile_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create policies for professional_profiles
CREATE POLICY "Public professional profiles are viewable by everyone"
ON professional_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own professional profile"
ON professional_profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND auth.uid() = id));

CREATE POLICY "Users can insert own professional profile"
ON professional_profiles FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND auth.uid() = id));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_user_type text;
  v_metadata jsonb;
  v_provider text;
BEGIN
  -- Only insert if user doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    v_provider := new.raw_user_meta_data->>'provider';
    
    -- Get metadata based on provider
    IF v_provider = 'google' THEN
      -- For Google OAuth
      v_metadata := jsonb_build_object(
        'full_name', new.raw_user_meta_data->>'full_name',
        'avatar_url', new.raw_user_meta_data->>'avatar_url',
        'user_type', COALESCE(
          (new.raw_user_meta_data->'provider_token')::jsonb->>'user_type',
          new.raw_app_meta_data->>'user_type',
          'customer'
        )
      );
    ELSE
      -- For email signup
      v_metadata := COALESCE(new.raw_user_meta_data, new.raw_app_meta_data);
    END IF;
    
    -- Get user type from metadata
    v_user_type := COALESCE(v_metadata->>'user_type', 'customer');
    
    -- Ensure we have a valid user type
    IF v_user_type NOT IN ('customer', 'professional') THEN
      v_user_type := 'customer';
    END IF;

    -- Insert profile
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      avatar_url,
      phone,
      location,
      is_professional,
      is_customer
    )
    VALUES (
      new.id,
      COALESCE(v_metadata->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      COALESCE(v_metadata->>'avatar_url', ''),
      COALESCE(v_metadata->>'phone', ''),
      COALESCE(v_metadata->>'location', ''),
      v_user_type = 'professional',
      v_user_type = 'customer'
    );
    
    -- If user is a pro, create professional profile
    IF v_user_type = 'professional' THEN
      INSERT INTO public.professional_profiles (
        profile_id,
        business_name,
        business_description,
        service_area
      )
      VALUES (
        new.id,
        COALESCE(v_metadata->>'business_name', ''),
        COALESCE(v_metadata->>'business_description', ''),
        ARRAY[]::TEXT[]
      );
    END IF;
  END IF;
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE professional_profiles; 