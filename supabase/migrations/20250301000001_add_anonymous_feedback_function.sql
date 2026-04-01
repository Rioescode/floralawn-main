-- Create a function to handle anonymous feedback
CREATE OR REPLACE FUNCTION public.submit_anonymous_feedback(
  feedback_type text,
  feedback_title text,
  feedback_description text,
  user_name text,
  user_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  new_profile_id uuid;
  new_feedback_id uuid;
BEGIN
  -- Create a temporary profile
  INSERT INTO public.profiles (full_name, email)
  VALUES (user_name, user_email)
  RETURNING id INTO new_profile_id;
  
  -- Create the feedback
  INSERT INTO public.feedback (
    type, 
    title, 
    description, 
    is_public, 
    user_id
  )
  VALUES (
    feedback_type::public.feedback_type, 
    feedback_title, 
    feedback_description, 
    true, 
    new_profile_id
  )
  RETURNING id INTO new_feedback_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'feedback_id', new_feedback_id,
    'profile_id', new_profile_id
  );
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.submit_anonymous_feedback TO anon; 