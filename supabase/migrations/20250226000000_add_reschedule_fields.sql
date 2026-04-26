-- Add reschedule-related fields to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS last_rescheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_rescheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rescheduled_reason TEXT;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id),
  created_by UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id); 