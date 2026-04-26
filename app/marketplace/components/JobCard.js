import React, { useState } from 'react';
import ProfessionalProfileModal from './ProfessionalProfileModal';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const getLawnServiceTypeLabel = (type) => {
  const types = {
    lawn_mowing: "Lawn Mowing",
    hedge_trimming: "Hedge Trimming",
    weed_control: "Weed Control",
    garden_maintenance: "Garden Maintenance",
    leaf_removal: "Leaf Removal",
    landscaping_design: "Landscaping Design",
    irrigation: "Irrigation Installation/Repair",
    tree_service: "Tree Service",
    mulching: "Mulching",
    fertilization: "Fertilization",
    planting: "Planting",
    sod_installation: "Sod Installation",
    other: "Other Service"
  };
  return types[type] || type;
};

const getLawnConditionLabel = (condition) => {
  const conditions = {
    normal: "Normal/Average",
    overgrown: "Overgrown",
    very_overgrown: "Very Overgrown",
    weedy: "Weedy",
    patchy: "Patchy/Bare Spots",
    new_construction: "New Construction"
  };
  return conditions[condition] || condition;
};

const getServiceFrequencyLabel = (frequency) => {
  const frequencies = {
    one_time: "One-time Service",
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    custom: "Custom Schedule"
  };
  return frequencies[frequency] || frequency;
};

