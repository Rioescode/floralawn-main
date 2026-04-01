-- Create function to increment upvotes
CREATE OR REPLACE FUNCTION public.increment_feedback_upvotes(feedback_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.feedback
  SET upvotes_count = upvotes_count + 1
  WHERE id = feedback_id;
END;
$$;

-- Create function to decrement upvotes
CREATE OR REPLACE FUNCTION public.decrement_feedback_upvotes(feedback_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.feedback
  SET upvotes_count = GREATEST(0, upvotes_count - 1)
  WHERE id = feedback_id;
END;
$$;

-- Grant execute permission to the functions
GRANT EXECUTE ON FUNCTION public.increment_feedback_upvotes TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_feedback_upvotes TO authenticated; 