"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import JobPostCard from './JobPostCard';
import WaiverCheckbox from '@/app/components/WaiverCheckbox';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function AvailableJobs({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidForm, setBidForm] = useState({
    amount: '',
    message: ''
  });
  const [timeSuggestion, setTimeSuggestion] = useState({
    date: '',
    time: '',
    message: ''
  });
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [failedImages, setFailedImages] = useState(new Set());
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showBidForm, setShowBidForm] = useState(null);

  useEffect(() => {
    loadAvailableJobs();
  }, [user.id]);

  const loadAvailableJobs = async () => {
    try {
      setLoading(true);
      
      // First check if user is a professional
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_professional')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.is_professional) {
        setError('Only professionals can view available jobs');
        return;
      }

      // Get all open jobs - simplified query
      const { data: openJobs, error: openError } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!customer_id (
            id,
            full_name,
            email,
            avatar_url,
            created_at
          ),
          bids (
            id,
            amount,
            status,
            professional_id
          ),
          job_photos (
            id,
            photo_url
          )
        `)
        .eq('status', 'open')
        .is('professional_id', null)
        .not('customer_id', 'eq', user.id);

      if (openError) {
        console.error('Error fetching jobs:', openError);
        throw openError;
      }

      // Debug log to see what we're getting
      console.log('Raw jobs data:', openJobs?.map(job => ({
        id: job.id,
        title: job.title,
        property_size: job.property_size,
        service_type: job.service_type,
        lawn_condition: job.lawn_condition,
        service_frequency: job.service_frequency,
        special_equipment: job.special_equipment,
        existing_issues: job.existing_issues
      })));

      const jobsWithoutMyBids = openJobs?.filter(job => {
        const hasNoBid = !job.bids?.some(bid => bid.professional_id === user.id);
        return hasNoBid;
      }) || [];

      // Debug log to see filtered jobs
      console.log('Filtered jobs:', jobsWithoutMyBids);

      setJobs(jobsWithoutMyBids);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (jobId) => {
    try {
      // Validate bid inputs
      if (!bidForm.amount || !bidForm.message) {
        setToast({
          show: true,
          message: 'Please fill in both bid amount and message',
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

      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        setToast({
          show: true,
          message: 'Please log in to submit a bid',
          type: 'error'
        });
        return;
      }

      // Check if bid already exists
      const { data: existingBid, error: checkError } = await supabase
        .from('bids')
        .select('id')
        .eq('job_id', jobId)
        .eq('professional_id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingBid) {
        setToast({
          show: true,
          message: 'You have already placed a bid on this job',
          type: 'error'
        });
        setBidForm({ amount: '', message: '' });
        setShowBidForm(null);
        return;
      }

      // Insert the bid
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .insert([{
          job_id: jobId,
          professional_id: session.user.id,
          amount: parseFloat(bidForm.amount),
          message: bidForm.message,
          status: 'pending'
        }])
        .select()
        .single();

      if (bidError) throw bidError;

      // Show success message
      setToast({
        show: true,
        message: 'Bid submitted successfully!',
        type: 'success'
      });

      // Reset form and close it
      setBidForm({ amount: '', message: '' });
      setShowBidForm(null);

      // Refresh jobs list to remove the job you just bid on
      await loadAvailableJobs();

    } catch (err) {
      console.error('Error submitting bid:', err);
      setToast({
        show: true,
        message: 'Failed to submit bid: ' + err.message,
        type: 'error'
      });
    }
  };

  const getProfileImageUrl = (customer) => {
    if (!customer?.profile_picture_url) {
      return null;
    }
    
    return customer.profile_picture_url;
  };

  const handleTimeSuggestion = async (jobId) => {
    try {
      const { data, error } = await supabase
        .from('time_suggestions')
        .insert([{
          job_id: jobId,
          professional_id: user.id,
          suggested_date: timeSuggestion.date,
          suggested_time: timeSuggestion.time,
          message: timeSuggestion.message,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setToast({
        show: true,
        message: 'Time suggestion sent successfully!',
        type: 'success'
      });
      
      setTimeSuggestion({
        date: '',
        time: '',
        message: ''
      });

    } catch (err) {
      console.error('Error suggesting time:', err);
      setToast({
        show: true,
        message: 'Failed to send time suggestion',
        type: 'error'
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Jobs</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-5xl mb-4">🌿</div>
          <p className="text-gray-500 text-lg">No available jobs at the moment</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new opportunities</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              {/* Job Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* Service Type Badge */}
                    {job.service_type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {getLawnServiceTypeLabel(job.service_type)}
                      </span>
                    )}
                    {/* Service Frequency Badge */}
                    {job.service_frequency && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getServiceFrequencyLabel(job.service_frequency)}
                      </span>
                    )}
                    {/* Lawn Condition Badge */}
                    {job.lawn_condition && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {getLawnConditionLabel(job.lawn_condition)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#22C55E]">${job.budget}</div>
                  <div className="text-sm text-gray-500">Posted {new Date(job.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Property Details</h3>
                  <div className="space-y-2">
                    <p className="text-gray-800">
                      <span className="font-medium">Size:</span> {job.property_size || 'Not specified'}
                      {job.property_size && ' acres'}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-medium">Location:</span> {job.location || 'Not specified'}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-medium">Date Needed:</span> {job.date_needed ? new Date(job.date_needed).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Requirements</h3>
                  <div className="space-y-2">
                    {(job.special_equipment || job.existing_issues) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Requirements</h3>
                        <div className="space-y-2">
                          {job.special_equipment && (
                            <p className="text-gray-800">
                              <span className="font-medium">Equipment Needed:</span> {job.special_equipment}
                            </p>
                          )}
                          {job.existing_issues && (
                            <p className="text-gray-800">
                              <span className="font-medium">Existing Issues:</span> {job.existing_issues}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{job.description}</p>
              </div>

              {/* Job Photos */}
              {job.job_photos && job.job_photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {job.job_photos.map(photo => (
                      <img
                        key={photo.id}
                        src={photo.photo_url}
                        alt="Job site"
                        className="rounded-lg w-full h-32 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
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
                {selectedCustomer.profile_picture_url ? (
                  <img
                    src={getProfileImageUrl(selectedCustomer)}
                    alt={selectedCustomer.full_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <UserCircleIcon className="w-20 h-20 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.full_name}</h3>
                <p className="text-gray-500">Member since {new Date(selectedCustomer.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long'
                })}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                  <p className="text-gray-900">{selectedCustomer.location || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Contact</h4>
                  <p className="text-gray-900">{selectedCustomer.phone || 'Not available'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                <p className="text-gray-900">{selectedCustomer.email}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Additional Information</h4>
                <p className="text-gray-900">
                  This customer has shared their contact information with you because they accepted your bid.
                  Please maintain professional communication and respect their privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Suggestion Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Suggest Time</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleTimeSuggestion(selectedJob);
              setSelectedJob(null); // Close modal after submission
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={timeSuggestion.date}
                  onChange={(e) => setTimeSuggestion({...timeSuggestion, date: e.target.value})}
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
                  onChange={(e) => setTimeSuggestion({...timeSuggestion, time: e.target.value})}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  required
                  value={timeSuggestion.message}
                  onChange={(e) => setTimeSuggestion({...timeSuggestion, message: e.target.value})}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                  rows="3"
                  placeholder="Add any additional details about your availability..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#22C55E]/90 transition-colors"
                >
                  Send Suggestion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    setTimeSuggestion({ date: '', time: '', message: '' });
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

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Add these helper functions at the top of the file
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

const getLawnConditionLabel = (condition) => {
  const conditions = {
    normal: "Normal/Average",
    overgrown: "Overgrown",
    very_overgrown: "Very Overgrown",
    weedy: "Weedy",
    patchy: "Patchy/Bare Spots",
    new_construction: "New Construction"
  };
  return conditions[condition] || condition;
};

const getServiceFrequencyLabel = (frequency) => {
  const frequencies = {
    one_time: "One-time Service",
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    custom: "Custom Schedule"
  };
  return frequencies[frequency] || frequency;
}; 