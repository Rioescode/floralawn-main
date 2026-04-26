"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CompletionChecklist from '@/app/components/CompletionChecklist';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function MyJobs({ user }) {
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [timeSuggestion, setTimeSuggestion] = useState({
    date: '',
    time: '',
    message: ''
  });
  const [completionChecklists, setCompletionChecklists] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadMyJobs();
  }, [user.id]);

  const loadMyJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
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
          bids (
            id,
            amount,
            status,
            professional_id,
            created_at
          ),
          job_photos!left (
            id,
            photo_url,
            uploaded_by
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
          message: timeSuggestion.message,
          status: 'pending'
        }]);

      if (error) throw error;

      setTimeSuggestion({ date: '', time: '', message: '' });
      setSelectedJob(null);
      setToast({
        show: true,
        message: 'Time suggestion sent successfully!',
        type: 'success'
      });

      loadMyJobs();

      setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
    } catch (err) {
      console.error('Error with time suggestion:', err);
      setToast({
        show: true,
        message: 'Failed to submit time suggestion. Please try again.',
        type: 'error'
      });
    }
  };

  const handleMarkCompleted = async (jobId) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('professional_id', user.id);

      if (error) throw error;

      // Update local state
      setMyJobs(myJobs.map(job => 
        job.id === jobId ? { ...job, status: 'completed' } : job
      ));

      setToast({
        show: true,
        message: 'Job marked as completed!',
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
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
                  <div className="text-lg font-semibold space-y-1">
                    <div className="text-gray-800">Customer: ${job.budget}</div>
                    {job.bids?.map(bid => 
                      bid.professional_id === user.id && (
                        <div key={bid.id} className="text-[#FF5733]">Your Bid: ${bid.amount}</div>
                      )
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
                                {suggestion.suggested_date} at {suggestion.suggested_time}
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
          ))}
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