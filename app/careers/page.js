'use client';

import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';
import { 
  BriefcaseIcon, 
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function CareersPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'RI',
    zipCode: '',
    position: '',
    experience: '',
    availability: '',
    startDate: '',
    salaryExpectation: '',
    previousEmployer: '',
    references: '',
    whyInterested: '',
    additionalInfo: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
  }, []);

  const positions = [
    'Landscaping Worker (Will Train)'
  ];

  const experienceLevels = [
    'No experience (willing to learn)',
    '1-2 years',
    '3-5 years',
    '5+ years'
  ];

  const availabilityOptions = [
    'Full-time',
    'Part-time',
    'Seasonal',
    'Weekends only',
    'Flexible'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Save to database
      const { data: applicationData, error: dbError } = await supabaseAdmin
        .from('job_applications')
        .insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          position: formData.position,
          experience: formData.experience,
          availability: formData.availability,
          start_date: formData.startDate || null,
          salary_expectation: formData.salaryExpectation,
          previous_employer: formData.previousEmployer,
          references: formData.references,
          why_interested: formData.whyInterested,
          additional_info: formData.additionalInfo,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue with email even if DB fails
      }

      // Send email notification
      const templateParams = {
        to_name: 'Flora Lawn & Landscaping',
        applicant_name: `${formData.firstName} ${formData.lastName}`,
        applicant_email: formData.email,
        applicant_phone: formData.phone,
        position: formData.position,
        experience: formData.experience,
        availability: formData.availability,
        message: `New job application received from ${formData.firstName} ${formData.lastName} for ${formData.position} position.`,
        reply_to: formData.email
      };

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams
      );

      // Send Telegram notification
      const notificationMessage = `📋 New Job Application!\n\n` +
        `👤 Name: ${formData.firstName} ${formData.lastName}\n` +
        `📧 Email: ${formData.email}\n` +
        `📞 Phone: ${formData.phone}\n` +
        `💼 Position: ${formData.position}\n` +
        `📍 Location: ${formData.city}, ${formData.state}\n` +
        `⏰ Availability: ${formData.availability}\n` +
        `🎓 Experience: ${formData.experience}\n` +
        `📅 Start Date: ${formData.startDate || 'Flexible'}\n` +
        `💰 Salary Expectation: ${formData.salaryExpectation || 'Not specified'}`;

      await sendNotification(notificationMessage);

      setStatus({
        type: 'success',
        message: 'Thank you for your application! We\'ll review it and get back to you within 3-5 business days.'
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: 'RI',
        zipCode: '',
        position: '',
        experience: '',
        availability: '',
        startDate: '',
        salaryExpectation: '',
        previousEmployer: '',
        references: '',
        whyInterested: '',
        additionalInfo: ''
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      setStatus({
        type: 'error',
        message: 'There was an error submitting your application. Please try again or call us directly at (401) 389-0913.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <BriefcaseIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              We're hiring! Learn landscaping, grass cutting, mulching, leaf removal, snow removal, and more. No experience required - we'll train you!
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <div className="text-2xl font-bold">2026</div>
                <div className="text-sm text-green-100">Hiring Year</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
                <div className="text-2xl font-bold">RI Only</div>
                <div className="text-sm text-green-100">Service Area</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Work With Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Perfect opportunity to learn landscaping skills! We'll teach you everything: cutting grass, mulching, leaf removal, snow removal, and more. No experience needed - just a willingness to learn and work hard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-green-50">
              <AcademicCapIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Full Training Provided</h3>
              <p className="text-gray-600">Learn landscaping, grass cutting, mulching, leaf removal, snow removal, and all aspects of the job. No experience required!</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-green-50">
              <CurrencyDollarIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Competitive Pay</h3>
              <p className="text-gray-600">Fair wages with opportunities for raises as you gain experience and skills</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-green-50">
              <ClockIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Flexible Schedule</h3>
              <p className="text-gray-600">Work-life balance with flexible hours. Seasonal work available for snow removal</p>
            </div>
          </div>

          {/* What You'll Learn Section */}
          <div className="mt-12 bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What You'll Learn</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Grass Cutting & Lawn Care</h4>
                  <p className="text-gray-600 text-sm">Proper mowing techniques, edging, trimming, and lawn maintenance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Mulch Installation</h4>
                  <p className="text-gray-600 text-sm">Bed preparation, spreading techniques, and cleanup</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Leaf Removal</h4>
                  <p className="text-gray-600 text-sm">Efficient leaf collection, bagging, and disposal methods</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Snow Removal</h4>
                  <p className="text-gray-600 text-sm">Plowing, shoveling, salting, and winter maintenance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Landscaping Basics</h4>
                  <p className="text-gray-600 text-sm">Plant care, bed maintenance, and general landscaping skills</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Equipment Operation</h4>
                  <p className="text-gray-600 text-sm">Safe operation of mowers, trimmers, blowers, and other tools</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Application</h2>
              <p className="text-gray-600">Fill out the form below to apply for a position with our team</p>
            </div>

            {/* Status Message */}
            {status.message && (
              <div className={`mb-8 p-6 rounded-xl ${
                status.type === 'success' 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {status.type === 'success' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  )}
                  <p className={`text-base font-medium ${
                    status.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {status.message}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-6 w-6 mr-2 text-green-600" />
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(401) 555-0123"
                        required
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                    <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        disabled
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-100"
                      >
                        <option value="RI">RI (Rhode Island Only)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Positions available in Rhode Island only</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Position & Experience */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="h-6 w-6 mr-2 text-green-600" />
                  Position & Experience
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position Applying For <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    >
                      <option value="">Select a position</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    >
                      <option value="">Select experience level</option>
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">No experience? No problem! We provide full training.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    >
                      <option value="">Select availability</option>
                      {availabilityOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Expectation
                    </label>
                    <input
                      type="text"
                      name="salaryExpectation"
                      value={formData.salaryExpectation}
                      onChange={handleChange}
                      placeholder="$17-20/hour (negotiable)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="h-6 w-6 mr-2 text-green-600" />
                  Background
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Employer (if applicable)
                    </label>
                    <input
                      type="text"
                      name="previousEmployer"
                      value={formData.previousEmployer}
                      onChange={handleChange}
                      placeholder="Company name and position"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-2 text-green-600" />
                  Additional Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why are you interested in working with us? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="whyInterested"
                      value={formData.whyInterested}
                      onChange={handleChange}
                      rows={4}
                      required
                      placeholder="Tell us why you'd be a great fit for our team..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      References
                    </label>
                    <textarea
                      name="references"
                      value={formData.references}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Name, relationship, and contact information"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Anything else you'd like us to know..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-8 rounded-lg font-bold text-lg shadow-lg hover:from-green-700 hover:to-green-800 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
                <p className="text-center text-gray-500 text-sm mt-4">
                  We'll review your application and contact you within 3-5 business days
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions About Working With Us?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Feel free to reach out if you have any questions about our open positions
          </p>
          <a
            href="tel:4013890913"
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <PhoneIcon className="h-6 w-6" />
            Call Us: (401) 389-0913
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

