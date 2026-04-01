'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { sendNotification } from '@/lib/notifications';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function SnowRemovalEarlyBird() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spotsLeft, setSpotsLeft] = useState(50);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    propertyType: '',
    drivewaySize: '',
    sidewalks: false,
    walkways: false,
    salting: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Calculate current tier and discount
  const getTierInfo = () => {
    const now = new Date();
    const winterStart = new Date(now.getFullYear(), 11, 21); // December 21st

    if (now > winterStart) {
      return {
        tier: 'Regular Season',
        discount: 0,
        description: 'Regular season pricing is now in effect.',
        color: 'gray',
        icon: '❄️'
      };
    }

    const months = winterStart.getMonth() - now.getMonth() + 
      (winterStart.getFullYear() - now.getFullYear()) * 12;

    if (months >= 6) {
      return {
        tier: 'Ultra Early Bird',
        discount: 25,
        description: 'Maximum savings! Lock in 25% off for booking 6+ months early.',
        color: 'purple',
        icon: '🌟'
      };
    } else if (months >= 4) {
      return {
        tier: 'Super Early Bird',
        discount: 20,
        description: 'Great value! Get 20% off for booking 4-6 months early.',
        color: 'blue',
        icon: '⭐'
      };
    } else if (months >= 2) {
      return {
        tier: 'Early Bird',
        discount: 15,
        description: 'Smart planning! Save 15% for booking 2-4 months early.',
        color: 'green',
        icon: '🌱'
      };
    } else {
      return {
        tier: 'Last Minute Bird',
        discount: 10,
        description: 'Quick decision discount! Get 10% off for advance booking.',
        color: 'yellow',
        icon: '⚡'
      };
    }
  };

  const tierInfo = getTierInfo();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setUser(user);
          setFormData(prev => ({
            ...prev,
            name: profile?.full_name || user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: profile?.phone || '',
            city: profile?.preferred_city || ''
          }));
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
    
    // Get initial spots count
    getSpotCount();

    // Subscribe to changes
    const subscription = supabase
      .channel('snow_removal_spots')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'snow_removal_waitlist' 
      }, () => {
        getSpotCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getSpotCount = async () => {
    try {
      const { count } = await supabase
        .from('snow_removal_waitlist')
        .select('*', { count: 'exact' });
      
      setSpotsLeft(Math.max(0, 50 - (count || 0)));
    } catch (error) {
      console.error('Error getting spot count:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Check if spots are available
      if (spotsLeft === 0) {
        throw new Error('Sorry, all early bird spots are taken. You can join our waitlist.');
      }

      const bookingData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        property_type: formData.propertyType,
        driveway_size: formData.drivewaySize,
        sidewalks: formData.sidewalks,
        walkways: formData.walkways,
        salting: formData.salting,
        service_type: 'Snow Removal',
        booking_type: 'Early Bird',
        discount_tier: tierInfo.tier,
        discount_percentage: tierInfo.discount,
        status: 'waitlist',
        created_at: new Date().toISOString()
      };

      if (user) {
        bookingData.customer_id = user.id;
      }

      const { data, error } = await supabase
        .from('snow_removal_waitlist')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      // Send Telegram notification
      const notificationMessage = `❄️ New Early Bird Snow Removal Registration!\n\n` +
        `🏆 Tier: ${tierInfo.tier} (${tierInfo.discount}% off)\n\n` +
        `👤 Customer: ${formData.name}\n` +
        `📞 Phone: ${formData.phone}\n` +
        `📧 Email: ${formData.email}\n\n` +
        `📍 Location:\n` +
        `${formData.address}\n` +
        `${formData.city}\n\n` +
        `🏠 Property Details:\n` +
        `Type: ${formData.propertyType}\n` +
        `Driveway: ${formData.drivewaySize}\n` +
        `Sidewalks: ${formData.sidewalks ? 'Yes' : 'No'}\n` +
        `Walkways: ${formData.walkways ? 'Yes' : 'No'}\n` +
        `Salting Service: ${formData.salting ? 'Yes' : 'No'}\n\n` +
        `👥 User Status: ${user ? 'Registered User' : 'Guest User'}`;

      await sendNotification(notificationMessage);

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                You're All Set for Winter! 🎉
              </h2>
              
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <p className="text-xl text-gray-700 mb-6">
                  Thank you for planning ahead! You've secured a {tierInfo.discount}% discount on your snow removal service.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Your Benefits</h3>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex items-center">
                        <span className="mr-2">💰</span>
                        {tierInfo.discount}% off regular pricing
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">🎯</span>
                        Priority scheduling
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">🔒</span>
                        Rate locked in for the season
                      </li>
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">What's Next</h3>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-center">
                        <span className="mr-2">📧</span>
                        Confirmation email sent
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">📅</span>
                        We'll contact you before winter
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">🌨️</span>
                        Service starts with first snow
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/customer/dashboard')}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View My Dashboard
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50"
                >
                  Return Home
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      {/* Early Snow Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center">
            {/* Animated Snow Icons */}
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-20">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>❄️</span>
              ))}
            </div>
            
            <div className="flex items-center space-x-2 py-1">
              <span className="text-yellow-300 font-semibold">⚡ EARLY SNOW ALERT:</span>
              <span className="font-medium">Meteorologists predict early winter! Lock in your rate today</span>
              <button 
                onClick={() => {
                  document.getElementById('booking-form').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="ml-4 px-4 py-1 text-sm bg-white text-blue-900 rounded-full font-semibold hover:bg-yellow-100 transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl rounded-b-[3rem] overflow-hidden">
          {/* Snow Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="snowflakes" aria-hidden="true">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="snowflake">❅</div>
              ))}
            </div>
          </div>
          
          <style jsx>{`
            @keyframes snowfall {
              0% {
                transform: translate3d(var(--left-ini), 0, 0);
              }
              100% {
                transform: translate3d(var(--left-end), 110vh, 0);
              }
            }
            
            .snowflakes {
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
            }
            
            .snowflake {
              position: absolute;
              color: white;
              font-size: 1.5em;
              opacity: 0.8;
              animation: snowfall 10s linear infinite;
              animation-delay: calc(random() * -10s);
            }
            
            .snowflake:nth-child(1) { --left-ini: -8%; --left-end: 3%; animation-duration: 9s; left: 93%; }
            .snowflake:nth-child(2) { --left-ini: 7%; --left-end: -4%; animation-duration: 11s; left: 84%; }
            .snowflake:nth-child(3) { --left-ini: -4%; --left-end: 8%; animation-duration: 13s; left: 75%; }
            .snowflake:nth-child(4) { --left-ini: 3%; --left-end: -7%; animation-duration: 8s; left: 66%; }
            .snowflake:nth-child(5) { --left-ini: -6%; --left-end: 5%; animation-duration: 12s; left: 57%; }
            .snowflake:nth-child(6) { --left-ini: 8%; --left-end: -3%; animation-duration: 10s; left: 48%; }
            .snowflake:nth-child(7) { --left-ini: -3%; --left-end: 6%; animation-duration: 9s; left: 39%; }
            .snowflake:nth-child(8) { --left-ini: 5%; --left-end: -8%; animation-duration: 11s; left: 30%; }
            .snowflake:nth-child(9) { --left-ini: -7%; --left-end: 4%; animation-duration: 13s; left: 21%; }
            .snowflake:nth-child(10) { --left-ini: 4%; --left-end: -6%; animation-duration: 8s; left: 12%; }
            .snowflake:nth-child(11) { --left-ini: -5%; --left-end: 7%; animation-duration: 12s; left: 3%; }
            .snowflake:nth-child(12) { --left-ini: 6%; --left-end: -5%; animation-duration: 10s; left: 94%; }
            .snowflake:nth-child(13) { --left-ini: -8%; --left-end: 3%; animation-duration: 9s; left: 85%; }
            .snowflake:nth-child(14) { --left-ini: 7%; --left-end: -4%; animation-duration: 11s; left: 76%; }
            .snowflake:nth-child(15) { --left-ini: -4%; --left-end: 8%; animation-duration: 13s; left: 67%; }
            .snowflake:nth-child(16) { --left-ini: 3%; --left-end: -7%; animation-duration: 8s; left: 58%; }
            .snowflake:nth-child(17) { --left-ini: -6%; --left-end: 5%; animation-duration: 12s; left: 49%; }
            .snowflake:nth-child(18) { --left-ini: 8%; --left-end: -3%; animation-duration: 10s; left: 40%; }
            .snowflake:nth-child(19) { --left-ini: -3%; --left-end: 6%; animation-duration: 9s; left: 31%; }
            .snowflake:nth-child(20) { --left-ini: 5%; --left-end: -8%; animation-duration: 11s; left: 22%; }
          `}</style>

          <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Winter Ready, Worry Free
              </h1>
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <span className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                <span className="text-white text-sm font-medium">
                  {spotsLeft === 0 ? (
                    'Early bird spots are full - Join waitlist'
                  ) : (
                    `Only ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left for early bird pricing`
                  )}
                </span>
              </div>
              <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Book early and save up to 25% on seasonal snow removal
              </p>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className={`inline-block bg-${tierInfo.color}-100 rounded-xl p-6 shadow-lg`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{tierInfo.icon}</span>
                  <div className="text-left">
                    <h2 className={`text-2xl font-bold text-${tierInfo.color}-900`}>
                      {tierInfo.tier}
                    </h2>
                    <p className={`text-${tierInfo.color}-700`}>
                      Book now for {tierInfo.discount}% off all season
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Discount Timeline */}
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Plan Ahead & Save More</h2>
            <p className="mt-4 text-lg text-gray-600">See how much you can save based on when you book</p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2" />

            <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                {
                  month: 'June-July',
                  discount: 25,
                  label: 'Ultra Early Bird',
                  description: 'Maximum savings! Book 6+ months ahead',
                  icon: '🌟',
                  color: 'purple'
                },
                {
                  month: 'August-September',
                  discount: 20,
                  label: 'Super Early Bird',
                  description: 'Great value! Book 4-6 months ahead',
                  icon: '⭐',
                  color: 'blue'
                },
                {
                  month: 'October',
                  discount: 15,
                  label: 'Early Bird',
                  description: 'Smart planning! Book 2-4 months ahead',
                  icon: '🌱',
                  color: 'green'
                },
                {
                  month: 'November',
                  discount: 10,
                  label: 'Last Minute Bird',
                  description: 'Quick decision! Book 1-2 months ahead',
                  icon: '⚡',
                  color: 'yellow'
                },
                {
                  month: 'December-March',
                  discount: 0,
                  label: 'Regular Season',
                  description: 'Regular pricing in effect',
                  icon: '❄️',
                  color: 'gray'
                }
              ].map((period, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-xl shadow-lg p-6 border-t-4 border-${period.color}-500 ${
                    period.discount === tierInfo.discount ? 'ring-2 ring-blue-500 transform scale-105' : ''
                  }`}
                >
                  {period.discount === tierInfo.discount && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Available Now
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                      {period.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{period.month}</h3>
                    <div className={`text-3xl font-bold mb-2 text-${period.color}-600`}>
                      {period.discount}% OFF
                    </div>
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      {period.label}
                    </div>
                    <p className="text-sm text-gray-600">
                      {period.description}
                    </p>
                  </div>

                  {period.discount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        document.getElementById('booking-form').scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }}
                      className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-${period.color}-500 hover:bg-${period.color}-600 transition-colors`}
                    >
                      Book Now
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="inline-block bg-blue-50 rounded-lg px-6 py-4"
            >
              <p className="text-blue-800">
                <span className="font-semibold">Pro Tip:</span> The earlier you book, the more you save! Lock in your rate today.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Booking Form */}
          <motion.div
            id="booking-form"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-white rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-3xl font-bold text-center mb-8">
                Secure Your Spot Today
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your@email.com"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(401) 555-0123"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select city</option>
                      <option value="Pawtucket">Pawtucket</option>
                      <option value="Providence">Providence</option>
                      <option value="East Providence">East Providence</option>
                      <option value="North Providence">North Providence</option>
                      <option value="Johnston">Johnston</option>
                      <option value="Cranston">Cranston</option>
                      <option value="Warwick">Warwick</option>
                      <option value="Other">Other RI City</option>
                    </select>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="sm:col-span-2 space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street address"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Multi-Family">Multi-Family</option>
                    </select>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="space-y-1"
                  >
                    <label className="block text-sm font-medium text-gray-700">
                      Driveway Size <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.drivewaySize}
                      onChange={(e) => setFormData({ ...formData, drivewaySize: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select size</option>
                      <option value="1-2 Cars">1-2 Cars</option>
                      <option value="3-4 Cars">3-4 Cars</option>
                      <option value="5+ Cars">5+ Cars</option>
                      <option value="Commercial Lot">Commercial Lot</option>
                    </select>
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center bg-blue-50 p-4 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      id="sidewalks"
                      checked={formData.sidewalks}
                      onChange={(e) => setFormData({ ...formData, sidewalks: e.target.checked })}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sidewalks" className="ml-3 text-blue-900">
                      Include sidewalk snow removal
                    </label>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center bg-blue-50 p-4 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      id="walkways"
                      checked={formData.walkways}
                      onChange={(e) => setFormData({ ...formData, walkways: e.target.checked })}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="walkways" className="ml-3 text-blue-900">
                      Include walkway snow removal
                    </label>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center bg-blue-50 p-4 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      id="salting"
                      checked={formData.salting}
                      onChange={(e) => setFormData({ ...formData, salting: e.target.checked })}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="salting" className="ml-3 text-blue-900">
                      Include salting service
                    </label>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="pt-4"
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all
                      ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Secure Your ${tierInfo.discount}% Discount Now`
                    )}
                  </button>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    No payment required now. Lock in your discount today!
                  </p>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                question: "When do I need to pay?",
                answer: "Payment is only required after each snow removal service. The early bird discount will be applied to all services throughout the winter season."
              },
              {
                question: "How does the service work?",
                answer: "We monitor weather conditions 24/7. When snow accumulation reaches 2 inches, our team automatically provides service to all registered customers, ensuring your property is cleared promptly."
              },
              {
                question: "What if I need to cancel?",
                answer: "You can cancel or modify your service at any time before the winter season begins. Once the season starts, we require a 30-day notice for service cancellation."
              },
              {
                question: "Do you provide commercial services?",
                answer: "Yes! We offer both residential and commercial snow removal services. Commercial properties receive priority service and can customize their snow removal triggers and requirements."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 