const renderProfessionalInfo = (professional) => {
  const profile = professional?.professional_profile || {};
  
  return (
    <div className="space-y-6 mt-6 border-t border-gray-100 pt-6">
      {/* Business Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">About Us</h3>
        <p className="mt-2 text-gray-600">
          {profile.business_description || 'No description available'}
        </p>
      </div>

      {/* Service Areas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Service Areas</h3>
        <div className="mt-2">
          {profile.service_area?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.service_area.map((area) => (
                <span 
                  key={area}
                  className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Service areas not specified</p>
          )}
        </div>
      </div>

      {/* Experience */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
        <p className="mt-2 text-gray-600">
          {profile.years_experience ? 
            `${profile.years_experience} years of experience` : 
            'Experience information not provided'}
        </p>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        <div className="mt-2 space-y-2">
          {profile.contact_email && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${profile.contact_email}`} className="hover:text-green-600">
                {profile.contact_email}
              </a>
            </div>
          )}
          {profile.contact_phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${profile.contact_phone}`} className="hover:text-green-600">
                {profile.contact_phone}
              </a>
            </div>
          )}
          {profile.website_url && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" 
                className="hover:text-green-600">
                {profile.website_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function JobCard({ 
  job, 
  user,
  onBidAction, 
  onTimeSuggestion, 
  onReview, 
  onDelete, 
  onToggleVisibility,
  onEdit,
  children
}) {
  const [showProfessionalProfile, setShowProfessionalProfile] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const handleShowProfile = (professional) => {
    setSelectedProfessional(professional);
    setShowProfessionalProfile(true);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 hover:text-[#FF5733] transition-colors">
            {job.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {job.service_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getLawnServiceTypeLabel(job.service_type)}
              </span>
            )}
            {job.service_frequency && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getServiceFrequencyLabel(job.service_frequency)}
              </span>
            )}
            {job.lawn_condition && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {getLawnConditionLabel(job.lawn_condition)}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            job.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            job.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {job.status.replace('_', ' ')}
          </span>
          {(job.status === 'open' || job.status === 'cancelled') && (
            <div className="flex gap-2">
              {job.status === 'open' && (
                <button
                  onClick={() => onEdit(job)}
                  className="px-3 py-1.5 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => onToggleVisibility(job.id, job.status)}
                className={`px-3 py-1.5 rounded text-sm ${
                  job.status === 'open' 
                    ? 'bg-gray-500 text-white hover:bg-gray-600'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {job.status === 'open' ? 'Hide' : 'Reopen'}
              </button>
              <button
                onClick={() => onDelete(job.id)}
                className="text-red-600 hover:text-red-800"
                title="Delete Job"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Budget</div>
          <div className="text-base md:text-lg font-semibold text-gray-800">
            <div>Customer: ${job.budget}</div>
            {job.bids && job.bids.find(b => b.status === 'accepted') && (
              <div className="text-[#FF5733]">
                Accepted Bid: ${job.bids.find(b => b.status === 'accepted').amount}
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Needed By</div>
          <div className="text-base md:text-lg font-semibold text-gray-800">
            {new Date(job.date_needed).toLocaleDateString()}
          </div>
        </div>
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
          <div className="text-base md:text-lg font-semibold text-gray-800">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-[#22C55E] transition-colors"
            >
              {job.location}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Job Photos */}
      {job.job_photos && job.job_photos.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Job Photos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {job.job_photos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt="Job photo"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 rounded-lg">
                  <a 
                    href={photo.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                      View Full Size
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bids Section */}
      {job.bids && job.bids.length > 0 && (
        <div className="mt-4 md:mt-6 border-t border-gray-100 pt-4 md:pt-6">
          <h4 className="font-semibold text-gray-800 mb-3 md:mb-4">Bids</h4>
          <div className="space-y-3 md:space-y-4">
            {job.bids.map(bid => (
              <div 
                key={bid.id} 
                className={`bg-gray-50 p-3 md:p-4 rounded-lg border ${
                  bid.status === 'accepted' ? 'border-green-200 bg-green-50' :
                  bid.status === 'rejected' ? 'border-red-200 bg-red-50' :
                  'border-gray-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleShowProfile(bid.professional)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={
                            bid.professional.professional_profile?.logo_url || 
                            bid.professional.avatar_url || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(bid.professional.full_name)}`
                          }
                          alt={bid.professional.professional_profile?.business_name || bid.professional.full_name}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-left">
                            {bid.professional.professional_profile?.business_name || bid.professional.full_name}
                          </div>
                          {bid.professional.professional_profile?.business_description && (
                            <p className="text-sm text-gray-600 text-left line-clamp-2">
                              {bid.professional.professional_profile.business_description}
                            </p>
                          )}
                          {bid.professional.professional_profile?.service_area && (
                            <p className="text-xs text-gray-500 mt-1 text-left">
                              Service Area: {(() => {
                                const areas = bid.professional.professional_profile.service_area;
                                if (Array.isArray(areas)) {
                                  return areas.join(', ');
                                }
                                if (typeof areas === 'string') {
                                  return areas;
                                }
                                return 'Not specified';
                              })()}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-500">Bid Amount:</span>
                      <span className="text-lg md:text-xl font-bold text-[#FF5733]">${bid.amount}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (bid.status || 'pending') === 'accepted' 
                          ? 'bg-green-100 text-green-800'
                          : (bid.status || 'pending') === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {((bid.status || 'pending').charAt(0).toUpperCase() + (bid.status || 'pending').slice(1))}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{bid.message}</p>
                  </div>
                  {job.status === 'open' && bid.status === 'pending' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onBidAction(job.id, bid.id, 'accept')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onBidAction(job.id, bid.id, 'reject')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Suggestions Section */}
      {job.time_suggestions && job.time_suggestions.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Time Suggestions</h4>
          <div className="space-y-2">
            {job.time_suggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {suggestion.professional.full_name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        suggestion.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(suggestion.suggested_date).toLocaleDateString()} at {suggestion.suggested_time}
                    </p>
                    {suggestion.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {suggestion.message}
                      </p>
                    )}
                  </div>
                  {suggestion.status === 'pending' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onTimeSuggestion(suggestion.id, 'accepted')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onTimeSuggestion(suggestion.id, 'rejected')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {job.reviews && job.reviews.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Customer Reviews</h4>
          <div className="space-y-4">
            {job.reviews.map(review => (
              <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  {review.reviewer.avatar_url && (
                    <img 
                      src={review.reviewer.avatar_url} 
                      alt={review.reviewer.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{review.reviewer.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Profile Modal */}
      {showProfessionalProfile && (
        <ProfessionalProfileModal
          professional={selectedProfessional}
          onClose={() => setShowProfessionalProfile(false)}
        />
      )}

      {job.professional && (
        <div className="mt-6">
          <div className="flex items-center gap-4 mb-4">
            {job.professional.professional_profile?.logo_url ? (
              <img 
                src={job.professional.professional_profile.logo_url} 
                alt={job.professional.professional_profile.business_name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {job.professional.professional_profile?.business_name || job.professional.full_name}
              </h2>
            </div>
          </div>
          {renderProfessionalInfo(job.professional)}
        </div>
      )}

      {children}
    </div>
  );
} 