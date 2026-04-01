-- Add rating columns to professional_profiles table
ALTER TABLE professional_profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create index for rating to optimize sorting and filtering
CREATE INDEX IF NOT EXISTS idx_professional_profiles_rating ON professional_profiles(rating);

-- Function to update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the professional's rating and total_reviews
  WITH review_stats AS (
    SELECT 
      COUNT(*) as review_count,
      AVG(rating) as avg_rating
    FROM reviews
    WHERE reviewed_id = NEW.reviewed_id
  )
  UPDATE professional_profiles
  SET 
    rating = COALESCE(review_stats.avg_rating, 0),
    total_reviews = review_stats.review_count
  FROM review_stats
  WHERE profile_id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update rating when reviews change
DROP TRIGGER IF EXISTS update_professional_rating_trigger ON reviews;
CREATE TRIGGER update_professional_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating(); 