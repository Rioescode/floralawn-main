-- Drop existing views if they exist
DROP VIEW IF EXISTS community_posts_with_metadata;
DROP VIEW IF EXISTS community_comments_with_profiles;

-- Recreate the posts view with proper avatar URL handling
CREATE OR REPLACE VIEW community_posts_with_metadata AS
SELECT 
    p.*,
    u.full_name,
    COALESCE(
        pp.business_name,
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
LEFT JOIN profiles u ON p.user_id = u.id
LEFT JOIN professional_profiles pp ON pp.id = u.id;

-- Recreate the comments view with proper avatar URL handling
CREATE OR REPLACE VIEW community_comments_with_profiles AS
SELECT 
    c.*,
    u.full_name,
    COALESCE(
        pp.business_name,
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(u.full_name, ' ', '+')
    ) as avatar_url,
    (
        SELECT COUNT(*)
        FROM community_reactions r
        WHERE r.comment_id = c.id
    ) as reaction_count
FROM community_comments c
LEFT JOIN profiles u ON c.user_id = u.id
LEFT JOIN professional_profiles pp ON pp.id = u.id; 