"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import WaiverCheckbox from '@/app/components/WaiverCheckbox';
import CompletionChecklist from '@/app/components/CompletionChecklist';
import CustomerProfileModal from './CustomerProfileModal';
import JobPostCard from './JobPostCard';
import AvailableJobs from './AvailableJobs';
import MyBids from './MyBids';
import MyJobs from './MyJobs';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import ProfessionalJobCalendar from '@/app/components/ProfessionalJobCalendar';
import TimeSuggestionForm from '@/app/components/TimeSuggestionForm';

const TOP_RI_CITIES = [
  'Providence',
  'Warwick',
  'Cranston',
  'Pawtucket',
  'East Providence'
];

const getProfileImage = (profile, user) => {
  if (profile?.logo_url) return profile.logo_url;
  if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'User')}`;
};

const getLawnServiceTypeLabel = (type) => {
  const types = {
    lawn_mowing: "Lawn Mowing",
    hedge_trimming: "Hedge Trimming",
    weed_control: "Weed Control",
    garden_maintenance: "Garden Maintenance",
    leaf_removal: "Leaf Removal",
    landscaping_design: "Landscaping Design",
    irrigation: "Irrigation Installation/Repair",
    tree_service: "Tree Service",
    mulching: "Mulching",
    fertilization: "Fertilization",
    planting: "Planting",
    sod_installation: "Sod Installation",
    other: "Other Service"
  };
  return types[type] || type;
};

const getServiceFrequencyLabel = (frequency) => {
  const frequencies = {
    weekly: "Weekly",
    bi_weekly: "Bi-Weekly",
    monthly: "Monthly",
    one_time: "One Time",
    other: "Other"
  };
  return frequencies[frequency] || frequency;
};

const getLawnConditionLabel = (condition) => {
  const conditions = {
    new_construction: "New Construction",
    existing_lawn: "Existing Lawn",
    new_lawn: "New Lawn",
    lawn_maintenance: "Lawn Maintenance",
    lawn_restoration: "Lawn Restoration",
    lawn_replacement: "Lawn Replacement",
    other: "Other"
  };
  return conditions[condition] || condition;
};

// Update the getDisplayAddress function
const getDisplayAddress = (job, bid, user) => {
  // If no location is provided
  if (!job.location) return 'Location not specified';

  // If the job has an accepted bid from this professional, show full address
  if (job.status === 'in_progress' && job.professional_id === user?.id) {
    return job.location;
  }
  
  // For all other cases, just show city and zip
  const addressParts = job.location.toLowerCase().split(' ');
  const cityIndex = addressParts.findIndex(part => 
    part.includes('pawtucket') || 
    part.includes('providence') || 
    part.includes('cranston') ||
    part.includes('warwick')
  );

  if (cityIndex !== -1) {
    // Extract zip code if it exists
    const zipMatch = job.location.match(/\b\d{5}\b/);
    const zip = zipMatch ? zipMatch[0] : '';
    
    // Capitalize city name
    const city = addressParts[cityIndex].charAt(0).toUpperCase() + addressParts[cityIndex].slice(1);
    
    // Always show city and zip (if available)
    return `${city}${zip ? `, ${zip}` : ''}`;
  }

  return 'Rhode Island'; // Default fallback
};

// Update where we call getDisplayAddress to pass the user
const renderJobDetails = (job, user) => {
  const displayAddress = getDisplayAddress(job, null, user);
  const showContactInfo = job.share_contact_info || (job.status === 'in_progress' && job.professional_id === user?.id);
  
  return (
    <>
      {/* Service Tags */}
      <div className="flex flex-wrap gap-2 mt-2">
        {job.service_type && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            {getLawnServiceTypeLabel(job.service_type)}
          </span>
        )}
        {job.service_frequency && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {getServiceFrequencyLabel(job.service_frequency)}
          </span>
        )}
        {job.lawn_condition && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {getLawnConditionLabel(job.lawn_condition)}
          </span>
        )}
      </div>

      {/* Job Details Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Property Details Card */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <h3 className="font-medium text-gray-800">Property Details</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-600">Size:</span>
              <span className="text-gray-800">
                {job.property_size ? `${job.property_size} acres` : 'Not specified'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-600">Location:</span>
              <span className="text-gray-800">
                {showContactInfo ? job.location : displayAddress}
              </span>
            </div>
            {showContactInfo && job.customer?.phone && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-600">Phone:</span>
                <span className="text-gray-800">{job.customer.phone}</span>
              </div>
            )}
            {showContactInfo && (
              <p className="text-xs text-[#22C55E]">
                Contact information shared by customer
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-600">Date Needed:</span>
              <span className="text-gray-800">
                {job.date_needed ? new Date(job.date_needed).toLocaleDateString() : 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Requirements Card */}
        {(job.special_equipment || job.existing_issues) && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <h3 className="font-medium text-gray-800">Additional Requirements</h3>
            </div>
            <div className="space-y-2">
              {job.special_equipment && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Equipment Needed:</span>
                    <p className="text-gray-800">{job.special_equipment}</p>
                  </div>
                </div>
              )}
              {job.existing_issues && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Existing Issues:</span>
                    <p className="text-gray-800">{job.existing_issues}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Budget and Timeline */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <span className="text-sm font-medium text-green-800">Budget:</span>
            <span className="ml-2 text-green-700">${job.budget}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <div>
            <span className="text-sm font-medium text-blue-800">Posted:</span>
            <span className="ml-2 text-blue-700">{new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};

// Update the renderCustomerDetails function to accept setSelectedCustomer and setShowCustomerProfile
const renderCustomerDetails = (job, bid = null, { setSelectedCustomer, setShowCustomerProfile }) => (
  <div className="mt-4 border-t pt-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" 
           onClick={() => {
             setSelectedCustomer({
               ...job.customer,
               showContactInfo: bid?.status === 'accepted'
             });
             setShowCustomerProfile(true);
           }}>
        {job.customer.avatar_url ? (
          <img 
            src={job.customer.avatar_url}
            alt={job.customer.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <UserCircleIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div>
          <h4 className="font-medium text-gray-800 hover:text-[#22C55E] transition-colors">
            {job.customer.full_name}
          </h4>
          {/* Only show contact details if bid is accepted */}
          {bid?.status === 'accepted' && (
            <div className="space-y-1 mt-2 text-sm text-gray-600">
              <p>📧 {job.customer.email}</p>
              {job.customer.phone && <p>📞 {job.customer.phone}</p>}
              {job.customer.location && <p>📍 {job.customer.location}</p>}
            </div>
          )}
        </div>
      </div>
      {/* Show view profile button if bid is accepted */}
      {bid?.status === 'accepted' && (
        <button
          onClick={() => {
            setSelectedCustomer({
              ...job.customer,
              showContactInfo: true
            });
            setShowCustomerProfile(true);
          }}
          className="text-[#22C55E] hover:text-[#22C55E]/80 text-sm font-medium"
        >
          View Full Profile
        </button>
      )}
    </div>
  </div>
);

// Update the job card rendering to pass user
const renderJobCard = (job, user) => {
  const userBid = job.bids?.find(bid => bid.professional_id === user?.id);
  const displayAddress = getDisplayAddress(job, userBid, user);
  
  return (
    <div key={job.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 border border-gray-100">
      {/* ... other job details ... */}
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-gray-500">Location:</span>
          <p className="text-gray-800">
            {displayAddress}
            {job.status === 'in_progress' && job.accepted_bid?.professional_id === user?.id && (
              <span className="ml-2 text-xs text-green-600">(Full address visible - Bid accepted)</span>
            )}
            {job.status !== 'in_progress' && (
              <span className="ml-2 text-xs text-gray-500">(Full address visible after bid acceptance)</span>
            )}
          </p>
        </div>
        {/* ... other job details ... */}
      </div>
      
      {/* ... rest of the card content ... */}
    </div>
  );
};

export default function ProfessionalDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('available');
  const [showBidForm, setShowBidForm] = useState(null);
  const [bidForm, setBidForm] = useState({
    amount: '',
    message: '' // Add message field
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [completionChecklists, setCompletionChecklists] = useState({});
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [searchCity, setSearchCity] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    business_description: '',
    service_area: [], // Initialize as empty array
    contact_email: '',
    contact_phone: '',
    website_url: '',
    years_experience: '',
    insurance_info: '',
    license_number: '',
    logo_url: '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    }
  });
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [currentBid, setCurrentBid] = useState(null);
  const [timeSuggestion, setTimeSuggestion] = useState({
    date: '',
    time: '',
    message: ''
  });

  useEffect(() => {
    loadJobs();
    loadMyJobs();
    loadMyBids();
    loadProfile();
    loadServiceAreas();

    // Subscribe to job updates
    const jobsSubscription = supabase
      .channel('pro-jobs-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `professional_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Job update received:', payload);
          loadMyJobs(); // Reload jobs when there's an update
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      jobsSubscription.unsubscribe();
    };
  }, [user.id]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      // First get all your bids
      const { data: myBids } = await supabase
        .from('bids')
        .select('job_id')
        .eq('professional_id', user.id);

      const biddedJobIds = (myBids || []).map(bid => bid.job_id);

      // Then get available jobs excluding ones you've already bid on
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!customer_id (
            id,
            full_name,
            avatar_url,
            location,
            email,
            phone
          ),
          bids (count),
          job_photos (
            id,
            photo_url
          )
        `)
        .eq('status', 'open');

      // If there are bidded jobs, filter them out
      if (biddedJobIds.length > 0) {
        const filteredJobs = jobs.filter(job => !biddedJobIds.includes(job.id));
        setJobs(filteredJobs || []);
      } else {
        setJobs(jobs || []);
      }

      if (error) throw error;
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!fk_customer (
            id,
            full_name,
            email,
            phone,
            location,
            avatar_url,
            created_at
          ),
          bids (
            id,
            amount,
            status,
            professional_id,
            created_at
          ),
          job_photos (
            id,
            photo_url,
            uploaded_by
          )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('My Jobs with photos:', data);
      setMyJobs(data || []);
    } catch (err) {
      console.error('Error loading my jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBids = async () => {
    try {
      const { data: bids, error } = await supabase
        .from('bids')
        .select(`
          *,
          job:jobs (
            *,
            customer:profiles!customer_id (
              id,
              full_name,
              email,
              phone,
              location,
              avatar_url,
            created_at
            ),
            job_photos (
              id,
              photo_url
            )
          )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyBids(bids || []);
    } catch (err) {
      console.error('Error loading bids:', err);
      setError(err.message);
    }
  };

  const loadProfile = async () => {
    try {
      // Get main profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get professional profile
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Handle case where professional profile doesn't exist yet
      if (professionalError && professionalError.code !== 'PGRST116') {
        throw professionalError;
      }

      // Combine the data properly
      const combinedProfile = {
        ...profileData,
        ...professionalData, // Merge professional data at the top level
        professional_profile: professionalData || {} // Also keep a reference in professional_profile
      };

      // Set the combined profile data
      setProfile(combinedProfile);

      // Initialize the form with the loaded data
      setProfileForm({
        business_name: professionalData?.business_name || '',
        business_description: professionalData?.business_description || '',
        service_area: Array.isArray(professionalData?.service_area) ? professionalData.service_area : [],
        contact_email: professionalData?.contact_email || '',
        contact_phone: professionalData?.contact_phone || '',
        website_url: professionalData?.website_url || '',
        years_experience: professionalData?.years_experience || '',
        insurance_info: professionalData?.insurance_info || '',
        license_number: professionalData?.license_number || '',
        logo_url: professionalData?.logo_url || '',
        social_media: professionalData?.social_media || {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: ''
        }
      });

    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    }
  };

  const loadServiceAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .order('name');

      if (error) throw error;
      setServiceAreas(data || []);
    } catch (err) {
      console.error('Error loading service areas:', err);
    }
  };

  const handleProfileUpdate = async (formData) => {
    try {
      setLoading(true);
      console.log('Updating profile with:', formData);

      // First, update the main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || profile?.full_name,
          is_professional: true
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Sanitize the form data
      const sanitizedData = {
        id: user.id,
        business_name: formData.business_name,
        business_description: formData.business_description,
        service_area: formData.service_area || [],
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website_url: formData.website_url,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        insurance_info: formData.insurance_info,
        license_number: formData.license_number,
        social_media: formData.social_media || {}
      };

      // Then, upsert the professional profile
      const { error: professionalError } = await supabase
        .from('professional_profiles')
        .upsert(sanitizedData, {
          onConflict: 'id',
          returning: 'minimal'
        });

      if (professionalError) {
        console.error('Professional profile update error:', professionalError);
        throw professionalError;
      }

      // Refresh the profile data
      await loadProfile();
      setEditingProfile(false); // Close the edit form

      setToast({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });

    } catch (err) {
      console.error('Error updating profile:', err);
      setToast({
        show: true,
        message: 'Failed to update profile: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith('image/')) {
        setToast({
          show: true,
          message: 'Please upload an image file',
          type: 'error'
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({
          show: true,
          message: 'File size must be less than 5MB',
          type: 'error'
        });
        return;
      }

      setLoading(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(`logos/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('public')
        .getPublicUrl(`logos/${fileName}`);

      if (urlError) throw urlError;

      // Update professional profile with new logo URL
      const { error: updateError } = await supabase
        .from('professional_profiles')
        .upsert({
          id: user.id,
          logo_url: publicUrl
        }, {
          onConflict: 'id'
        });

      if (updateError) throw updateError;

      // Update form state
      setProfileForm(prev => ({
        ...prev,
        logo_url: publicUrl
      }));

      setToast({
        show: true,
        message: 'Logo uploaded successfully!',
        type: 'success'
      });

    } catch (err) {
      console.error('Error uploading logo:', err);
      setToast({
        show: true,
        message: 'Failed to upload logo: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (jobId, existingBidId = null) => {
    try {
      // Validate bid amount and message
      if (!bidForm.amount || !bidForm.message) {
        setToast({
          show: true,
          message: 'Please enter both bid amount and message',
          type: 'error'
        });
        return;
      }

      // Validate bid amount is a positive number
      if (isNaN(bidForm.amount) || parseFloat(bidForm.amount) <= 0) {
        setToast({
          show: true,
          message: 'Please enter a valid bid amount',
          type: 'error'
        });
        return;
      }

      if (existingBidId) {
        // Update existing bid
        const { data: bid, error: bidError } = await supabase
          .from('bids')
          .update({
            amount: parseFloat(bidForm.amount),
            message: bidForm.message,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBidId)
          .eq('professional_id', user.id)
          .select('*')
          .single();

        if (bidError) throw bidError;

        setToast({
          show: true,
          message: 'Bid updated successfully!',
          type: 'success'
        });
      } else {
        // Insert new bid
        const { data: bid, error: bidError } = await supabase
          .from('bids')
          .insert([{
            job_id: jobId,
            professional_id: user.id,
            amount: parseFloat(bidForm.amount),
            message: bidForm.message,
            status: 'pending'
          }])
          .select('*')
          .single();

        if (bidError) throw bidError;

        setToast({
          show: true,
          message: 'Bid submitted successfully!',
          type: 'success'
        });
      }

      // Reset form and close it
      setBidForm({ amount: '', message: '' });
      setShowBidForm(null);
      setCurrentBid(null);

      // Refresh bids list and available jobs
      await Promise.all([loadMyBids(), loadJobs()]);

    } catch (err) {
      console.error('Error submitting/updating bid:', err);
      setToast({
        show: true,
        message: 'Failed to submit bid: ' + err.message,
        type: 'error'
      });
    }
  };

  const handlePhotoUpload = async (jobId, file) => {
    try {
      setUploadingPhoto(true);
      
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('job_photos')
        .insert([{
          job_id: jobId,
          photo_url: publicUrl,
          uploaded_by: user.id
        }]);

      if (dbError) throw dbError;

      loadMyJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCompletionChecklist = (jobId) => (checklist) => {
    setCompletionChecklists({
      ...completionChecklists,
      [jobId]: checklist
    });
  };

  const handleMarkCompleted = async (jobId) => {
    try {
      console.log('Marking job as completed:', jobId);

      // First verify the job is in progress and assigned to you
      const { data: job, error: jobCheckError } = await supabase
        .from('jobs')
        .select('status, professional_id')
        .eq('id', jobId)
        .single();

      if (jobCheckError) throw jobCheckError;

      if (job.status !== 'in_progress' || job.professional_id !== user.id) {
        throw new Error('Cannot complete this job');
      }

      // Update job status
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('professional_id', user.id)
        .eq('status', 'in_progress');

      if (updateError) {
        console.error('Error updating job:', updateError);
        throw updateError;
      }

      // Update local state
      setMyJobs(myJobs.map(job => 
        job.id === jobId ? { ...job, status: 'completed', updated_at: new Date().toISOString() } : job
      ));

      setToast({
        show: true,
        message: 'Job marked as completed!',
        type: 'success'
      });

      // Refresh jobs list
      await loadMyJobs();

    } catch (err) {
      console.error('Error marking job as completed:', err);
      setToast({
        show: true,
        message: 'Failed to mark job as completed. Please try again.',
        type: 'error'
      });
    }
  };

  const handleTimeSuggestion = async (jobId) => {
    try {
      // Validate inputs
      if (!timeSuggestion.date || !timeSuggestion.time) {
        setToast({
          show: true,
          message: 'Please select both date and time',
          type: 'error'
        });
        return;
      }

      // Submit new time suggestion
      const { error } = await supabase
        .from('time_suggestions')
        .insert([{
          job_id: jobId,
          professional_id: user.id,
          suggested_date: timeSuggestion.date,
          suggested_time: timeSuggestion.time,
          message: timeSuggestion.message || '',
          status: 'pending'
        }]);

      if (error) throw error;

      // Reset form and close modal
      setTimeSuggestion({ date: '', time: '', message: '' });
      setSelectedJob(null);
      
      // Show success message
      setToast({
        show: true,
        message: 'Time suggestion sent successfully!',
        type: 'success'
      });

      // Reload jobs to get updated data
      await loadJobs();

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);

    } catch (err) {
      console.error('Error submitting time suggestion:', err);
      setToast({
        show: true,
        message: 'Failed to send time suggestion. Please try again.',
        type: 'error'
      });
    }
  };

  const handleShowCustomerProfile = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerProfile(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg">
        Error: {error}
    </div>
  );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
        <button
          onClick={() => setActiveSection('available')}
          className={`py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
            activeSection === 'available'
              ? 'bg-[#22C55E] text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
          }`}
        >
          Available Jobs
        </button>
        <button
          onClick={() => setActiveSection('bids')}
          className={`py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
            activeSection === 'bids'
              ? 'bg-[#22C55E] text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
          }`}
        >
          My Bids
        </button>
        <button
          onClick={() => setActiveSection('jobs')}
          className={`py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
            activeSection === 'jobs'
              ? 'bg-[#22C55E] text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
          }`}
        >
          My Jobs
        </button>
        <button
          onClick={() => setActiveSection('profile')}
          className={`py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
            activeSection === 'profile'
              ? 'bg-[#22C55E] text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-[#22C55E]/10 border border-gray-200'
          }`}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveSection('calendar')}
          className={`px-4 py-2 font-medium rounded-lg ${
            activeSection === 'calendar' 
              ? 'bg-[#22C55E] text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Calendar
        </button>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <section className="mb-8 sm:mb-16">
          {!editingProfile && !profile?.business_name && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <svg className="w-6 h-6 text-[#22C55E] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-[#22C55E]">Complete Your Profile</h3>
                  <p className="text-gray-600 mt-1">A complete profile helps you win more jobs! Add your business details, experience, and services to stand out to potential customers.</p>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="mt-3 bg-[#22C55E] text-white px-4 py-2 rounded-lg hover:bg-[#22C55E]/90 transition-colors"
                  >
                    Update Profile Now
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                <span className="text-[#22C55E]">Business Profile</span>
              </h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="w-full sm:w-auto bg-[#22C55E] text-white px-6 py-2 rounded-lg hover:bg-[#22C55E]/90"
                >
                  Edit Profile
                </button>
              )}
            </div>
            {editingProfile ? (
              <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(profileForm); }} className="space-y-6 max-w-3xl mx-auto">
                <div className="space-y-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.business_name}
                      onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                    />
                  </div>

                  {/* Business Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Logo
                    </label>
                    <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#22C55E] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full"
                      />
                      {profileForm.logo_url && (
                        <img 
                          src={profileForm.logo_url}
                          alt="Business Logo"
                          className="mt-4 w-32 h-32 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>

                  {/* Business Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Description
                      <span className="text-gray-500 ml-2">({profileForm.business_description?.length || 0}/1000)</span>
                    </label>
                    <textarea
                      name="business_description"
                      value={profileForm.business_description || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
                        if (value.length <= 1000) {
                          setProfileForm(prev => ({
                            ...prev,
                            business_description: value
                          }));
                        }
                      }}
                      rows="6"
                      maxLength={1000}
                      className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      placeholder="Describe your business, services, and expertise..."
                    />
                  </div>

                  {/* Service Areas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Areas
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchCity}
                        onChange={(e) => {
                          setSearchCity(e.target.value);
                          if (e.target.value) {
                            setFilteredCities(
                              serviceAreas
                                .filter(area => 
                                  area.name.toLowerCase().includes(e.target.value.toLowerCase()) &&
                                  !profileForm.service_area.includes(area.name)
                                )
                                .map(area => area.name)
                            );
                          }
                        }}
                        onFocus={() => {
                          if (!searchCity) {
                            setFilteredCities(
                              TOP_RI_CITIES.filter(city => !profileForm.service_area.includes(city))
                            );
                          }
                        }}
                        placeholder="Search and add cities..."
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                      
                      {/* Filtered cities dropdown */}
                      {filteredCities.length > 0 && (
                        <div className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                          {filteredCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => {
                                setProfileForm({
                                  ...profileForm,
                                  service_area: [...profileForm.service_area, city]
                                });
                                setSearchCity('');
                                setFilteredCities([]);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected cities */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profileForm.service_area.map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22C55E]/10 text-[#22C55E] rounded-full text-sm"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => {
                                setProfileForm(prev => ({
                                  ...prev,
                                  service_area: prev.service_area.filter(c => c !== city)
                                }));
                              }}
                              className="hover:text-[#22C55E]/80 p-1 rounded-full hover:bg-[#22C55E]/5 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Business Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Years of Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={profileForm.years_experience || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm, 
                          years_experience: e.target.value ? parseInt(e.target.value) : ''
                        })}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>

                    {/* License Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.license_number}
                        onChange={(e) => setProfileForm({...profileForm, license_number: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>

                    {/* Insurance Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Information
                      </label>
                      <input
                        type="text"
                        value={profileForm.insurance_info}
                        onChange={(e) => setProfileForm({...profileForm, insurance_info: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>

                    {/* Website URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={profileForm.website_url}
                        onChange={(e) => setProfileForm({...profileForm, website_url: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={profileForm.contact_email}
                        onChange={(e) => setProfileForm({...profileForm, contact_email: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={profileForm.contact_phone}
                        onChange={(e) => setProfileForm({...profileForm, contact_phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Social Media Links
                    </label>
                    <div className="space-y-4">
                      <input
                        type="url"
                        placeholder="Facebook URL"
                        value={profileForm.social_media?.facebook || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, facebook: e.target.value }
                        })}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                      <input
                        type="url"
                        placeholder="Instagram URL"
                        value={profileForm.social_media?.instagram || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, instagram: e.target.value }
                        })}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={profileForm.social_media?.linkedin || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, linkedin: e.target.value }
                        })}
                        className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm(profile);
                    }}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-[#22C55E] text-white px-6 py-3 rounded-lg hover:bg-[#22C55E]/90 disabled:opacity-50 font-medium transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {profile?.logo_url && (
                    <img 
                      src={profile.logo_url}
                      alt={profile.business_name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{profile?.business_name}</h3>
                    <p className="text-gray-600 mt-3">{profile?.business_description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Service Areas</h4>
                    <p className="text-gray-600">
                      {Array.isArray(profile?.service_area) 
                        ? profile.service_area.join(', ') 
                        : profile?.service_area || 'No service areas specified'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Years of Experience</h4>
                    <p className="text-gray-600">{profile?.years_experience}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">License Number</h4>
                    <p className="text-gray-600">{profile?.license_number}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Insurance Information</h4>
                    <p className="text-gray-600">{profile?.insurance_info}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Contact Information</h4>
                    <div className="space-y-2">
                      <p className="text-gray-600">Email: {profile?.contact_email}</p>
                      <p className="text-gray-600">Phone: {profile?.contact_phone}</p>
                      <p className="text-gray-600">Website: {profile?.website_url}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Social Media</h4>
                    <div className="space-y-2">
                      {profile?.social_media?.facebook && (
                        <a href={profile.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Facebook</a>
                      )}
                      {profile?.social_media?.instagram && (
                        <a href={profile.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Instagram</a>
                      )}
                      {profile?.social_media?.linkedin && (
                        <a href={profile.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">LinkedIn</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Available Jobs Section */}
      {activeSection === 'available' && (
        <section className="mb-8 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                <span className="text-[#22C55E]">Available Jobs</span>
              </h2>
              <div className="bg-[#22C55E]/10 px-4 py-2 rounded-full">
                <span className="text-[#22C55E] font-medium text-sm">New Opportunities</span>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No available jobs at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 w-full sm:w-auto">
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-[#22C55E] transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{job.description}</p>
                        {renderJobDetails(job, user)}
                        {renderCustomerDetails(job, null, { setSelectedCustomer, setShowCustomerProfile })}
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        job.status === 'in_progress' 
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status === 'in_progress' ? 'In Progress' : 
                         job.status === 'completed' ? 'Completed' : 'Open'}
                      </span>
                    </div>

                    {/* Add Job Photos Section */}
                    {job.job_photos && job.job_photos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Job Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {job.job_photos.map(photo => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.photo_url}
                                alt="Job photo"
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 rounded-lg">
                                <a 
                                  href={photo.photo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                  <span className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                                    View Full Size
                                  </span>
                                </a>
                      </div>
                        </div>
                          ))}
                      </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowBidForm(job.id)}
                        className="flex-1 bg-[#22C55E] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#22C55E]/90 transition-colors"
                      >
                        Place Bid
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setTimeSuggestion({ date: '', time: '', message: '' });
                        }}
                        className="flex-1 bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Suggest Time
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* My Jobs Section */}
      {activeSection === 'jobs' && (
        <section className="mb-8 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                <span className="text-[#22C55E]">My Jobs</span>
              </h2>
              <div className="bg-[#22C55E]/10 px-4 py-2 rounded-full">
                <span className="text-[#22C55E] font-medium text-sm">Active Jobs: {myJobs.length}</span>
              </div>
            </div>

            {myJobs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">You don't have any active jobs yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {myJobs.map(job => (
                  <div key={job.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 w-full sm:w-auto">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{job.description}</p>
                        {renderJobDetails(job, user)}
                      </div>
                    </div>

                    {/* Job Actions - show different buttons based on status */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      {job.status === 'in_progress' && (
                        <button
                          onClick={() => handleMarkCompleted(job.id)}
                          className="w-full sm:w-auto bg-[#22C55E] text-white px-6 py-2 rounded-lg hover:bg-[#22C55E]/90"
                        >
                          Mark as Completed
                        </button>
                      )}
                      
                      {/* Show upload photo button for in-progress jobs */}
                      {job.status === 'in_progress' && (
                        <label className="w-full sm:w-auto bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 cursor-pointer text-center">
                          Upload Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(job.id, e.target.files[0])}
                          />
                        </label>
                      )}

                      {/* Show completion details for completed jobs */}
                      {job.status === 'completed' && (
                        <div className="bg-green-50 p-4 rounded-lg w-full">
                          <p className="text-green-800 font-medium">Job completed!</p>
                          <p className="text-green-600 text-sm mt-1">
                            Completed on: {new Date(job.updated_at).toLocaleDateString()}
                          </p>
                      </div>
                      )}
                    </div>

                    {/* Show job photos if any */}
                    {job.job_photos && job.job_photos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Job Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {job.job_photos.map(photo => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.photo_url}
                                alt="Job photo"
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 rounded-lg">
                                <a 
                                  href={photo.photo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                  <span className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                                    View Full Size
                      </span>
                                </a>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews Section */}
                    {job.reviews && job.reviews.length > 0 && (
                      <div className="mt-6 border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-700 mb-3">Customer Reviews</h4>
                        <div className="space-y-4">
                          {job.reviews.map(review => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center gap-3 mb-2">
                                {review.reviewer.avatar_url && (
                                  <img 
                                    src={review.reviewer.avatar_url} 
                                    alt={review.reviewer.full_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-800">{review.reviewer.full_name}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <p className="text-gray-600">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* My Bids Section */}
      {activeSection === 'bids' && (
        <section className="mb-8 sm:mb-16">
          <MyBids 
            bids={myBids} 
            user={user}
            profile={profile}
          />
        </section>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Customer Profile Modal */}
      {showCustomerProfile && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => {
                setShowCustomerProfile(false);
                setSelectedCustomer(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20">
                {selectedCustomer.avatar_url ? (
                  <img
                    src={selectedCustomer.avatar_url}
                    alt={selectedCustomer.full_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl text-gray-500">
                      {selectedCustomer.full_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.full_name}</h3>
                <p className="text-gray-500">Member since {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Only show contact info if there's an accepted bid */}
            {selectedCustomer.showContactInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                    <p className="text-gray-900">{selectedCustomer.location || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                    <p className="text-gray-900">{selectedCustomer.phone || 'Not available'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p className="text-gray-900">{selectedCustomer.email}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  Full contact information will be available once your bid is accepted.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Suggestion Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Suggest Time</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleTimeSuggestion(selectedJob.id);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={timeSuggestion.date}
                  onChange={(e) => setTimeSuggestion(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={timeSuggestion.time}
                  onChange={(e) => setTimeSuggestion(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={timeSuggestion.message}
                  onChange={(e) => setTimeSuggestion(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#22C55E] text-white px-4 py-2 rounded-lg hover:bg-[#22C55E]/90"
                >
                  Send Suggestion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    setTimeSuggestion({ date: '', time: '', message: '' });
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">
              {currentBid ? 'Update Bid' : 'Place Bid'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleBidSubmit(
                currentBid ? currentBid.job.id : showBidForm,
                currentBid ? currentBid.id : null
              );
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bid Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={bidForm.amount}
                  onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                />
              </div>
              
              {/* Add message field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Customer
                </label>
                <textarea
                  required
                  value={bidForm.message}
                  onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                  placeholder="Describe your approach to this job..."
                  rows={4}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#22C55E]/90 transition-colors"
                >
                  {currentBid ? 'Update Bid' : 'Submit Bid'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBidForm(null);
                    setCurrentBid(null);
                    setBidForm({ amount: '', message: '' });
                  }}
                  className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSection === 'calendar' && (
        <section className="mb-8 sm:mb-16">
          <ProfessionalJobCalendar user={user} />
        </section>
      )}
    </div>
  );
} 