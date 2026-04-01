-- Drop existing view
DROP VIEW IF EXISTS community_posts_with_metadata;

-- Recreate the posts view with proper profile handling
CREATE OR REPLACE VIEW community_posts_with_metadata AS
SELECT 
    p.*,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        u.full_name
    ) as display_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(u.full_name, ' ', '+')
    ) as avatar_url,
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
LEFT JOIN profiles u ON p.user_id = u.id; 