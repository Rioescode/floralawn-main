"use client";

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { lawnServices } from '@/data/lawn-services';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">Our Lawn Care & Landscaping Services</h1>
            <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
              Professional landscaping services throughout Rhode Island. From lawn mowing to complete landscape design, we've got you covered.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div>
                <h2 className="text-2xl font-semibold text-green-600 mb-6">Professional Lawn Care & Landscaping</h2>
                <p className="text-gray-600 mb-6">
                  At Flora Lawn and Landscaping Inc, we provide comprehensive lawn care services to keep your property looking its best year-round. Our team of experienced professionals uses commercial-grade equipment and proven techniques to deliver exceptional results.
                </p>
                <p className="text-gray-600 mb-6">
                  Whether you need regular maintenance or a one-time service, we tailor our approach to meet your specific needs and budget.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Licensed and insured professionals</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Reliable, on-time service</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Satisfaction guaranteed</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Free estimates on all services</span>
                  </div>
                </div>
              </div>
              
              <div className="relative h-80 md:h-auto rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/images/2024-09-18.jpg"
                  alt="Professional lawn care service by Flora Lawn and Landscaping Inc"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {lawnServices.map((service, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4">
                      {service.description || service.metaDescription?.replace('{city}', 'Rhode Island')}
                    </p>
                    {service.includes && service.includes.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {service.includes.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-600">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <Link 
                        href={`/services/${service.urlPath}`}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-center text-sm"
                      >
                        Learn More
                      </Link>
                      <Link 
                        href={`/contact?service=${encodeURIComponent(service.title)}`}
                        className="flex-1 border border-green-600 text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors text-center text-sm"
                      >
                        Get Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-green-50 rounded-xl p-8 mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to transform your lawn?</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Contact us today for a free estimate and let our professionals take care of your lawn and landscaping needs.
                </p>
      </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/schedule" 
                  className="bg-green-600 text-white px-6 py-3 rounded-lg text-center font-medium hover:bg-green-700 transition-colors"
                >
                  Schedule Service
                </Link>
                <a 
                  href="tel:4013890913" 
                  className="border border-green-600 text-green-600 px-6 py-3 rounded-lg text-center font-medium hover:bg-green-50 transition-colors"
                >
                  Call (401) 389-0913
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 