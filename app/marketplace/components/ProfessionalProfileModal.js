import React from 'react';

const getProfileImage = (professional) => {
  if (professional.professional_profile?.logo_url) return professional.professional_profile.logo_url;
  if (professional.avatar_url) return professional.avatar_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.full_name || 'User')}`;
};

export default function ProfessionalProfileModal({ professional, onClose }) {
  if (!professional) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Professional Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Header with Logo and Name */}
          <div className="flex items-center gap-4">
            <img
              src={getProfileImage(professional)}
              alt={professional.professional_profile?.business_name || professional.full_name}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div>
              <h4 className="text-xl font-bold text-gray-800">
                {professional.professional_profile?.business_name || professional.full_name}
              </h4>
            </div>
          </div>

          {/* Business Description */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">About Us</h5>
            <p className="text-gray-600">
              {professional.professional_profile?.business_description || 'No description available'}
            </p>
          </div>

          {/* Service Areas */}
          {professional.professional_profile?.service_area && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-700 mb-2">Service Areas</h5>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const areas = professional.professional_profile.service_area;
                  if (Array.isArray(areas)) {
                    return areas.map((area, index) => (
                      <span
                        key={index}
                        className="bg-[#FF5733]/10 text-[#FF5733] px-3 py-1 rounded-full text-sm"
                      >
                        {area}
                      </span>
                    ));
                  }
                  if (typeof areas === 'string') {
                    return (
                      <span className="bg-[#FF5733]/10 text-[#FF5733] px-3 py-1 rounded-full text-sm">
                        {areas}
                      </span>
                    );
                  }
                  return (
                    <span className="text-gray-500">
                      No service areas specified
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Experience and Contact Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700">Experience</h5>
              <p className="text-gray-600 mt-1">
                {professional.professional_profile?.years_experience 
                  ? `${professional.professional_profile.years_experience} years` 
                  : 'Experience information not provided'}
              </p>
            </div>

            <div>
              <h5 className="font-medium text-gray-700">Contact Information</h5>
              <div className="space-y-2 mt-1">
                {professional.professional_profile?.contact_email && (
                  <a
                    href={`mailto:${professional.professional_profile.contact_email}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {professional.professional_profile.contact_email}
                  </a>
                )}
                {professional.professional_profile?.contact_phone && (
                  <a
                    href={`tel:${professional.professional_profile.contact_phone}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {professional.professional_profile.contact_phone}
                  </a>
                )}
                {professional.professional_profile?.website_url && (
                  <a
                    href={professional.professional_profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          {professional.professional_profile?.social_media && Object.values(professional.professional_profile.social_media).some(Boolean) && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Social Media</h5>
              <div className="flex gap-4">
                {professional.professional_profile.social_media.facebook && (
                  <a
                    href={professional.professional_profile.social_media.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  </a>
                )}
                {professional.professional_profile.social_media.instagram && (
                  <a
                    href={professional.professional_profile.social_media.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                    </svg>
                  </a>
                )}
                {professional.professional_profile.social_media.linkedin && (
                  <a
                    href={professional.professional_profile.social_media.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 