-- Insert a test job if none exist
INSERT INTO public.jobs (
  title,
  description,
  budget,
  date_needed,
  location,
  status,
  customer_id
)
SELECT
  'Test Job',
  'This is a test job description',
  100,
  CURRENT_DATE + INTERVAL '7 days',
  'Test Location',
  'open',
  (SELECT id FROM public.profiles WHERE is_professional = false LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.jobs
); 