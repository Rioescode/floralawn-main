-- Add fields for anonymous feedback comments
ALTER TABLE public.feedback_comments
ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
ADD COLUMN IF NOT EXISTS anonymous_email TEXT;

-- Create a view for feedback comments with user information
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    -- Check if the view exists
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback_comments_with_user'
    ) INTO view_exists;
    
    IF view_exists THEN
        -- Drop the existing view
        DROP VIEW public.feedback_comments_with_user;
    END IF;
    
    -- Create the new view
    CREATE VIEW public.feedback_comments_with_user AS
    SELECT 
        fc.id,
        fc.feedback_id,
        fc.user_id,
        fc.content,
        fc.is_official,
        fc.created_at,
        fc.updated_at,
        fc.anonymous_name,
        fc.anonymous_email,
        COALESCE(p.full_name, fc.anonymous_name) AS full_name,
        COALESCE(p.email, fc.anonymous_email) AS email,
        p.avatar_url
    FROM 
        feedback_comments fc
    LEFT JOIN 
        profiles p ON fc.user_id = p.id;
END $$; 