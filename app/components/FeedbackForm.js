"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PaintBrushIcon, 
  SparklesIcon, 
  BugAntIcon, 
  CurrencyDollarIcon, 
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const categories = [
  { value: 'suggestion', label: 'Suggestion', icon: <PaintBrushIcon className="h-5 w-5" /> },
  { value: 'feature_request', label: 'Feature Request', icon: <SparklesIcon className="h-5 w-5" /> },
  { value: 'issue', label: 'Issue Report', icon: <BugAntIcon className="h-5 w-5" /> },
  { value: 'other', label: 'Other', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> }
];

export default function FeedbackForm() {
  const [formData, setFormData] = useState({
    category: '',
    feedback: '',
    email: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // First try to get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Require authentication
      if (!user) {
        setError('Please sign in to submit feedback');
        setIsLoading(false);
        return;
      }
      
      let feedbackData = {
        type: formData.category,
        title: formData.name || 'Feedback',
        description: formData.feedback.trim(),
        is_public: true,
        user_id: user.id
      };

      const { error: submitError } = await supabase
        .from('feedback')
        .insert([feedbackData]);

      if (submitError) throw submitError;

      setSuccess(true);
      setFormData({ category: '', feedback: '', email: '', name: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-[#FF5733] to-[#E64A2E] p-1 rounded-xl shadow-xl">
        <div className="bg-white p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Thoughts</h2>
          <p className="text-gray-600 mb-6">Help us make RIJunkworks better for everyone</p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Thank you for your feedback! We'll review it carefully.
            </div>
          )}

          {!user ? (
            <div className="text-center py-8">
              <div className="mb-4 text-gray-600">
                <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to submit feedback</h3>
              <p className="text-gray-600 mb-6">Your feedback helps us improve RIJunkworks for everyone.</p>
              <div className="flex justify-center gap-4">
                <Link 
                  href="/marketplace?login=true"
                  className="px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/marketplace?register=true"
                  className="px-4 py-2 border border-[#FF5733] text-[#FF5733] rounded-lg hover:bg-[#FF5733]/5 transition-all"
                >
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-all"
                    placeholder="John Doe"
                    required={!formData.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-all"
                    placeholder="john@example.com"
                    required={!formData.name}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                        formData.category === cat.value
                          ? 'border-[#FF5733] bg-[#FF5733]/5 text-[#FF5733]'
                          : 'border-gray-200 hover:border-[#FF5733]/50'
                      }`}
                    >
                      {cat.icon}
                      <span className="text-xs mt-1">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Feedback
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5733] focus:border-transparent transition-all"
                  rows="6"
                  placeholder="Share your ideas, suggestions, or report issues..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#FF5733] to-[#E64A2E] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 