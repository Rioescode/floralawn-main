-- Add new columns to the jobs table for lawn-specific fields
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS property_size TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'lawn_mowing',
ADD COLUMN IF NOT EXISTS lawn_condition TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS service_frequency TEXT DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS special_equipment TEXT,
ADD COLUMN IF NOT EXISTS existing_issues TEXT;

-- You might want to make these columns visible in your RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_job() 
RETURNS TRIGGER AS $$
BEGIN
  -- Include the new fields in your trigger function if you have one
  NEW.property_size = COALESCE(NEW.property_size, '');
  NEW.service_type = COALESCE(NEW.service_type, 'lawn_mowing');
  NEW.lawn_condition = COALESCE(NEW.lawn_condition, 'normal');
  NEW.service_frequency = COALESCE(NEW.service_frequency, 'one_time');
  NEW.special_equipment = COALESCE(NEW.special_equipment, '');
  NEW.existing_issues = COALESCE(NEW.existing_issues, '');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update your RLS policies to include the new fields
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Example of updating an existing policy (adjust according to your actual policies)
CREATE POLICY "Customers can read their own jobs"
ON jobs
FOR SELECT
USING (auth.uid() = customer_id);

-- Update handleEditJob function to include new fields
-- Make sure this is done in CustomerDashboard.js 