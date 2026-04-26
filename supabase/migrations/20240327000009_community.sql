-- Create post type enum
CREATE TYPE post_type AS ENUM ('general', 'question', 'discussion', 'event', 'announcement', 'job-update', 'recommendation');

-- Create post status enum
CREATE TYPE post_status AS ENUM ('active', 'closed', 'archived', 'reported');

-- Create community posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    type post_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status post_status DEFAULT 'active',
    is_pinned BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create community comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    is_solution BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES community_comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create community reactions table
CREATE TABLE IF NOT EXISTS community_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id, comment_id, reaction_type)
);

-- Create community bookmarks table
CREATE TABLE IF NOT EXISTS community_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create view for posts with user info and counts
CREATE OR REPLACE VIEW community_posts_with_metadata AS
SELECT 
    p.*,
    u.full_name,
    u.avatar_url,
    (
        SELECT COUNT(*)
        FROM community_comments c
        WHERE c.post_id = p.id
    ) as comment_count,
    (
        SELECT COUNT(*)
        FROM community_reactions r
        WHERE r.post_id = p.id
    ) as reaction_count,
    (
        SELECT COUNT(*)
        FROM community_bookmarks b
        WHERE b.post_id = p.id
    ) as bookmark_count
FROM community_posts p
LEFT JOIN profiles u ON p.user_id = u.id;

-- Create view for comments with user info
CREATE OR REPLACE VIEW community_comments_with_profiles AS
SELECT 
    c.*,
    u.full_name,
    u.avatar_url,
    (
        SELECT COUNT(*)
        FROM community_reactions r
        WHERE r.comment_id = c.id
    ) as reaction_count
FROM community_comments c
LEFT JOIN profiles u ON c.user_id = u.id;

-- Create indexes
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_type ON community_posts(type);
CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_community_posts_created ON community_posts(created_at);
CREATE INDEX idx_community_comments_post ON community_comments(post_id);
CREATE INDEX idx_community_comments_user ON community_comments(user_id);
CREATE INDEX idx_community_comments_parent ON community_comments(parent_id);
CREATE INDEX idx_community_reactions_post ON community_reactions(post_id);
CREATE INDEX idx_community_reactions_comment ON community_reactions(comment_id);
CREATE INDEX idx_community_reactions_user ON community_reactions(user_id);
CREATE INDEX idx_community_bookmarks_user ON community_bookmarks(user_id);
CREATE INDEX idx_community_bookmarks_post ON community_bookmarks(post_id);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON community_posts;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON community_comments;

-- Create more permissive policies
CREATE POLICY "Posts are viewable by everyone" 
ON community_posts FOR SELECT 
USING (true);

CREATE POLICY "Users can create posts" 
ON community_posts FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own posts" 
ON community_posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON community_posts FOR DELETE 
USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" 
ON community_comments FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON community_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON community_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON community_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" 
ON community_reactions FOR SELECT 
USING (true);

CREATE POLICY "Users can create reactions" 
ON community_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON community_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" 
ON community_bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" 
ON community_bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON community_bookmarks FOR DELETE 
USING (auth.uid() = user_id);

-- Function to increment post view count
CREATE OR REPLACE FUNCTION increment_post_view(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE community_posts
    SET view_count = view_count + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark comment as solution
CREATE OR REPLACE FUNCTION mark_comment_as_solution(
    p_comment_id UUID,
    p_post_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_post_owner_id UUID;
BEGIN
    -- Get post owner
    SELECT user_id INTO v_post_owner_id
    FROM community_posts
    WHERE id = p_post_id;

    -- Check if user is post owner
    IF v_post_owner_id != p_user_id THEN
        RAISE EXCEPTION 'Only the post owner can mark a solution';
    END IF;

    -- Unmark any existing solution
    UPDATE community_comments
    SET is_solution = false
    WHERE post_id = p_post_id
    AND is_solution = true;

    -- Mark new solution
    UPDATE community_comments
    SET is_solution = true
    WHERE id = p_comment_id
    AND post_id = p_post_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove all storage related policies and bucket
DROP POLICY IF EXISTS "Community images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload community images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own community images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community images" ON storage.objects;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE community_bookmarks; 