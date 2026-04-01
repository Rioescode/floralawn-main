'use client';

import { useState } from 'react';

const reviews = [
  {
    name: 'Melissa Debarros',
    reviewCount: 1,
    photoCount: 0,
    rating: 5,
    date: '4 days ago',
    text: 'They were great to work with. Clear communication, cordial and their work was excellent! We\'re happy to finally have a clean yard! 🙌🏽',
    response: null
  },
  {
    name: 'Mary Mcnichols',
    reviewCount: 26,
    photoCount: 2,
    rating: 5,
    date: '2 weeks ago',
    text: 'We highly recommend Floras Lawn & Landscaping service. They did a beautiful job on our yard and we highly recommend them. Thank you Raphael.',
    response: 'Thank you so much for the kind words! It was a pleasure working on your yard, and I\'m glad you\'re happy with the results. We truly appreciate your recommendation—means a lot!'
  },
  {
    name: 'Lisa Petrarca',
    reviewCount: 3,
    photoCount: 0,
    rating: 5,
    date: '3 weeks ago',
    text: 'Excellent job, used twice already and could not be happier. Neat and works quickly. Will use again',
    response: 'Thanks so much, Lisa! We\'re really glad you\'re happy with our lawn care service. It means a lot to us, and we look forward to helping you again soon!'
  },
  {
    name: 'Gail Dancause',
    reviewCount: 2,
    photoCount: 0,
    rating: 5,
    date: '3 weeks ago',
    text: 'Rafael does beautiful work never had any issues always polite I would recommend him to anyone',
    response: 'Thank you, Gali! Glad you\'re happy with the service'
  },
  {
    name: 'Soror Natasha Gordon',
    reviewCount: 3,
    photoCount: 0,
    rating: 5,
    date: '4 weeks ago',
    text: 'We are very pleased with Flora Lawn & Landscaping! They have been helping to maintain our yard for two years now and we couldn\'t be happier with their service.',
    response: 'Thank you for the great review! We\'re so happy to hear that you\'ve been pleased with our services. We truly appreciate your trust in us and look forward to continuing to care for your yard!'
  }
];

export default function Reviews() {
  const [showAll, setShowAll] = useState(false);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Trusted by 100+ Local Customers
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            See what our customers have to say about our services
          </p>
          <div className="mt-4">
            <a
              href="https://g.co/kgs/rU7iLyH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-600 hover:text-green-700"
            >
              <span>View all reviews on Google</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-12 space-y-8">
          {displayedReviews.map((review, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {review.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {review.reviewCount} review{review.reviewCount !== 1 ? 's' : ''} • {review.photoCount} photo{review.photoCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-600">{review.text}</p>
              </div>
              {review.response && (
                <div className="mt-4 pl-4 border-l-4 border-green-500">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-green-600">Flora Lawn & Landscaping Inc</span>
                    <br />
                    {review.response}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center space-y-4">
          {!showAll && reviews.length > 3 && (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View More Reviews
            </button>
          )}
          <div>
            <a
              href="https://g.co/kgs/rU7iLyH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-600 hover:text-green-700"
            >
              <span>Read all reviews on Google</span>
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 