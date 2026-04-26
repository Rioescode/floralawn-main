"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import WaiverCheckbox from '@/app/components/WaiverCheckbox';
import CompletionChecklist from '@/app/components/CompletionChecklist';
import CustomerProfileModal from './CustomerProfileModal';

export default function ProfessionalDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('available');
  const [bidForm, setBidForm] = useState({
    amount: '',
    message: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [timeSuggestion, setTimeSuggestion] = useState({
    date: '',
    time: '',
    message: ''
  });
  const [completionChecklists, setCompletionChecklists] = useState({});
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    business_description: '',
    service_area: [],
    logo_url: '',
    years_experience: '',
    license_number: '',
    insurance_info: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    social_media: {
      facebook: '',
      instagram: '',
      linkedin: ''
    }
  });
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadJobs();
    loadMyJobs();
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
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!customer_id (
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
            message,
            status,
            professional_id,
            professional:profiles!professional_id (
              full_name,
              avatar_url,
              professional_profile:professional_profiles (
                business_name,
                business_description,
                service_area,
                logo_url
              )
            )
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviewer_id (
              full_name
            )
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
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
          customer:profiles!customer_id (
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
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviewer_id (
              full_name
            )
          ),
          time_suggestions (
            id,
            suggested_date,
            suggested_time,
            status,
            created_at
          )
        `)
        .eq('professional_id', user.id)
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyJobs(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setProfileForm(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
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

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('professional_profiles')
        .upsert({
          profile_id: user.id,
          ...profileForm,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      setProfile(profileForm);
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setLoading(true);
      
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      // Update profile form
      setProfileForm({
        ...profileForm,
        logo_url: publicUrl
      });
    } catch (err) {
      setError(err.message);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (jobId) => {
    try {
      // Check if bid already exists
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('job_id', jobId)
        .eq('professional_id', user.id)
        .single();

      if (existingBid) {
        alert('You have already placed a bid on this job');
        setBidForm({ amount: '', message: '' });
        setSelectedJob(null);
        return;
      }

      // Submit the bid
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .insert([{
          job_id: jobId,
          professional_id: user.id,
          amount: parseFloat(bidForm.amount),
          message: bidForm.message,
          status: 'pending'
        }])
        .select()
        .single();

      if (bidError) throw bidError;

      // Insert all document acceptances
      const documents = ['waiver', 'privacy', 'terms'];
      for (const docType of documents) {
        const { error: acceptanceError } = await supabase
          .from('document_acceptances')
          .insert([{
            user_id: user.id,
            document_type: docType,
            job_id: jobId
          }]);

        if (acceptanceError) throw acceptanceError;
      }

      setBidForm({ amount: '', message: '' });
      setSelectedJob(null);
      alert('Bid submitted successfully!');
      loadJobs();
    } catch (err) {
      setError(err.message);
      alert('Failed to submit bid. Please try again.');
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

  const markJobComplete = async (jobId) => {
    try {
      setLoading(true);
      const checklist = completionChecklists[jobId];
      
      if (!checklist || !Object.values(checklist).every(Boolean)) {
        setError('Please complete all checklist items before marking the job as complete');
        return;
      }

      // Start a transaction
      const { error: txnError } = await supabase.rpc('complete_job', {
        p_job_id: jobId,
        p_professional_id: user.id,
        p_proper_disposal: checklist.properDisposal,
        p_area_clean: checklist.areaClean,
        p_no_damage: checklist.noDamage,
        p_recycling: checklist.recycling,
        p_estimate_accurate: checklist.estimateAccurate,
        p_photos_uploaded: checklist.photosUploaded,
        p_completion_notes: checklist.notes || null
      });

      if (txnError) throw txnError;

      // Show success message and reload jobs
      alert('Job marked as complete! The customer can now leave a review.');
      loadMyJobs();
    } catch (err) {
      console.error('Error completing job:', err);
      setError(err.message);
      alert('Failed to mark job as complete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSuggestion = async (jobId) => {
    try {
      if (!user || !user.id) {
        alert('Please log in to suggest a time');
        return;
      }

      if (!jobId) {
        alert('Invalid job ID');
        return;
      }

      if (!timeSuggestion.date || !timeSuggestion.time) {
        alert('Please select both date and time');
        return;
      }

      // Check if this is a new job (needs bid) or existing job
      const existingJob = myJobs.find(j => j.id === jobId);

      if (!existingJob && !bidForm.amount) {
        alert('Please enter a bid amount before suggesting a time');
        return;
      }

      // If this is a new job, check for existing bid first
      if (!existingJob && bidForm.amount) {
        const { data: existingBid } = await supabase
          .from('bids')
          .select('id')
          .eq('job_id', jobId)
          .eq('professional_id', user.id)
          .single();

        if (!existingBid) {
          await handleBidSubmit(jobId);
        }
      }

      // Now submit the time suggestion
      const { error } = await supabase
        .from('time_suggestions')
        .insert([{
          job_id: jobId,
          professional_id: user.id,
          suggested_date: timeSuggestion.date,
          suggested_time: timeSuggestion.time,
          message: timeSuggestion.message,
          status: 'pending'
        }]);

      if (error) throw error;

      setTimeSuggestion({ date: '', time: '', message: '' });
      alert('Time suggestion sent to customer');
      loadMyJobs();
      if (!existingJob) loadJobs();
    } catch (err) {
      console.error('Error suggesting time:', err);
      setError(err.message);
      alert('Failed to suggest time. Please try again.');
    }
  };

  const handleShowCustomerProfile = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerProfile(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Navigation Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveSection('available')}
          className={`flex-1 py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
            activeSection === 'available'
              ? 'bg-[#FF5733] text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 hover:bg-[#FF5733]/10 border border-gray-200'
          }`}
        >
          Available Jobs
        </button>
        <button
          onClick={() => setActiveSection('bids')}
          className={`flex-1 py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
            activeSection === 'bids'
              ? 'bg-[#FF5733] text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 hover:bg-[#FF5733]/10 border border-gray-200'
          }`}
        >
          My Bids
        </button>
        <button
          onClick={() => setActiveSection('jobs')}
          className={`flex-1 py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
            activeSection === 'jobs'
              ? 'bg-[#FF5733] text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 hover:bg-[#FF5733]/10 border border-gray-200'
          }`}
        >
          My Jobs
        </button>
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex-1 py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
            activeSection === 'profile'
              ? 'bg-[#FF5733] text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 hover:bg-[#FF5733]/10 border border-gray-200'
          }`}
        >
          My Profile
        </button>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                <span className="text-[#FF5733]">Business Profile</span>
              </h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#FF5733]/90"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editingProfile ? (
              <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.business_name}
                      onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Logo
                    </label>
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
                        className="mt-2 w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Description
                    </label>
                    <textarea
                      value={profileForm.business_description}
                      onChange={(e) => setProfileForm({...profileForm, business_description: e.target.value})}
                      rows="4"
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Areas
                    </label>
                    <select
                      multiple
                      value={profileForm.service_area || []}
                      onChange={(e) => {
                        const selectedAreas = Array.from(e.target.selectedOptions, option => option.value);
                        setProfileForm({
                          ...profileForm,
                          service_area: selectedAreas
                        });
                      }}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733] h-32"
                    >
                      {serviceAreas.map(area => (
                        <option key={area.id} value={area.name}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple areas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={profileForm.years_experience}
                      onChange={(e) => setProfileForm({...profileForm, years_experience: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.license_number}
                      onChange={(e) => setProfileForm({...profileForm, license_number: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Information
                    </label>
                    <input
                      type="text"
                      value={profileForm.insurance_info}
                      onChange={(e) => setProfileForm({...profileForm, insurance_info: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={profileForm.website_url}
                      onChange={(e) => setProfileForm({...profileForm, website_url: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.contact_email}
                      onChange={(e) => setProfileForm({...profileForm, contact_email: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.contact_phone}
                      onChange={(e) => setProfileForm({...profileForm, contact_phone: e.target.value})}
                      className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Media Links
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="url"
                        placeholder="Facebook URL"
                        value={profileForm.social_media?.facebook || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, facebook: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                      />
                      <input
                        type="url"
                        placeholder="Instagram URL"
                        value={profileForm.social_media?.instagram || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, instagram: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                      />
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={profileForm.social_media?.linkedin || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, linkedin: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm(profile);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#FF5733]/90 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {profile?.logo_url && (
                    <img 
                      src={profile.logo_url}
                      alt={profile.business_name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{profile?.business_name}</h3>
                    <p className="text-gray-600 mt-2">{profile?.business_description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700">Service Areas</h4>
                    <p className="text-gray-600 mt-1">{profile?.service_area?.join(', ')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Years of Experience</h4>
                    <p className="text-gray-600 mt-1">{profile?.years_experience}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">License Number</h4>
                    <p className="text-gray-600 mt-1">{profile?.license_number}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Insurance Information</h4>
                    <p className="text-gray-600 mt-1">{profile?.insurance_info}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Contact Information</h4>
                    <div className="space-y-1 mt-1">
                      <p className="text-gray-600">Email: {profile?.contact_email}</p>
                      <p className="text-gray-600">Phone: {profile?.contact_phone}</p>
                      <p className="text-gray-600">Website: {profile?.website_url}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Social Media</h4>
                    <div className="space-y-1 mt-1">
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

      {/* My Bids Section */}
      {activeSection === 'bids' && (
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                <span className="text-[#FF5733]">My Bids</span>
              </h2>
              <div className="bg-[#FF5733]/10 px-4 py-2 rounded-full">
                <span className="text-[#FF5733] font-medium">Total Bids: {jobs.length}</span>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-5xl mb-4">🤝</div>
                <p className="text-gray-500 text-lg">You haven't placed any bids yet.</p>
                <p className="text-gray-400 text-sm mt-2">Your bid history will appear here</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    {console.log('Rendering job card:', {
                      id: job.id,
                      title: job.title,
                      status: job.status,
                      budget: job.budget,
                      bids: job.bids?.map(b => ({
                        id: b.id,
                        amount: b.amount,
                        status: b.status,
                        professional_id: b.professional_id
                      }))
                    })}
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-800 hover:text-[#FF5733] transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">Posted by:</span>
                          <span className="font-medium text-gray-700">{job.customer.full_name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                          job.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                          job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                        {job.bids?.map(bid => (
                          <span key={bid.id} className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                            bid.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            bid.status === 'rejected' ? 'bg-red-50 text-red-800 border border-red-100' :
                            'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-1">Budget</div>
                        <div className="text-lg font-semibold text-gray-800">
                          <div>Customer: ${job.budget}</div>
                          {job.bids?.find(b => b.status === 'accepted' && b.professional_id === user.id) && (
                            <div className="text-[#FF5733]">
                              Your Bid: ${job.bids.find(b => b.status === 'accepted' && b.professional_id === user.id).amount}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-1">Needed By</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {new Date(job.date_needed).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                        <div className="text-lg font-semibold text-gray-800">{job.location}</div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Your Bid Details</h4>
                      {job.bids?.map(bid => (
                        <div key={bid.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-baseline space-x-2">
                                <span className="text-sm font-medium text-gray-500">Your Bid:</span>
                                <span className="text-xl font-bold text-[#FF5733]">${bid.amount}</span>
                              </div>
                              <p className="text-gray-600 text-sm">{bid.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {job.reviews && job.reviews.length > 0 && (
                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Reviews</h4>
                        <div className="space-y-4">
                          {job.reviews.map(review => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-yellow-400 text-lg">
                                      {'★'.repeat(review.rating)}
                                      <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      by {review.reviewer.full_name}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-gray-700">{review.comment}</p>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
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

      {/* My Jobs Section */}
      {activeSection === 'jobs' && (
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                <span className="text-[#FF5733]">My Jobs</span>
              </h2>
              <div className="bg-[#FF5733]/10 px-4 py-2 rounded-full">
                <span className="text-[#FF5733] font-medium">Active Jobs: {myJobs.length}</span>
              </div>
            </div>

            {myJobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-gray-500 text-lg">You don't have any active jobs yet.</p>
                <p className="text-gray-400 text-sm mt-2">Jobs you're working on will appear here</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {myJobs.map(job => (
                  <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-800 hover:text-[#FF5733] transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
                        <button
                          onClick={() => handleShowCustomerProfile(job.customer)}
                          className="text-sm text-gray-500 hover:text-[#FF5733] flex items-center gap-1"
                        >
                          <span>Customer: {job.customer.full_name}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status === 'in_progress' ? 'in progress' : job.status}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-1">Budget</div>
                        <div className="text-lg font-semibold text-gray-800">
                          <div>Customer: ${job.budget}</div>
                          {job.bids?.find(b => b.status === 'accepted' && b.professional_id === user.id) && (
                            <div className="text-[#FF5733]">
                              Your Bid: ${job.bids.find(b => b.status === 'accepted' && b.professional_id === user.id).amount}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-1">Needed By</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {new Date(job.date_needed).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                        <div className="text-lg font-semibold text-gray-800">{job.location}</div>
                      </div>
                    </div>

                    {job.status === 'in_progress' && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Suggest New Time</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Date</label>
                              <input
                                type="date"
                                value={timeSuggestion.date}
                                onChange={(e) => setTimeSuggestion({...timeSuggestion, date: e.target.value})}
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Time</label>
                              <input
                                type="time"
                                value={timeSuggestion.time}
                                onChange={(e) => setTimeSuggestion({...timeSuggestion, time: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                            <textarea
                              value={timeSuggestion.message}
                              onChange={(e) => setTimeSuggestion({...timeSuggestion, message: e.target.value})}
                              placeholder="Explain why you need to change the time..."
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              rows="3"
                            />
                          </div>
                          <button
                            onClick={() => handleTimeSuggestion(job.id)}
                            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                          >
                            Suggest Time
                          </button>
                        </div>

                        {job.time_suggestions && job.time_suggestions.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Suggested Times</h4>
                            <div className="space-y-2">
                              {job.time_suggestions.map(suggestion => (
                                <div key={suggestion.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="font-medium">
                                      {new Date(suggestion.suggested_date).toLocaleDateString()} at{' '}
                                      {new Date(`2000-01-01T${suggestion.suggested_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                      suggestion.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                      suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {suggestion.status}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(suggestion.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-2">Upload Photos</h4>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(job.id, e.target.files[0])}
                            disabled={uploadingPhoto}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>

                        {job.job_photos && job.job_photos.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Job Photos</h4>
                            <div className="grid grid-cols-3 gap-4">
                              {job.job_photos.map(photo => (
                                <img
                                  key={photo.id}
                                  src={photo.photo_url}
                                  alt="Job progress"
                                  className="w-full h-32 object-cover rounded"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <CompletionChecklist 
                            onAccept={handleCompletionChecklist(job.id)} 
                            initialState={completionChecklists[job.id]}
                          />
                        </div>

                        <button
                          onClick={() => markJobComplete(job.id)}
                          disabled={loading || !completionChecklists[job.id] || !Object.values(completionChecklists[job.id] || {}).every(Boolean)}
                          className={`w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                            loading ? 'cursor-not-allowed' : ''
                          }`}
                        >
                          {loading ? 'Completing...' : 'Mark as Complete'}
                        </button>
                      </div>
                    )}

                    {job.status === 'completed' && job.job_photos && job.job_photos.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Completed Work Photos</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {job.job_photos.map(photo => (
                            <img
                              key={photo.id}
                              src={photo.photo_url}
                              alt="Completed work"
                              className="w-full h-32 object-cover rounded"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {job.reviews && job.reviews.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Customer Reviews</h4>
                        <div className="space-y-4">
                          {job.reviews.map(review => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-yellow-400">
                                      {'★'.repeat(review.rating)}
                                      <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      by {review.reviewer.full_name}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-gray-700">{review.comment}</p>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
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

      {/* Available Jobs Section */}
      {activeSection === 'available' && (
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                <span className="text-[#FF5733]">Available Jobs</span>
              </h2>
              <div className="bg-[#FF5733]/10 px-4 py-2 rounded-full">
                <span className="text-[#FF5733] font-medium">New Opportunities</span>
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg shadow">
                <p className="text-gray-500">No available jobs at the moment.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <p className="text-gray-600">{job.description}</p>
                        <button
                          onClick={() => handleShowCustomerProfile(job.customer)}
                          className="text-sm text-gray-500 mt-1 hover:text-[#FF5733] flex items-center gap-1"
                        >
                          <span>Posted by: {job.customer.full_name}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        Open
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>Budget: ${job.budget}</div>
                      <div>Date Needed: {new Date(job.date_needed).toLocaleDateString()}</div>
                      <div>{job.location}</div>
                    </div>

                    {selectedJob === job.id ? (
                      <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold">Place Your Bid</h4>
                            {job.bids?.some(bid => bid.professional_id === user.id) ? (
                              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                                You have already placed a bid on this job
                              </div>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Your Bid Amount ($)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={bidForm.amount}
                                    onChange={(e) => setBidForm({...bidForm, amount: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Message</label>
                                  <textarea
                                    value={bidForm.message}
                                    onChange={(e) => setBidForm({...bidForm, message: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Explain why you're the best fit for this job..."
                                  />
                                </div>

                                <WaiverCheckbox 
                                  onAccept={() => {/* Waiver is handled in bid submission */}} 
                                  userType="professional"
                                />

                                <button
                                  onClick={() => handleBidSubmit(job.id)}
                                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                  Place Bid
                                </button>
                              </>
                            )}
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold">Suggest Alternative Time</h4>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Date</label>
                              <input
                                type="date"
                                value={timeSuggestion.date}
                                onChange={(e) => setTimeSuggestion({...timeSuggestion, date: e.target.value})}
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Time</label>
                              <input
                                type="time"
                                value={timeSuggestion.time}
                                onChange={(e) => setTimeSuggestion({...timeSuggestion, time: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                              <textarea
                                value={timeSuggestion.message}
                                onChange={(e) => setTimeSuggestion({...timeSuggestion, message: e.target.value})}
                                placeholder="Explain why you need to change the time..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                rows="3"
                              />
                            </div>

                            <button
                              onClick={() => handleTimeSuggestion(job.id)}
                              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                              Suggest Time
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedJob(null);
                            setTimeSuggestion({ date: '', time: '', message: '' });
                            setBidForm({ amount: '', message: '' });
                          }}
                          className="w-full mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex space-x-4">
                        <button
                          onClick={() => setSelectedJob(job.id)}
                          disabled={job.bids?.some(bid => bid.professional_id === user.id)}
                          className={`flex-1 ${
                            job.bids?.some(bid => bid.professional_id === user.id)
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } text-white px-4 py-2 rounded`}
                        >
                          {job.bids?.some(bid => bid.professional_id === user.id) ? 'Bid Placed' : 'Place Bid'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJob(job.id);
                            setTimeSuggestion({ date: '', time: '', message: '' });
                          }}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Suggest Time
                        </button>
                      </div>
                    )}

                    {job.bids && job.bids.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-2">
                          {job.bids.length} bid{job.bids.length !== 1 ? 's' : ''} so far
                        </p>
                        {job.bids.map(bid => (
                          <div key={bid.id} className="bg-gray-50 rounded-lg p-4 mb-2">
                            <div className="flex items-center gap-3">
                              <img 
                                src={
                                  bid.professional.professional_profile?.logo_url || 
                                  bid.professional.avatar_url || 
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(bid.professional.full_name)}`
                                }
                                alt={bid.professional.professional_profile?.business_name || bid.professional.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium">
                                  {bid.professional.professional_profile?.business_name || bid.professional.full_name}
                                </div>
                                {bid.professional.professional_profile?.business_description && (
                                  <p className="text-sm text-gray-600">
                                    {bid.professional.professional_profile.business_description}
                                  </p>
                                )}
                                {bid.professional.professional_profile?.service_area && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Service Area: {bid.professional.professional_profile.service_area.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="text-lg font-semibold text-green-600">${bid.amount}</div>
                              <p className="text-gray-600">{bid.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer Profile Modal */}
      {showCustomerProfile && (
        <CustomerProfileModal
          customer={selectedCustomer}
          onClose={() => setShowCustomerProfile(false)}
        />
      )}
    </div>
  );
} 