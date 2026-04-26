-- Create document_acceptances table
CREATE TABLE IF NOT EXISTS document_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, document_type, job_id)
);

-- Enable RLS
ALTER TABLE document_acceptances ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own document acceptances"
ON document_acceptances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own document acceptances"
ON document_acceptances FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
