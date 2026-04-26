-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to read any avatar
CREATE POLICY "Avatar public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.foldername(name))[2] = 'avatar'
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update avatar"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.foldername(name))[2] = 'avatar'
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to read professional profiles
CREATE POLICY "Anyone can read professional profiles"
ON public.profiles
FOR SELECT
USING (is_professional = true);

-- Allow users to read professional_profiles
CREATE POLICY "Anyone can read professional_profiles"
ON public.professional_profiles
FOR SELECT
USING (true); 