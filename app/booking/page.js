'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { format, addDays, isAfter, startOfDay } from 'date-fns';

export default function BookingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    city: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetchAvailability();
    checkUserAndLoadCustomerInfo();
  }, []);

  const checkUserAndLoadCustomerInfo = async () => {
    try {
      setLoadingUser(true);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setUser(authUser);

      // Fetch customer record for this user
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
      }

      // If customer record exists, auto-fill form
      if (customerData) {
        // Try to get city from last appointment
        const { data: lastAppointment } = await supabase
          .from('appointments')
          .select('city')
          .eq('customer_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setFormData(prev => ({
          ...prev,
          name: customerData.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          email: customerData.email || authUser.email || '',
          phone: customerData.phone || '',
          city: lastAppointment?.city || customerData.address?.split(',').pop()?.trim() || '', // Get city from last appointment or address
          service: customerData.service_type?.replace('_', ' ') || '',
        }));
      } else {
        // If no customer record, try to get from user metadata or profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
            email: authUser.email || '',
            phone: profile.phone || '',
          }));
        } else {
          // Just use auth user info
          setFormData(prev => ({
            ...prev,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
            email: authUser.email || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = addDays(new Date(), 30).toISOString().split('T')[0];
      
      const response = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      if (data.availableDates) {
        setAvailableDates(data.availableDates);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // When date changes, update available times
    if (name === 'preferredDate') {
      const selectedDate = availableDates.find(d => d.date === value);
      if (selectedDate) {
        setAvailableTimes(selectedDate.times);
        // Clear time if not available for new date
        if (selectedDate.times.length > 0 && !selectedDate.times.includes(formData.preferredTime)) {
          setFormData(prev => ({ ...prev, [name]: value, preferredTime: '' }));
        }
      } else {
        setAvailableTimes([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Combine date and time
      let appointmentDate = new Date();
      if (formData.preferredDate) {
        const [year, month, day] = formData.preferredDate.split('-');
        appointmentDate = new Date(year, month - 1, day);
        
        if (formData.preferredTime) {
          const [time, period] = formData.preferredTime.split(' ');
          let [hours, minutes] = time.split(':');
          hours = parseInt(hours);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          appointmentDate.setHours(hours, parseInt(minutes) || 0);
        } else {
          appointmentDate.setHours(10, 0); // Default to 10 AM
        }
      } else {
        // Default to tomorrow at 10 AM if no date selected
        appointmentDate.setDate(appointmentDate.getDate() + 1);
        appointmentDate.setHours(10, 0);
      }

      const appointmentData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        service_type: formData.service,
        city: formData.city,
        street_address: '',
        date: appointmentDate.toISOString(),
        notes: formData.notes || `Service: ${formData.service} in ${formData.city}${formData.preferredDate ? `. Preferred date: ${formData.preferredDate}${formData.preferredTime ? ` at ${formData.preferredTime}` : ''}` : ''}`,
        status: 'pending',
        booking_type: 'Ready to Hire',
        customer_id: user?.id || null // Set customer_id if user is logged in
      };

      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send notification
      const notificationMessage = `🌿 New Service Request!\n\n` +
        `👤 Name: ${formData.name}\n` +
        `📧 Email: ${formData.email}\n` +
        `📞 Phone: ${formData.phone}\n` +
        `📍 City: ${formData.city}\n` +
        `🔧 Service: ${formData.service}\n` +
        `📅 Preferred: ${formData.preferredDate ? format(appointmentDate, 'MMM d, yyyy h:mm a') : 'Flexible'}\n` +
        `📝 Notes: ${formData.notes || 'None'}`;

      await sendNotification(notificationMessage);

      setSuccess(true);
      // Clear form but keep user info if logged in
      if (user) {
        // Reload customer info to keep form pre-filled
        await checkUserAndLoadCustomerInfo();
        setFormData(prev => ({
          ...prev,
          preferredDate: '',
          preferredTime: '',
          notes: '',
          service: '' // Clear service so they can select a new one
        }));
      } else {
        // Clear everything for guest users
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          city: '',
          preferredDate: '',
          preferredTime: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setError(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
            <p className="text-gray-600 mb-6">
              We'll contact you soon to confirm your appointment.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Send Another Request
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Request Service</h1>
          <p className="text-gray-600">Fill out the form below and we'll get back to you quickly</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-5">
          {user && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded">
              <p className="text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Logged in as <strong>{formData.email}</strong>. Your information has been auto-filled.</span>
              </p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!user}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${
                  user ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="(401) 555-0123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                <option value="">Select service</option>
                <option value="Lawn Mowing">Lawn Mowing</option>
                <option value="Lawn Care">Lawn Care</option>
                <option value="Landscaping">Landscaping</option>
                <option value="Mulch Installation">Mulch Installation</option>
                <option value="Spring Cleanup">Spring Cleanup</option>
                <option value="Fall Cleanup">Fall Cleanup</option>
                <option value="Snow Removal">Snow Removal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                <option value="">Select city</option>
                <option value="Pawtucket">Pawtucket</option>
                <option value="Providence">Providence</option>
                <option value="East Providence">East Providence</option>
                <option value="Cranston">Cranston</option>
                <option value="Warwick">Warwick</option>
                <option value="Johnston">Johnston</option>
                <option value="Attleboro">Attleboro</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Preferred Date <span className="text-gray-400 font-normal text-xs">(We'll confirm availability)</span>
            </label>
            {loadingAvailability ? (
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                Loading available dates...
              </div>
            ) : (
              <select
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                <option value="">Select a date (optional)</option>
                {availableDates.slice(0, 14).map((dateInfo) => (
                  <option key={dateInfo.date} value={dateInfo.date}>
                    {format(new Date(dateInfo.date), 'EEEE, MMM d')} ({dateInfo.times.length} slots available)
                  </option>
                ))}
                {availableDates.length === 0 && (
                  <option value="" disabled>No available dates in next 2 weeks - we'll contact you</option>
                )}
              </select>
            )}
            {formData.preferredDate && availableTimes.length > 0 && (
              <p className="mt-1 text-xs text-green-600">
                {availableTimes.length} time slot{availableTimes.length !== 1 ? 's' : ''} available on this date
              </p>
            )}
          </div>

          {formData.preferredDate && availableTimes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Preferred Time <span className="text-gray-400 font-normal text-xs">(We'll aim for this time)</span>
              </label>
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                <option value="">Any available time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500 italic">
                💡 Note: We'll do our best to arrive at your preferred time, but we may need some flexibility since some jobs take longer than expected.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Any special requests or details..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-6 rounded-lg font-semibold text-lg transition-all ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Request'
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            We'll contact you within 24 hours to confirm your appointment
          </p>
        </form>
      </div>

      <Footer />
    </div>
  );
}
