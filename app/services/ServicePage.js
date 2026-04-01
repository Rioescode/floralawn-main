"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { lawnServices } from "@/data/lawn-services";
import { motion } from 'framer-motion';
import { CheckCircleIcon, PhoneIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

export default function ServicePage({ city, service, state = "RI" }) {
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Find the service data
  const serviceData = lawnServices.find(s => s.urlPath === service);
  
  if (!serviceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p>Could not find information for: {service}</p>
          <Link href="/services" className="text-green-600 hover:text-green-700 mt-4 inline-block">
            View All Services
          </Link>
        </div>
      </div>
    );
  }

  // Get a random H1 variation
  const getRandomH1 = () => {
    const variations = serviceData.h1Variations || [`Professional ${serviceData.title} in {city}`];
    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex].replace('{city}', city);
  };

  const h1 = getRandomH1();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{h1}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Professional, reliable {serviceData.title.toLowerCase()} services in {city} and surrounding areas. 
              Licensed, insured, and committed to excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:4013890913"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-md inline-flex items-center justify-center"
              >
                <PhoneIcon className="w-5 h-5 mr-2" />
                Get Free Quote
              </a>
              <Link 
                href="/contact" 
                className="border border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors inline-flex items-center justify-center"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <MapPinIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local to {city}</h3>
              <p className="text-gray-600">Serving {city} and surrounding areas with prompt, reliable service</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <ClockIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">Fast response times and flexible scheduling options</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <ShieldCheckIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Licensed & Insured</h3>
              <p className="text-gray-600">Fully licensed and insured for your peace of mind</p>
            </div>
          </div>
            
          {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div>
                <h2 className="text-2xl font-semibold text-green-600 mb-6">{serviceData.title} Services in {city}, {state}</h2>
                <p className="text-gray-600 mb-6">
                  Flora Lawn & Landscaping Inc provides professional {serviceData.title.toLowerCase()} services in {city} and throughout {state}. Our experienced team delivers reliable, high-quality service for both residential and commercial properties.
                </p>
                <p className="text-gray-600 mb-6">
                  {serviceData.description}
                </p>
              <div className="space-y-4">
                  {serviceData.includes.map((item, index) => (
                  <div key={index} className="flex items-start bg-white p-4 rounded-lg shadow-sm">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get a Free Quote</h3>
              <p className="text-gray-600 mb-8">
                  Contact us today for a free estimate on {serviceData.title.toLowerCase()} services in {city}, {state}.
                </p>
                
              <div className="space-y-6">
                  <a 
                    href="tel:4013890913"
                  className="flex items-center justify-center gap-3 w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-lg"
                  >
                  <PhoneIcon className="h-6 w-6" />
                    Call (401) 389-0913
                  </a>
                  
                  <Link
                    href="/contact"
                  className="flex items-center justify-center gap-3 w-full border-2 border-green-600 text-green-600 py-4 rounded-lg font-medium hover:bg-green-50 transition-colors text-lg"
                  >
                    Contact Us Online
                  </Link>
                </div>
                
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Why Choose Us?</h4>
                <ul className="space-y-4">
                    <li className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Licensed and insured professionals</span>
                    </li>
                    <li className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Reliable, on-time service</span>
                    </li>
                    <li className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Competitive pricing</span>
                    </li>
                    <li className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">100% satisfaction guaranteed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Service Benefits */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Benefits of Professional {serviceData.title}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(serviceData?.serviceContent?.benefits || []).map((benefit, index) => (
                <div key={index} className="flex items-start bg-gray-50 p-6 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                    <CheckCircleIcon className="h-8 w-8" />
                    </div>
                    <div>
                    <p className="text-gray-800 font-medium">{benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Service Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {(serviceData?.serviceContent?.types || []).map((type, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{type?.name}</h3>
                <p className="text-gray-600 mb-6">{type?.description}</p>
                <ul className="space-y-3 mb-8">
                  {(type?.benefits || []).map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                  href={`/schedule?service=${service}&city=${encodeURIComponent(city)}&type=${encodeURIComponent(type?.name)}`}
                  className="inline-block w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
                  >
                    Schedule Service
                  </Link>
                </div>
              ))}
            </div>
            
            {/* Seasonal Tips */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Seasonal {serviceData.title} Tips for {city}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Spring</h3>
                <ul className="space-y-3">
                  {(serviceData?.serviceContent?.seasonalTips?.spring || []).map((tip, index) => (
                      <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summer</h3>
                <ul className="space-y-3">
                  {(serviceData?.serviceContent?.seasonalTips?.summer || []).map((tip, index) => (
                      <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fall</h3>
                <ul className="space-y-3">
                  {(serviceData?.serviceContent?.seasonalTips?.fall || []).map((tip, index) => (
                      <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Winter</h3>
                <ul className="space-y-3">
                  {(serviceData?.serviceContent?.seasonalTips?.winter || []).map((tip, index) => (
                      <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Common Issues */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Common {serviceData.title} Issues in {city}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(serviceData?.serviceContent?.commonIssues || []).map((item, index) => (
                <div key={index} className="flex items-start bg-red-50 p-6 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-4">
                      <span className="text-xl font-bold">!</span>
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item?.issue}</h3>
                    <p className="text-gray-700">{item?.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
            
            {/* Customer Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-16">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Customer Reviews</h2>
                <p className="text-xl text-gray-600">Trusted by homeowners across Rhode Island with over 85 verified reviews</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">4.9</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600">Average Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Review 1 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center text-green-600 font-semibold text-xl">
                      JR
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">J R</h4>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 272 92">
                          <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                          <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                          <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                          <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                          <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                          <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
                        </svg>
                        <span className="text-sm text-gray-600">Google • 5 reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center text-blue-600 font-semibold text-xl">
                      MD
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">M Da G</h4>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 272 92">
                          <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                          <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                          <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                          <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                          <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                          <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
                        </svg>
                        <span className="text-sm text-gray-600">Google • 3 reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center text-purple-600 font-semibold text-xl">
                      GL
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">Gianna Laurie</h4>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path d="M16.84 15.78l-5.72-5.72c-.19-.19-.44-.29-.71-.29s-.52.1-.71.29L8.8 11.24c-.39.39-.39 1.02 0 1.41l5.72 5.72c.19.19.44.29.71.29s.52-.1.71-.29l.9-.9c.39-.39.39-1.02 0-1.41l-5.72-5.72c-.19-.19-.44-.29-.71-.29s-.52.1-.71.29l-.9.9c-.39.39-.39 1.02 0 1.41l5.72 5.72c.19.19.44.29.71.29s.52-.1.71-.29l.9-.9c.39-.39.39-1.02 0-1.41z" fill="#009fd9"/>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#009fd9"/>
                        </svg>
                        <span className="text-sm text-gray-600">Thumbtack • 2 reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 4 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center text-red-600 font-semibold text-xl">
                      V4
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">V 401</h4>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 272 92">
                          <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                          <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
                          <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                          <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                          <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                          <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
                        </svg>
                        <span className="text-sm text-gray-600">Google • 8 reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 5 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-pink-100 rounded-full w-12 h-12 flex items-center justify-center text-pink-600 font-semibold text-xl">
                      RM
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">Rachel Morse</h4>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path d="M16.84 15.78l-5.72-5.72c-.19-.19-.44-.29-.71-.29s-.52.1-.71.29L8.8 11.24c-.39.39-.39 1.02 0 1.41l5.72 5.72c.19.19.44.29.71.29s.52-.1.71-.29l.9-.9c.39-.39.39-1.02 0-1.41l-5.72-5.72c-.19-.19-.44-.29-.71-.29s-.52.1-.71.29l-.9.9c-.39.39-.39 1.02 0 1.41l5.72 5.72c.19.19.44.29.71.29s.52-.1.71-.29l.9-.9c.39-.39.39-1.02 0-1.41z" fill="#009fd9"/>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#009fd9"/>
                        </svg>
                        <span className="text-sm text-gray-600">Thumbtack • 3 reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Final CTA */}
            <div className="bg-green-50 rounded-xl p-8">
              <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready for Professional {serviceData.title} in {city}?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Contact Flora Lawn & Landscaping Inc today for a free estimate and let our professionals take care of your lawn and landscaping needs.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href="tel:4013890913" 
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-center font-semibold text-lg hover:bg-green-700 transition-colors shadow-md inline-flex items-center justify-center"
              >
                <PhoneIcon className="h-6 w-6 mr-2" />
                Call for Free Quote
              </a>
                <Link 
                  href="/contact" 
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-center font-semibold text-lg hover:bg-green-50 transition-colors"
                >
                Contact Us
                </Link>
              </div>
            </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 