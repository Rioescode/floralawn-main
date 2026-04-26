'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { sendNotification } from '@/lib/notifications';
import { generateNotes, generateThanks } from '@/lib/anthropic';
import Link from 'next/link';

// Service templates for note generation
const SERVICE_TEMPLATES = {
  'Lawn Mowing': 'I need regular lawn mowing service for my property. The lawn is [describe size/condition]. I would like service [weekly/bi-weekly/monthly].',
  'Lawn Fertilization': 'I need lawn fertilization service for my property. The lawn is [describe size/condition]. Looking to improve grass health and growth.',
  'Weed Control': 'I need weed control service for my lawn. The property has [describe weed situation]. Looking for treatment to control and prevent weeds.',
  'Lawn Aeration': 'I need lawn aeration service. The soil is [describe compaction/condition]. Looking to improve lawn health and drainage.',
  'Overseeding': 'I need overseeding service for my lawn. The grass is [describe current state]. Looking to fill in bare spots and improve density.',
  'Lawn Maintenance': 'I need regular lawn maintenance service. The property requires [describe needs]. Looking for [weekly/bi-weekly] maintenance.',
  'Mulching': 'I need mulching service for my garden beds. The area is approximately [describe size]. Looking for [type/color] mulch installation.',
  'Hedge Trimming': 'I need hedge trimming service. Have [describe number/type] of hedges that need shaping and maintenance.',
  'Garden Maintenance': 'I need garden maintenance service. The garden area is [describe size/type]. Looking for [describe specific needs].',
  'Planting': 'I need planting service for my property. Looking to plant [describe plants/area]. The space is [describe location/conditions].',
  'Landscape Design': 'I need landscape design service. The area is [describe size/current state]. Looking for [describe design goals].',
  'Spring Cleanup': 'I need spring cleanup service. The property requires [describe cleanup needs]. Looking to prepare for the growing season.',
  'Fall Cleanup': 'I need fall cleanup service. The property has [describe leaf situation/needs]. Looking for thorough seasonal cleanup.',
  'Leaf Removal': 'I need leaf removal service. The property has [describe leaf coverage]. Looking for [one-time/regular] leaf removal.',
  'Snow Removal': 'I need snow removal service. The property has [describe areas needing clearing]. Looking for [on-call/seasonal] service.',
  'Commercial Lawn Care': 'Need commercial lawn care service for business property. The area is [describe size/type]. Looking for [frequency] service.',
  'Commercial Landscaping': 'Need commercial landscaping service. The property requires [describe needs]. Looking for [describe specific services].',
  'Property Maintenance': 'Need property maintenance service. The property requires [describe needs]. Looking for [frequency] maintenance.',
  'Other': 'I need landscaping service for my property. Specifically looking for [describe needs]. The property is [describe relevant details].'
};

