'use client';

import { useState } from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function QuoteForm({ city, service }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertySize: 'Less than 1/4 acre',
    address: '',
    message: '',
    preferredTime: 'morning',
    serviceDate: '',
    howDidYouHear: '',
    serviceType: service?.title || 'General Service',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      setSubmitted(true);
    } catch (err) {
      setError('There was a problem submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">
          Your quote request has been received. We'll contact you within 24 hours to discuss your {service?.title.toLowerCase() || 'service'} needs.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-green-600 font-medium hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Size</label>
          <select
            name="propertySize"
            value={formData.propertySize}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
          >
            <option value="Less than 1/4 acre">Less than 1/4 acre</option>
            <option value="1/4 to 1/2 acre">1/4 to 1/2 acre</option>
            <option value="1/2 to 1 acre">1/2 to 1 acre</option>
            <option value="More than 1 acre">More than 1 acre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder={`Enter your address in ${city?.name || 'Rhode Island'}`}
            className="pl-10 w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="serviceDate"
              value={formData.serviceDate}
              onChange={handleChange}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
            >
              <option value="morning">Morning (8am - 12pm)</option>
              <option value="afternoon">Afternoon (12pm - 4pm)</option>
              <option value="evening">Evening (4pm - 7pm)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed</label>
        <select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          className="w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
        >
          <option value={service?.title || 'General Service'}>{service?.title || 'General Service'}</option>
          <option value="Lawn Mowing">Lawn Mowing</option>
          <option value="Landscaping">Landscaping</option>
          <option value="Yard Cleanup">Yard Cleanup</option>
          <option value="Hedge Trimming">Hedge Trimming</option>
          <option value="Mulching">Mulching</option>
          <option value="Other">Other Services</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Details
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
          rows="3"
          placeholder="Tell us about your project or any specific requirements..."
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
        <select
          name="howDidYouHear"
          value={formData.howDidYouHear}
          onChange={handleChange}
          className="w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 shadow-sm"
        >
          <option value="">Please select...</option>
          <option value="google">Google Search</option>
          <option value="referral">Friend/Family Referral</option>
          <option value="social">Social Media</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors ${
          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          'Get Free Quote'
        )}
      </button>

      <div className="flex items-center justify-center space-x-2">
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-gray-500">
          Your information is secure and will never be shared
        </p>
      </div>
    </form>
  );
} 