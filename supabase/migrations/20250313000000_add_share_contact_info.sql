-- Add share_contact_info column to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS share_contact_info BOOLEAN DEFAULT false;

-- Update the jobs_view to include the new field
CREATE OR REPLACE VIEW public.jobs_view AS
SELECT 
  j.*,
  p.full_name as customer_name,
  p.phone as customer_phone,
  p.avatar_url as customer_avatar
FROM public.jobs j
LEFT JOIN public.profiles p ON j.customer_id = p.id; 