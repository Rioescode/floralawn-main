-- Drop existing views if they exist
DROP VIEW IF EXISTS dumpster_rentals_with_metadata;
DROP VIEW IF EXISTS community_free_items_with_profiles;
DROP VIEW IF EXISTS feedback_with_metadata;
DROP VIEW IF EXISTS feedback_comments_with_profiles;

-- Create view for dumpster rentals with proper profile handling
CREATE OR REPLACE VIEW dumpster_rentals_with_metadata AS
SELECT 
    r.*,
    u.full_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(u.full_name, ' ', '+')
    ) as avatar_url,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        u.full_name
    ) as display_name
FROM dumpster_rentals r
LEFT JOIN profiles u ON r.owner_id = u.id;

-- Update view for free items with proper profile handling
CREATE OR REPLACE VIEW community_free_items_with_profiles AS
SELECT 
    i.*,
    u.full_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(u.full_name, ' ', '+')
    ) as avatar_url,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        u.full_name
    ) as display_name,
    rp.full_name as reserver_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = rp.id),
        rp.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(COALESCE(rp.full_name, 'User'), ' ', '+')
    ) as reserver_avatar
FROM community_free_items i
LEFT JOIN profiles u ON i.user_id = u.id
LEFT JOIN profiles rp ON i.reserved_by = rp.id;

-- Create view for feedback with proper profile handling
CREATE OR REPLACE VIEW feedback_with_metadata AS
SELECT 
    f.*,
    u.full_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(u.full_name, ' ', '+')
    ) as avatar_url,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        u.full_name
    ) as display_name
FROM feedback f
LEFT JOIN profiles u ON f.user_id = u.id;

-- Create view for feedback comments with proper profile handling
CREATE OR REPLACE VIEW feedback_comments_with_profiles AS
SELECT 
    c.*,
    u.full_name,
    COALESCE(
        (SELECT logo_url FROM professional_profiles WHERE profile_id = u.id),
        u.avatar_url,
        'https://ui-avatars.com/api/?name=' || REPLACE(u.full_name, ' ', '+')
    ) as avatar_url,
    COALESCE(
        (SELECT business_name FROM professional_profiles WHERE profile_id = u.id),
        u.full_name
    ) as display_name
FROM feedback_comments c
LEFT JOIN profiles u ON c.user_id = u.id; 