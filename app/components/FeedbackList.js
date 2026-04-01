"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  HandThumbUpIcon,
  ChatBubbleLeftIcon, 
  TrashIcon,
  FunnelIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid';

const FILTERS = [
  { value: 'all', label: 'All Feedback' },
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'features', label: 'Features' },
  { value: 'bugs', label: 'Bugs' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'other', label: 'Other' }
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'most_discussed', label: 'Most Discussed' }
];

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userLikes, setUserLikes] = useState(new Set());
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [editingFeedback, setEditingFeedback] = useState(null);

  useEffect(() => {
    checkViewExists();
    loadFeedbacks();
    checkUser();
  }, [sort]);

  useEffect(() => {
    filterFeedbacks();
  }, [feedbacks, filter]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadUserLikes(user.id);
    }
  };

  const loadUserLikes = async (userId) => {
    const { data: likes } = await supabase
      .from('feedback_upvotes')
      .select('feedback_id')
      .eq('user_id', userId);

    if (likes) {
      setUserLikes(new Set(likes.map(like => like.feedback_id)));
    }
  };

  const checkViews = async () => {
    try {
      console.log('Checking views...');
      
      // Check if the feedback_with_metadata view exists and has data
      const { data: viewData, error: viewError } = await supabase
        .from('feedback_with_metadata')
        .select('count(*)')
        .single();
      
      console.log('View check result:', viewData, viewError);
      
      // If there's an error with the view, try querying the base table
      if (viewError) {
        console.log('View error detected, querying base table...');
        const { data: tableData, error: tableError } = await supabase
          .from('feedback')
          .select('*');
        
        console.log('Base table data:', tableData, tableError);
        
        if (tableData && tableData.length > 0) {
          console.log('Found data in base table, using it directly');
          setFeedbacks(tableData);
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error checking views:', err);
      return false;
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      console.log('Starting to load feedback...');
      
      // First check if the views exist and have data
      const viewsWorking = await checkViews();
      
      if (viewsWorking) {
        console.log('Views are working, using them');
        return;
      }
      
      // If views aren't working, query the base table directly
      console.log('Falling back to base table query');
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('Loaded feedback data from base table:', data);
      
      // Transform the data to match the expected format
      const transformedData = await Promise.all((data || []).map(async (item) => {
        // Get user info if available
        let userName = null;
        let userEmail = null;
        let userAvatar = null;
        
        if (item.user_id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', item.user_id)
            .single();
          
          if (userData) {
            userName = userData.full_name;
            userEmail = userData.email;
            userAvatar = userData.avatar_url;
            console.log(`Found user data for ${item.id}:`, userData);
          } else {
            console.log(`No profile found for user_id ${item.user_id}`);
          }
        }
        
        // Get comment count
        const { count: commentCount } = await supabase
          .from('feedback_comments')
          .select('count(*)', { count: 'exact' })
          .eq('feedback_id', item.id)
          .single();
        
        return {
          ...item,
          full_name: userName || 'Anonymous',
          email: userEmail,
          avatar_url: userAvatar,
          comment_count: commentCount || 0,
          is_upvoted: false // Default to false since we can't easily check this
        };
      }));
      
      console.log('Transformed data:', transformedData);
      console.log('User names in transformed data:', transformedData.map(item => ({
        id: item.id,
        user_id: item.user_id,
        full_name: item.full_name
      })));
      setFeedbacks(transformedData);
    } catch (err) {
      console.error('Error loading feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    let filtered = [...feedbacks];
    
    // Apply type filter (changed from category)
    if (filter !== 'all') {
      filtered = filtered.filter(f => f.type === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'most_liked':
          return (b.upvotes_count || 0) - (a.upvotes_count || 0);
        case 'most_discussed':
          return (b.comment_count || 0) - (a.comment_count || 0);
        default: // latest
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredFeedbacks(filtered);
  };

  const handleLike = async (feedbackId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to like feedback');
        return;
      }

      if (userLikes.has(feedbackId)) {
        // Unlike
        await supabase
          .from('feedback_upvotes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);

        setUserLikes(prev => {
          const newLikes = new Set(prev);
          newLikes.delete(feedbackId);
          return newLikes;
        });

        // Update upvotes count
        await supabase.rpc('decrement_feedback_upvotes', { feedback_id: feedbackId });
      } else {
        // Like
        await supabase
          .from('feedback_upvotes')
          .insert([{ feedback_id: feedbackId, user_id: user.id }]);

        setUserLikes(prev => new Set([...prev, feedbackId]));
        
        // Update upvotes count
        await supabase.rpc('increment_feedback_upvotes', { feedback_id: feedbackId });
      }

      // Refresh the feedback to get updated counts
      loadFeedbacks();
    } catch (err) {
      console.error('Error handling like:', err);
    }
  };

  const loadComments = async (feedbackId) => {
    try {
      const { data, error } = await supabase
        .from('feedback_comments_with_profiles')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({
        ...prev,
        [feedbackId]: data
      }));
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleComment = async (feedbackId) => {
    if (!newComment.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let commentData = {
        feedback_id: feedbackId,
        content: newComment.trim()
      };
      
      if (user) {
        // For authenticated users, use their user ID
        commentData.user_id = user.id;
      } else {
        // For anonymous users, store name/email directly
        commentData.anonymous_name = 'Anonymous';
      }
      
      const { data, error } = await supabase
        .from('feedback_comments')
        .insert(commentData)
        .select(`
          id, 
          content, 
          created_at, 
          user_id,
          anonymous_name,
          (
            SELECT full_name FROM profiles WHERE id = user_id
          ) as full_name,
          (
            SELECT avatar_url FROM profiles WHERE id = user_id
          ) as avatar_url
        `)
        .single();
        
      if (error) throw error;
      
      // Add the new comment to the comments state
      setComments(prev => ({
        ...prev,
        [feedbackId]: [...(prev[feedbackId] || []), {
          ...data,
          full_name: data.full_name || data.anonymous_name || 'Anonymous'
        }]
      }));
      
      setNewComment('');
      
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId, feedbackId) => {
    try {
      const { error } = await supabase
        .from('feedback_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => ({
        ...prev,
        [feedbackId]: prev[feedbackId].filter(c => c.id !== commentId)
      }));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);
        
      if (error) throw error;
      
      // Remove from state
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      
      // Close edit form if open
      if (editingFeedback === feedbackId) {
        setEditingFeedback(null);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const handleUpdate = async (feedbackId, updatedData) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update(updatedData)
        .eq('id', feedbackId);
        
      if (error) throw error;
      
      // Update in state
      setFeedbacks(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, ...updatedData } : f
      ));
      
      // Close edit form
      setEditingFeedback(null);
    } catch (err) {
      console.error('Error updating feedback:', err);
      alert('Failed to update feedback');
    }
  };

  const EditFeedbackForm = ({ feedback, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
      title: feedback.title,
      description: feedback.description,
      type: feedback.type
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onUpdate(feedback.id, formData);
    };

    return (
      <div className="border-t border-gray-200 bg-gray-50 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Feedback</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
            >
              {['suggestion', 'feature_request', 'issue', 'other'].map(type => (
                <option key={type} value={type}>
                  {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF5733] rounded-md hover:bg-[#E64A2E]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Add a function to check if the view exists
  const checkViewExists = async () => {
    try {
      const { data, error } = await supabase.rpc('check_view_exists', {
        view_name: 'feedback_with_metadata'
      });
      
      console.log('View check result:', data, error);
      
      if (error) {
        console.error('Error checking view:', error);
      }
    } catch (err) {
      console.error('Error in view check:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5733] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-none bg-transparent text-gray-700 font-medium focus:ring-0"
            >
              {FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border-none bg-transparent text-gray-700 font-medium focus:ring-0"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={loadFeedbacks}
              className="p-2 text-gray-500 hover:text-[#FF5733] transition-colors"
              title="Refresh feedback"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Cards */}
      {filteredFeedbacks.map((feedback) => (
        <div key={feedback.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                {feedback.avatar_url ? (
                  <img
                    src={feedback.avatar_url}
                    alt={feedback.full_name || 'Anonymous'}
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF5733] to-[#E64A2E] text-white rounded-full flex items-center justify-center font-medium">
                    {feedback.full_name?.charAt(0) || 'A'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {feedback.full_name !== 'Anonymous' 
                        ? feedback.full_name 
                        : 'Anonymous'}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF5733]/10 text-[#FF5733] mt-1">
                    {feedback.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                  <h4 className="mt-2 font-medium text-gray-900">{feedback.title}</h4>
                  <p className="mt-2 text-gray-700">{feedback.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {user?.id === feedback.user_id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingFeedback(feedback.id)}
                      className="p-1 text-gray-400 hover:text-[#FF5733] transition-colors"
                      title="Edit feedback"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(feedback.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete feedback"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleLike(feedback.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-[#FF5733] transition-colors"
                >
                  {feedback.is_upvoted ? (
                    <HandThumbUpSolidIcon className="h-5 w-5 text-[#FF5733]" />
                  ) : (
                    <HandThumbUpIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{feedback.upvotes_count || 0}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveDiscussion(activeDiscussion === feedback.id ? null : feedback.id);
                    if (activeDiscussion !== feedback.id) {
                      loadComments(feedback.id);
                    }
                  }}
                  className="flex items-center gap-1 text-gray-500 hover:text-[#FF5733] transition-colors"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{feedback.comment_count || 0}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {editingFeedback === feedback.id && (
            <EditFeedbackForm
              feedback={feedback}
              onClose={() => setEditingFeedback(null)}
              onUpdate={handleUpdate}
            />
          )}

          {/* Comments Section */}
          {activeDiscussion === feedback.id && (
            <div className="border-t bg-gray-50 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Discussion</h3>
              
              <div className="space-y-4 mb-4">
                {(comments[feedback.id] || []).map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    {comment.avatar_url ? (
                      <img
                        src={comment.avatar_url}
                        alt={comment.full_name || 'Anonymous'}
                        className="w-8 h-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#FF5733] to-[#E64A2E] text-white rounded-full flex items-center justify-center text-sm">
                        {comment.full_name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div className="flex-grow bg-white rounded-lg shadow-sm p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.full_name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id, feedback.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment form - show for all users */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add to the discussion..."
                  className="flex-grow px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-all"
                />
                <button
                  onClick={() => handleComment(feedback.id)}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E] disabled:opacity-50 transition-all font-medium"
                >
                  Comment
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {filteredFeedbacks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-2">
            <ChatBubbleLeftIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No feedback yet</h3>
          <p className="text-gray-500">Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
} 