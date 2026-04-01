"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import WaiverCheckbox from '@/app/components/WaiverCheckbox';
import ProfessionalProfileModal from './ProfessionalProfileModal';
import JobCard from './JobCard';
import Toast from '@/app/components/Toast';
import CustomerJobCalendar from '@/app/components/CustomerJobCalendar';

export default function CustomerDashboard({ user: initialUser }) {
  // Update the initial state to show jobs section by default
  const [activeTab, setActiveTab] = useState('jobs');
  const [activeSection, setActiveSection] = useState('active');
  const [user, setUser] = useState(initialUser || {});
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    budget: '',
    date_needed: '',
    location: '',
    property_size: '',
    service_type: 'lawn_mowing',
    lawn_condition: 'normal',
    service_frequency: 'one_time',
    special_equipment: '',
    existing_issues: '',
    share_contact_info: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [jobPhotos, setJobPhotos] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [timeSuggestions, setTimeSuggestions] = useState({});

  const tabs = [
    { id: 'jobs', label: 'My Jobs' },
    { id: 'profile', label: 'My Profile' },
    { id: 'calendar', label: 'Calendar' }
  ];

  useEffect(() => {
    if (user && user.id) {
      loadUserProfile();
      loadJobs();
    }
  }, [user?.id]);

  useEffect(() => {
    loadJobs();

    // Subscribe to job updates
    const jobsSubscription = supabase
      .channel('jobs-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Job update received:', payload);
          // Only reload if it's not a date_needed update (which we handle locally)
          if (!payload.new || !payload.old || payload.new.date_needed === payload.old.date_needed) {
            loadJobs();
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      jobsSubscription.unsubscribe();
    };
  }, [user.id]);

  useEffect(() => {
    if (user) {
      console.log('Current user state:', user);
      console.log('User address:', user.address);
      console.log('Current job location:', newJob.location);
    }
  }, [user, newJob.location]);

  useEffect(() => {
    console.log('Initial user prop:', initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (jobs.length > 0) {
      jobs.forEach(job => loadTimeSuggestions(job.id));
    }
  }, [jobs]);

  // Add this after loading time suggestions
  useEffect(() => {
    console.log('Time Suggestions State:', timeSuggestions);
  }, [timeSuggestions]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          bids (
            id,
            amount,
            message,
            status,
            created_at,
            professional:profiles!professional_id (
              id,
              full_name,
              avatar_url,
              professional_profile:professional_profiles!inner (
                business_name,
                business_description,
                years_experience,
                contact_email,
                contact_phone,
                website_url,
                insurance_info,
                license_number,
                logo_url,
                service_area
              )
            )
          ),
          time_suggestions (
            id,
            suggested_date,
            suggested_time,
            message,
            status,
            professional:profiles!professional_id (
              id,
              full_name
            )
          ),
          professional:profiles!professional_id (
            id,
            full_name,
            avatar_url,
            professional_profile:professional_profiles!inner (
              business_name,
              business_description,
              years_experience,
              contact_email,
              contact_phone,
              website_url,
              insurance_info,
              license_number,
              logo_url,
              service_area
            )
          ),
          job_photos (
            id,
            photo_url
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Loaded jobs with time suggestions:', jobs);
      setJobs(jobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (jobPhotos.length + files.length > 5) {
      setToast({
        show: true,
        message: 'Maximum 5 photos allowed',
        type: 'error'
      });
      return;
    }

    setUploadingPhotos(true);
    const newPhotos = [...jobPhotos];

    for (const file of files) {
      try {
        const preview = URL.createObjectURL(file);
        newPhotos.push({
          file,
          preview,
          uploading: true
        });
      } catch (err) {
        console.error('Error creating preview:', err);
      }
    }

    setJobPhotos(newPhotos);
    setUploadingPhotos(false);
  };

  const removePhoto = (index) => {
    const newPhotos = [...jobPhotos];
    if (newPhotos[index].preview) {
      URL.revokeObjectURL(newPhotos[index].preview);
    }
    newPhotos.splice(index, 1);
    setJobPhotos(newPhotos);
  };

  const resetForm = () => {
    setNewJob({
      title: '',
      description: '',
      budget: '',
      date_needed: '',
      location: user?.address || '',
      property_size: '',
      service_type: 'lawn_mowing',
      lawn_condition: 'normal',
      service_frequency: 'one_time',
      special_equipment: '',
      existing_issues: '',
      share_contact_info: false
    });
    setJobPhotos([]);
  };

  // Add a function to check if photos are required for the service type
  const isPhotoRequired = (serviceType) => {
    const requiresPhoto = [
      'lawn_mowing',
      'hedge_trimming',
      'garden_maintenance',
      'landscaping_design',
      'tree_service',
      'leaf_removal'
    ];
    return requiresPhoto.includes(serviceType);
  };

  // Update the handleSubmit function
  const handlePostJob = async (e) => {
    e.preventDefault();
    
    if (submitLoading) return; // Prevent double submission
    
    try {
      setSubmitLoading(true); // Use specific loading state
      console.log('Starting job post process...');

      // Validate required fields first
      const requiredFields = {
        title: 'Job Title',
        description: 'Description',
        budget: 'Budget',
        date_needed: 'Date Needed',
        location: 'Location'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !newJob[key])
        .map(([, label]) => label);

      if (missingFields.length > 0) {
        throw new Error(`Please fill in: ${missingFields.join(', ')}`);
      }

      // Format job data
      const jobPayload = {
        ...newJob,
        customer_id: user.id,
        budget: parseFloat(newJob.budget),
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert job with timeout
      const jobPromise = supabase
        .from('jobs')
        .insert([jobPayload])
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );

      const { data: jobData, error: jobError } = await Promise.race([
        jobPromise,
        timeoutPromise
      ]);

      if (jobError) throw jobError;

      // Handle photo uploads in parallel if any exist
      if (jobPhotos.length > 0) {
        const chunkSize = 2; // Upload 2 photos at a time
        const photoChunks = [];
        
        for (let i = 0; i < jobPhotos.length; i += chunkSize) {
          photoChunks.push(jobPhotos.slice(i, i + chunkSize));
        }

        for (const chunk of photoChunks) {
          await Promise.all(
            chunk.map(async (photo) => {
              try {
                const file = photo.file;
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${jobData.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `${user.id}/${jobData.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('job-photos')
                  .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                  .from('job-photos')
                  .getPublicUrl(filePath);

                await supabase
                  .from('job_photos')
                  .insert({
                    job_id: jobData.id,
                    photo_url: publicUrl,
                    uploaded_by: user.id
                  });
              } catch (error) {
                console.error('Photo upload error:', error);
              }
            })
          );
        }
      }

      // Reset form immediately after job creation
      setNewJob({
        title: '',
        description: '',
        budget: '',
        date_needed: '',
        location: '',
        property_size: '',
        service_type: 'lawn_mowing',
        lawn_condition: 'normal',
        service_frequency: 'one_time',
        special_equipment: '',
        existing_issues: '',
        share_contact_info: false
      });
      setJobPhotos([]);

      // Show success message
      setToast({
        show: true,
        message: 'Job posted successfully!',
        type: 'success'
      });

      // Switch to active jobs view
      setActiveSection('active');

      // Refresh jobs list in the background
      loadJobs();

    } catch (error) {
      console.error('Job posting error:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to post job',
        type: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First update the job details
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          title: editingJob.title,
          description: editingJob.description,
          budget: parseFloat(editingJob.budget),
          date_needed: editingJob.date_needed,
          location: editingJob.location,
          property_size: editingJob.property_size,
          service_type: editingJob.service_type,
          lawn_condition: editingJob.lawn_condition,
          service_frequency: editingJob.service_frequency,
          special_equipment: editingJob.special_equipment,
          existing_issues: editingJob.existing_issues,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingJob.id)
        .eq('customer_id', user.id)
        .eq('status', 'open');

      if (updateError) throw updateError;

      // Handle new photos
      if (jobPhotos.length > 0) {
        try {
          const photoUrls = await uploadJobPhotos(editingJob.id, jobPhotos.map(photo => photo.file));
          console.log('Uploaded photo URLs:', photoUrls);

          // Insert into job_photos table instead of updating the job
          const { error: photoError } = await supabase
            .from('job_photos')
            .insert(
              photoUrls.map(url => ({
                job_id: editingJob.id,
                photo_url: url,
                uploaded_by: user.id
              }))
            );

          if (photoError) {
            console.error('Error inserting photos:', photoError);
            throw photoError;
          }
        } catch (photoErr) {
          console.error('Error handling photos:', photoErr);
          throw new Error('Failed to upload photos');
        }
      }

      setToast({
        show: true,
        message: 'Job updated successfully!',
        type: 'success'
      });

      await loadJobs();
      setEditingJob(null);
      setJobPhotos([]);

    } catch (err) {
      console.error('Error updating job:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to update job. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (job) => {
    setEditingJob({
      id: job.id,
      title: job.title,
      description: job.description,
      budget: job.budget,
      date_needed: job.date_needed,
      location: job.location
    });
    setJobPhotos(job.job_photos?.map(photo => ({
      preview: photo.photo_url,
      uploaded: true
    })) || []);
    setActiveSection('post');
  };

  const handleBidAction = async (jobId, bidId, action) => {
    try {
      if (action === 'accept') {
        // Update job status and set professional
        const { data: bid } = await supabase
          .from('bids')
          .select('professional_id')
          .eq('id', bidId)
          .single();

        // Update job status and professional
        const { error: jobError } = await supabase
          .from('jobs')
          .update({
            status: 'in_progress',
            professional_id: bid.professional_id
          })
          .eq('id', jobId);

        if (jobError) throw jobError;

        // Update accepted bid status
        const { error: acceptError } = await supabase
          .from('bids')
          .update({ status: 'accepted' })
          .eq('id', bidId);

        if (acceptError) throw acceptError;

        // Reject other bids
        const { error: rejectError } = await supabase
          .from('bids')
          .update({ status: 'rejected' })
          .eq('job_id', jobId)
          .neq('id', bidId);

        if (rejectError) throw rejectError;

        // Refresh jobs data to ensure we have the latest state
        await loadJobs();

        setToast({
          show: true,
          message: 'Bid accepted successfully! Other bids have been rejected.',
          type: 'success'
        });
      } else {
        // Reject single bid
        const { error: rejectError } = await supabase
          .from('bids')
          .update({ status: 'rejected' })
          .eq('id', bidId);

        if (rejectError) throw rejectError;

        // Refresh jobs data to ensure we have the latest state
        await loadJobs();

        setToast({
          show: true,
          message: 'Bid rejected successfully!',
          type: 'success'
        });
      }

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);

    } catch (err) {
      console.error('Error handling bid action:', err);
      setToast({
        show: true,
        message: `Failed to ${action} bid. Please try again.`,
        type: 'error'
      });
    }
  };

  const handleTimeSuggestion = async (suggestionId, status) => {
    try {
      // Update time suggestion status
      const { error } = await supabase
        .from('time_suggestions')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Refresh jobs to get updated time suggestions
      await loadJobs();

      setToast({
        show: true,
        message: `Time suggestion ${status} successfully!`,
        type: 'success'
      });

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);

    } catch (err) {
      console.error('Error updating time suggestion:', err);
      setToast({
        show: true,
        message: 'Failed to update time suggestion',
        type: 'error'
      });
    }
  };

  const handleReview = async (jobId, reviewData) => {
    try {
      setLoading(true);

      // Get the professional_id from the job
      const { data: jobData, error: jobFetchError } = await supabase
        .from('jobs')
        .select('professional_id')
        .eq('id', jobId)
        .single();

      if (jobFetchError) throw jobFetchError;

      // First update the job with the review
      const { data: updatedJob, error: jobError } = await supabase
        .from('jobs')
        .update({
          customer_review: reviewData.review,
          customer_rating: reviewData.rating,
          reviewed_at: new Date().toISOString(),
          has_review: true
        })
        .eq('id', jobId)
        .eq('customer_id', user.id)
        .select('*')  // Get the updated job data
        .single();

      if (jobError) {
        console.error('Job update error:', jobError);
        throw jobError;
      }

      // Then create the review record
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          job_id: jobId,
          reviewer_id: user.id,
          reviewed_id: jobData.professional_id,
          rating: reviewData.rating,
          comment: reviewData.review,
          created_at: new Date().toISOString()
        });

      if (reviewError) {
        console.error('Review insert error:', reviewError);
        throw reviewError;
      }

      // Update the jobs state locally instead of reloading
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? {
                ...job,
                customer_review: reviewData.review,
                customer_rating: reviewData.rating,
                reviewed_at: new Date().toISOString(),
                has_review: true
              }
            : job
        )
      );

      setToast({
        show: true,
        message: 'Review submitted successfully!',
        type: 'success'
      });

    } catch (err) {
      console.error('Review submission error:', err);
      setToast({
        show: true,
        message: 'Failed to submit review: ' + (err.message || 'Unknown error'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      // First check if the job exists and belongs to the user
      const { data: job, error: checkError } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('id', jobId)
        .eq('customer_id', user.id)
        .single();

      if (checkError) {
        console.error('Error checking job:', checkError);
        throw new Error('Could not verify job ownership');
      }

      if (!job) {
        throw new Error('Job not found or unauthorized');
      }

      // Only allow deletion of open or cancelled jobs
      if (job.status !== 'open' && job.status !== 'cancelled') {
        throw new Error('Only open or cancelled jobs can be deleted');
      }

      // Delete all related records first
      const deletePromises = [
        // Delete bids
        supabase.from('bids').delete().eq('job_id', jobId),
        // Delete time suggestions
        supabase.from('time_suggestions').delete().eq('job_id', jobId),
        // Delete document acceptances
        supabase.from('document_acceptances').delete().eq('job_id', jobId),
        // Delete job photos from storage
        supabase.storage.from('job-photos').remove([`${jobId}/*`]),
        // Delete job photos records
        supabase.from('job_photos').delete().eq('job_id', jobId),
      ];

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // Finally delete the job
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('customer_id', user.id);

      if (deleteError) {
        console.error('Error deleting job:', deleteError);
        throw deleteError;
      }
      
      setJobs(jobs.filter(job => job.id !== jobId));
      setToast({
        show: true,
        message: 'Job deleted successfully',
        type: 'success'
      });

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);

    } catch (err) {
      console.error('Error in handleDeleteJob:', err);
      setToast({
        show: true,
        message: `Failed to delete job: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJobVisibility = async (jobId, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'open' ? 'cancelled' : 'open';
      
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('customer_id', user.id);

      if (error) throw error;
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
      
      setToast({
        show: true,
        message: `Job ${newStatus === 'open' ? 'reopened' : 'hidden'} successfully`,
        type: 'success'
      });

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);

    } catch (err) {
      console.error('Error updating job visibility:', err);
      setToast({
        show: true,
        message: 'Failed to update job visibility. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (jobId, bid) => {
    try {
      console.log('Accepting bid:', { jobId, bid });
      
      // Start a transaction
      const { data: updatedBid, error: bidError } = await supabase
        .from('bids')
        .update({ 
          status: 'accepted'
        })
        .eq('id', bid.id)
        .select()
        .single();

      if (bidError) {
        console.error('Bid update error:', bidError);
        throw bidError;
      }

      console.log('Bid updated:', updatedBid);

      // Verify job status was updated by trigger
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('status, professional_id')
        .eq('id', jobId)
        .single();

      console.log('Job status after bid acceptance:', job);

      // Show success message
      setToast({
        show: true,
        message: 'Bid accepted successfully!',
        type: 'success'
      });

      // Refresh jobs
      await loadJobs();

    } catch (err) {
      console.error('Error accepting bid:', err);
      setToast({
        show: true,
        message: 'Failed to accept bid. Please try again.',
        type: 'error'
      });
    }
  };

  // Add or update the handleProfileUpdate function to properly handle photo uploads
  const handleProfileUpdate = async (profileData, newAvatar) => {
    try {
      setLoading(true);
      let avatarUrl = user.avatar_url;
      
      if (newAvatar) {
        // Create a clean folder path for the user's avatar
        const avatarFolder = `${user.id}`;
        const fileExt = newAvatar.name.split('.').pop();
        const fileName = `${avatarFolder}/avatar.${fileExt}`;

        // Delete old avatar if exists
        if (user.avatar_url) {
          try {
            const oldPath = user.avatar_url.split('/').pop();
            await supabase.storage
              .from('avatars')
              .remove([`${avatarFolder}/${oldPath}`]);
          } catch (error) {
            console.error('Error removing old avatar:', error);
          }
        }

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, newAvatar, {
            cacheControl: '3600',
            upsert: true // Allow overwriting
          });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Profile update error: ${updateError.message}`);
      }

      // Update local state
      setUser(prev => ({
        ...prev,
        ...profileData,
        avatar_url: avatarUrl
      }));

      setToast({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });

    } catch (error) {
      console.error('Profile update failed:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the useProfileAddress function to handle both new and editing jobs
  const useProfileAddress = () => {
    if (user?.address) {
      if (editingJob) {
        setEditingJob(prev => ({
          ...prev,
          location: user.address
        }));
      } else {
        setNewJob(prev => ({
          ...prev,
          location: user.address
        }));
      }
    } else {
      setToast({
        show: true,
        message: 'No address found in your profile. Please update your profile first.',
        type: 'info'
      });
    }
  };

  // Update the loadUserProfile function to ensure the address is properly loaded
  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile for ID:', user.id);
      
      // Get the user's profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data loaded:', profile);
      
      // Update the user state with the profile data
      setUser(prevUser => {
        const updatedUser = {
          ...prevUser,
          ...profile
        };
        console.log('Updated user state:', updatedUser);
        return updatedUser;
      });
      
      // Update the job location with the user's address if available
      if (profile.address) {
        console.log('Setting job location from profile address:', profile.address);
        setNewJob(prev => {
          const updatedJob = {
            ...prev,
            location: profile.address
          };
          console.log('Updated job state:', updatedJob);
          return updatedJob;
        });
      } else {
        console.log('No address found in profile');
        
        // Show a toast message suggesting the user update their profile
        setToast({
          show: true,
          message: 'Add your address in your profile to automatically use it when posting jobs.',
          type: 'info'
        });
        
        // Hide toast after 5 seconds
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 5000);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  // Add photo recommendation message based on service type
  const getPhotoRecommendation = (serviceType) => {
    const recommendations = {
      lawn_mowing: "📸 Recommended: Upload photos of your lawn area to help professionals provide more accurate bids",
      hedge_trimming: "📸 Recommended: Upload photos of your hedges to help professionals assess the work",
      garden_maintenance: "📸 Recommended: Upload photos of your garden area for better service estimates",
      leaf_removal: "📸 Recommended: Photos of your property help professionals estimate the work needed",
      landscaping_design: "📸 Important: Photos of your property are essential for design planning",
      tree_service: "📸 Important: Photos of the trees help professionals assess the work and provide accurate quotes",
      default: "📸 Photos help professionals provide more accurate bids"
    };
    return recommendations[serviceType] || recommendations.default;
  };

  // Add this helper function at the top of your component
  const getGoogleEarthLink = (address) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://earth.google.com/web/search/${encodedAddress}`;
  };

  // Update the photo upload section in the form
  const renderPhotoUploadSection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Property Photos
        {isPhotoRequired(newJob.service_type) ? (
          <span className="ml-2 text-red-500">Required *</span>
        ) : (
          <span className="ml-2 text-xs text-[#22C55E]">Recommended</span>
        )}
      </label>
      
      <div className="mt-1 text-xs text-gray-500 mb-2">
        {isPhotoRequired(newJob.service_type) ? (
          <span className="text-red-500 font-medium">
            Photos are required for this type of job. Professionals need clear images to provide accurate bids.
          </span>
        ) : (
          getPhotoRecommendation(newJob.service_type)
        )}
      </div>
      
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg relative">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-[#22C55E] hover:text-[#22C55E]/80 focus-within:outline-none"
            >
              <span>Upload photos</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
        </div>
        
        {uploadingPhotos && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
          </div>
        )}
      </div>

      {/* Preview uploaded photos */}
      {jobPhotos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {jobPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Upload ${index + 1}`}
                className="h-24 w-full object-cover rounded-lg"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {isPhotoRequired(newJob.service_type) && jobPhotos.length === 0 && (
        <p className="mt-2 text-sm text-red-500">
          Please upload at least one photo of your property
        </p>
      )}
      
      {jobPhotos.length > 0 && (
        <p className="mt-2 text-sm text-gray-500">
          {jobPhotos.length} photo{jobPhotos.length !== 1 ? 's' : ''} selected
          {jobPhotos.length < 5 && ' (You can add up to 5 photos)'}
          {isPhotoRequired(newJob.service_type) && ' - Required for this service type'}
        </p>
      )}
    </div>
  );

  const uploadJobPhotos = async (jobId, files) => {
    try {
      setUploadingPhotos(true);
      const uploadedPhotos = [];

      for (const file of files) {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        let fileName = `${jobId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        console.log('Uploading file:', fileName);

        // Upload file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(fileName);

        uploadedPhotos.push(publicUrl);
      }

      return uploadedPhotos;
    } catch (error) {
      console.error('Error in uploadJobPhotos:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Add a function to handle time suggestion responses
  const handleTimeSuggestionResponse = async (suggestionId, status) => {
    try {
      console.log('Updating time suggestion:', { suggestionId, status });

      // First get the suggestion to verify it exists
      const { data: suggestion, error: fetchError } = await supabase
        .from('time_suggestions')
        .select('id, status, job_id')
        .eq('id', suggestionId)
        .single();

      if (fetchError) throw fetchError;
      if (!suggestion) throw new Error('Time suggestion not found');

      // Update the suggestion status
      const { error: updateError } = await supabase
        .from('time_suggestions')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // If accepting, reject all other pending suggestions for this job
      if (status === 'accepted') {
        const { error: rejectError } = await supabase
          .from('time_suggestions')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('job_id', suggestion.job_id)
          .neq('id', suggestionId)
          .eq('status', 'pending');

        if (rejectError) {
          console.error('Error rejecting other suggestions:', rejectError);
        }
      }

      setToast({
        show: true,
        message: `Time suggestion ${status === 'accepted' ? 'accepted' : 'rejected'}`,
        type: 'success'
      });

      // Reload jobs to show updated status
      await loadJobs();

    } catch (err) {
      console.error('Error updating time suggestion:', err);
      setToast({
        show: true,
        message: err.message || 'Failed to update time suggestion',
        type: 'error'
      });
    }
  };

  // Add this new component at the top of the file
  const ProfileSection = ({ user, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleAvatarClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('File size must be less than 5MB');
        return;
      }

      try {
        setLoading(true);
        await onUpdate(formData, file);
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        await onUpdate(formData);
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          {loading && (
            <div className="text-sm text-gray-500">Saving changes...</div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm">Change Photo</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E]"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 text-white font-medium rounded-lg transition-colors
                ${loading ? 'bg-gray-400' : 'bg-[#22C55E] hover:bg-[#22C55E]/90'}`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const handleMarkAsCompleted = async (jobId) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('customer_id', user.id);

      if (error) throw error;

      // Refresh jobs list
      await loadJobs();

      setToast({
        show: true,
        message: 'Job marked as completed successfully!',
        type: 'success'
      });

    } catch (err) {
      console.error('Error marking job as completed:', err);
      setToast({
        show: true,
        message: 'Failed to mark job as completed',
        type: 'error'
      });
    }
  };

  const handleSendMessage = async (bidId, professionalId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          job_id: selectedBid.job_id,
          bid_id: bidId,
          sender_id: user.id,
          receiver_id: professionalId,
          message: chatMessage
        });

      if (error) throw error;

      // Clear message input
      setChatMessage('');
      
      // Refresh messages
      loadMessages(bidId);

      setToast({
        show: true,
        message: 'Message sent successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setToast({
        show: true,
        message: 'Failed to send message',
        type: 'error'
      });
    }
  };

  const loadMessages = async (bidId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          ),
          receiver:profiles!receiver_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('bid_id', bidId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadTimeSuggestions = async (jobId) => {
    try {
      const { data, error } = await supabase
        .from('time_suggestions')
        .select(`
          id,
          suggested_date,
          suggested_time,
          message,
          status,
          professional:profiles!professional_id (
            full_name
          )
        `)
        .eq('job_id', jobId)
        .eq('status', 'pending');

      console.log(`Time suggestions for job ${jobId}:`, data); // Add this line
      
      if (error) throw error;
      
      setTimeSuggestions(prev => ({
        ...prev,
        [jobId]: data || []
      }));
    } catch (err) {
      console.error('Error loading time suggestions:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const activeJobs = jobs.filter(job => job.status === 'open' || job.status === 'in_progress');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const cancelledJobs = jobs.filter(job => job.status === 'cancelled');

  const renderTimeSuggestions = (job) => {
    if (!job.time_suggestions?.length) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-900 mb-2">Time Suggestions</h4>
        <div className="space-y-3">
          {job.time_suggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {suggestion.professional?.full_name || 'Professional'}
                  {suggestion.professional?.professional_profile?.business_name && 
                    ` (${suggestion.professional.professional_profile.business_name})`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(suggestion.suggested_date).toLocaleDateString()} at{' '}
                  {suggestion.suggested_time}
                </p>
                {suggestion.message && suggestion.message !== '0[0[' && (
                  <p className="text-sm text-gray-500 mt-1">{suggestion.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Status: {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                </p>
              </div>
              {suggestion.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTimeSuggestionResponse(suggestion.id, 'accepted')}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleTimeSuggestionResponse(suggestion.id, 'rejected')}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // In the JSX where you display professional info
  const renderProfessionalInfo = (professional) => {
    const profile = professional?.professional_profile || {};
    
    return (
      <div className="space-y-6">
        {/* Business Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">About Us</h3>
          <p className="mt-2 text-gray-600">
            {profile.business_description || 'No description available'}
          </p>
        </div>

        {/* Service Areas */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Service Areas</h3>
          <div className="mt-2">
            {profile.service_area?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.service_area.map((area) => (
                  <span 
                    key={area}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Service areas not specified</p>
            )}
          </div>
        </div>

        {/* Experience */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
          <p className="mt-2 text-gray-600">
            {profile.years_experience ? 
              `${profile.years_experience} years of experience` : 
              'Experience information not provided'}
          </p>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <div className="mt-2 space-y-2">
            {profile.contact_email && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${profile.contact_email}`} className="hover:text-green-600">
                  {profile.contact_email}
                </a>
              </div>
            )}
            {profile.contact_phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${profile.contact_phone}`} className="hover:text-green-600">
                  {profile.contact_phone}
                </a>
              </div>
            )}
            {profile.website_url && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" 
                  className="hover:text-green-600">
                  {profile.website_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* License & Insurance */}
        {(profile.license_number || profile.insurance_info) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Credentials</h3>
            <div className="mt-2 space-y-2">
              {profile.license_number && (
                <p className="text-gray-600">
                  <span className="font-medium">License:</span> {profile.license_number}
                </p>
              )}
              {profile.insurance_info && (
                <p className="text-gray-600">
                  <span className="font-medium">Insurance:</span> {profile.insurance_info}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-[#22C55E] text-[#22C55E]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'jobs' && (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 md:mb-8">
            <button
              onClick={() => setActiveSection('active')}
              className={`py-2.5 md:py-3 px-4 md:px-6 rounded-xl text-base md:text-lg font-semibold transition-all duration-200 ${
                activeSection === 'active'
                  ? 'bg-[#22C55E] text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
              }`}
            >
              Active Jobs
            </button>
            <button
              onClick={() => setActiveSection('completed')}
              className={`py-2.5 md:py-3 px-4 md:px-6 rounded-xl text-base md:text-lg font-semibold transition-all duration-200 ${
                activeSection === 'completed'
                  ? 'bg-[#22C55E] text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveSection('hidden')}
              className={`py-2.5 md:py-3 px-4 md:px-6 rounded-xl text-base md:text-lg font-semibold transition-all duration-200 ${
                activeSection === 'hidden'
                  ? 'bg-[#22C55E] text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
              }`}
            >
              Hidden
            </button>
            <button
              onClick={() => setActiveSection('post')}
              className={`py-2.5 md:py-3 px-4 md:px-6 rounded-xl text-base md:text-lg font-semibold transition-all duration-200 ${
                activeSection === 'post'
                  ? 'bg-[#22C55E] text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
              }`}
            >
              Post Job
            </button>
          </div>

          {/* Post New Job Section */}
          {activeSection === 'post' && (
            <section className="mb-8 md:mb-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    <span className="text-[#22C55E]">{editingJob ? 'Edit Lawn Service Job' : 'Post a New Lawn Service Job'}</span>
                  </h2>
                </div>

                <form onSubmit={editingJob ? handleEditJob : handlePostJob} className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      value={editingJob ? editingJob.title : newJob.title}
                      onChange={(e) => editingJob ? 
                        setEditingJob({...editingJob, title: e.target.value}) :
                        setNewJob({...newJob, title: e.target.value})
                      }
                      className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      placeholder="e.g., Lawn Mowing, Hedge Trimming, Garden Design"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      value={editingJob ? editingJob.description : newJob.description}
                      onChange={(e) => editingJob ?
                        setEditingJob({...editingJob, description: e.target.value}) :
                        setNewJob({...newJob, description: e.target.value})
                      }
                      className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      rows="4"
                      placeholder="Describe the lawn service needed, any special requirements, or problem areas"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                      <select
                        required
                        value={editingJob ? editingJob.service_type : newJob.service_type}
                        onChange={(e) => editingJob ?
                          setEditingJob({...editingJob, service_type: e.target.value}) :
                          setNewJob({...newJob, service_type: e.target.value})
                        }
                        className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      >
                        <option value="lawn_mowing">Lawn Mowing</option>
                        <option value="hedge_trimming">Hedge Trimming</option>
                        <option value="weed_control">Weed Control</option>
                        <option value="garden_maintenance">Garden Maintenance</option>
                        <option value="leaf_removal">Leaf Removal</option>
                        <option value="landscaping_design">Landscaping Design</option>
                        <option value="irrigation">Irrigation Installation/Repair</option>
                        <option value="tree_service">Tree Service</option>
                        <option value="mulching">Mulching</option>
                        <option value="fertilization">Fertilization</option>
                        <option value="planting">Planting</option>
                        <option value="sod_installation">Sod Installation</option>
                        <option value="other">Other (Describe in Description)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Frequency</label>
                      <select
                        required
                        value={editingJob ? editingJob.service_frequency : newJob.service_frequency}
                        onChange={(e) => editingJob ?
                          setEditingJob({...editingJob, service_frequency: e.target.value}) :
                          setNewJob({...newJob, service_frequency: e.target.value})
                        }
                        className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      >
                        <option value="one_time">One-time Service</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom Schedule</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Size</label>
                      <div className="flex">
                        <input
                          type="text"
                          required
                          value={editingJob ? editingJob.property_size : newJob.property_size}
                          onChange={(e) => editingJob ?
                            setEditingJob({...editingJob, property_size: e.target.value}) :
                            setNewJob({...newJob, property_size: e.target.value})
                          }
                          className="w-full rounded-l-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                          placeholder="e.g., 0.25, 0.5, 1.0"
                        />
                        <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg">
                          acres
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lawn Condition</label>
                      <select
                        required
                        value={editingJob ? editingJob.lawn_condition : newJob.lawn_condition}
                        onChange={(e) => editingJob ?
                          setEditingJob({...editingJob, lawn_condition: e.target.value}) :
                          setNewJob({...newJob, lawn_condition: e.target.value})
                        }
                        className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      >
                        <option value="normal">Normal/Average</option>
                        <option value="overgrown">Overgrown</option>
                        <option value="very_overgrown">Very Overgrown</option>
                        <option value="weedy">Weedy</option>
                        <option value="patchy">Patchy/Bare Spots</option>
                        <option value="new_construction">New Construction</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Equipment Required</label>
                    <input
                      type="text"
                      value={editingJob ? editingJob.special_equipment : newJob.special_equipment}
                      onChange={(e) => editingJob ?
                        setEditingJob({...editingJob, special_equipment: e.target.value}) :
                        setNewJob({...newJob, special_equipment: e.target.value})
                      }
                      className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      placeholder="Any special equipment needed? (e.g., hedge trimmer, chainsaw, etc.)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing Issues</label>
                    <input
                      type="text"
                      value={editingJob ? editingJob.existing_issues : newJob.existing_issues}
                      onChange={(e) => editingJob ?
                        setEditingJob({...editingJob, existing_issues: e.target.value}) :
                        setNewJob({...newJob, existing_issues: e.target.value})
                      }
                      className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      placeholder="Any existing issues? (e.g., pest problems, flooding, etc.)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editingJob ? editingJob.budget : newJob.budget}
                        onChange={(e) => editingJob ?
                          setEditingJob({...editingJob, budget: e.target.value}) :
                          setNewJob({...newJob, budget: e.target.value})
                        }
                        className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                        placeholder="Enter budget"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Needed</label>
                      <input
                        type="date"
                        required
                        value={editingJob ? editingJob.date_needed : newJob.date_needed}
                        onChange={(e) => editingJob ?
                          setEditingJob({...editingJob, date_needed: e.target.value}) :
                          setNewJob({...newJob, date_needed: e.target.value})
                        }
                        className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location <span className="text-red-500">*</span>
                        {user?.address && newJob.location === user.address && (
                          <span className="ml-2 text-xs text-[#22C55E]">
                            (Using your profile address)
                          </span>
                        )}
                      </label>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                      <input
                        type="text"
                            id="location"
                            name="location"
                        value={editingJob ? editingJob.location : newJob.location}
                        onChange={(e) => editingJob ?
                          setEditingJob({...editingJob, location: e.target.value}) :
                          setNewJob({...newJob, location: e.target.value})
                        }
                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#22C55E] focus:border-[#22C55E] ${
                              user?.address && newJob.location === user.address ? 'bg-green-50 border-green-200' : ''
                            }`}
                            required
                          />
                          {user?.address && (
                            <button
                              type="button"
                              onClick={() => {
                                if (editingJob) {
                                  setEditingJob({...editingJob, location: user.address});
                                } else {
                                  setNewJob({...newJob, location: user.address});
                                }
                              }}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                              title="Use address from your profile"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </button>
                          )}
                  </div>

                        {/* Add Google Earth Link */}
                        {(editingJob?.location || newJob.location) && (
                          <a
                            href={getGoogleEarthLink(editingJob ? editingJob.location : newJob.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-[#22C55E] hover:text-[#22C55E]/80"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                            View on Google Earth (Take a screenshot for better estimates)
                          </a>
                        )}

                        {user?.address && (editingJob ? editingJob.location !== user.address : newJob.location !== user.address) && (
                          <p className="text-xs text-gray-500">
                            Your profile address: {user.address}
                            <button
                              type="button"
                              onClick={() => {
                                if (editingJob) {
                                  setEditingJob({...editingJob, location: user.address});
                                } else {
                                  setNewJob({...newJob, location: user.address});
                                }
                              }}
                              className="ml-2 text-[#22C55E] hover:underline"
                            >
                              Use this
                            </button>
                          </p>
                        )}
                          </div>
                      </div>
                  </div>

                  {renderPhotoUploadSection()}

                  {!editingJob && (
                    <WaiverCheckbox 
                      onAccept={() => {/* Waiver is handled in form submission */}} 
                      userType="customer"
                    />
                  )}

                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={editingJob ? editingJob.share_contact_info : newJob.share_contact_info}
                            onChange={(e) => {
                              if (editingJob) {
                                setEditingJob({...editingJob, share_contact_info: e.target.checked});
                              } else {
                                setNewJob({...newJob, share_contact_info: e.target.checked});
                              }
                            }}
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${
                            (editingJob ? editingJob.share_contact_info : newJob.share_contact_info) 
                              ? 'bg-[#22C55E]' 
                              : 'bg-gray-300'
                          }`}>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                              (editingJob ? editingJob.share_contact_info : newJob.share_contact_info) 
                                ? 'translate-x-6' 
                                : 'translate-x-0'
                            }`}></div>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Share Contact Information</span>
                          <p className="text-xs text-gray-500">
                            Allow professionals to see your address and phone number before bidding
                          </p>
                        </div>
                      </label>
                      <div className="text-xs text-gray-500 italic">
                        {(editingJob ? editingJob.share_contact_info : newJob.share_contact_info) 
                          ? "Contact info will be visible to professionals"
                          : "Contact info will only be shared after accepting a bid"}
                      </div>
                    </div>
                    
                    {(editingJob ? editingJob.share_contact_info : newJob.share_contact_info) && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Note:</span> The following information will be visible to professionals:
                        </p>
                        <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                          <li>Your complete address (to verify property location via Google Maps)</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className={`w-full px-4 py-2 text-white font-medium rounded-lg transition-colors
                        ${submitLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#22C55E] hover:bg-[#22C55E]/90'}`}
                    >
                      {submitLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Posting...
                        </div>
                      ) : (
                        'Post Job'
                      )}
                    </button>
                    {editingJob && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingJob(null);
                          setJobPhotos([]);
                          setActiveSection('active');
                        }}
                        className="w-full sm:w-auto bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Active Jobs Section */}
          {activeSection === 'active' && (
            <section className="mb-8 md:mb-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    <span className="text-[#22C55E]">Active Jobs</span>
                  </h2>
                  <div className="bg-[#22C55E]/10 px-4 py-2 rounded-full">
                    <span className="text-[#22C55E] font-medium">Total: {activeJobs.length}</span>
                  </div>
                </div>

                {activeJobs.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-4xl md:text-5xl mb-4">📋</div>
                    <p className="text-gray-500 text-base md:text-lg">No active jobs at the moment</p>
                    <button
                      onClick={() => setActiveSection('post')}
                      className="mt-4 text-[#22C55E] hover:text-[#22C55E]/80"
                    >
                      Post a new job →
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:gap-6">
                    {activeJobs.map((job, index) => {
                      const isNew = new Date(job.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return (
                        <div 
                          key={job.id} 
                          className={`relative transition-all duration-300 ${
                            isNew ? 'bg-[#22C55E]/5 ring-2 ring-[#22C55E]/20 rounded-xl' : ''
                          }`}
                        >
                          {isNew && (
                            <div className="absolute -top-3 -right-3 bg-[#22C55E] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                              NEW
                            </div>
                          )}
                          <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-300 hidden md:block">
                            #{activeJobs.length - index}
                          </div>
                          <JobCard 
                            job={job}
                            user={user}  // Add this line
                            onBidAction={handleBidAction}
                            onTimeSuggestion={handleTimeSuggestion}
                            onReview={handleReview}
                            onDelete={handleDeleteJob}
                            onToggleVisibility={handleToggleJobVisibility}
                            onEdit={startEditing}
                          >
                            {timeSuggestions[job.id]?.length > 0 && (
                              <div className="mt-4 border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Time Suggestions</h4>
                                <div className="space-y-2">
                                  {timeSuggestions[job.id].map(suggestion => (
                                    <div key={suggestion.id} className="bg-gray-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {suggestion.professional.full_name}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {new Date(suggestion.suggested_date).toLocaleDateString()} at {suggestion.suggested_time}
                                          </p>
                                          {suggestion.message && (
                                            <p className="text-sm text-gray-600 mt-1">
                                              {suggestion.message}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </JobCard>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Completed Jobs Section */}
          {activeSection === 'completed' && (
            <section className="mb-8 md:mb-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    <span className="text-[#22C55E]">Completed Jobs</span>
                  </h2>
                  <div className="bg-[#22C55E]/10 px-4 py-2 rounded-full">
                    <span className="text-[#22C55E] font-medium">Total: {completedJobs.length}</span>
                  </div>
                </div>

                {completedJobs.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-4xl md:text-5xl mb-4">🎯</div>
                    <p className="text-gray-500 text-base md:text-lg">No completed jobs yet</p>
                    <p className="text-gray-400 text-sm mt-2">Completed jobs will appear here</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:gap-6">
                    {completedJobs.map(job => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                        <JobCard 
                          job={job}
                          user={user}  // Add this line
                          onBidAction={handleBidAction}
                          onTimeSuggestion={handleTimeSuggestion}
                          onReview={handleReview}
                          onDelete={handleDeleteJob}
                          onToggleVisibility={handleToggleJobVisibility}
                          onEdit={startEditing}
                        >
                          {timeSuggestions[job.id]?.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Time Suggestions</h4>
                              <div className="space-y-2">
                                {timeSuggestions[job.id].map(suggestion => (
                                  <div key={suggestion.id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {suggestion.professional.full_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {new Date(suggestion.suggested_date).toLocaleDateString()} at {suggestion.suggested_time}
                                        </p>
                                        {suggestion.message && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {suggestion.message}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </JobCard>
                        
                        {/* Add Review Section */}
                        {job.status === 'completed' && !job.customer_review && (
                          <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-[#22C55E]/10 rounded-full">
                                <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Share Your Experience</h3>
                            </div>
                            
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target);
                              handleReview(job.id, {
                                rating: parseInt(formData.get('rating')),
                                review: formData.get('review')
                              });
                            }} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  How would you rate this service?
                                </label>
                                <div className="flex gap-4">
                                  {[5,4,3,2,1].map(num => (
                                    <label key={num} className="relative">
                                      <input
                                        type="radio"
                                        name="rating"
                                        value={num}
                                        className="sr-only peer"
                                        required
                                      />
                                      <div className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-gray-200 cursor-pointer peer-checked:border-[#22C55E] peer-checked:bg-[#22C55E]/10 hover:bg-gray-50 transition-all">
                                        <span className="text-lg font-medium text-gray-700 peer-checked:text-[#22C55E]">
                                          {num}★
                                        </span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tell us about your experience
                                </label>
                                <textarea
                                  name="review"
                                  required
                                  rows="4"
                                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E] resize-none"
                                  placeholder="What did you like? What could be improved?"
                                ></textarea>
                              </div>

                              <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:w-auto px-6 py-3 bg-[#22C55E] text-white font-medium rounded-lg 
                                  ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#22C55E]/90'} 
                                  transition-colors flex items-center justify-center gap-2`}
                              >
                                {loading ? (
                                  <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    Submit Review
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Show Existing Review */}
                        {job.customer_review && (
                          <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">Your Review</span>
                                <div className="flex items-center">
                                  {Array.from({ length: job.customer_rating }).map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(job.reviewed_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{job.customer_review}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Hidden Jobs Section */}
          {activeSection === 'hidden' && (
            <section className="mb-8 md:mb-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    <span className="text-[#22C55E]">Hidden Jobs</span>
                  </h2>
                  <div className="bg-[#22C55E]/10 px-4 py-2 rounded-full">
                    <span className="text-[#22C55E] font-medium">Total: {cancelledJobs.length}</span>
                  </div>
                </div>

                {cancelledJobs.length === 0 ? (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-4xl md:text-5xl mb-4">🔍</div>
                    <p className="text-gray-500 text-base md:text-lg">No hidden jobs</p>
                    <p className="text-gray-400 text-sm mt-2">Jobs you've hidden will appear here</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:gap-6">
                    {cancelledJobs.map(job => (
                      <JobCard 
                        key={job.id} 
                        job={job}
                        user={user}  // Add this line
                        onBidAction={handleBidAction}
                        onTimeSuggestion={handleTimeSuggestion}
                        onReview={handleReview}
                        onDelete={handleDeleteJob}
                        onToggleVisibility={handleToggleJobVisibility}
                        onEdit={startEditing}
                      >
                        {timeSuggestions[job.id]?.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Time Suggestions</h4>
                            <div className="space-y-2">
                              {timeSuggestions[job.id].map(suggestion => (
                                <div key={suggestion.id} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {suggestion.professional.full_name}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(suggestion.suggested_date).toLocaleDateString()} at {suggestion.suggested_time}
                                      </p>
                                      {suggestion.message && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {suggestion.message}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </JobCard>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Calendar Section */}
      {activeTab === 'calendar' && (
        <CustomerJobCalendar user={user} />
      )}

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <ProfileSection 
          user={user} 
          onUpdate={async (profileData, avatarFile) => {
            try {
              let avatarUrl = user.avatar_url;

              if (avatarFile) {
                // Upload new avatar
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${user.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(filePath, avatarFile, {
                    upsert: true
                  });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(filePath);

                avatarUrl = publicUrl;
              }

              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  ...profileData,
                  avatar_url: avatarUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              if (updateError) throw updateError;

              setUser(prev => ({
                ...prev,
                ...profileData,
                avatar_url: avatarUrl
              }));

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
              throw error;
            }
          }}
        />
      )}
    </div>
  );
} 