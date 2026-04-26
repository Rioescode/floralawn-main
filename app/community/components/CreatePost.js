"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreatePost({ onClose, onPostCreated, user }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general', // general, job-update, recommendation
    rating: 5, // Default rating
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const postTypes = [
    { value: 'general', label: 'General Discussion' },
    { value: 'job-update', label: 'Job Update' },
    { value: 'recommendation', label: 'Recommendation' }
  ];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('Please sign in to create a post');
      }

      const newPost = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        rating: formData.type === 'recommendation' ? formData.rating : null,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      // First insert the post
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .insert([newPost])
        .select()
        .single();

      if (postError) throw postError;

      // Then fetch the user data separately
      const { data: userData } = await supabase.auth.getUser();

      // Combine the data to match the view structure
      const combinedData = {
        ...postData,
        display_name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || userData.user.email || 'Anonymous',
        avatar_url: userData.user.user_metadata?.avatar_url || ''
      };

      onPostCreated(combinedData);
    } catch (err) {
      console.error('Post submission error:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = ({ value, onChange }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <svg
              className={`w-8 h-8 ${
                star <= value
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          ✕
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Create Post</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post Type
              </label>
              <select
                required
                name="type"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={formData.type}
                onChange={handleFormChange}
              >
                {postTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.type === 'recommendation' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <StarRating
                  value={formData.rating}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, rating: value }))
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                name="title"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Enter your post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                required
                name="content"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={formData.content}
                onChange={handleFormChange}
                rows="4"
                placeholder="Share your thoughts, updates, or recommendations..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#FF5733] text-white px-4 py-2 rounded-md hover:bg-[#E64A2E] disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 