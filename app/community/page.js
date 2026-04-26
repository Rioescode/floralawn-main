"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import CreatePost from './components/CreatePost';
import PostList from './components/PostList';

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    try {
      // Get posts with user info and counts
      const { data: posts, error } = await supabase
        .from('community_posts_with_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If user is authenticated, get their reactions
      if (user) {
        const { data: reactions } = await supabase
          .from('community_reactions')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('reaction_type', 'like')
          .in('post_id', posts.map(p => p.id));

        const likedPostIds = new Set(reactions?.map(r => r.post_id) || []);
        
        // Add is_liked field to posts
        const postsWithLikes = posts.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id)
        }));

        setPosts(postsWithLikes);
      } else {
        setPosts(posts);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to refetch posts when the component is focused
  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Add this useEffect to subscribe to realtime changes
  useEffect(() => {
    const postsSubscription = supabase
      .channel('public:community_posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'community_posts' 
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
    };
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          {user && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-[#FF5733] text-white px-4 py-2 rounded-md hover:bg-[#E64A2E] transition-colors"
            >
              Create Post
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : (
          <PostList posts={posts} onPostUpdated={fetchPosts} currentUser={user} />
        )}

        {showCreatePost && (
          <CreatePost
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
            user={user}
          />
        )}
      </div>
    </div>
  );
} 