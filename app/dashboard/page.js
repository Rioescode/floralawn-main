'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO, isAfter } from 'date-fns';
import Calendar from '@/components/Calendar';

export default function CustomerDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);
      fetchAppointments(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      setError(error.message);
    }
  };

  const fetchAppointments = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', userId)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('customer_id', user.id);

      if (error) throw error;
      
      // Refresh appointments
      fetchAppointments(user.id);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError(error.message);
    }
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(parseISO(appointment.date));
    setShowRescheduleModal(true);
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedAppointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          date: selectedDate.toISOString(),
          status: 'pending' // Reset status to pending for admin review
        })
        .eq('id', selectedAppointment.id)
        .eq('customer_id', user.id);

      if (error) throw error;
      
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setSelectedDate(null);
      
      // Refresh appointments
      fetchAppointments(user.id);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setError(error.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your scheduled services
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No appointments found. <a href="/booking" className="text-green-600 hover:text-green-700">Book a service</a>
              </div>
            ) : (
              appointments.map((appointment) => {
                const appointmentDate = parseISO(appointment.date);
                const isUpcoming = isAfter(appointmentDate, new Date());
                
                return (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.service_type}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Date:</span>{' '}
                            {format(appointmentDate, 'MMMM d, yyyy h:mm a')}
                          </p>
                          <p>
                            <span className="font-medium">Location:</span>{' '}
                            {appointment.city}
                          </p>
                          {appointment.notes && (
                            <p>
                              <span className="font-medium">Notes:</span>{' '}
                              {appointment.notes}
                            </p>
                          )}
                          {appointment.status === 'pending' && (
                            <p className="text-yellow-700 mt-2">
                              <span className="font-medium">Note:</span> Your appointment is pending confirmation from our team.
                            </p>
                          )}
                        </div>
                      </div>

                      {isUpcoming && appointment.status !== 'cancelled' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openRescheduleModal(appointment)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(appointment.id)}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Reschedule Appointment
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select a new date for your appointment
              </p>
            </div>

            <div className="p-6">
              <Calendar 
                onDateSelect={(date) => setSelectedDate(date)} 
                selectedDate={selectedDate}
              />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedAppointment(null);
                  setSelectedDate(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!selectedDate}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg
                  ${selectedDate
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
