"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PostComments({ postId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      // Get comments with user profiles in a single query
      const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments_with_profiles')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Transform comments into hierarchical structure
      const commentMap = new Map();
      const topLevelComments = [];

      // First pass: Create comment objects and store in map
      commentsData.forEach(comment => {
        const commentObj = {
          ...comment,
          replies: [],
          likes_count: 0,
          is_liked: false
        };
        commentMap.set(comment.id, commentObj);
      });

      // Second pass: Build the hierarchy
      commentsData.forEach(comment => {
        const commentObj = commentMap.get(comment.id);
        if (comment.parent_id) {
          const parentComment = commentMap.get(comment.parent_id);
          if (parentComment) {
            parentComment.replies.push(commentObj);
          }
        } else {
          topLevelComments.push(commentObj);
        }
      });

      // Get reactions if user is authenticated
      if (currentUser) {
        const { data: reactions } = await supabase
          .from('community_reactions')
          .select('comment_id')
          .eq('user_id', currentUser.id)
          .eq('reaction_type', 'like')
          .in('comment_id', commentsData.map(c => c.id));

        if (reactions) {
          const likedCommentIds = new Set(reactions.map(r => r.comment_id));
          
          // Update liked status in our comment hierarchy
          const updateLikedStatus = (comments) => {
            return comments.map(comment => ({
              ...comment,
              is_liked: likedCommentIds.has(comment.id),
              replies: updateLikedStatus(comment.replies)
            }));
          };

          const updatedComments = updateLikedStatus(topLevelComments);
          setComments(updatedComments);
        } else {
          setComments(topLevelComments);
        }
      } else {
        setComments(topLevelComments);
      }

    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setSubmitting(true);
    setError('');

    try {
      // Insert the comment
      const { data: insertedComment, error: insertError } = await supabase
        .from('community_comments')
        .insert([
          {
            post_id: postId,
            user_id: currentUser.id,
            content: newComment.trim(),
            parent_id: replyingTo?.id || null
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Fetch the comment with profile data from the view
      const { data: commentWithProfile, error: profileError } = await supabase
        .from('community_comments_with_profiles')
        .select('*')
        .eq('id', insertedComment.id)
        .single();

      if (profileError) throw profileError;

      // Create transformed comment with profile data
      const newCommentData = {
        ...commentWithProfile,
        replies: [],
        likes_count: 0,
        is_liked: false
      };

      if (replyingTo) {
        // Function to recursively update replies
        const updateReplies = (comments) => {
          return comments.map(comment => {
            if (comment.id === replyingTo.id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newCommentData]
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateReplies(comment.replies)
              };
            }
            return comment;
          });
        };

        setComments(prevComments => updateReplies(prevComments));
        setReplyingTo(null);
      } else {
        setComments(prevComments => [...prevComments, newCommentData]);
      }

      setNewComment('');
      if (typeof onCommentAdded === 'function') {
        onCommentAdded();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) return;

    try {
      const { data: existingLike } = await supabase
        .from('community_reactions')
        .select()
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .eq('reaction_type', 'like')
        .single();

      if (existingLike) {
        await supabase
          .from('community_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id)
          .eq('reaction_type', 'like');

        // Update comments state to reflect the unliked status
        const updateLikeStatus = (comments) => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, is_liked: false, likes_count: Math.max(0, comment.likes_count - 1) };
            }
            if (comment.replies.length > 0) {
              return { ...comment, replies: updateLikeStatus(comment.replies) };
            }
            return comment;
          });
        };

        setComments(prevComments => updateLikeStatus(prevComments));
      } else {
        await supabase
          .from('community_reactions')
          .insert([{ 
            comment_id: commentId, 
            user_id: currentUser.id,
            reaction_type: 'like'
          }]);

        // Update comments state to reflect the liked status
        const updateLikeStatus = (comments) => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, is_liked: true, likes_count: comment.likes_count + 1 };
            }
            if (comment.replies.length > 0) {
              return { ...comment, replies: updateLikeStatus(comment.replies) };
            }
            return comment;
          });
        };

        setComments(prevComments => updateLikeStatus(prevComments));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      setError('Failed to update like status');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      // Find the comment to verify ownership
      const comment = comments.find(c => c.id === commentId) || 
                     comments.flatMap(c => c.replies).find(c => c.id === commentId);
      
      if (!comment || comment.user_id !== currentUser.id) {
        throw new Error('You can only delete your own comments');
      }

      // First delete any reactions to this comment
      await supabase
        .from('community_reactions')
        .delete()
        .eq('comment_id', commentId);

      // Then delete the comment itself
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Recursively remove comment from state
      const removeComment = (comments) => {
        return comments.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      setComments(prevComments => removeComment(prevComments));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.message || 'Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const Comment = ({ comment, isReply = false, depth = 0 }) => (
    <div className={`flex space-x-3 ${isReply ? `ml-${Math.min(depth * 8, 16)} mt-3` : ''}`}>
      <div className="flex-shrink-0">
        {comment.avatar_url ? (
          <img
            src={comment.avatar_url}
            alt={comment.display_name}
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-[#FF5733] flex items-center justify-center text-white text-sm">
            {comment.display_name?.charAt(0) || '?'}
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{comment.display_name}</span>
            <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
          </div>
          {currentUser && comment.user_id === currentUser.id && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-gray-400 hover:text-red-500"
              title="Delete comment"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-gray-700">{comment.content}</p>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleLikeComment(comment.id)}
            className={`flex items-center space-x-1 text-sm ${
              comment.is_liked ? 'text-[#FF5733]' : 'text-gray-500 hover:text-[#FF5733]'
            }`}
          >
            <svg className="h-4 w-4" fill={comment.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{comment.likes_count || 0}</span>
          </button>
          <button
            onClick={() => setReplyingTo(comment)}
            className="text-sm text-gray-500 hover:text-[#FF5733]"
          >
            Reply
          </button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => (
              <Comment key={reply.id} comment={reply} isReply={true} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}

        {comments.length === 0 && (
          <div className="text-center text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {currentUser && (
        <form onSubmit={handleSubmit} className="mt-4">
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <span className="text-sm text-gray-500">
                Replying to {replyingTo.display_name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              {currentUser.user_metadata?.picture || currentUser.user_metadata?.avatar_url ? (
                <img
                  src={currentUser.user_metadata.picture || currentUser.user_metadata.avatar_url}
                  alt={currentUser.user_metadata.display_name || "Profile"}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.user_metadata.display_name || 'User')}`;
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-[#FF5733] text-white rounded-full flex items-center justify-center text-sm">
                  {currentUser.user_metadata?.display_name?.charAt(0) || currentUser.email?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent resize-none"
                rows="2"
              />

              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="bg-[#FF5733] text-white px-4 py-2 rounded-md hover:bg-[#E64A2E] disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
} 