-- Add explicit permission for customers to update their own jobs' date_needed field
CREATE POLICY "Customers can update date_needed for their own jobs" 
ON "public"."jobs"
FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id AND (
  -- Only allow updating specific fields
  jsonb_build_object(
    'date_needed', date_needed,
    'last_rescheduled_at', last_rescheduled_at,
    'last_rescheduled_by', last_rescheduled_by,
    'rescheduled_reason', rescheduled_reason
  ) <> '{}'::jsonb
)); 