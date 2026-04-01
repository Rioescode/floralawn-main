'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { sendNotification } from '@/lib/notifications';
import { businessInfo } from '@/utils/business-info';
import emailjs from '@emailjs/browser';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ShieldCheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function SpringCleanupFunnel() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    service: 'Spring Cleanup', // Pre-filled
    message: ''
  });
  
  // Email marketing preferences
  const [emailPreferences, setEmailPreferences] = useState({
    subscribe: false,
    frequency: 'monthly'
  });
  
  // SMS preferences
  const [smsPreferences, setSmsPreferences] = useState({
    subscribe: false
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessageHelper, setShowMessageHelper] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(50);

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    setShowMessageHelper(true); // Show helper since service is pre-filled
  }, []);

  useEffect(() => {
    // Simulate spots remaining
    const timer = setInterval(() => {
      setSpotsLeft(prev => prev > 0 ? prev - Math.floor(Math.random() * 2) : prev);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      service: value
    }));
  };

  const insertTemplate = () => {
    const template = 'I need spring cleanup service. The property is approximately [describe size]. I need help with [specific tasks like leaf removal, debris cleanup, bed maintenance, pruning, mulching, etc.].';
    setFormData(prev => ({
      ...prev,
      message: template
    }));
    setShowMessageHelper(false);
  };

  const convertServiceTypeToDbFormat = (serviceType) => {
    if (!serviceType) return 'spring_cleanup';
    return serviceType.toLowerCase().replace(/\s+/g, '_');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const templateParams = {
        user_name: formData.name,
        user_email: formData.email,
        user_phone: formData.phone,
        user_address: `${formData.address}, ${formData.city}, RI`,
        service_type: convertServiceTypeToDbFormat(formData.service),
        message: formData.message,
        to_name: process.env.NEXT_PUBLIC_APP_NAME,
        reply_to: formData.email
      };

      const response = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams
      );

      const isSuccess = response.status === 200 || response.text === 'OK';
      
      if (isSuccess) {
        // Save email and SMS preferences
        const hasEmailPreferences = emailPreferences.subscribe;
        const hasSmsPreferences = smsPreferences.subscribe;
        
        if (hasEmailPreferences || hasSmsPreferences) {
          try {
            const preferencesData = {
              email: {
                subscribe: hasEmailPreferences,
                frequency: emailPreferences.frequency || 'monthly',
                coupons: hasEmailPreferences,
                seasonal: hasEmailPreferences,
                updates: hasEmailPreferences,
                newsletter: hasEmailPreferences
              },
              sms: {
                subscribe: hasSmsPreferences,
                confirmations: hasSmsPreferences,
                reminders: hasSmsPreferences
              }
            };

            const { data, error } = await supabaseAdmin
              .from('email_subscribers')
              .upsert({
                name: formData.name,
                email: formData.email.toLowerCase().trim(),
                phone: formData.phone || null,
                city: formData.city || null,
                source: 'spring_cleanup_funnel',
                preferences: preferencesData,
                sms_consent: hasSmsPreferences,
                subscribed_at: new Date().toISOString(),
                is_active: true,
                unsubscribed_at: null,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'email',
                ignoreDuplicates: false
              })
              .select();
            
            if (error) {
              console.error('Error saving preferences:', error);
            }
          } catch (dbError) {
            console.error('Database error saving preferences:', dbError);
          }
        }

        // Create pending customer
        try {
          const { data: customerData, error: customerError } = await supabaseAdmin
            .from('customers')
            .insert([{
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: `${formData.address}, ${formData.city}, RI`,
              service_type: convertServiceTypeToDbFormat(formData.service),
              status: 'pending',
              frequency: 'monthly',
              price: 0,
              notes: `Spring cleanup funnel inquiry: ${formData.message}`,
              created_at: new Date().toISOString(),
              next_service: null
            }])
            .select();
          
          if (customerError) {
            console.error('Error creating pending customer:', customerError);
          }
        } catch (customerDbError) {
          console.error('Customer database error:', customerDbError);
        }

        // Create appointment/lead
        try {
          const appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 1);
          appointmentDate.setHours(10, 0);

          const { data: appointmentData, error: appointmentError } = await supabaseAdmin
            .from('appointments')
            .insert([{
              customer_name: formData.name,
              customer_email: formData.email,
              customer_phone: formData.phone,
              service_type: formData.service,
              city: formData.city,
              street_address: formData.address || '',
              date: appointmentDate.toISOString(),
              notes: `Spring cleanup funnel inquiry: ${formData.message}`,
              status: 'pending',
              booking_type: 'Ready to Hire'
            }])
            .select();
          
          if (appointmentError) {
            console.error('Error creating appointment:', appointmentError);
          }
        } catch (appointmentDbError) {
          console.error('Appointment database error:', appointmentDbError);
        }

        // Send notification
        const emailPrefText = hasEmailPreferences ? 
          `\n📧 Email Subscription: Yes (${emailPreferences.frequency} emails)` : '';
        const smsPrefText = hasSmsPreferences ? 
          `\n📱 SMS Subscription: Yes` : '';

        const notificationMessage = `🌱 New Spring Cleanup Lead!\n\n` +
          `👤 Name: ${formData.name}\n` +
          `📧 Email: ${formData.email}\n` +
          `📞 Phone: ${formData.phone}\n` +
          `📍 Address: ${formData.address}, ${formData.city}, RI\n` +
          `💬 Message: ${formData.message}${emailPrefText}${smsPrefText}`;

        try {
          await sendNotification(notificationMessage);
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }

        // Send confirmation email
        let emailSent = false;
        try {
          const emailResponse = await fetch('/api/send-contact-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              name: formData.name,
              service: formData.service || 'Spring Cleanup',
              message: formData.message || '',
              phone: formData.phone || '',
              sendSMS: smsPreferences.subscribe
            })
          });
          
          if (emailResponse.ok) {
            emailSent = true;
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        const successMessage = emailSent 
          ? '✅ Thank you! Your spring cleanup request has been received. We\'ll contact you within 24 hours to schedule your service. A confirmation email has been sent!'
          : '✅ Thank you! Your spring cleanup request has been received. We\'ll contact you within 24 hours to schedule your service.';
        
        setStatus({
          type: 'success',
          message: successMessage
        });
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          service: 'Spring Cleanup',
          message: ''
        });
        setEmailPreferences({
          subscribe: false,
          frequency: 'monthly'
        });
        setSmsPreferences({
          subscribe: false
        });
        
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error(`Failed to send message. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus({
        type: 'error',
        message: '❌ There was an error sending your request. Please try again or call us directly at (401) 389-0913.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                🌱 SPRING SPECIAL
              </span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Get Your Yard <span className="text-green-600">Spring-Ready</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional spring cleanup services to transform your yard after winter. 
              <span className="font-semibold text-green-600"> Limited spots available!</span>
            </p>

            {/* Urgency Banner */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-full mb-8">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-semibold">
                Only {spotsLeft} spots left for early spring bookings!
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckCircleIcon className="h-8 w-8" />,
                title: 'Complete Cleanup',
                description: 'Leaf removal, debris cleanup, bed preparation, and more'
              },
              {
                icon: <CalendarIcon className="h-8 w-8" />,
                title: 'Early Booking Discount',
                description: 'Save up to 20% when you book before March 15th'
              },
              {
                icon: <ShieldCheckIcon className="h-8 w-8" />,
                title: 'Satisfaction Guaranteed',
                description: '100% satisfaction guarantee or we\'ll make it right'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-center p-6 bg-green-50 rounded-xl"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Spring Services Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm tracking-wider uppercase">Spring Services</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-gray-900">Complete Spring Lawn Care Services</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get your yard ready for spring with our comprehensive range of professional services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Spring Cleanup',
                icon: '🌱',
                description: 'Complete yard cleanup including leaf removal, debris cleanup, and bed preparation',
                features: ['Leaf removal', 'Debris cleanup', 'Bed preparation', 'Pruning']
              },
              {
                title: 'Lawn Mowing',
                icon: '✂️',
                description: 'Professional grass cutting with precise heights, edging, and cleanup',
                features: ['Grass cutting', 'String trimming', 'Edging', 'Cleanup']
              },
              {
                title: 'Lawn Fertilization',
                icon: '🌿',
                description: 'Spring fertilization to promote healthy growth and green-up',
                features: ['Pre-emergent weed control', 'Fertilizer application', 'Soil conditioning']
              },
              {
                title: 'Lawn Aeration',
                icon: '🌍',
                description: 'Core aeration to improve soil health and root growth',
                features: ['Core aeration', 'Overseeding', 'Soil improvement']
              },
              {
                title: 'Overseeding',
                icon: '🌾',
                description: 'Fill bare spots and improve lawn density for a lush green yard',
                features: ['Seed application', 'Bare spot repair', 'Lawn thickening']
              },
              {
                title: 'Weed Control',
                icon: '🌱',
                description: 'Pre and post-emergent weed treatments to keep your lawn weed-free',
                features: ['Pre-emergent treatment', 'Post-emergent control', 'Crabgrass prevention']
              },
              {
                title: 'Mulch Installation',
                icon: '🍂',
                description: 'Fresh mulch application to enhance garden beds and suppress weeds',
                features: ['Bed preparation', 'Mulch spreading', 'Edge trimming']
              },
              {
                title: 'Hedge Trimming',
                icon: '🌳',
                description: 'Professional shaping and trimming of hedges and shrubs',
                features: ['Shaping', 'Trimming', 'Cleanup']
              },
              {
                title: 'Garden Bed Maintenance',
                icon: '🌷',
                description: 'Complete garden bed care including weeding, edging, and preparation',
                features: ['Weeding', 'Edging', 'Bed preparation', 'Plant care']
              },
              {
                title: 'Pruning & Trimming',
                icon: '✂️',
                description: 'Expert pruning of trees and shrubs to promote healthy growth',
                features: ['Tree pruning', 'Shrub trimming', 'Dead branch removal']
              },
              {
                title: 'Dethatching',
                icon: '🌾',
                description: 'Remove thatch buildup to improve water and nutrient absorption',
                features: ['Thatch removal', 'Lawn health improvement']
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{service.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              Book multiple spring services together and save! Our team can handle all your spring lawn care needs in one visit.
            </p>
            <Link
              href="/contact?service=Spring Cleanup"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg shadow-lg hover:from-green-700 hover:to-green-800 transform hover:-translate-y-0.5 transition-all"
            >
              Get Free Estimate for All Spring Services
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success/Error Message */}
          {status.message && (
            <div 
              className={`mb-8 p-8 rounded-xl shadow-lg max-w-2xl mx-auto ${
                status.type === 'success' 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500' 
                  : 'bg-red-50 border-2 border-red-500'
              }`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">
                  {status.type === 'success' ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    status.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {status.type === 'success' ? 'Request Received!' : 'Error Sending Request'}
                  </h3>
                  <p className={`text-lg leading-relaxed ${
                    status.type === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {status.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-8 border-t-4 border-green-500">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Account Link */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center mb-3">
                    <div className="bg-green-100 rounded-full p-2 mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">🎁 Create Account & Earn Rewards!</h3>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <p className="text-gray-800 font-semibold text-sm">
                      ✨ Create a free account and unlock exclusive benefits:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">💰</span>
                        <span><strong>Earn Loyalty Points</strong> - Get points for every service, redeem for discounts!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">🎁</span>
                        <span><strong>Referral Rewards</strong> - Earn $25-$100 when friends sign up with your code!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">⚡</span>
                        <span><strong>Faster Booking</strong> - Quick access to schedule, skip, or reschedule services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">📱</span>
                        <span><strong>Service Management</strong> - View your schedule, service history, and invoices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">🎫</span>
                        <span><strong>Exclusive Discounts</strong> - Account holders get special offers and early access</span>
                      </li>
                    </ul>
                  </div>

                  {/* Sign Up with Google Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (typeof window === 'undefined') {
                          alert('Please enable JavaScript to sign in.');
                          return;
                        }

                        const origin = window.location.origin;
                        const isSecure = window.location.protocol === 'https:' || 
                                        window.location.hostname === 'localhost' || 
                                        window.location.hostname === '127.0.0.1' ||
                                        origin.includes('localhost');
                        
                        if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                          console.warn('Non-secure context detected, but proceeding with OAuth');
                        }
                        
                        const redirectUrl = `${origin}/auth/callback?redirect=/spring-cleanup`;
                        
                        const { data, error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: redirectUrl
                          }
                        });
                        
                        if (error) {
                          console.error('OAuth error:', error);
                          throw error;
                        }
                      } catch (err) {
                        console.error('Error with Google auth:', err);
                        const errorMessage = err?.message || 'Failed to sign up with Google. Please try again.';
                        alert(`Authentication error: ${errorMessage}`);
                      }
                    }}
                    className="inline-flex items-center justify-center w-full bg-white text-gray-700 border-2 border-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-md hover:shadow-lg mb-3"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    🎁 Sign Up Free & Start Earning Rewards!
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-green-50 text-gray-500">Or fill the form below</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Skip services • Cancel services • View schedule • Request other work
                  </p>
                </div>

                {/* Form Fields */}
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

                {/* Email */}
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
                  />
                </div>

                {/* Phone */}
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

                {/* Address */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Service Location City <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
                    required
                  >
                    <option value="">Select the city where service is needed</option>
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
                    <option value="Other">Other RI City (Please specify in message)</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Select the city where you need our service</p>
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleServiceChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
                    required
                  >
                    <optgroup label="Spring Services">
                      <option value="Spring Cleanup">Spring Cleanup</option>
                      <option value="Lawn Mowing">Lawn Mowing</option>
                      <option value="Lawn Fertilization">Lawn Fertilization</option>
                      <option value="Lawn Aeration">Lawn Aeration</option>
                      <option value="Overseeding">Overseeding</option>
                      <option value="Weed Control">Weed Control</option>
                      <option value="Mulch Installation">Mulch Installation</option>
                      <option value="Hedge Trimming">Hedge Trimming</option>
                      <option value="Garden Maintenance">Garden Maintenance</option>
                      <option value="Pruning & Trimming">Pruning & Trimming</option>
                      <option value="Dethatching">Dethatching</option>
                    </optgroup>
                    <optgroup label="Other Services">
                      <option value="Fall Cleanup">Fall Cleanup</option>
                      <option value="Leaf Removal">Leaf Removal</option>
                      <option value="Lawn Maintenance">Lawn Maintenance</option>
                      <option value="Snow Removal">Snow Removal</option>
                      <option value="Other">Other</option>
                    </optgroup>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-800">
                    Message <span className="text-red-500">*</span>
                  </label>
                  {showMessageHelper && (
                    <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 mb-2">
                        Need help writing your message? We can help you get started!
                      </p>
                      <button
                        type="button"
                        onClick={insertTemplate}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Click here to insert a template message
                      </button>
                    </div>
                  )}
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your spring cleanup needs..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
                    required
                  />
                </div>

                {/* Email & SMS Marketing Opt-in Section */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 rounded-full p-2 mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">📧 Stay Connected & Save Money!</h3>
                  </div>
                  
                  <p className="text-gray-700 mb-4 text-sm">
                    Get exclusive discounts, seasonal reminders, and landscaping tips. 
                    <span className="font-semibold text-green-700"> You can unsubscribe anytime!</span>
                  </p>

                  <div className="space-y-4">
                    {/* Email Opt-in */}
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-white/50 p-3 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={emailPreferences.subscribe}
                        onChange={(e) => setEmailPreferences(prev => ({...prev, subscribe: e.target.checked}))}
                        className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-800">📧 Yes, send me emails with:</span>
                        <p className="text-sm text-gray-600">🎫 Exclusive coupons • 🍂 Seasonal reminders • 📢 Service updates • 💡 Lawn care tips</p>
                      </div>
                    </label>

                    {/* SMS Opt-in */}
                    <label className="flex items-start space-x-3 cursor-pointer hover:bg-white/50 p-3 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={smsPreferences.subscribe}
                        onChange={(e) => setSmsPreferences(prev => ({...prev, subscribe: e.target.checked}))}
                        className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-800">📱 Yes, send me a text message confirmation</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Get instant confirmation via text when you submit your inquiry. 
                          <span className="font-semibold text-blue-700"> Standard message and data rates may apply.</span> Reply STOP to opt-out.
                        </p>
                      </div>
                    </label>

                    {(emailPreferences.subscribe || smsPreferences.subscribe) && (
                      <div className="ml-8 p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">
                          {emailPreferences.subscribe && smsPreferences.subscribe && "✅ You'll receive emails and text messages with valuable discounts and tips!"}
                          {emailPreferences.subscribe && !smsPreferences.subscribe && "✅ You'll receive valuable discounts and tips via email!"}
                          {!emailPreferences.subscribe && smsPreferences.subscribe && "✅ You'll receive a text message confirmation when you submit your inquiry!"}
                        </p>
                      </div>
                    )}
                  </div>

                  {smsPreferences.subscribe && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700">
                        📱 By checking the text message box, you consent to receive text messages from Flora Lawn & Landscaping. 
                        Message and data rates may apply. Reply STOP to opt-out.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:from-green-600 hover:to-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Get My Free Spring Cleanup Estimate'}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-green-600 mb-8">Get In Touch</h2>
              <p className="text-gray-600 mb-12 text-lg">
                We're here to help with all your spring cleanup needs. Contact us for a free estimate or to schedule a service.
              </p>

              {/* Contact Cards */}
              <div className="space-y-6">
                {/* Phone */}
                <div className="bg-gradient-to-r from-white to-green-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className="text-green-500">
                      <PhoneIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Phone</h3>
                      <a 
                        href="tel:4013890913"
                        className="text-green-600 hover:text-green-700 font-medium transition-colors"
                      >
                        (401) 389-0913
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-gradient-to-r from-white to-green-50 rounded-xl p-6 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="text-green-500">
                      <EnvelopeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Email</h3>
                      <a href="mailto:floralawncareri@gmail.com" className="text-green-600 hover:text-green-700 block">floralawncareri@gmail.com</a>
                      <a href="mailto:riyardworks@gmail.com" className="text-green-600 hover:text-green-700 block">riyardworks@gmail.com</a>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gradient-to-r from-white to-green-50 rounded-xl p-6 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="text-green-500">
                      <MapPinIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Address</h3>
                      <p className="text-gray-600">45 Vernon St</p>
                      <p className="text-gray-600">Pawtucket, RI 02860</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⭐', text: '4.9/5 Rating' },
              { icon: '🏆', text: 'Licensed & Insured' },
              { icon: '⚡', text: 'Same-Day Response' },
              { icon: '💰', text: 'Best Price Guarantee' }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="font-semibold text-gray-900">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Yard?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Call us now for immediate assistance
          </p>
          <a
            href="tel:4013890913"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-600 rounded-lg font-bold text-lg shadow-lg hover:bg-green-50 transition-all"
          >
            <PhoneIcon className="h-6 w-6" />
            (401) 389-0913
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

