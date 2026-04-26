'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckIcon } from '@heroicons/react/24/outline';

const LAWN_CARE_SERVICES = [
  { id: 'mowing', name: 'Lawn Mowing', description: 'Regular cutting and trimming of grass' },
  { id: 'fertilization', name: 'Lawn Fertilization', description: 'Nutrient application for healthy growth' },
  { id: 'weed_control', name: 'Weed Control', description: 'Pre and post-emergent weed treatment' },
  { id: 'aeration', name: 'Lawn Aeration', description: 'Core aeration to improve soil health' },
  { id: 'overseeding', name: 'Overseeding', description: 'Seeding to fill bare spots and improve density' },
  { id: 'mulching', name: 'Mulching', description: 'Garden bed mulching and maintenance' },
  { id: 'hedge_trimming', name: 'Hedge Trimming', description: 'Shaping and trimming of hedges and shrubs' },
  { id: 'garden_maintenance', name: 'Garden Maintenance', description: 'Regular garden bed care and maintenance' },
  { id: 'spring_cleanup', name: 'Spring Cleanup', description: 'Seasonal cleanup and preparation' },
  { id: 'fall_cleanup', name: 'Fall Cleanup', description: 'Leaf removal and seasonal cleanup' },
  { id: 'leaf_removal', name: 'Leaf Removal', description: 'Regular leaf removal service' },
  { id: 'snow_removal', name: 'Snow Removal', description: 'Winter snow plowing and shoveling' },
];

const SERVICE_FREQUENCIES = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'one_time', name: 'One-Time Service' },
  { id: 'seasonal', name: 'Seasonal' },
];

export default function ContractPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    propertySize: '',
    serviceFrequency: '',
    startDate: '',
    selectedServices: [],
    specialInstructions: '',
    agreedToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.agreedToTerms) {
      setError('Please agree to the terms and conditions to proceed.');
      return;
    }

    if (formData.selectedServices.length === 0) {
      setError('Please select at least one service.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create contract record
      const contractData = {
        customer_name: formData.customerName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        property_address: formData.address,
        city: formData.city,
        property_size: formData.propertySize,
        service_frequency: formData.serviceFrequency,
        start_date: formData.startDate || null,
        selected_services: formData.selectedServices,
        special_instructions: formData.specialInstructions,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Try to save to database (if contracts table exists)
      // Otherwise, just show success message
      try {
        const { error: dbError } = await supabase
          .from('contracts')
          .insert([contractData]);

        if (dbError && dbError.code !== '42P01') { // 42P01 = table doesn't exist
          console.error('Database error:', dbError);
        }
      } catch (dbErr) {
        // Table might not exist, that's okay
        console.log('Contracts table may not exist, continuing...');
      }

      // Also create an appointment/lead
      const appointmentData = {
        customer_name: formData.customerName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        service_type: formData.selectedServices.join(', '),
        city: formData.city,
        street_address: formData.address,
        date: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        notes: `Contract Request\n\nProperty Size: ${formData.propertySize}\nFrequency: ${formData.serviceFrequency}\nServices: ${formData.selectedServices.map(id => LAWN_CARE_SERVICES.find(s => s.id === id)?.name).join(', ')}\n\nSpecial Instructions: ${formData.specialInstructions || 'None'}`,
        status: 'pending',
        booking_type: 'Contract Request'
      };

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (appointmentError) {
        console.error('Appointment error:', appointmentError);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting contract:', err);
      setError('Failed to submit contract. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Contract Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in our lawn care services. We've received your contract request and will contact you shortly to discuss your selected services and finalize the details.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Selected Services:</strong> {formData.selectedServices.map(id => LAWN_CARE_SERVICES.find(s => s.id === id)?.name).join(', ')}
              </p>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  customerName: '',
                  email: '',
                  phone: '',
                  address: '',
                  city: '',
                  propertySize: '',
                  serviceFrequency: '',
                  startDate: '',
                  selectedServices: [],
                  specialInstructions: '',
                  agreedToTerms: false,
                });
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Another Contract
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Lawn Care Maintenance Contract</h1>
          <p className="text-gray-600 mb-6">Select the services you'd like for your property</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Customer Information */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="(401) 555-0123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
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
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
            </section>

            {/* Property Details */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="propertySize"
                    value={formData.propertySize}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  >
                    <option value="">Select size</option>
                    <option value="Less than 1/4 acre">Less than 1/4 acre</option>
                    <option value="1/4 to 1/2 acre">1/4 to 1/2 acre</option>
                    <option value="1/2 to 1 acre">1/2 to 1 acre</option>
                    <option value="1 to 2 acres">1 to 2 acres</option>
                    <option value="More than 2 acres">More than 2 acres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="serviceFrequency"
                    value={formData.serviceFrequency}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  >
                    <option value="">Select frequency</option>
                    {SERVICE_FREQUENCIES.map(freq => (
                      <option key={freq.id} value={freq.id}>{freq.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Service Selection */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Select Services <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">Check all services you'd like included in your maintenance plan:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LAWN_CARE_SERVICES.map(service => (
                  <label
                    key={service.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.selectedServices.includes(service.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="mt-1 mr-3 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{service.name}</div>
                      <div className="text-sm text-gray-600">{service.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Special Instructions */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Special Instructions</h2>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Any special requests, property access instructions, or notes about your property..."
              />
            </section>

            {/* Terms Agreement */}
            <section>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  required
                  className="mt-1 mr-3 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the terms and conditions of this lawn care maintenance contract. I understand that pricing will be discussed and finalized before services begin. <span className="text-red-500">*</span>
                </span>
              </label>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Contract Request'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

