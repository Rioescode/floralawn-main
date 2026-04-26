-- Function to update user posts
CREATE OR REPLACE FUNCTION update_user_posts(
    p_user_id UUID,
    p_full_name TEXT,
    p_avatar_url TEXT
) RETURNS void AS $$
BEGIN
    -- Update the user's posts
    UPDATE community_posts_with_metadata cp
    SET 
        full_name = p_full_name,
        avatar_url = p_avatar_url
    FROM profiles p
    WHERE cp.user_id = p_user_id
    AND p.id = cp.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user comments
CREATE OR REPLACE FUNCTION update_user_comments(
    p_user_id UUID,
    p_full_name TEXT,
    p_avatar_url TEXT
) RETURNS void AS $$
BEGIN
    -- Update the user's comments
    UPDATE community_comments_with_profiles cc
    SET 
        full_name = p_full_name,
        avatar_url = p_avatar_url
    FROM profiles p
    WHERE cc.user_id = p_user_id
    AND p.id = cc.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 