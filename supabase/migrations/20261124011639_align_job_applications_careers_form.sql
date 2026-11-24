-- Careers applications. Safe to run once on a database that never had
-- job_applications, and also after 20250115000000_create_job_applications_table.sql.
-- Not applied by this change. The API still emails the application if the insert fails.

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  city text,
  state text DEFAULT 'RI',
  position text,
  experience text,
  drivers_license text,
  availability text,
  start_date date,
  languages text,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now()),
  CONSTRAINT job_applications_contact_method_check CHECK (
    (email IS NOT NULL AND btrim(email) <> '')
    OR (phone IS NOT NULL AND btrim(phone) <> '')
  )
);

ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS state text DEFAULT 'RI';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS drivers_license text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS availability text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS languages text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now());
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

UPDATE public.job_applications
SET full_name = NULLIF(btrim(concat_ws(' ', first_name, last_name)), '')
WHERE full_name IS NULL OR btrim(full_name) = '';

UPDATE public.job_applications
SET full_name = 'Unknown'
WHERE full_name IS NULL OR btrim(full_name) = '';

-- The earlier migration required address, zip, and both contact fields.
-- Phone OR email is enough for this form, so those constraints have to relax.
DO $$
DECLARE
  legacy_column text;
BEGIN
  FOREACH legacy_column IN ARRAY ARRAY[
    'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state',
    'zip_code', 'position', 'experience', 'availability', 'why_interested'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'job_applications'
        AND column_name = legacy_column
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.job_applications ALTER COLUMN %I DROP NOT NULL',
        legacy_column
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.job_applications ALTER COLUMN full_name SET NOT NULL;

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_contact_method_check;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_contact_method_check
  CHECK (
    (email IS NOT NULL AND btrim(email) <> '')
    OR (phone IS NOT NULL AND btrim(phone) <> '')
  );

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_full_name_check;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_full_name_check
  CHECK (btrim(full_name) <> '');

CREATE INDEX IF NOT EXISTS idx_job_applications_created_at
  ON public.job_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_email
  ON public.job_applications (email);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit job applications" ON public.job_applications;
CREATE POLICY "Anyone can submit job applications"
  ON public.job_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- service_role bypasses RLS and is what the API uses. anon and authenticated
-- can insert only. There is no select policy for those roles.
REVOKE ALL ON TABLE public.job_applications FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.job_applications TO anon, authenticated;
GRANT ALL ON TABLE public.job_applications TO service_role;

COMMENT ON TABLE public.job_applications IS
  'Job applications from /careers. Insert-only for anon. The API reads and writes with the service role.';
