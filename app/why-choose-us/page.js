"use client";

import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { IMAGES } from '@/utils/constants'; // We might need to adjust which images are used
import { reviews } from '@/data/reviews-data'; // Assuming reviews are moved or copied to a separate file
import { CheckIcon, StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

// Placeholder for reviews - you might need to adjust this import based on where reviews are stored
// If reviews are still only in app/page.js, we'll need to extract them.
// For now, let's assume they are available via import { reviews } from '@/data/reviews-data';
// If not, we'll get an error and adjust.

// Select specific high-quality images showcasing maintained lawns AND mulch work
const showcaseImages = [
  // Lawns
  '/images/Lawn care services.jpg',
  '/images/2024-05-14.jpg',
  // Black Mulch
  '/images/black mulch/image_fx (16).jpg',
  '/images/black mulch/image_fx (22).jpg',
  // Red Mulch
  '/images/red_mulch/image_fx (32).jpg',
  '/images/red_mulch/image_fx (37).jpg',
  // Brown Mulch
  '/brown_mulch/image_fx (50).jpg',
  '/brown_mulch/image_fx (23).jpg',
  // Dark Brown Mulch
  '/dark_brown_mulch/image_fx (53).jpg',
  '/dark_brown_mulch/image_fx (42).jpg',
];

export default function WhyChooseUsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-20 md:py-28 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Partner for a Pristine Rhode Island Lawn</h1>
            <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-8">
              Experience reliable, top-quality lawn maintenance that keeps your property beautiful year-round, hassle-free.
            </p>
            <Link
              href="/contact?service=maintenance" // Add query param to pre-select maintenance
              className="inline-block bg-white text-green-600 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 text-lg"
            >
              Get My Free Maintenance Quote
            </Link>
          </div>
        </section>

        {/* Key Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose Flora Landscaping?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Benefit 1 */}
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Reliable & Consistent</h3>
                <p className="text-gray-600">We show up on schedule, every time. Count on us for dependable lawn care you don't have to think about.</p>
              </div>
              {/* Benefit 2 */}
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Local RI Expertise</h3>
                <p className="text-gray-600">We know Rhode Island lawns. Our services are tailored to the local climate and soil conditions for optimal results.</p>
              </div>
              {/* Benefit 3 */}
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Quality Workmanship</h3>
                <p className="text-gray-600">Our experienced crew uses professional equipment to deliver sharp, clean results that enhance your curb appeal.</p>
              </div>
              {/* Benefit 4 */}
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Clear Communication</h3>
                <p className="text-gray-600">We keep you informed and respond promptly to your questions and requests.</p>
              </div>
               {/* Benefit 5 */}
               <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                 <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                 <h3 className="text-xl font-semibold mb-2">Satisfaction Focused</h3>
                 <p className="text-gray-600">Your happiness is our priority. We stand by our work with a satisfaction guarantee.</p>
               </div>
               {/* Benefit 6 */}
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Licensed & Insured</h3>
                <p className="text-gray-600">Providing you with peace of mind and professional service.</p>
              </div>
               {/* Benefit 7 - Previously Benefit 4 */}
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Full-Service Options</h3>
                <p className="text-gray-600">From mowing and trimming to fertilization and seasonal cleanups, we handle all aspects of lawn upkeep.</p>
              </div>
               {/* Benefit 8 - Optional/Example */}
               <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4 bg-green-100 rounded-full p-2" />
                <h3 className="text-xl font-semibold mb-2">Easy Billing</h3>
                <p className="text-gray-600">Convenient online payment options and clear invoices.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Comprehensive Lawn Maintenance</h2>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Standard Plan Includes:</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Regular mowing tailored to seasonal growth (weekly/bi-weekly)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Precise trimming around obstacles and borders</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Sharp edging along sidewalks, driveways, and garden beds</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Blowing clippings off all hard surfaces for a clean finish</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Optional Add-ons:</h3>
                 <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Seasonal Fertilization & Weed Control Programs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Spring & Fall Cleanup Services (Leaves, Debris)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Aeration & Overseeding for Lawn Health</span>
                  </li>
                   <li className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span>Mulch Installation & Bed Maintenance</span>
                  </li>
                </ul>
                 <p className="text-sm text-gray-500 mt-4">Customize your plan during your free quote!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Process Section */}
        <section className="py-16 bg-gray-50">
           <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Simple Process</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {/* Step 1 */}
              <div className="p-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 text-2xl font-bold">1</div>
                <h3 className="text-lg font-semibold mb-2">Request Quote</h3>
                <p className="text-gray-600 text-sm">Contact us via phone, email, or form for a free, no-obligation estimate.</p>
              </div>
              {/* Step 2 */}
              <div className="p-4">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 text-2xl font-bold">2</div>
                <h3 className="text-lg font-semibold mb-2">Consultation</h3>
                <p className="text-gray-600 text-sm">We discuss your needs, assess your property, and propose a customized plan.</p>
              </div>
              {/* Step 3 */}
              <div className="p-4">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 text-2xl font-bold">3</div>
                <h3 className="text-lg font-semibold mb-2">Schedule Service</h3>
                <p className="text-gray-600 text-sm">Once approved, we schedule your regular maintenance visits.</p>
              </div>
              {/* Step 4 */}
              <div className="p-4">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 text-2xl font-bold">4</div>
                <h3 className="text-lg font-semibold mb-2">Enjoy Your Lawn</h3>
                <p className="text-gray-600 text-sm">Relax while we keep your lawn looking its best, providing reliable service and easy billing.</p>
              </div>
            </div>
           </div>
        </section>

        {/* Showcase Gallery */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">See Our Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {showcaseImages.map((image, index) => (
                <div key={`showcase-${index}`} className="relative aspect-video overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow group">
                  <Image
                    src={image}
                    alt={`Landscaping showcase ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
             <div className="text-center mt-12">
              <Link
                href="/gallery" // Link to the full gallery page
                className="inline-block text-green-600 font-medium hover:text-green-700 border-b-2 border-green-600 hover:border-green-700 transition"
              >
                View Full Project Gallery &rarr;
              </Link>
            </div>
          </div>
        </section>

         {/* Testimonials Section */}
         <section className="py-16 bg-gray-50">
           <div className="max-w-7xl mx-auto px-4">
             <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Trusted by Your Neighbors</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
               {reviews && reviews.length > 0 ? (
                 reviews.slice(0, 4).map((review, index) => ( // Show top 4 reviews
                   <div key={index} className="bg-white rounded-lg p-6 shadow-sm flex flex-col border border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className={`rounded-full w-12 h-12 flex items-center justify-center ${review.color || 'bg-gray-100 text-gray-600'} font-semibold text-xl flex-shrink-0`}>
                        {review.initials}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">{review.name}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} className={`w-4 h-4 ${i < 5 ? 'text-yellow-400' : 'text-gray-300' }`} /> // Assume 5 stars if not specified
                          ))}
                          <span className='ml-2'>{review.source}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 flex-grow italic">"{review.text}"</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-200">
                      <span>{review.date}</span>
                      {review.isVerified && (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <CheckBadgeIcon className="w-5 h-5" />
                          Verified Review
                        </span>
                      )}
                    </div>
                   </div>
                 ))
               ) : (
                 <p className="text-center text-gray-600 md:col-span-2">Customer reviews coming soon.</p>
               )}
             </div>
           </div>
         </section>

         {/* Final CTA */}
         <section className="py-20 bg-green-700 text-white">
           <div className="max-w-4xl mx-auto px-4 text-center">
             <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready for a Beautiful, Worry-Free Lawn?</h2>
             <p className="text-lg md:text-xl text-green-100 mb-8 max-w-2xl mx-auto">
               Let Flora Landscaping handle the hard work. Get a personalized quote for our comprehensive lawn maintenance plans today.
             </p>
             <Link
               href="/contact?service=maintenance"
               className="inline-block bg-white text-green-700 font-bold py-3 px-10 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 text-lg"
             >
               Request My Free Quote
             </Link>
           </div>
         </section>

      </main>

      <Footer />
    </div>
  );
} 