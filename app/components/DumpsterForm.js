"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
// Import just one icon to test
import { XMarkIcon } from '@heroicons/react/24/outline';

// Temporarily replace other icons with a basic div
const PlaceholderIcon = () => <div className="w-4 h-4" />;

// Use placeholder for other icons
const PhotoIcon = PlaceholderIcon;
const CheckCircleIcon = PlaceholderIcon;
const CurrencyDollarIcon = PlaceholderIcon;
const MapPinIcon = PlaceholderIcon;
const RulerIcon = PlaceholderIcon;
const TagIcon = PlaceholderIcon;
const ListBulletIcon = PlaceholderIcon;

const DUMPSTER_SIZES = [
  { value: '10 yard', label: '10 Yard', description: 'Good for small projects and cleanouts' },
  { value: '15 yard', label: '15 Yard', description: 'Perfect for medium residential projects' },
  { value: '20 yard', label: '20 Yard', description: 'Ideal for construction debris' },
  { value: '30 yard', label: '30 Yard', description: 'Great for large renovations' },
  { value: '40 yard', label: '40 Yard', description: 'Best for major construction projects' }
];

const COMMON_FEATURES = [
  { id: 'door', label: 'Door opening', icon: '🚪' },
  { id: 'wheels', label: 'Wheels', icon: '⚙️' },
  { id: 'cover', label: 'Cover', icon: '🔒' },
  { id: 'lockable', label: 'Lockable', icon: '🔑' },
  { id: 'residential', label: 'Residential friendly', icon: '🏠' },
  { id: 'sameday', label: 'Same day delivery', icon: '⚡' },
  { id: 'weekend', label: 'Weekend delivery', icon: '📅' }
];

export default function DumpsterForm({ onSuccess }) {
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

        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload the file
        const { error: uploadError, data } = await supabase.storage
          .from('dumpster-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('dumpster-images')
          .getPublicUrl(filePath);

        return filePath;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedPaths]
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to list a dumpster');

      const newDumpster = {
        ...formData,
        owner_id: user.id,
        daily_rate: parseFloat(formData.daily_rate),
        availability_status: 'available'
      };

      const { error: submitError } = await supabase
        .from('dumpster_rentals')
        .insert([newDumpster]);

      if (submitError) throw submitError;

      onSuccess?.();
      setFormData({
        title: '',
        description: '',
        size: '',
        daily_rate: '',
        location: '',
        features: [],
        images: []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-64">
        {formData.images.length > 0 ? (
          <img
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dumpster-images/${formData.images[0]}`}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-[#FF5733] text-white px-3 py-1 rounded-full text-sm font-medium">
          ${formData.daily_rate}/day
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{formData.title || 'Your Dumpster Title'}</h3>
        <div className="mt-2 flex items-center text-gray-500">
          <MapPinIcon className="h-4 w-4 mr-1" />
          <span>{formData.location || 'Location'}</span>
        </div>
        <p className="mt-4 text-gray-600">{formData.description || 'Dumpster description will appear here'}</p>
        {formData.features.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
            <div className="flex flex-wrap gap-2">
              {formData.features.map(feature => (
                <span key={feature} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {COMMON_FEATURES.find(f => f.label === feature)?.icon} {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">List Your Dumpster</h2>
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
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <TagIcon className="h-4 w-4 mr-1" />
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733] transition-all"
                  placeholder="e.g., Clean 20 Yard Roll-Off Dumpster"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <ListBulletIcon className="h-4 w-4 mr-1" />
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733] transition-all"
                  placeholder="Describe your dumpster, rental terms, and any special requirements..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <RulerIcon className="h-4 w-4 mr-1" />
                    Size
                  </label>
                  <select
                    required
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733] transition-all"
                  >
                    <option value="">Select size</option>
                    {DUMPSTER_SIZES.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label} - {size.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Daily Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, daily_rate: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733] transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733] transition-all"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Features
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {COMMON_FEATURES.map(feature => (
                    <label
                      key={feature.id}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.features.includes(feature.label)
                          ? 'border-[#FF5733] bg-[#FF5733]/5'
                          : 'border-gray-200 hover:border-[#FF5733]/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.label)}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            features: e.target.checked
                              ? [...prev.features, feature.label]
                              : prev.features.filter(f => f !== feature.label)
                          }));
                        }}
                        className="sr-only"
                      />
                      <span className="mr-2">{feature.icon}</span>
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <PhotoIcon className="h-4 w-4 mr-1" />
                  Images
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#FF5733] transition-colors">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-[#FF5733] hover:text-[#E64A2E] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#FF5733]">
                        <span>Upload images</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB (max 5 images)
                    </p>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((path, index) => (
                      <div key={path} className="relative group">
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dumpster-images/${path}`}
                          alt={`Dumpster image ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images.filter(img => img !== path)
                            }));
                          }}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || uploading}
              className="w-full bg-gradient-to-r from-[#FF5733] to-[#E64A2E] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Listing...
                </div>
              ) : (
                'List Dumpster'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 