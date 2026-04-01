import React from 'react';

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.includes('googleusercontent')) return avatarPath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`;
};

export default function CustomerProfileModal({ customer, onClose }) {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Customer Profile</h3>
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
          {/* Header with Avatar and Name */}
          <div className="flex items-center gap-4">
            <img
              src={
                getAvatarUrl(customer.avatar_url) ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.full_name)}&size=96`
              }
              alt={customer.full_name}
              className="w-24 h-24 rounded-lg object-cover border border-gray-200"
            />
            <div>
              <h4 className="text-xl font-bold text-gray-800">
                {customer.full_name}
              </h4>
              <p className="text-gray-600 mt-1">
                Member since {formatDate(customer.created_at)}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Contact Information</h5>
            <div className="space-y-2">
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {customer.phone}
                </a>
              )}
            </div>
          </div>

          {/* Location */}
          {customer.location && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Location</h5>
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {customer.location}
              </div>
            </div>
          )}

          {/* Job History */}
          {customer.jobs && customer.jobs.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Job History</h5>
              <div className="space-y-3">
                {customer.jobs.map(job => (
                  <div key={job.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="font-medium text-gray-800">{job.title}</h6>
                        <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Budget: ${job.budget}</span>
                          <span>Date: {formatDate(job.date_needed)}</span>
                          <span className="capitalize">Status: {job.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Given */}
          {customer.reviews && customer.reviews.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Reviews Given</h5>
              <div className="space-y-3">
                {customer.reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-400">
                            {'★'.repeat(review.rating)}
                            <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            for {review.reviewed.full_name}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700">{review.comment}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 