'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { sendNotification } from '@/lib/notifications';

export default function CustomerSupport() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('support');
  const [uploading, setUploading] = useState(false);
  const [complaint, setComplaint] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchProfile(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('support_requests')
        .insert([{
          customer_id: user.id,
          customer_name: profile.full_name,
          customer_email: user.email,
          subject: complaint.subject,
          description: complaint.description,
          priority: complaint.priority,
          status: 'pending'
        }]);

      if (error) throw error;

      // Send Telegram notification
      const notificationMessage = `🚨 New Customer Support Request!\n\n` +
        `👤 Customer: ${profile.full_name}\n` +
        `📧 Email: ${user.email}\n` +
        `📞 Phone: ${profile.phone}\n\n` +
        `📝 Subject: ${complaint.subject}\n` +
        `📋 Description: ${complaint.description}\n` +
        `⚠️ Priority: ${complaint.priority}\n\n` +
        `⚡ Action Required: Please review and respond to this request.`;

      await sendNotification(notificationMessage);

      // Clear form
      setComplaint({
        subject: '',
        description: '',
        priority: 'medium'
      });

      // Clear photos
      setPhotos([]);

      // Show success message
      setSuccess('Support request submitted successfully! Our team will get back to you soon.');
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting support request:', error);
      setError('Failed to submit support request');
    }
  };

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('property_photos')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setError('Failed to load photos');
    }
  };

  const handlePhotoUpload = async (e) => {
    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath);

      // Save to property_photos table
      const { error: insertError } = await supabase
        .from('property_photos')
        .insert([{
          customer_id: user.id,
          photo_url: publicUrl,
          description: 'Property photo'
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message);
      }

      setSuccess('Photo uploaded successfully');
      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId, photoUrl) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      setError('');
      setSuccess('');

      // Extract file path from URL
      const filePath = photoUrl.split('/').pop();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-photos')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        throw new Error(storageError.message);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(dbError.message);
      }

      setSuccess('Photo deleted successfully');
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError(error.message || 'Failed to delete photo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'support'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Support & Help
                </button>
              </nav>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="fixed top-20 right-4 z-50 animate-fade-in">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{success}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Need Help?</h3>
                  <p className="text-blue-700">
                    Our support team is here to help you with any questions or concerns. 
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <form onSubmit={handleComplaintSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-gray-800">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={complaint.subject}
                          onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })}
                          placeholder="What do you need help with?"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-gray-800">
                          Description
                        </label>
                        <textarea
                          value={complaint.description}
                          onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
                          placeholder="Please provide details about your request..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all min-h-[150px]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-gray-800">
                          Priority
                        </label>
                        <select
                          value={complaint.priority}
                          onChange={(e) => setComplaint({ ...complaint, priority: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        >
                          <option value="low">Low - Not Urgent</option>
                          <option value="medium">Medium - Standard</option>
                          <option value="high">High - Urgent</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Submit Request
                      </button>
                    </form>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">Upload Photos</h3>
                      <p className="text-blue-700">
                        Upload photos of your property or specific areas you'd like us to work on. 
                        This helps us better understand your needs and provide accurate quotes.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        {uploading && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.photo_url}
                              alt="Property"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => window.open(photo.photo_url, '_blank')}
                                  className="text-white text-sm font-medium hover:text-green-400 transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                                  className="text-white text-sm font-medium hover:text-red-400 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 