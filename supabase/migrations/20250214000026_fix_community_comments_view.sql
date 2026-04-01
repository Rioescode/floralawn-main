-- Update community comments view to properly handle Google avatars and names
DROP VIEW IF EXISTS community_comments_with_profiles;

CREATE OR REPLACE VIEW community_comments_with_profiles AS
SELECT 
    c.*,
    u.full_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        CASE 
            WHEN u.avatar_url LIKE '%googleusercontent.com%' THEN u.avatar_url
            WHEN u.avatar_url IS NOT NULL AND u.avatar_url != '' THEN u.avatar_url
            ELSE 'https://ui-avatars.com/api/?name=' || REPLACE(COALESCE(u.full_name, 'Anonymous'), ' ', '+')
        END
    ) as avatar_url,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        CASE 
            WHEN u.full_name IS NOT NULL AND u.full_name != '' THEN u.full_name
            ELSE 'Anonymous'
        END
    ) as display_name
FROM community_comments c
LEFT JOIN profiles u ON c.user_id = u.id; 