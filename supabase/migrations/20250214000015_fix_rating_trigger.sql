-- Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS update_professional_rating_trigger ON reviews;
DROP FUNCTION IF EXISTS update_professional_rating();

-- Create improved rating update function
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
DECLARE
    prof_id UUID;
BEGIN
    -- Handle INSERT, UPDATE, and DELETE operations
    IF TG_OP = 'DELETE' THEN
        prof_id := OLD.reviewed_id;
    ELSE
        prof_id := NEW.reviewed_id;
    END IF;

    -- Update the professional's rating and total_reviews
    UPDATE professional_profiles
    SET 
        rating = COALESCE((
            SELECT AVG(rating)::DECIMAL(3,1)
            FROM reviews
            WHERE reviewed_id = prof_id
        ), 0),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews
            WHERE reviewed_id = prof_id
        )
    WHERE profile_id = prof_id;

    -- Return appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for all relevant operations
CREATE TRIGGER update_professional_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_rating();

-- Update all existing ratings
UPDATE professional_profiles
SET 
    rating = COALESCE((
        SELECT AVG(rating)::DECIMAL(3,1)
        FROM reviews
        WHERE reviewed_id = professional_profiles.profile_id
    ), 0),
    total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE reviewed_id = professional_profiles.profile_id
    ); 