-- Create feedback type enum
CREATE TYPE feedback_type AS ENUM ('suggestion', 'issue', 'feature_request', 'other');

-- Create feedback status enum
CREATE TYPE feedback_status AS ENUM ('new', 'under_review', 'planned', 'in_progress', 'completed', 'declined');

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    type feedback_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status feedback_status DEFAULT 'new',
    is_public BOOLEAN DEFAULT true,
    upvotes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback upvotes table
CREATE TABLE IF NOT EXISTS feedback_upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feedback_id, user_id)
);

-- Create feedback comments table
CREATE TABLE IF NOT EXISTS feedback_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for feedback with user info and counts
CREATE OR REPLACE VIEW feedback_with_metadata AS
SELECT 
    f.id,
    f.user_id,
    f.type,
    f.title,
    f.description,
    f.status,
    f.is_public,
    f.created_at,
    f.updated_at,
    p.full_name,
    p.avatar_url,
    (
        SELECT COUNT(*)
        FROM feedback_comments c
        WHERE c.feedback_id = f.id
    ) as comment_count,
    f.upvotes_count,
    EXISTS (
        SELECT 1 
        FROM feedback_upvotes u 
        WHERE u.feedback_id = f.id 
        AND u.user_id = auth.uid()
    ) as is_upvoted
FROM feedback f
LEFT JOIN profiles p ON f.user_id = p.id;

-- Create view for feedback comments with user info
CREATE OR REPLACE VIEW feedback_comments_with_profiles AS
SELECT 
    c.*,
    p.full_name,
    p.avatar_url
FROM feedback_comments c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Create indexes
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at);
CREATE INDEX idx_feedback_upvotes_feedback ON feedback_upvotes(feedback_id);
CREATE INDEX idx_feedback_upvotes_user ON feedback_upvotes(user_id);
CREATE INDEX idx_feedback_comments_feedback ON feedback_comments(feedback_id);
CREATE INDEX idx_feedback_comments_user ON feedback_comments(user_id);

-- Create stored procedures for managing upvotes
CREATE OR REPLACE FUNCTION increment_feedback_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE feedback
  SET upvotes_count = upvotes_count + 1
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_feedback_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE feedback
  SET upvotes_count = GREATEST(0, upvotes_count - 1)
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public feedback is viewable by everyone"
ON feedback FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create feedback"
ON feedback FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own feedback"
ON feedback FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
ON feedback FOR DELETE
USING (auth.uid() = user_id);

-- Upvotes policies
CREATE POLICY "Users can view upvotes"
ON feedback_upvotes FOR SELECT
USING (true);

CREATE POLICY "Users can upvote"
ON feedback_upvotes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove their upvotes"
ON feedback_upvotes FOR DELETE
USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments"
ON feedback_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON feedback_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
ON feedback_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON feedback_comments FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_comments; 