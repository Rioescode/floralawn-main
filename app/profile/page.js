"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Toast from '@/app/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        setUser(user);
        setProfileData({
          full_name: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone || '',
          address: profile.address || ''
        });
        
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };
    
    getUser();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({
        show: true,
        message: 'Image is too large. Maximum size is 5MB.',
        type: 'error'
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setToast({
        show: true,
        message: 'Please upload an image file.',
        type: 'error'
      });
      return;
    }
    
    setAvatar(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      // Log the profile data being saved
      console.log('Saving profile data:', profileData);
      
      // First handle avatar upload if there's a new one
      let newAvatarUrl = avatarUrl;
      
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        console.log('Uploading avatar:', { fileName, filePath, fileSize: avatar.size });
        
        // Upload the file to storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          throw new Error('Failed to upload profile picture. ' + uploadError.message);
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        newAvatarUrl = publicUrl;
        console.log('Avatar uploaded successfully:', newAvatarUrl);
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update profile information. ' + updateError.message);
      }
      
      setAvatarUrl(newAvatarUrl);
      setAvatar(null);
      
      setToast({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Profile update error:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
      
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-[#22C55E]"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-[#22C55E] px-6 py-4">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Avatar */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {(avatarPreview || avatarUrl) ? (
                  <img 
                    src={avatarPreview || avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.full_name)}&background=22C55E&color=fff`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[#22C55E] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#22C55E]/90 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Click the camera icon to change your profile picture</p>
          </div>
          
          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E]"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={profileData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E]"
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={updating}
                className={`w-full bg-[#22C55E] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#22C55E]/90 transition-colors ${
                  updating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 