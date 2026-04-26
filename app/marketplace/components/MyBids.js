"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function MyBids({ user, profile }) {
  const [myBids, setMyBids] = useState([]);
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
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [selectedBid, setSelectedBid] = useState(null);
  const [currentBid, setCurrentBid] = useState(null);
  const [showBidForm, setShowBidForm] = useState(null);
  const [showTimeSuggestionForm, setShowTimeSuggestionForm] = useState(null);
  const [timeSuggestionForm, setTimeSuggestionForm] = useState({
    date: '',
    time: '',
    message: ''
  });

  useEffect(() => {
    loadBids();
  }, [user.id]);

  const loadBids = async () => {
    try {
      const { data: bids, error } = await supabase
        .from('bids')
        .select(`
          *,
          job:jobs!inner (
            *,
            customer:profiles!customer_id (
              *
            ),
            job_photos (
              *
            ),
            time_suggestions (
              id,
              suggested_date,
              suggested_time,
              message,
              status,
              created_at
            )
          )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded bids with time suggestions:', bids);
      setMyBids(bids || []);
    } catch (err) {
      console.error('Error loading bids:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (jobId, isUpdate = false) => {
    try {
      if (!bidForm.amount || !bidForm.message) {
        setToast({
          show: true,
          message: 'Please fill in both bid amount and message',
          type: 'error'
        });
        return;
      }

      if (isUpdate && currentBid) {
        // Update existing bid
        const { error: updateError } = await supabase
          .from('bids')
          .update({
            amount: parseFloat(bidForm.amount),
            message: bidForm.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentBid.id); // Use currentBid.id instead of looking up the bid again

        if (updateError) throw updateError;

        setToast({
          show: true,
          message: 'Bid updated successfully!',
          type: 'success'
        });
      }

      // Clear form and states
      setBidForm({ amount: '', message: '' });
      setCurrentBid(null);
      setShowBidForm(null);
      
      // Reload bids to show updated data
      await loadBids();

      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);

    } catch (err) {
      console.error('Bid submission error:', err);
      setToast({
        show: true,
        message: `Failed to ${isUpdate ? 'update' : 'submit'} bid. Please try again.`,
        type: 'error'
      });
    }
  };

  const handleTimeSuggestionSubmit = async (jobId) => {
    try {
      if (!timeSuggestionForm.date || !timeSuggestionForm.time) {
        setToast({
          show: true,
          message: 'Please select both date and time',
          type: 'error'
        });
        return;
      }

      // Log the data being sent
      console.log('Sending time suggestion:', {
        job_id: jobId,
        professional_id: user.id,
        suggested_date: timeSuggestionForm.date,
        suggested_time: timeSuggestionForm.time,
        message: timeSuggestionForm.message,
        status: 'pending'
      });

      const { data, error } = await supabase
        .from('time_suggestions')
        .insert({
          job_id: jobId,
          professional_id: user.id,
          suggested_date: timeSuggestionForm.date,
          suggested_time: timeSuggestionForm.time,
          message: timeSuggestionForm.message || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Time suggestion created:', data);

      // Reset form and close modal
      setTimeSuggestionForm({ date: '', time: '', message: '' });
      setShowTimeSuggestionForm(null);
      
      // Show success message
      setToast({
        show: true,
        message: 'Time suggestion sent successfully!',
        type: 'success'
      });

      // Reload bids to get updated data
      await loadBids();

    } catch (err) {
      console.error('Error submitting time suggestion:', err);
      setToast({
        show: true,
        message: `Failed to send time suggestion: ${err.message}`,
        type: 'error'
      });
    }
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          <span className="text-[#FF5733]">My Bids</span>
        </h2>
        <div className="bg-[#FF5733]/10 px-4 py-2 rounded-full">
          <span className="text-[#FF5733] font-medium">Total Bids: {myBids.length}</span>
        </div>
      </div>

      {myBids.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">You haven't placed any bids yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {myBids.map((bid) => (
            <div key={bid.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 w-full sm:w-auto">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {bid.job.title || getLawnServiceTypeLabel(bid.job.service_type)}
                  </h3>
                  {bid.job.description && (
                    <p className="text-gray-600 text-sm">{bid.job.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getServiceFrequencyLabel(bid.job.service_frequency)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getLawnServiceTypeLabel(bid.job.service_type)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {getLawnConditionLabel(bid.job.lawn_condition)}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Property Details</h4>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Size: </span>
                        <span className="text-sm text-gray-700">{bid.job.property_size} acres</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Location: </span>
                        <span className="text-sm text-gray-700">{bid.job.location}</span>
                      </div>
                      {bid.job.share_contact_info && (
                        <div className="text-sm text-green-600">
                          Contact information shared by customer
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Date Needed:</span>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(bid.job.date_needed).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Budget:</span>
                      <div className="text-sm font-medium text-gray-900">${bid.job.budget}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Posted:</span>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(bid.job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    bid.status === 'accepted' 
                      ? 'bg-green-100 text-green-800'
                      : bid.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </span>
                  <div className="text-lg font-semibold text-[#22C55E]">
                    Your Bid: ${bid.amount}
                  </div>
                </div>
              </div>

              {/* Your Message */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500 mb-2">Your Message</div>
                <p className="text-gray-700">{bid.message}</p>
              </div>

              {/* Job Photos */}
              {bid.job.job_photos && bid.job.job_photos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Job Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {bid.job.job_photos.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt="Job photo"
                          className="w-full h-32 object-cover rounded-lg"
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

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Bid placed on: {new Date(bid.created_at).toLocaleDateString()}
                </div>
                {bid.status === 'pending' && (
                  <button
                    onClick={() => {
                      setBidForm({
                        amount: bid.amount,
                        message: bid.message
                      });
                      setCurrentBid(bid);
                      setShowBidForm(bid.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Update Bid
                  </button>
                )}
              </div>

              {/* Add Time Suggestion Button */}
              {bid.status === 'accepted' && (
                <div className="mt-4 border-t pt-4">
                  {bid.job.time_suggestions?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-900">Time Suggestions</h4>
                        <button
                          onClick={() => setShowTimeSuggestionForm(bid.job.id)}
                          className="text-sm text-[#22C55E] hover:text-[#22C55E]/80"
                        >
                          + New Suggestion
                        </button>
                      </div>
                      {bid.job.time_suggestions.map(suggestion => (
                        <div key={suggestion.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  suggestion.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(suggestion.suggested_date).toLocaleDateString()} at {suggestion.suggested_time}
                              </p>
                              {suggestion.message && (
                                <p className="text-sm text-gray-600 mt-1">{suggestion.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTimeSuggestionForm(bid.job.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#22C55E] bg-[#22C55E]/10 rounded-lg hover:bg-[#22C55E]/20"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Suggest Time
                    </button>
                  )}
                </div>
              )}
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
                {selectedCustomer.avatar_url ? (
                  <img
                    src={selectedCustomer.avatar_url}
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

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Bid</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleBidSubmit(currentBid.job_id, true);
            }}>
              <div className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    value={bidForm.message}
                    onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                    className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                    rows="4"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#22C55E] text-white px-4 py-2 rounded-lg hover:bg-[#22C55E]/90"
                  >
                    Update Bid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBidForm(null);
                      setCurrentBid(null);
                      setBidForm({ amount: '', message: '' });
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Suggestion Form Modal */}
      {showTimeSuggestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Suggest New Time</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleTimeSuggestionSubmit(showTimeSuggestionForm);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  value={timeSuggestionForm.date}
                  onChange={(e) => setTimeSuggestionForm(prev => ({ ...prev, date: e.target.value }))}
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
                  value={timeSuggestionForm.time}
                  onChange={(e) => setTimeSuggestionForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={timeSuggestionForm.message}
                  onChange={(e) => setTimeSuggestionForm(prev => ({ ...prev, message: e.target.value }))}
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
                    setShowTimeSuggestionForm(null);
                    setTimeSuggestionForm({ date: '', time: '', message: '' });
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
    </div>
  );
} 