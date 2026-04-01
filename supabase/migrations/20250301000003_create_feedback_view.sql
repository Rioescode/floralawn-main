-- Create the feedback_with_metadata view
CREATE OR REPLACE VIEW public.feedback_with_metadata AS
SELECT 
  f.id,
  f.user_id,
  f.type,
  f.title,
  f.description,
  f.status,
  f.is_public,
  f.upvotes_count,
  f.created_at,
  f.updated_at,
  p.full_name,
  p.email,
  p.avatar_url,
  (SELECT COUNT(*) FROM feedback_comments fc WHERE fc.feedback_id = f.id) AS comment_count,
  CASE 
    WHEN EXISTS (SELECT 1 FROM feedback_upvotes fu WHERE fu.feedback_id = f.id AND fu.user_id = auth.uid()) 
    THEN true 
    ELSE false 
  END AS is_upvoted
FROM 
  feedback f
LEFT JOIN 
  profiles p ON f.user_id = p.id;

-- Create the feedback_comments_with_profiles view
CREATE OR REPLACE VIEW public.feedback_comments_with_profiles AS
SELECT 
  fc.id,
  fc.feedback_id,
  fc.user_id,
  fc.content,
  fc.is_official,
  fc.created_at,
  fc.updated_at,
  p.full_name,
  p.email,
  p.avatar_url
FROM 
  feedback_comments fc
LEFT JOIN 
  profiles p ON fc.user_id = p.id;

-- Grant access to the views
GRANT SELECT ON public.feedback_with_metadata TO anon, authenticated;
GRANT SELECT ON public.feedback_comments_with_profiles TO anon, authenticated; 