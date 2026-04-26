-- Update dumpster rentals view with better fallback handling
DROP VIEW IF EXISTS dumpster_rentals_with_metadata;

CREATE OR REPLACE VIEW dumpster_rentals_with_metadata AS
SELECT 
    r.*,
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
FROM dumpster_rentals r
LEFT JOIN profiles u ON r.owner_id = u.id; 