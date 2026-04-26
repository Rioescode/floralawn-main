"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import PostComments from './PostComments';

const CreatePostForm = ({ onClose, onPostCreated, currentUser }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [rating, setRating] = useState(5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const { error } = await supabase.from('posts').insert([
        {
          title,
          content,
          type,
          rating: type === 'recommendation' ? rating : null,
          user_id: currentUser.id
        }
      ]);

      if (error) throw error;

      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Create Post</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Post Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="general">General Discussion</option>
              <option value="job-update">Job Update</option>
              <option value="recommendation">Recommendation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Enter your post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="What's on your mind?"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF5733] text-white py-2 px-4 rounded-lg hover:bg-[#E64A2E] disabled:opacity-50"
          >
            Create Post
          </button>
        </form>
      </div>
    </div>
  );
};

const EditPostForm = ({ post, onClose, onPostUpdated, currentUser }) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [type, setType] = useState(post.type);
  const [rating, setRating] = useState(post.rating || 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({
          title,
          content,
          type,
          rating: type === 'recommendation' ? rating : null,
          updated_at: new Date()
        })
        .eq('id', post.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      onPostUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Edit Post</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Post Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="general">General Discussion</option>
              <option value="job-update">Job Update</option>
              <option value="recommendation">Recommendation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Enter your post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="What's on your mind?"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF5733] text-white py-2 px-4 rounded-lg hover:bg-[#E64A2E] disabled:opacity-50"
          >
            Update Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default function PostList({ posts, onPostUpdated, currentUser }) {
  const [expandedPost, setExpandedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const postTypes = [
    { value: 'all', label: 'All Posts' },
    { value: 'general', label: 'General Discussion' },
    { value: 'job-update', label: 'Job Updates' },
    { value: 'recommendation', label: 'Recommendations' }
  ];

  const filteredPosts = selectedType === 'all' 
    ? posts 
    : posts.filter(post => post.type === selectedType);

  const handleLike = async (postId) => {
    if (!currentUser) return;

    try {
      const { data: existingLike } = await supabase
        .from('community_reactions')
        .select()
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .eq('reaction_type', 'like')
        .single();

      if (existingLike) {
        // Unlike the post
        await supabase
          .from('community_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id)
          .eq('reaction_type', 'like');

        // Update local state
        onPostUpdated(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  reaction_count: Math.max(0, post.reaction_count - 1),
                  is_liked: false 
                }
              : post
          )
        );
      } else {
        // Like the post
        await supabase
          .from('community_reactions')
          .insert([{
            post_id: postId,
            user_id: currentUser.id,
            reaction_type: 'like'
          }]);

        // Update local state
        onPostUpdated(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  reaction_count: (post.reaction_count || 0) + 1,
                  is_liked: true 
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
    }
  };

  const handleDelete = async (postId) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      onPostUpdated();
    } catch (error) {
      console.error('Error deleting post:', error);
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

  const getPostTypeColor = (type) => {
    switch (type) {
      case 'job-update':
        return 'bg-blue-100 text-blue-800';
      case 'recommendation':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case 'job-update':
        return 'Job Update';
      case 'recommendation':
        return 'Recommendation';
      default:
        return 'General';
    }
  };

  const StarDisplay = ({ rating }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const ImageModal = ({ url, onClose }) => (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-xl p-2"
      >
        ✕
      </button>
      <img
        src={url}
        alt="Full size"
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );

  const ImageGrid = ({ images }) => {
    if (!images || images.length === 0) return null;

    const getGridClass = () => {
      switch (images.length) {
        case 1:
          return "grid-cols-1 aspect-[16/9]";
        case 2:
          return "grid-cols-2 aspect-[16/9]";
        default:
          return "grid-cols-2 grid-rows-2 aspect-square";
      }
    };

    const getImageClass = (index) => {
      if (images.length === 1) return "aspect-[16/9] w-full h-full object-cover rounded-lg cursor-pointer";
      if (images.length === 2) return "aspect-[4/3] w-full h-full object-cover rounded-lg cursor-pointer";
      if (images.length === 3 && index === 0) return "col-span-2 aspect-[16/9] w-full h-full object-cover rounded-lg cursor-pointer";
      return "aspect-square w-full h-full object-cover rounded-lg cursor-pointer";
    };

    return (
      <div className={`grid gap-1 ${getGridClass()} max-h-[500px] overflow-hidden`}>
        {images.map((url, index) => (
          index < 4 ? (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className={getImageClass(index)}
                onClick={() => setSelectedImage(url)}
              />
              {index === 3 && images.length > 4 && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg cursor-pointer"
                  onClick={() => setSelectedImage(images[3])}
                >
                  <span className="text-white text-xl font-semibold">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ) : null
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-20">
      {/* Floating Create Post Button */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-6 right-6 bg-[#FF5733] text-white rounded-full p-4 shadow-lg hover:bg-[#E64A2E] transition-colors z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showCreatePost && (
        <CreatePostForm
          onClose={() => setShowCreatePost(false)}
          onPostCreated={onPostUpdated}
          currentUser={currentUser}
        />
      )}

      {editingPost && (
        <EditPostForm
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onPostUpdated={onPostUpdated}
          currentUser={currentUser}
        />
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {postTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedType === type.value
                ? 'bg-[#FF5733] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {selectedImage && (
        <ImageModal url={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      {filteredPosts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {selectedType !== 'all' ? getPostTypeLabel(selectedType).toLowerCase() : ''} posts found
        </div>
      ) : (
        filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {post.avatar_url ? (
                      <img
                        src={post.avatar_url}
                        alt={post.display_name || post.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#FF5733] text-white rounded-full flex items-center justify-center">
                        {(post.display_name || post.full_name)?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {post.display_name || post.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
                      {getPostTypeLabel(post.type)}
                    </span>
                    {currentUser && post.user_id === currentUser.id && (
                      <>
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-1 text-gray-400 hover:text-[#FF5733] transition-colors"
                          title="Edit post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {post.type === 'recommendation' && post.rating && (
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={post.rating} />
                    </div>
                  )}
                </div>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-gray-900">{post.title}</h3>
              
              <div className="mt-2">
                <p className={`text-gray-600 ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                  {post.content}
                </p>
                {post.content.length > 200 && (
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="mt-2 text-[#FF5733] hover:text-[#E64A2E] text-sm font-medium"
                  >
                    {expandedPost === post.id ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {post.image_urls && post.image_urls.length > 0 && (
                <div className="mt-4">
                  <ImageGrid images={post.image_urls} />
                </div>
              )}

              <div className="mt-6 flex items-center space-x-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    post.is_liked ? 'text-[#FF5733]' : 'text-gray-500 hover:text-[#FF5733]'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${post.is_liked ? 'fill-current' : 'stroke-current fill-none'}`}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{post.reaction_count || 0}</span>
                </button>

                <button
                  onClick={() => {
                    setShowComments(!showComments);
                    setExpandedPost(post.id);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#FF5733] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{post.comment_count || 0}</span>
                </button>
              </div>
              
              {showComments && expandedPost === post.id && (
                <div className="mt-4">
                  <PostComments postId={post.id} currentUser={currentUser} />
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}