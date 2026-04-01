'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/marketplace/components/LoginForm';
import RegisterForm from '@/app/marketplace/components/RegisterForm';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadBusinesses();
    checkSession();
  }, []);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          id,
          profile_id,
          business_name,
          business_description,
          service_area,
          services,
          contact_email,
          contact_phone,
          website_url,
          social_media,
          years_experience,
          logo_url,
          rating,
          total_reviews,
          claimed,
          featured,
          equipment_photos,
          profile:profiles!profile_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session) {
      // Check for existing profile
      const { data: profile } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profile:profiles!profile_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('profile_id', session.user.id)
        .single();
      
      setExistingProfile(profile);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const featuredBusinesses = businesses.filter(b => b.featured);
  const regularBusinesses = businesses.filter(b => !b.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Top Junk Removal Professionals
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect with trusted and experienced junk removal experts in your area
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Featured Businesses */}
        {featuredBusinesses.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              Featured Professionals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredBusinesses.map((business) => (
                <FeaturedBusinessCard key={business.id} business={business} />
              ))}
            </div>
          </section>
        )}

        {/* Regular Businesses Grid */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            All Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {regularBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>

        {/* Join as Pro CTA */}
        <section className="mt-20">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Are You a Junk Removal Professional?
              </h2>
              <p className="text-gray-400 mb-8">
                Join our platform to connect with customers, grow your business, and manage your jobs efficiently. Your profile will be automatically created and listed in our directory when you sign up.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!session ? (
                  <>
                    <button
                      onClick={() => setShowRegister(true)}
                      className="bg-[#FF5733] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#FF5733]/90 transition-colors"
                    >
                      Sign Up as Pro
                    </button>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Pro Login
                    </button>
                  </>
                ) : (
                  <Link
                    href={`/professionals/register${existingProfile ? `?profile_id=${existingProfile.id}` : ''}`}
                    className="bg-[#FF5733] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#FF5733]/90 transition-colors"
                  >
                    {existingProfile ? 'Update Your Profile' : 'Complete Your Profile'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onShowRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onShowLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      <Footer />
    </div>
  );
}

function BusinessDetailsModal({ business, onClose }) {
  if (!business) return null;

  const handleModalClick = (e) => {
    // Close modal when clicking the backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleModalClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.business_name}
                    width={128}
                    height={128}
              className="w-full h-full object-cover"
            />
          ) : (
                  <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl text-gray-400">
                      {business.business_name?.charAt(0) || business.profile?.full_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {business.business_name || business.profile?.full_name}
                </h2>
                {business.years_experience && (
                  <p className="text-gray-600 mt-2">
                    {business.years_experience} years of experience
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700 p-2"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            {/* Description */}
            {business.business_description && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">About Us</h3>
                <p className="text-gray-600">{business.business_description}</p>
              </div>
            )}

            {/* Equipment Photos */}
            {business.equipment_photos?.photos?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Equipment & Facilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {business.equipment_photos.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <Image
                        src={photo.url}
                        alt={`Equipment ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-200 group-hover:scale-105"
                      />
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services & Areas */}
            <div className="grid md:grid-cols-2 gap-6">
              {business.services && business.services.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Services Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-[#FF5733]/10 text-[#FF5733] px-3 py-1 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {business.service_area && business.service_area.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.service_area.map((area, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            {(business.contact_email || business.contact_phone || business.website_url || business.social_media) && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {business.contact_email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${business.contact_email}`} className="text-[#FF5733] hover:underline">
                          {business.contact_email}
                        </a>
                      </div>
                    )}
                    {business.contact_phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${business.contact_phone}`} className="text-[#FF5733] hover:underline">
                          {business.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>

          <div className="space-y-2">
                    {business.website_url && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-[#FF5733] hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}
                    {business.social_media?.facebook && (
                      <a href={business.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Facebook</a>
                    )}
                    {business.social_media?.instagram && (
                      <a href={business.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Instagram</a>
                    )}
                    {business.social_media?.linkedin && (
                      <a href={business.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">LinkedIn</a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedBusinessCard({ business }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setShowDetails(true);
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.business_name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {business.business_name?.charAt(0) || business.profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {business.business_name || business.profile?.full_name}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {business.business_description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                <span>Service Areas: {business.service_area?.join(', ') || 'Not specified'}</span>
              </div>
              {business.years_experience && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{business.years_experience} years of experience</span>
                </div>
              )}
            </div>

            {/* Preview of Equipment Photos */}
            {business.equipment_photos?.photos?.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {business.equipment_photos.photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={photo.url}
                        alt={`Equipment ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                  {business.equipment_photos.photos.length > 3 && (
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        +{business.equipment_photos.photos.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="bg-[#FF5733] text-white px-6 py-3 rounded-xl hover:bg-[#FF5733]/90 transition-colors inline-block"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <BusinessDetailsModal
          business={business}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

function BusinessCard({ business }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    checkSession();
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    setShowDetails(true);
  };

  const handleCloseModal = (e) => {
    if (e) e.stopPropagation();
    setShowDetails(false);
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
        onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                  alt={business.business_name || ''}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#FF5733]/10 text-[#FF5733]">
                  <span className="text-2xl font-bold">
                    {business.business_name?.charAt(0) || business.profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {business.business_name || business.profile?.full_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-sm text-gray-500">
              <span className="text-yellow-400 mr-1">★</span>
              <span>{business.rating?.toFixed(1) || 'New'}</span>
              {business.total_reviews > 0 && (
                <span className="ml-1">({business.total_reviews} reviews)</span>
              )}
            </div>
                {business.claimed && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
          </div>
        </div>
          </div>

        {!business.claimed && (
          <button
              onClick={(e) => {
                e.stopPropagation();
                setShowClaimModal(true);
              }}
            className="text-[#FF5733] hover:bg-[#FF5733]/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Claim Business
          </button>
        )}
      </div>

        {/* Description */}
        {business.business_description && (
          <p className="text-gray-600 text-sm mt-4 mb-4 line-clamp-2">
            {business.business_description}
          </p>
        )}

      {/* Equipment Photos */}
      {business.equipment_photos?.photos?.length > 0 && (
          <div className="mt-4 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {business.equipment_photos.photos.slice(0, 2).map((photo, index) => (
                <div key={index} className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={photo.url}
                  alt={`Equipment ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                    className="rounded-lg"
                />
              </div>
            ))}
              {business.equipment_photos.photos.length > 2 && (
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    +{business.equipment_photos.photos.length - 2}
                  </span>
                </div>
              )}
          </div>
        </div>
      )}

        {/* Service Areas */}
        {business.service_area && business.service_area.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
              <span>{business.service_area.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Services */}
        {business.services && business.services.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {business.services.slice(0, 3).map((service, index) => (
                <span
                  key={index}
                  className="bg-[#FF5733]/10 text-[#FF5733] px-3 py-1 rounded-full text-xs"
                >
                  {service}
                </span>
              ))}
              {business.services.length > 3 && (
                <span className="text-gray-500 text-xs">+{business.services.length - 3} more</span>
              )}
        </div>
      </div>
        )}
      </motion.div>

      {showDetails && (
        <BusinessDetailsModal
          business={business}
          onClose={handleCloseModal}
        />
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Claim {business.business_name}</h3>
            <p className="text-gray-600 mb-6">
              To claim this business, you'll need to create an account or sign in.
            </p>
            
            <div className="flex gap-4">
                <button
                onClick={() => {
                  setShowClaimModal(false);
                  setShowLogin(true);
                }}
                className="flex-1 bg-[#FF5733] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#FF5733]/90"
              >
                Sign In
                </button>
                <button
                onClick={() => {
                  setShowClaimModal(false);
                  setShowRegister(true);
                }}
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700"
              >
                Create Account
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onShowRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onShowLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
} 