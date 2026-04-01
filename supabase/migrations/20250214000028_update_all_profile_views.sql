-- Drop existing views
DROP VIEW IF EXISTS community_posts_with_metadata;
DROP VIEW IF EXISTS community_comments_with_profiles;
DROP VIEW IF EXISTS dumpster_rentals_with_metadata;
DROP VIEW IF EXISTS feedback_with_metadata;
DROP VIEW IF EXISTS feedback_comments_with_profiles;
DROP VIEW IF EXISTS community_free_items_with_profiles;

-- Create consistent profile view
CREATE OR REPLACE VIEW public.user_profiles_view AS
SELECT 
    p.*,
    COALESCE(
        pp.business_name,
        p.full_name,
        'Anonymous'
    ) as display_name,
    COALESCE(
        pp.logo_url,
        CASE 
            WHEN p.avatar_url LIKE '%googleusercontent.com%' THEN p.avatar_url
            WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN p.avatar_url
            ELSE 'https://ui-avatars.com/api/?name=' || REPLACE(COALESCE(p.full_name, 'Anonymous'), ' ', '+')
        END
    ) as display_avatar_url
FROM profiles p
LEFT JOIN professional_profiles pp ON p.id = pp.profile_id;

-- Recreate all views using the user_profiles_view
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