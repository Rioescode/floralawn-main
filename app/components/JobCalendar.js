"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function JobCalendar({ user, userType }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  
  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Month names for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    loadEvents();
  }, [currentDate, user, userType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Start and end of current month as DATE strings
      const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const endOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      console.log('Loading events for date range:', { startOfMonth, endOfMonth });
      
      let query;
      
      if (userType === 'customer') {
        // Load jobs for customer with DATE comparison - ensure we get in_progress jobs
        query = supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            date_needed,
            location,
            status,
            property_size,
            service_type,
            lawn_condition,
            service_frequency,
            professional:profiles!professional_id (
              id,
              full_name,
              email,
              avatar_url
            ),
            time_suggestions (
              id,
              suggested_date,
              suggested_time,
              status
            ),
            bids!inner (
              id,
              professional_id,
              status
            )
          `)
          .eq('customer_id', user.id)
          .in('status', ['open', 'in_progress', 'completed'])
          .or('status.eq.in_progress,bids.status.eq.accepted')
          .gte('date_needed', startOfMonth)
          .lte('date_needed', endOfMonth)
          .order('date_needed', { ascending: true });
      } else {
        // Load jobs for professional with DATE comparison
        query = supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            date_needed,
            location,
            status,
            property_size,
            service_type,
            lawn_condition,
            service_frequency,
            customer:profiles!customer_id (
              id,
              full_name,
              email,
              avatar_url
            ),
            time_suggestions (
              id,
              suggested_date,
              suggested_time,
              status
            )
          `)
          .eq('professional_id', user.id)
          .in('status', ['in_progress', 'completed'])
          .gte('date_needed', startOfMonth)
          .lte('date_needed', endOfMonth)
          .order('date_needed', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert jobs to events - parse date_needed as a simple date
      const jobEvents = data?.map(job => {
        // Parse the date_needed as YYYY-MM-DD
        const dateParts = job.date_needed.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2]);
        
        return {
          id: `job-${job.id}`,
          title: job.title,
          date: new Date(year, month, day), // Create date without time component
          type: 'job',
          status: job.status,
          job: job
        };
      }) || [];
      
      // Also get time suggestions that have been accepted
      const { data: acceptedSuggestions, error: suggestionsError } = await supabase
        .from('time_suggestions')
        .select(`
          id,
          job_id,
          suggested_date,
          suggested_time,
          status,
          job:jobs (
            id,
            title,
            description,
            location,
            status,
            property_size,
            service_type,
            lawn_condition,
            service_frequency,
            customer:profiles!customer_id (
              id,
              full_name,
              email,
              avatar_url
            ),
            professional:profiles!professional_id (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq(userType === 'customer' ? 'job:jobs.customer_id' : 'professional_id', user.id)
        .eq('status', 'accepted')
        .gte('suggested_date', startOfMonth)
        .lte('suggested_date', endOfMonth);
      
      if (suggestionsError) throw suggestionsError;
      
      // Convert accepted suggestions to events
      const suggestionEvents = acceptedSuggestions?.map(suggestion => ({
        id: `suggestion-${suggestion.id}`,
        title: suggestion.job.title,
        date: new Date(suggestion.suggested_date),
        time: suggestion.suggested_time,
        type: 'suggestion',
        job: suggestion.job,
        suggestion: suggestion
      })) || [];
      
      console.log('Calendar events loaded:', {
        jobEvents: jobEvents.length,
        total: jobEvents.length + suggestionEvents.length
      });
      
      setEvents([...jobEvents, ...suggestionEvents]);

      // Add this after the query is executed
      console.log('Jobs loaded for calendar:', {
        userType,
        count: data?.length || 0,
        statuses: data?.map(job => job.status) || [],
        data
      });
    } catch (err) {
      console.error('Error loading calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Build calendar days
  const buildCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      return event.date.getDate() === day && 
             event.date.getMonth() === currentMonth && 
             event.date.getFullYear() === currentYear;
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  // Get service type label
  const getServiceTypeLabel = (type) => {
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

  // Add a function to handle rescheduling
  const handleReschedule = async (event) => {
    try {
      if (!rescheduleForm.date) {
        alert('Please select a new date');
        return;
      }
      
      // Get the job ID safely
      const jobId = event.job?.id || event.id?.replace('job-', '') || null;
      
      if (!jobId) {
        throw new Error('Could not determine job ID');
      }
      
      console.log('Rescheduling job to date:', rescheduleForm.date);
      
      // Update the job with the new date (already in YYYY-MM-DD format)
      const { error } = await supabase
        .from('jobs')
        .update({ 
          date_needed: rescheduleForm.date, // Already in correct DATE format
          last_rescheduled_at: new Date().toISOString(),
          last_rescheduled_by: user.id,
          rescheduled_reason: rescheduleForm.reason || null
        })
        .eq('id', jobId);
        
      if (error) throw error;
      
      // Create a notification for the other party
      const otherPartyId = userType === 'customer' 
        ? event.job?.professional?.id 
        : event.job?.customer?.id;
        
      if (otherPartyId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: otherPartyId,
            type: 'job_rescheduled',
            content: `Job "${event.title || 'Untitled'}" has been rescheduled to ${new Date(rescheduleForm.date).toLocaleDateString()}${rescheduleForm.time ? ` at ${rescheduleForm.time}` : ''}`,
            job_id: jobId,
            created_by: user.id
          });
      }
      
      // Reset form and close modal
      setRescheduleForm({ date: '', time: '', reason: '' });
      setShowRescheduleForm(false);
      setSelectedEvent(null);
      
      // Reload events
      loadEvents();
      
      alert('Job successfully rescheduled');
    } catch (err) {
      console.error('Error rescheduling job:', err);
      alert('Failed to reschedule job: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          <span className="text-[#22C55E]">Job Calendar</span>
        </h2>
        
        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-800">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22C55E]"></div>
        </div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {buildCalendarDays().map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day && 
                new Date().getDate() === day && 
                new Date().getMonth() === currentMonth && 
                new Date().getFullYear() === currentYear;
              
              return (
                <div 
                  key={index} 
                  className={`min-h-24 border p-1 ${
                    day ? 'bg-white' : 'bg-gray-50'
                  } ${
                    isToday ? 'border-[#22C55E] border-2' : 'border-gray-100'
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-right">
                        <span className={`inline-block w-6 h-6 rounded-full text-center ${
                          isToday ? 'bg-[#22C55E] text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                      </div>
                      
                      {/* Events for this day */}
                      <div className="mt-1 space-y-1">
                        {dayEvents.map(event => {
                          // Create a better display title that includes service type if title is too short
                          const displayTitle = event.title.length < 5 
                            ? `${getServiceTypeLabel(event.job.service_type || 'other')}`
                            : event.title;
                          
                          return (
                            <div 
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`text-xs p-1 rounded truncate cursor-pointer ${
                                event.type === 'suggestion' 
                                  ? 'bg-green-100 text-green-800' 
                                  : event.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : event.status === 'completed'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {event.time && <span className="font-medium">{formatTime(event.time)}</span>}
                              <span className="ml-1">{displayTitle}</span>
                              {event.status && (
                                <span className="ml-1 opacity-75">
                                  ({event.status === 'in_progress' ? 'In Progress' : 
                                    event.status === 'completed' ? 'Done' : 
                                    event.status})
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Event details modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {showRescheduleForm ? 'Reschedule Job' : selectedEvent.title}
                  </h3>
                  <button 
                    onClick={() => {
                      setSelectedEvent(null);
                      setShowRescheduleForm(false);
                      setRescheduleForm({ date: '', time: '', reason: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {!showRescheduleForm ? (
                  <div className="space-y-4">
                    {/* Date and time */}
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-800">
                        {selectedEvent.date.toLocaleDateString()} 
                        {selectedEvent.time && ` at ${formatTime(selectedEvent.time)}`}
                      </span>
                    </div>
                    
                    {/* Location - safely access properties */}
                    {(selectedEvent.job?.location || selectedEvent.location) && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.job?.location || selectedEvent.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-800 hover:text-[#22C55E] transition-colors flex items-center"
                        >
                          {selectedEvent.job?.location || selectedEvent.location}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                    
                    {/* Service type - safely access properties */}
                    {(selectedEvent.job?.service_type || selectedEvent.service_type) && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span className="text-gray-800">
                          {getServiceTypeLabel(selectedEvent.job?.service_type || selectedEvent.service_type || 'other')}
                        </span>
                      </div>
                    )}
                    
                    {/* Description - safely access properties */}
                    {(selectedEvent.job?.description || selectedEvent.description) && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Description</h4>
                        <p className="text-gray-800">{selectedEvent.job?.description || selectedEvent.description}</p>
                      </div>
                    )}
                    
                    {/* Contact person - only show if we have the data */}
                    {selectedEvent.job && (
                      selectedEvent.job[userType === 'customer' ? 'professional' : 'customer'] && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">
                            {userType === 'customer' ? 'Professional' : 'Customer'}
                          </h4>
                          <div className="flex items-center gap-3">
                            {selectedEvent.job[userType === 'customer' ? 'professional' : 'customer']?.avatar_url ? (
                              <img 
                                src={selectedEvent.job[userType === 'customer' ? 'professional' : 'customer'].avatar_url}
                                alt="Contact"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">
                                {selectedEvent.job[userType === 'customer' ? 'professional' : 'customer']?.full_name || 'Not assigned'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedEvent.job[userType === 'customer' ? 'professional' : 'customer']?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                      {/* Only show reschedule button for in-progress jobs */}
                      {(selectedEvent.status === 'in_progress' || selectedEvent.job?.status === 'in_progress') && (
                        <button
                          onClick={() => {
                            // Pre-fill the form with current date
                            const currentDate = selectedEvent.job?.date_needed || selectedEvent.date.toISOString();
                            setRescheduleForm({
                              date: currentDate.split('T')[0],
                              time: '',
                              reason: ''
                            });
                            setShowRescheduleForm(true);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Reschedule
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedEvent(null);
                          setShowRescheduleForm(false);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Reschedule form */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleReschedule(selectedEvent);
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Date
                        </label>
                        <input
                          type="date"
                          required
                          value={rescheduleForm.date}
                          onChange={(e) => setRescheduleForm({...rescheduleForm, date: e.target.value})}
                          className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Time (optional)
                        </label>
                        <input
                          type="time"
                          value={rescheduleForm.time}
                          onChange={(e) => setRescheduleForm({...rescheduleForm, time: e.target.value})}
                          className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Rescheduling
                        </label>
                        <textarea
                          value={rescheduleForm.reason}
                          onChange={(e) => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                          className="w-full rounded-lg border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]"
                          rows="3"
                          placeholder="Please provide a reason for rescheduling"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#22C55E]/90"
                        >
                          Confirm Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRescheduleForm(false);
                            setRescheduleForm({ date: '', time: '', reason: '' });
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 