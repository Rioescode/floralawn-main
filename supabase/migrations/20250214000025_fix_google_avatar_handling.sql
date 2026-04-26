-- Update dumpster rentals view to properly handle Google avatars
DROP VIEW IF EXISTS dumpster_rentals_with_metadata;

CREATE OR REPLACE VIEW dumpster_rentals_with_metadata AS
SELECT 
    r.*,
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
FROM dumpster_rentals r
LEFT JOIN profiles u ON r.owner_id = u.id; 