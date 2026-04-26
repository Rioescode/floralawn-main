"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { XMarkIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function DumpsterForm({ onSuccess, dumpster = null }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    size: '',
    daily_rate: '',
    location: '',
    features: [],
    images: []
  });
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(!user);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Load existing dumpster data if editing
  useEffect(() => {
    if (dumpster) {
      setFormData({
        title: dumpster.title || '',
        description: dumpster.description || '',
        size: dumpster.size || '',
        daily_rate: dumpster.daily_rate?.toString() || '',
        location: dumpster.location || '',
        features: dumpster.features || [],
        images: dumpster.images || []
      });
    }
  }, [dumpster]);

  // If not authenticated, show login/register forms
  if (!user) {
    if (showRegisterForm) {
      return (
        <RegisterForm 
          onClose={() => setShowRegisterForm(false)}
        />
      );
    }
    
    return (
      <LoginForm 
        onClose={() => setShowLoginForm(false)}
        onShowRegister={() => {
          setShowLoginForm(false);
          setShowRegisterForm(true);
        }}
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (dumpster) {
        // Update existing dumpster
        const { data, error: updateError } = await supabase.rpc('update_dumpster', {
          p_dumpster_id: dumpster.id,
          p_owner_id: user.id,
          p_title: formData.title,
          p_description: formData.description,
          p_size: formData.size,
          p_daily_rate: parseFloat(formData.daily_rate),
          p_location: formData.location,
          p_features: formData.features,
          p_images: formData.images
        });

        if (updateError) throw updateError;
      } else {
        // Create new dumpster
        const { error: submitError } = await supabase
          .from('dumpster_rentals')
          .insert([{
            ...formData,
            owner_id: user.id,
            daily_rate: parseFloat(formData.daily_rate),
            availability_status: 'available'
          }]);

        if (submitError) throw submitError;
      }

      onSuccess?.();
      if (!dumpster) {
        // Only clear form for new listings
        setFormData({
          title: '',
          description: '',
          size: '',
          daily_rate: '',
          location: '',
          features: [],
          images: []
        });
      }
    } catch (err) {
      console.error('Error submitting dumpster:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('dumpster_rentals')
        .delete()
        .eq('id', dumpster.id)
        .eq('owner_id', user.id);

      if (deleteError) throw deleteError;

      // Delete associated images from storage
      for (const image of formData.images) {
        await supabase.storage
          .from('dumpster-images')
          .remove([image])
          .catch(console.error); // Don't block on image deletion errors
      }

      onSuccess?.();
    } catch (err) {
      console.error('Error deleting dumpster:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const files = Array.from(event.target.files);

      if (files.length > 5) {
        throw new Error('Maximum 5 images allowed');
      }

      const uploadPromises = files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Each image must be less than 5MB');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('dumpster-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        return filePath;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedPaths]
      }));
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = () => {
    return (
      <div className="space-y-6">
        {/* Image Preview */}
        <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
          {formData.images.length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dumpster-images/${formData.images[0]}`}
              alt={formData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No images uploaded
            </div>
          )}
          <div className="absolute top-2 right-2 bg-[#FF5733] text-white px-3 py-1 rounded-full text-sm font-medium">
            ${formData.daily_rate}/day
          </div>
        </div>

        {/* Listing Details */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{formData.title || 'Untitled Listing'}</h3>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <MapPinIcon className="h-4 w-4" />
            <span className="text-sm">{formData.location || 'No location set'}</span>
          </div>
        </div>

        <p className="text-gray-600">{formData.description || 'No description provided'}</p>

        {/* Features */}
        {formData.features.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  <CheckCircleIcon className="h-3 w-3" />
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {formData.size || 'Size not specified'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {dumpster ? 'Edit Dumpster Listing' : 'List Your Dumpster'}
          </h2>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-sm text-[#FF5733] hover:text-[#E64A2E]"
          >
            {preview ? 'Edit Listing' : 'Preview'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <XMarkIcon className="h-5 w-5" />
            {error}
          </div>
        )}

        {preview ? (
          renderPreview()
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                placeholder="Enter a descriptive title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                placeholder="Describe your dumpster and any special features"
              />
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Size</label>
              <select
                required
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
              >
                <option value="">Select a size</option>
                <option value="10 Yard">10 Yard</option>
                <option value="20 Yard">20 Yard</option>
                <option value="30 Yard">30 Yard</option>
                <option value="40 Yard">40 Yard</option>
              </select>
            </div>

            {/* Daily Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Daily Rate ($)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, daily_rate: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                placeholder="Enter daily rental rate"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                placeholder="Enter pickup/delivery location"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Features (comma-separated)</label>
              <input
                type="text"
                value={formData.features.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  features: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
                placeholder="e.g., Wheels, Easy Loading, Residential Friendly"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="mt-1 block w-full"
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-2 text-sm text-gray-500">
                  Uploading images...
                </div>
              )}
              {formData.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dumpster-images/${image}`}
                        alt={`Preview ${index + 1}`}
                        className="h-20 w-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || uploading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF5733] to-[#E64A2E] hover:shadow-lg disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {dumpster ? 'Updating...' : 'Listing...'}
                  </div>
                ) : (
                  dumpster ? 'Update Dumpster' : 'List Dumpster'
                )}
              </button>

              {dumpster && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 