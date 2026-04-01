'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { sendNotification } from '@/lib/notifications';
import ReferralProgram from '@/components/ReferralProgram';
import LoyaltyRewards from '@/components/LoyaltyRewards';

export default function CustomerDashboard() {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [skipDate, setSkipDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false); // Start as false to show banner by default
  const [showOptInModal, setShowOptInModal] = useState(false);
  const [optInPreferences, setOptInPreferences] = useState({
    coupons: true,
    seasonal: true,
    updates: true,
    newsletter: true,
    sms: false
  });
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    
    // Check user role
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
    
    await Promise.all([
      fetchServices(user),
      fetchAppointments(user.id)
    ]);
  };

  const checkSubscriptionStatus = async () => {
    if (!user?.email) {
      console.log('No user email, showing opt-in banner');
      setIsSubscribed(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('is_active, preferences')
        .eq('email', user.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user is not subscribed
          console.log('User not subscribed, showing opt-in banner');
          setIsSubscribed(false);
        } else {
          // Other error - show banner anyway to be safe
          console.error('Error checking subscription:', error);
          setIsSubscribed(false);
        }
        return;
      }

      // User is subscribed if record exists and is_active is true
      const subscribed = data?.is_active === true;
      console.log('Subscription status check:', { 
        email: user.email, 
        subscribed, 
        data,
        is_active: data?.is_active 
      });
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // On error, show banner to allow opt-in
      setIsSubscribed(false);
    }
  };

  const handleOptIn = async () => {
    if (!user) return;
    
    setIsOptingIn(true);
    setError('');
    setSuccess('');

    try {
      // Get user profile for name and phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, preferred_city')
        .eq('id', user.id)
        .single();

      // Get customer info for phone/city if profile doesn't have it
      const { data: customer } = await supabase
        .from('customers')
        .select('phone, city')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
      const phone = profile?.phone || customer?.phone || '';
      const city = profile?.preferred_city || customer?.city || '';

      const response = await fetch('/api/email-subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: user.email,
          phone,
          city,
          source: 'customer_dashboard',
          preferences: {
            coupons: optInPreferences.coupons,
            seasonal: optInPreferences.seasonal,
            updates: optInPreferences.updates,
            newsletter: optInPreferences.newsletter,
            sms: optInPreferences.sms
          }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to subscribe');
      }

      setSuccess('Successfully subscribed to emails and updates!');
      setIsSubscribed(true);
      setShowOptInModal(false);
      
      // Reset preferences
      setOptInPreferences({
        coupons: true,
        seasonal: true,
        updates: true,
        newsletter: true,
        sms: false
      });
    } catch (error) {
      console.error('Error opting in:', error);
      setError(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsOptingIn(false);
    }
  };

  const fetchServices = async (user) => {
    try {
      // First, try to link customers by email if user_id is null
      const { data: customersToLink } = await supabase
        .from('customers')
        .select('id, email')
        .is('user_id', null)
        .eq('email', user.email);

      if (customersToLink && customersToLink.length > 0) {
        // Link customers to this user
        await supabase
          .from('customers')
          .update({ user_id: user.id })
          .in('id', customersToLink.map(c => c.id));
      }

      // Fetch services for this user
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('next_service', { ascending: true, nullsLast: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', userId)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSkipService = async () => {
    if (!selectedService || !skipDate) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/customers/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          customerId: selectedService.id,
          serviceDate: skipDate,
          reason: skipReason
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to skip service');

      setSuccess('Service skipped successfully!');
      setError('');
      await fetchServices(user);
      setShowSkipModal(false);
      setSelectedService(null);
      setSkipDate('');
      setSkipReason('');
    } catch (error) {
      console.error('Error skipping service:', error);
      setError(error.message || 'Failed to skip service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelService = async () => {
    if (!selectedService) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/customers/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          customerId: selectedService.id,
          reason: cancelReason
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to cancel service');

      setSuccess('Service cancelled successfully!');
      setError('');
      await fetchServices(user);
      setShowCancelModal(false);
      setSelectedService(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling service:', error);
      setError(error.message || 'Failed to cancel service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateService = async (serviceId) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/customers/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          customerId: serviceId
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to reactivate service');

      setSuccess('Service reactivated successfully!');
      setError('');
      await fetchServices(user);
    } catch (error) {
      console.error('Error reactivating service:', error);
      setError(error.message || 'Failed to reactivate service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert date to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Get local date/time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local value to ISO string without timezone shift
  const convertLocalDateTimeToISO = (localDateTimeString) => {
    if (!localDateTimeString) return null;
    // datetime-local format: YYYY-MM-DDTHH:mm (no timezone info)
    // We need to treat this as local time and convert to ISO properly
    const [datePart, timePart] = localDateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create date in local timezone
    const localDate = new Date(year, month - 1, day, hours, minutes);
    
    // Convert to ISO string (this will include timezone offset)
    return localDate.toISOString();
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !newDate) return;
    setIsSubmitting(true);
    setError('');

    try {
      // Convert datetime-local value to ISO string properly
      const newDateTimeISO = convertLocalDateTimeToISO(newDate);
      if (!newDateTimeISO) {
        throw new Error('Invalid date format');
      }
      
      const newDateTime = new Date(newDateTimeISO);
      const oldDateTime = new Date(selectedAppointment.date);
      
      if (newDateTime < new Date()) {
        throw new Error('Please select a future date and time');
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          date: newDateTimeISO,
          status: 'rescheduled',
          reschedule_reason: rescheduleReason,
          previous_date: oldDateTime.toISOString()
        })
        .eq('id', selectedAppointment.id);

      if (updateError) throw updateError;
      
      // Enhanced Telegram notification
      const notificationMessage = `🔄 Appointment Rescheduled!\n\n` +
        `👤 Customer: ${selectedAppointment.customer_name}\n` +
        `📞 Phone: ${selectedAppointment.customer_phone}\n` +
        `📧 Email: ${selectedAppointment.customer_email}\n\n` +
        `📅 Original Date: ${format(oldDateTime, 'PPpp')}\n` +
        `📅 New Date: ${format(newDateTime, 'PPpp')}\n` +
        `📝 Reason: ${rescheduleReason || 'No reason provided'}\n\n` +
        `🔧 Service: ${selectedAppointment.service_type}\n` +
        `📍 City: ${selectedAppointment.city}\n` +
        `📝 Notes: ${selectedAppointment.notes || 'No notes'}\n\n` +
        `⚡ Action Required: Please confirm the new time slot is available.`;

      try {
        await sendNotification(notificationMessage);
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
      }
      
      // Refresh appointments
      const { data: { user } } = await supabase.auth.getUser();
      await fetchAppointments(user.id);
      
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setNewDate('');
      setRescheduleReason('');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setError(error.message || 'Failed to reschedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const formatServiceType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatFrequency = (freq) => {
    const map = {
      'weekly': 'Weekly',
      'bi_weekly': 'Bi-Weekly',
      'monthly': 'Monthly',
      'seasonal': 'Seasonal',
      'one_time': 'One Time'
    };
    return map[freq] || freq;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Services</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {userRole === 'admin' && (
                <Link
                  href="/customers"
                  className="flex-1 sm:flex-none text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/booking"
                className="flex-1 sm:flex-none text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium"
              >
                Book New Service
              </Link>
              {isSubscribed ? (
                <button
                  disabled
                  className="flex-1 sm:flex-none text-center bg-green-100 text-green-700 px-4 py-2 rounded-lg cursor-default text-sm sm:text-base font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Subscribed
                </button>
              ) : (
                <button
                  onClick={() => setShowOptInModal(true)}
                  className="flex-1 sm:flex-none text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Subscribe
                </button>
              )}
              <Link
                href="/customer/support"
                className="flex-1 sm:flex-none text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base font-medium"
              >
                Support
              </Link>
              <button
                onClick={handleSignOut}
                className="flex-1 sm:flex-none text-center bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm sm:text-base font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 text-green-700 rounded">
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recurring Services ({services.length})
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Appointments ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'referrals'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab('loyalty')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'loyalty'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Loyalty Rewards
              </button>
            </nav>
          </div>

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {services.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring services</h3>
                  <p className="text-gray-500 mb-6">You don't have any recurring services set up yet</p>
                  <Link
                    href="/booking"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Book Service
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {services.map((service) => (
                    <div key={service.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatServiceType(service.service_type)}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              service.status === 'active' ? 'bg-green-100 text-green-800' :
                              service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              service.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Frequency: {formatFrequency(service.frequency)}
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ${parseFloat(service.price).toFixed(2)} per service
                            </div>
                            {service.next_service && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Next Service: {new Date(service.next_service).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                            {service.address && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {service.address}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          {service.status === 'active' ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedService(service);
                                  setSkipDate(service.next_service || '');
                                  setShowSkipModal(true);
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                              >
                                Skip Next
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedService(service);
                                  setShowCancelModal(true);
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : service.status === 'cancelled' ? (
                            <button
                              onClick={() => handleReactivateService(service.id)}
                              disabled={isSubmitting}
                              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <ReferralProgram 
              userId={user?.id} 
              customerId={services.length > 0 ? services[0].id : null}
            />
          )}

          {/* Loyalty Rewards Tab */}
          {activeTab === 'loyalty' && (
            <LoyaltyRewards 
              userId={user?.id} 
              customerId={services.length > 0 ? services[0].id : null}
            />
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {appointments.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                  <p className="text-gray-500 mb-6">Schedule your first appointment to get started</p>
                  <Link
                    href="/booking"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Book Now
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {appointment.service_type}
                            </h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(appointment.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {appointment.city}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            View Details
                          </button>
                          {appointment.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                // Initialize newDate with current appointment date in datetime-local format
                                const currentDateFormatted = formatDateForInput(appointment.date);
                                setNewDate(currentDateFormatted);
                                setShowRescheduleModal(true);
                              }}
                              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-transparent text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Reschedule
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Opt-In Modal */}
      {showOptInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Subscribe to Updates</h2>
                  <p className="text-sm text-gray-600">Choose what you'd like to receive</p>
                </div>
                <button
                  onClick={() => {
                    setShowOptInModal(false);
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={optInPreferences.coupons}
                    onChange={(e) => setOptInPreferences(prev => ({...prev, coupons: e.target.checked}))}
                    className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 block">🎫 Exclusive Coupons</span>
                    <p className="text-sm text-gray-600">Get special discounts and promotional offers</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={optInPreferences.seasonal}
                    onChange={(e) => setOptInPreferences(prev => ({...prev, seasonal: e.target.checked}))}
                    className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 block">🍂 Seasonal Reminders</span>
                    <p className="text-sm text-gray-600">Timely reminders for spring cleanup, mulch season, fall prep, etc.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={optInPreferences.updates}
                    onChange={(e) => setOptInPreferences(prev => ({...prev, updates: e.target.checked}))}
                    className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 block">📢 Service Updates</span>
                    <p className="text-sm text-gray-600">Important updates about your services and appointments</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={optInPreferences.newsletter}
                    onChange={(e) => setOptInPreferences(prev => ({...prev, newsletter: e.target.checked}))}
                    className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 block">💡 Lawn Care Tips</span>
                    <p className="text-sm text-gray-600">Helpful tips and advice for maintaining a beautiful lawn</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={optInPreferences.sms}
                    onChange={(e) => setOptInPreferences(prev => ({...prev, sms: e.target.checked}))}
                    className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-800 block">📱 SMS Notifications</span>
                    <p className="text-sm text-gray-600">Receive text messages for service reminders and updates. Message and data rates may apply.</p>
                  </div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowOptInModal(false);
                    setError('');
                  }}
                  className="w-full sm:w-1/2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOptIn}
                  disabled={isOptingIn}
                  className={`w-full sm:w-1/2 px-4 py-3 rounded-xl text-white font-medium text-sm transition-all
                    ${isOptingIn
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`}
                >
                  {isOptingIn ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </span>
                  ) : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Service Type</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.service_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.city}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}</p>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Reschedule Appointment</h2>
                  <p className="text-sm text-gray-600">Current appointment: {format(new Date(selectedAppointment.date), 'PPpp')}</p>
                </div>
                    <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedAppointment(null);
                    setNewDate('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                    </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Service Type
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border-2 border-gray-200">
                    {selectedAppointment.service_type}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Location
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border-2 border-gray-200">
                    {selectedAppointment.city}
                  </div>
                </div>

                <div>
                  <label htmlFor="newDate" className="block text-sm font-bold mb-2 text-gray-800">
                    New Date and Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="newDate"
                    name="newDate"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    min={formatDateForInput(new Date().toISOString())}
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500 italic">
                    * We'll confirm your preferred time or suggest alternatives based on availability.
                  </p>
                </div>

                <div>
                  <label htmlFor="rescheduleReason" className="block text-sm font-bold mb-2 text-gray-800">
                    Reason for Rescheduling <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="rescheduleReason"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Please provide a reason for rescheduling..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all min-h-[100px]"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowRescheduleModal(false);
                        setSelectedAppointment(null);
                      setNewDate('');
                      setError('');
                      }}
                    className="w-full sm:w-1/2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  <button
                    onClick={handleReschedule}
                    disabled={isSubmitting || !newDate}
                    className={`w-full sm:w-1/2 px-4 py-3 rounded-xl text-white font-medium text-sm transition-all
                      ${isSubmitting || !newDate
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Rescheduling...
                      </span>
                    ) : 'Confirm Reschedule'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Service Modal */}
      {showSkipModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Skip Service</h2>
                  <p className="text-sm text-gray-600">Skip your next scheduled service</p>
                </div>
                <button
                  onClick={() => {
                    setShowSkipModal(false);
                    setSelectedService(null);
                    setSkipDate('');
                    setSkipReason('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Service Type
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border-2 border-gray-200">
                    {formatServiceType(selectedService.service_type)}
                  </div>
                </div>

                <div>
                  <label htmlFor="skipDate" className="block text-sm font-bold mb-2 text-gray-800">
                    Service Date to Skip <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="skipDate"
                    name="skipDate"
                    value={skipDate}
                    onChange={(e) => setSkipDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="skipReason" className="block text-sm font-bold mb-2 text-gray-800">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="skipReason"
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder="Why are you skipping this service?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all min-h-[100px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowSkipModal(false);
                      setSelectedService(null);
                      setSkipDate('');
                      setSkipReason('');
                      setError('');
                    }}
                    className="w-full sm:w-1/2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSkipService}
                    disabled={isSubmitting || !skipDate}
                    className={`w-full sm:w-1/2 px-4 py-3 rounded-xl text-white font-medium text-sm transition-all
                      ${isSubmitting || !skipDate
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                      }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Skipping...
                      </span>
                    ) : 'Skip Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Service Modal */}
      {showCancelModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Cancel Service</h2>
                  <p className="text-sm text-gray-600">This will cancel your recurring service</p>
                </div>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedService(null);
                    setCancelReason('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ Warning: This will cancel your recurring service. You can reactivate it later if needed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Service Type
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border-2 border-gray-200">
                    {formatServiceType(selectedService.service_type)}
                  </div>
                </div>

                <div>
                  <label htmlFor="cancelReason" className="block text-sm font-bold mb-2 text-gray-800">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Why are you cancelling this service?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all min-h-[100px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedService(null);
                      setCancelReason('');
                      setError('');
                    }}
                    className="w-full sm:w-1/2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  >
                    Keep Service
                  </button>
                  <button
                    onClick={handleCancelService}
                    disabled={isSubmitting}
                    className={`w-full sm:w-1/2 px-4 py-3 rounded-xl text-white font-medium text-sm transition-all
                      ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                      }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelling...
                      </span>
                    ) : 'Cancel Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 