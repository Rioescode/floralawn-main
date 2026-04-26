-- Update existing feedback comments view to ensure it has the latest profile data
DROP VIEW IF EXISTS feedback_comments_with_profiles;

CREATE OR REPLACE VIEW feedback_comments_with_profiles AS
SELECT 
    c.*,
    u.full_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(COALESCE(u.full_name, 'Anonymous'), ' ', '+')
    ) as avatar_url,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        u.full_name,
        'Anonymous'
    ) as display_name
FROM feedback_comments c
LEFT JOIN profiles u ON c.user_id = u.id; 