-- Add fields for anonymous feedback
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
ADD COLUMN IF NOT EXISTS anonymous_email TEXT;

-- Create a temporary function to check if the view exists and modify it
DO $$
DECLARE
    view_exists BOOLEAN;
BEGIN
    -- Check if the view exists
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback_with_metadata'
    ) INTO view_exists;
    
    IF view_exists THEN
        -- Drop the existing view
        DROP VIEW public.feedback_with_metadata;
    END IF;
    
    -- Create the new view without duplicating upvotes_count
    CREATE VIEW public.feedback_with_metadata AS
    SELECT 
        f.id,
        f.user_id,
        f.type,
        f.title,
        f.description,
        f.status,
        f.is_public,
        f.upvotes_count,  -- Use the existing column
        f.created_at,
        f.updated_at,
        f.anonymous_name,
        f.anonymous_email,
        COALESCE(p.full_name, f.anonymous_name) AS full_name,
        COALESCE(p.email, f.anonymous_email) AS email,
        p.avatar_url,
        (SELECT COUNT(*) FROM feedback_comments fc WHERE fc.feedback_id = f.id) AS comment_count
    FROM 
        feedback f
    LEFT JOIN 
        profiles p ON f.user_id = p.id;
END $$; 