'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function ProfessionalRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    logo_url: '',
    services: [],
    years_experience: '',
    license_number: '',
    insurance_info: '',
    service_area: [],
    website_url: '',
    social_media: {
      facebook: '',
      instagram: '',
      linkedin: ''
    },
    contact_email: '',
    contact_phone: '',
    business_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '', close: '' }
    },
    owner_full_name: '',
    owner_phone: '',
    equipment_photos: { photos: [] }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim())
    }));
  };

  const handleLogoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload an image file (JPG, PNG, or GIF)');
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      setLoading(true);

      // Create a unique file name
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to business-logos bucket
      const { error: uploadError, data } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      // Show preview
      const previewContainer = document.getElementById('logo-preview');
      if (previewContainer) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'w-32 h-32 object-cover rounded-lg';
        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Error uploading logo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentPhotoUpload = async (e) => {
    try {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setLoading(true);

      const uploadedPhotos = await Promise.all(files.map(async (file) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Please upload image files only (JPG, PNG, or GIF)');
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error('File size must be less than 5MB');
        }

        // Create unique filename
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `equipment-${timestamp}.${fileExt}`;

        // Upload to equipment-photos bucket
        const { error: uploadError, data } = await supabase.storage
          .from('equipment-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('equipment-photos')
          .getPublicUrl(fileName);

        return {
          url: publicUrl,
          name: file.name
        };
      }));

      setFormData(prev => ({
        ...prev,
        equipment_photos: {
          photos: [...prev.equipment_photos.photos, ...uploadedPhotos]
        }
      }));

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Error uploading photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('professional_profiles')
          .select(`
            *,
            profile:profiles!profile_id (
              full_name,
              avatar_url,
              email
            )
          `)
          .eq('profile_id', user.id)
          .single();

        if (profile) {
          setFormData({
            business_name: profile.business_name || '',
            description: profile.business_description || '',
            logo_url: profile.logo_url || '',
            services: profile.services || [],
            years_experience: profile.years_experience || '',
            license_number: profile.license_number || '',
            insurance_info: profile.insurance_info || '',
            service_area: profile.service_area || [],
            website_url: profile.website_url || '',
            social_media: profile.social_media || {
              facebook: '',
              instagram: '',
              linkedin: ''
            },
            contact_email: profile.contact_email || profile.profile?.email || '',
            contact_phone: profile.contact_phone || '',
            business_hours: profile.business_hours || {
              monday: { open: '09:00', close: '17:00' },
              tuesday: { open: '09:00', close: '17:00' },
              wednesday: { open: '09:00', close: '17:00' },
              thursday: { open: '09:00', close: '17:00' },
              friday: { open: '09:00', close: '17:00' },
              saturday: { open: '09:00', close: '17:00' },
              sunday: { open: '', close: '' }
            },
            equipment_photos: profile.equipment_photos || { photos: [] }
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load existing profile data');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your business profile? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Delete the business logo from storage if it exists
      if (formData.logo_url) {
        try {
          const fileName = formData.logo_url.split('/').pop();
          const { error: storageError } = await supabase.storage
            .from('business-logos')
            .remove([fileName]);
          
          if (storageError) {
            console.error('Error deleting logo:', storageError);
            // Continue with profile deletion even if logo deletion fails
          }
        } catch (storageErr) {
          console.error('Storage error:', storageErr);
          // Continue with profile deletion even if logo deletion fails
        }
      }

      // Delete the business profile
      const { error: deleteError } = await supabase
        .from('business_profiles')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(deleteError.message || 'Failed to delete profile');
      }

      // Clear form data and existing profile
      setFormData({
        business_name: '',
        description: '',
        logo_url: '',
        services: [],
        years_experience: '',
        license_number: '',
        insurance_info: '',
        service_area: [],
        website_url: '',
        social_media: { facebook: '', instagram: '', linkedin: '' },
        contact_email: '',
        contact_phone: '',
        business_hours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '09:00', close: '17:00' },
          sunday: { open: '', close: '' }
        },
        owner_full_name: '',
        owner_phone: '',
        equipment_photos: { photos: [] }
      });
      setExistingProfile(null);

      alert('Business profile deleted successfully');
      router.push('/marketplace');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate years_experience is a number
      const formDataToSubmit = {
        business_name: formData.business_name,
        description: formData.description,
        logo_url: formData.logo_url,
        services: formData.services,
        years_experience: formData.years_experience === '' ? 0 : parseInt(formData.years_experience, 10),
        license_number: formData.license_number,
        insurance_info: formData.insurance_info,
        service_area: formData.service_area,
        website_url: formData.website_url,
        social_media: formData.social_media,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        business_hours: formData.business_hours,
        equipment_photos: formData.equipment_photos,
        updated_at: new Date().toISOString()
      };

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      // Check if user already has a business profile
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // If profile exists, update it
        const { error: updateError } = await supabase
          .from('business_profiles')
          .update(formDataToSubmit)
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;
      } else {
        // If no profile exists, insert new one
        const { error: insertError } = await supabase
          .from('business_profiles')
          .insert([{
            ...formDataToSubmit,
            user_id: user.id
          }]);

        if (insertError) throw insertError;
      }

      router.push('/marketplace');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formData.business_name ? 'Update Your Profile' : 'Complete Your Profile'}
            </h1>
            <p className="text-gray-600">
              {formData.business_name 
                ? 'Update your profile information to attract more customers'
                : 'Complete your profile to start receiving job requests'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    s <= step
                      ? 'bg-[#FF5733] text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-[#FF5733]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      required
                      value={formData.business_name}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Description *
                    </label>
                    <textarea
                      name="description"
                      required
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Logo
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full"
                      />
                      <div id="logo-preview" className="mt-2">
                        {formData.logo_url && (
                          <img 
                            src={formData.logo_url} 
                            alt="Logo preview" 
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Accepted formats: JPG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      name="years_experience"
                      required
                      min="0"
                      value={formData.years_experience}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow non-negative numbers or empty string
                        if (value === '' || (parseInt(value) >= 0)) {
                          handleChange(e);
                        }
                      }}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipment Photos *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEquipmentPhotoUpload}
                        className="w-full"
                      />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.equipment_photos.photos.map((photo, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={photo.url}
                              alt={`Equipment ${index + 1}`}
                              layout="fill"
                              objectFit="cover"
                            />
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  equipment_photos: {
                                    photos: prev.equipment_photos.photos.filter((_, i) => i !== index)
                                  }
                                }));
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        Upload photos of your equipment (trucks, dumpsters, etc.)
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Services Offered *
                    </label>
                    <input
                      type="text"
                      value={formData.services.join(', ')}
                      onChange={(e) => handleArrayChange('services', e.target.value)}
                      placeholder="e.g. Junk Removal, Estate Cleanout, Construction Debris"
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Areas *
                    </label>
                    <input
                      type="text"
                      value={formData.service_area.join(', ')}
                      onChange={(e) => handleArrayChange('service_area', e.target.value)}
                      placeholder="e.g. Providence, Warwick, Cranston"
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Information
                    </label>
                    <textarea
                      name="insurance_info"
                      value={formData.insurance_info}
                      onChange={handleChange}
                      rows="3"
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      required
                      value={formData.contact_email}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      required
                      value={formData.contact_phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Social Media
                    </label>
                    <input
                      type="url"
                      name="social_media.facebook"
                      placeholder="Facebook URL"
                      value={formData.social_media.facebook}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                    <input
                      type="url"
                      name="social_media.instagram"
                      placeholder="Instagram URL"
                      value={formData.social_media.instagram}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                    <input
                      type="url"
                      name="social_media.linkedin"
                      placeholder="LinkedIn URL"
                      value={formData.social_media.linkedin}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="bg-[#FF5733] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#FF5733]/90 transition-colors ml-auto"
                >
                  Next
                </button>
              ) : (
                <div className="flex gap-4 ml-auto">
                  {existingProfile && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="bg-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : 'Delete Profile'}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF5733] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#FF5733]/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (existingProfile ? 'Update Profile' : 'Complete Registration')}
                  </button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 