export default function BookingForm({ selectedDate, onSuccess }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    service: '',
    notes: '',
    bookingType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('');

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Get customer profile with saved preferences
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        // Get customer's previous appointments to pre-fill preferences
        const { data: lastAppointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setUser(user);
        
        // Pre-fill form with profile data and last appointment preferences
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          name: profile?.full_name || user.user_metadata?.full_name || '',
          phone: profile?.phone || lastAppointment?.customer_phone || '',
          city: profile?.preferred_city || lastAppointment?.city || '',
          service: lastAppointment?.service_type || '',
          notes: '',
          bookingType: ''
        }));

        // Update profile if needed
        if (profile && (!profile.phone || !profile.full_name)) {
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name,
              phone: lastAppointment?.customer_phone || '',
              preferred_city: lastAppointment?.city || '',
              role: 'customer'
            });
          
          if (updateError) {
            console.error('Error updating profile:', updateError);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
        // Don't set error here, just set user to null for non-logged in flow
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        getUser(); // Reuse the same function to get user data
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setFormData(prev => ({
          ...prev,
          email: '',
          name: '',
          phone: '',
          city: '',
          service: '',
          notes: '',
          bookingType: ''
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Removed auto-note generation for faster form
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Simple, fast booking - always allow guest bookings
      const appointmentData = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        service_type: formData.service,
        city: formData.city,
        street_address: formData.address || '',
        date: selectedDate.toISOString(),
        notes: formData.notes || `Service: ${formData.service} in ${formData.city}`,
        status: 'pending',
        booking_type: 'Ready to Hire'
      };

      // Add customer_id if user is logged in
      if (user) {
        appointmentData.customer_id = user.id;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;

      // Send Telegram notification
      const notificationMessage = `🌿 New Service Request!\n\n` +
        `👤 Name: ${formData.name}\n` +
        `📧 Email: ${formData.email}\n` +
        `📞 Phone: ${formData.phone}\n` +
        `📍 Location: ${formData.address ? formData.address + ', ' : ''}${formData.city}\n` +
        `🔧 Service: ${formData.service}\n` +
        `📅 Date: ${format(selectedDate, 'PPpp')}\n` +
        `📝 Notes: ${formData.notes || 'No additional notes'}`;

      await sendNotification(notificationMessage);

      if (onSuccess) {
        onSuccess();
      }

      // Clear form (keep email if user is logged in)
      setFormData({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        service: '',
        notes: '',
        bookingType: ''
      });

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to schedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!formData.service || !formData.city || !formData.bookingType) {
      setError('Please select a service type and city first');
      return;
    }

    try {
      setError('');
      setIsGeneratingNotes(true);
      const generatedNotes = await generateNotes(
        formData.service,
        formData.city,
        formData.bookingType
      );
      
      if (generatedNotes) {
        setFormData(prev => ({ ...prev, notes: generatedNotes }));
      } else {
        throw new Error('No notes were generated. Please try again.');
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      setError(error.message || 'Failed to generate notes. Please try again or write them manually.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (thankYouMessage) {
    return (
      <div className="text-center py-6 sm:py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-green-600 mb-6">
          ✨ Appointment Successfully Booked! ✨
        </h2>
        
        <div className="bg-green-50 px-4 sm:px-8 py-6 rounded-xl mb-8 max-w-2xl mx-auto">
          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
            {thankYouMessage.split('\n\n').map((paragraph, i) => (
              <span key={i} className="block mb-4 last:mb-0">{paragraph}</span>
            ))}
          </p>
        </div>
        
        {!user && (
          <div className="bg-blue-50 p-3 sm:p-4 rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-blue-800 font-medium mb-1">
                  Want to manage your bookings?
                </h3>
                <p className="text-sm text-blue-600">
                  Schedule, reschedule, or cancel appointments anytime
                </p>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                <Link
                  href="/login?redirect=/booking"
                  className="w-full sm:w-auto text-center shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?redirect=/booking"
                  className="w-full sm:w-auto text-center shrink-0 border-2 border-blue-600 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 justify-center">
          {user && (
          <button
            onClick={() => {
              setThankYouMessage('');
              router.push('/customer/dashboard');
            }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-all"
          >
            See My Appointments
          </button>
          )}
          <button
            onClick={() => {
              setThankYouMessage('');
              router.push('/booking');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-green-600 text-base font-medium rounded-lg text-green-600 bg-white hover:bg-green-50 transition-all"
          >
            Book Another Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 p-3 sm:p-4 rounded-xl mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-blue-800 font-medium mb-1">
                Want to manage your bookings?
              </h3>
              <p className="text-sm text-blue-600">
                Schedule, reschedule, or cancel appointments anytime
              </p>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              <Link
                href="/login?redirect=/booking"
                className="w-full sm:w-auto text-center shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/login?redirect=/booking"
                className="w-full sm:w-auto text-center shrink-0 border-2 border-blue-600 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold mb-2 text-gray-800">
          Selected Date & Time
        </label>
        <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border-2 border-gray-200">
          {format(selectedDate, 'MMMM d, yyyy h:mm a')}
        </div>
        <p className="mt-2 text-sm text-gray-500 italic">
          * We'll confirm your preferred time or suggest alternatives based on availability.
        </p>
      </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
              disabled={user?.email}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(401) 555-0123"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
            >
              <option value="">Select service</option>
              <optgroup label="Lawn Care Services">
                <option value="Lawn Mowing">Lawn Mowing</option>
                <option value="Lawn Fertilization">Lawn Fertilization</option>
                <option value="Weed Control">Weed Control</option>
                <option value="Lawn Aeration">Lawn Aeration</option>
                <option value="Overseeding">Overseeding</option>
                <option value="Lawn Maintenance">Lawn Maintenance</option>
              </optgroup>
              <optgroup label="Landscaping Services">
                <option value="Mulching">Mulching</option>
                <option value="Hedge Trimming">Hedge Trimming</option>
                <option value="Garden Maintenance">Garden Maintenance</option>
                <option value="Planting">Planting</option>
                <option value="Landscape Design">Landscape Design</option>
              </optgroup>
              <optgroup label="Seasonal Services">
                <option value="Spring Cleanup">Spring Cleanup</option>
                <option value="Fall Cleanup">Fall Cleanup</option>
                <option value="Leaf Removal">Leaf Removal</option>
                <option value="Snow Removal">Snow Removal</option>
              </optgroup>
              <optgroup label="Commercial Services">
                <option value="Commercial Lawn Care">Commercial Lawn Care</option>
                <option value="Commercial Landscaping">Commercial Landscaping</option>
                <option value="Property Maintenance">Property Maintenance</option>
              </optgroup>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              City <span className="text-red-500">*</span>
            </label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
            >
              <option value="">Select city</option>
              <option value="Pawtucket">Pawtucket</option>
              <option value="Providence">Providence</option>
              <option value="East Providence">East Providence</option>
              <option value="North Providence">North Providence</option>
              <option value="Johnston">Johnston</option>
              <option value="Cranston">Cranston</option>
              <option value="Warwick">Warwick</option>
              <option value="Attleboro">Attleboro</option>
              <option value="North Attleboro">North Attleboro</option>
              <option value="Cumberland">Cumberland</option>
              <option value="Woonsocket">Woonsocket</option>
              <option value="Barrington">Barrington</option>
              <option value="Bristol">Bristol</option>
              <option value="Warren">Warren</option>
              <option value="Newport">Newport</option>
              <option value="Middletown">Middletown</option>
              <option value="Portsmouth">Portsmouth</option>
              <option value="Other">Other RI City (Please specify in notes)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Address <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St (optional)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Additional Notes <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requests or details..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400 min-h-[80px]"
            />
          </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.service || !formData.city}
        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all shadow-lg
          ${isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.service || !formData.city
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl'
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
    </form>
  );
} 