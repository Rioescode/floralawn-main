-- Create function to handle job completion
CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id UUID,
  p_professional_id UUID,
  p_proper_disposal BOOLEAN,
  p_area_clean BOOLEAN,
  p_no_damage BOOLEAN,
  p_recycling BOOLEAN,
  p_estimate_accurate BOOLEAN,
  p_photos_uploaded BOOLEAN,
  p_completion_notes TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the professional is assigned to this job
  IF NOT EXISTS (
    SELECT 1 FROM jobs 
    WHERE id = p_job_id 
    AND professional_id = p_professional_id
    AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Unauthorized or invalid job status';
  END IF;

  -- Insert completion checklist
  INSERT INTO job_completions (
    job_id,
    professional_id,
    proper_disposal,
    area_clean,
    no_damage,
    recycling,
    estimate_accurate,
    photos_uploaded,
    completion_notes
  ) VALUES (
    p_job_id,
    p_professional_id,
    p_proper_disposal,
    p_area_clean,
    p_no_damage,
    p_recycling,
    p_estimate_accurate,
    p_photos_uploaded,
    p_completion_notes
  );

  -- Update job status to completed
  UPDATE jobs 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- Create job_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) NOT NULL,
  proper_disposal BOOLEAN NOT NULL,
  area_clean BOOLEAN NOT NULL,
  no_damage BOOLEAN NOT NULL,
  recycling BOOLEAN NOT NULL,
  estimate_accurate BOOLEAN NOT NULL,
  photos_uploaded BOOLEAN NOT NULL,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id)
);

-- Enable RLS
ALTER TABLE job_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_completions
CREATE POLICY "Job completions are viewable by job participants"
ON job_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_id
    AND (
      auth.uid() = customer_id
      OR auth.uid() = professional_id
    )
  )
);

CREATE POLICY "Professionals can create job completions"
ON job_completions FOR INSERT
WITH CHECK (auth.uid() = professional_id);

-- Add completed_at column to jobs if it doesn't exist
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ; 