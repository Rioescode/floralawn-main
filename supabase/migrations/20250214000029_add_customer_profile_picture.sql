-- Create profile-pictures storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Add profile_picture_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Allow public access to view profile pictures
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop dependent views first
DROP VIEW IF EXISTS community_posts_with_metadata;
DROP VIEW IF EXISTS community_comments_with_profiles;
DROP VIEW IF EXISTS dumpster_rentals_with_metadata;
DROP VIEW IF EXISTS feedback_with_metadata;
DROP VIEW IF EXISTS feedback_comments_with_profiles;
DROP VIEW IF EXISTS community_free_items_with_profiles;

-- Update the user_profiles_view to prioritize profile pictures
DROP VIEW IF EXISTS user_profiles_view;
CREATE OR REPLACE VIEW public.user_profiles_view AS
SELECT 
    p.*,
    COALESCE(
        pp.business_name,
        p.full_name,
        'Anonymous'
    ) as display_name,
    COALESCE(
        pp.logo_url,                                    -- First try professional logo
        p.profile_picture_url,                         -- Then try custom profile picture
        CASE 
            WHEN p.avatar_url LIKE '%googleusercontent.com%' THEN p.avatar_url  -- Then try Google avatar
            WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN p.avatar_url  -- Then try other avatar
            ELSE 'https://ui-avatars.com/api/?name=' || REPLACE(COALESCE(p.full_name, 'Anonymous'), ' ', '+')  -- Finally fallback
        END
    ) as display_avatar_url
FROM profiles p
LEFT JOIN professional_profiles pp ON p.id = pp.profile_id;

-- Recreate dependent views
CREATE OR REPLACE VIEW community_posts_with_metadata AS
SELECT 
    p.*,
    u.display_name,
    u.display_avatar_url as avatar_url,
    (
        SELECT COUNT(*)
        FROM community_comments c
        WHERE c.post_id = p.id
    ) as comment_count,
    (
        SELECT COUNT(*)
        FROM community_reactions r
        WHERE r.post_id = p.id
    ) as reaction_count,
    (
        SELECT COUNT(*)
        FROM community_bookmarks b
        WHERE b.post_id = p.id
    ) as bookmark_count
FROM community_posts p
LEFT JOIN user_profiles_view u ON p.user_id = u.id;

CREATE OR REPLACE VIEW community_comments_with_profiles AS
SELECT 
    c.*,
    u.display_name,
    u.display_avatar_url as avatar_url
FROM community_comments c
LEFT JOIN user_profiles_view u ON c.user_id = u.id;

CREATE OR REPLACE VIEW dumpster_rentals_with_metadata AS
SELECT 
    r.*,
    u.display_name,
    u.display_avatar_url as avatar_url
FROM dumpster_rentals r
LEFT JOIN user_profiles_view u ON r.owner_id = u.id;

CREATE OR REPLACE VIEW feedback_with_metadata AS
SELECT 
    f.*,
    u.display_name,
    u.display_avatar_url as avatar_url
FROM feedback f
LEFT JOIN user_profiles_view u ON f.user_id = u.id;

CREATE OR REPLACE VIEW feedback_comments_with_profiles AS
SELECT 
    c.*,
    u.display_name,
    u.display_avatar_url as avatar_url
FROM feedback_comments c
LEFT JOIN user_profiles_view u ON c.user_id = u.id;

CREATE OR REPLACE VIEW community_free_items_with_profiles AS
SELECT 
    i.*,
    u.display_name,
    u.display_avatar_url as avatar_url,
    ru.display_name as reserver_name,
    ru.display_avatar_url as reserver_avatar
FROM community_free_items i
LEFT JOIN user_profiles_view u ON i.user_id = u.id
LEFT JOIN user_profiles_view ru ON i.reserved_by = ru.id; 