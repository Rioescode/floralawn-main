"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function CustomerJobCalendar({ user }) {
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
  }, [currentDate, user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Get ALL in-progress jobs directly with rescheduling info
      const { data: inProgressJobs, error: inProgressError } = await supabase
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
          professional_id,
          last_rescheduled_at,
          last_rescheduled_by,
          rescheduled_reason,
          professional:profiles!professional_id (
            id,
            full_name,
            email,
            avatar_url,
            phone
          )
        `)
        .eq('customer_id', user.id)
        .eq('status', 'in_progress');
      
      if (inProgressError) throw inProgressError;
      
      console.log('In-progress jobs found:', inProgressJobs?.length || 0, inProgressJobs);
      
      // Create events for in-progress jobs, using their actual date if available
      const inProgressEvents = (inProgressJobs || []).map(job => {
        let eventDate;
        
        // Try to parse the actual date from the job
        if (job.date_needed) {
          try {
            const dateParts = job.date_needed.split('T')[0].split('-');
            eventDate = new Date(
              parseInt(dateParts[0]), 
              parseInt(dateParts[1]) - 1, 
              parseInt(dateParts[2])
            );
            
            // Check if the date is valid
            if (isNaN(eventDate.getTime())) {
              // If invalid, use the 15th of current month
              eventDate = new Date(currentYear, currentMonth, 15);
            }
          } catch (err) {
            console.error('Error parsing date for in-progress job:', job.id, err);
            eventDate = new Date(currentYear, currentMonth, 15);
          }
        } else {
          // If no date, use the 15th of current month
          eventDate = new Date(currentYear, currentMonth, 15);
        }
        
        return {
          id: `job-${job.id}`,
          title: job.title,
          date: eventDate,
          type: 'job',
          status: 'in_progress',
          job: job,
          professional: job.professional
        };
      });
      
      // Get all other jobs for the month
      const { data: monthJobs, error: monthJobsError } = await supabase
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
          professional_id,
          professional:profiles!professional_id (
            id,
            full_name,
            email,
            avatar_url,
            phone
          )
        `)
        .eq('customer_id', user.id)
        .in('status', ['open', 'completed'])
        .gte('date_needed', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)
        .lte('date_needed', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(new Date(currentYear, currentMonth + 1, 0).getDate()).padStart(2, '0')}`);
      
      if (monthJobsError) throw monthJobsError;
      
      // Convert regular jobs to events
      const regularEvents = (monthJobs || []).map(job => {
        let eventDate;
        try {
          const dateParts = job.date_needed.split('T')[0].split('-');
          eventDate = new Date(
            parseInt(dateParts[0]), 
            parseInt(dateParts[1]) - 1, 
            parseInt(dateParts[2])
          );
        } catch (err) {
          console.error('Error parsing date for job:', job.id, err);
          eventDate = new Date(currentYear, currentMonth, 1);
        }
        
        return {
          id: `job-${job.id}`,
          title: job.title,
          date: eventDate,
          type: 'job',
          status: job.status,
          job: job,
          professional: job.professional
        };
      });
      
      // Combine all events
      const allEvents = [...inProgressEvents, ...regularEvents];
      console.log('All events to display:', allEvents);
      
      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add the missing calendar UI and functionality
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

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (err) {
      console.error('Error formatting time:', err);
      return timeString;
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

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      // Make sure we have a valid date object
      if (!event.date || !(event.date instanceof Date)) {
        console.error('Invalid date for event:', event);
        return false;
      }
      
      try {
        return event.date.getDate() === day && 
               event.date.getMonth() === currentMonth && 
               event.date.getFullYear() === currentYear;
      } catch (err) {
        console.error('Error comparing dates:', err);
        return false;
      }
    });
  };

  // Handle rescheduling a job
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
      
      // Format the date as YYYY-MM-DD to ensure consistency
      const formattedDate = rescheduleForm.date.split('T')[0];
      
      // Log the update we're about to make
      console.log('Updating job with:', {
        jobId,
        date_needed: formattedDate,
        last_rescheduled_at: new Date().toISOString(),
        last_rescheduled_by: user.id,
        rescheduled_reason: rescheduleForm.reason || null
      });
      
      // Update the job with the new date
      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          date_needed: formattedDate,
          last_rescheduled_at: new Date().toISOString(),
          last_rescheduled_by: user.id,
          rescheduled_reason: rescheduleForm.reason || null
        })
        .eq('id', jobId)
        .select();
        
      if (error) {
        console.error('Supabase error updating job:', error);
        throw error;
      }
      
      console.log('Job updated successfully:', data);
      
      // Create a notification for the professional
      const professionalId = event.job?.professional?.id || event.professional?.id;
        
      if (professionalId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: professionalId,
            type: 'job_rescheduled',
            content: `Job "${event.title || 'Untitled'}" has been rescheduled to ${new Date(formattedDate).toLocaleDateString()}${rescheduleForm.time ? ` at ${rescheduleForm.time}` : ''}`,
            job_id: jobId,
            created_by: user.id
          });
      }
      
      // Reset form and close modal
      setRescheduleForm({ date: '', time: '', reason: '' });
      setShowRescheduleForm(false);
      setSelectedEvent(null);
      
      // Force a complete reload of the calendar
      setEvents([]);
      
      // Check if we need to change the month view
      const newDate = new Date(formattedDate);
      if (newDate.getMonth() !== currentMonth || newDate.getFullYear() !== currentYear) {
        // Update the current date to show the month of the rescheduled job
        setCurrentDate(newDate);
      } else {
        // Just reload events for the current month
        await loadEvents();
      }
      
      alert('Job successfully rescheduled');
    } catch (err) {
      console.error('Error rescheduling job:', err);
      alert('Failed to reschedule job: ' + err.message);
    }
  };

  // Render the calendar UI
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          <span className="text-[#22C55E]">My Calendar</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-lg font-medium text-gray-800">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#22C55E]"></div>
        </div>
      ) : (
        <>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, index) => (
              <div key={`empty-start-${index}`} className="h-24 md:h-32 bg-gray-50 rounded-lg"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, index) => {
              const day = index + 1;
              const isToday = 
                new Date().getDate() === day && 
                new Date().getMonth() === currentMonth && 
                new Date().getFullYear() === currentYear;
              const dayEvents = getEventsForDay(day);

              return (
                <div 
                  key={`day-${day}`} 
                  className={`h-24 md:h-32 p-1 md:p-2 border rounded-lg overflow-hidden ${
                    isToday 
                      ? 'border-[#22C55E] bg-[#22C55E]/5' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex justify-center items-center w-6 h-6 rounded-full text-sm ${
                      isToday 
                        ? 'bg-[#22C55E] text-white' 
                        : 'text-gray-700'
                    }`}>
                      {day}
                    </span>
                  </div>

                  {/* Events for this day */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.map(event => {
                      // Create a better display title that includes professional name if available
                      let displayTitle = event.title;
                      if (event.professional?.full_name) {
                        displayTitle = `${event.title} (${event.professional.full_name.split(' ')[0]})`;
                      }
                      
                      // Check if this job was rescheduled
                      const wasRescheduled = event.job?.last_rescheduled_at || false;
                      const rescheduledByCustomer = wasRescheduled && event.job?.last_rescheduled_by === user.id;
                      const rescheduledByPro = wasRescheduled && event.job?.last_rescheduled_by === event.job?.professional_id;
                      
                      return (
                        <div 
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`px-1.5 py-1 rounded text-xs md:text-sm truncate cursor-pointer ${
                            event.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : event.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          } ${wasRescheduled ? 'border-l-4 border-dashed' : ''} ${
                            rescheduledByCustomer ? 'border-purple-400' : 
                            rescheduledByPro ? 'border-orange-400' : ''
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
                          {wasRescheduled && (
                            <span className="ml-1">
                              {rescheduledByCustomer ? '🔄' : rescheduledByPro ? '📅' : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Empty cells for days after the last day of month */}
            {Array.from({ 
              length: 42 - (getFirstDayOfMonth(currentYear, currentMonth) + getDaysInMonth(currentYear, currentMonth)) 
            }).map((_, index) => (
              <div key={`empty-end-${index}`} className="h-24 md:h-32 bg-gray-50 rounded-lg"></div>
            ))}
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
                    
                    {/* Professional info - enhanced to show more details */}
                    {(selectedEvent.professional || selectedEvent.job?.professional) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                          Professional
                        </h4>
                        <div className="flex items-center gap-3">
                          {(selectedEvent.professional?.avatar_url || selectedEvent.job?.professional?.avatar_url) ? (
                            <img 
                              src={selectedEvent.professional?.avatar_url || selectedEvent.job?.professional?.avatar_url}
                              alt="Professional"
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
                              {selectedEvent.professional?.full_name || selectedEvent.job?.professional?.full_name || 'Not assigned'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedEvent.professional?.email || selectedEvent.job?.professional?.email}
                            </p>
                            {(selectedEvent.professional?.phone || selectedEvent.job?.professional?.phone) && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {selectedEvent.professional?.phone || selectedEvent.job?.professional?.phone}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Add contact buttons */}
                        {(selectedEvent.status === 'in_progress' || selectedEvent.job?.status === 'in_progress') && 
                         (selectedEvent.professional?.email || selectedEvent.job?.professional?.email) && (
                          <div className="mt-3 flex gap-2">
                            <a 
                              href={`mailto:${selectedEvent.professional?.email || selectedEvent.job?.professional?.email}`}
                              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email
                            </a>
                            {(selectedEvent.professional?.phone || selectedEvent.job?.professional?.phone) && (
                              <a 
                                href={`tel:${selectedEvent.professional?.phone || selectedEvent.job?.professional?.phone}`}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Call
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Rescheduling info */}
                    {(selectedEvent.job?.last_rescheduled_at) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                          Rescheduling Information
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Last rescheduled:</span> {new Date(selectedEvent.job.last_rescheduled_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Rescheduled by:</span> {
                              selectedEvent.job.last_rescheduled_by === user.id 
                                ? 'You (Customer)' 
                                : selectedEvent.job.last_rescheduled_by === selectedEvent.job.professional_id
                                ? `${selectedEvent.job.professional?.full_name || 'Professional'}`
                                : 'Other'
                            }
                          </p>
                          {selectedEvent.job.rescheduled_reason && (
                            <p className="text-sm text-gray-700 mt-1">
                              <span className="font-medium">Reason:</span> {selectedEvent.job.rescheduled_reason}
                            </p>
                          )}
                        </div>
                      </div>
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

          {/* Add a legend below the calendar */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
              <span>Open</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border-l-4 border-dashed border-purple-400 pl-2 mr-2"></div>
              <span>Rescheduled by You</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border-l-4 border-dashed border-orange-400 pl-2 mr-2"></div>
              <span>Rescheduled by Professional</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 