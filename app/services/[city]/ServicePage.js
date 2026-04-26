'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { lawnServices } from '@/data/lawn-services'

export default function ServicePage({ city, service }) {
  // Find the service data from lawn-services.js
  const serviceData = lawnServices.find(s => s.urlPath === service)
  
  if (!serviceData) return null

  // Get a random H1 variation or default to the first one
  const h1 = serviceData.h1Variations[Math.floor(Math.random() * serviceData.h1Variations.length)]
    .replace('{city}', city)

  return (
    <>
      <Navigation />

      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-10">
              <h1 className="text-4xl font-bold mb-4">
                {h1}
              </h1>
              <p className="text-xl text-gray-600">
                {serviceData.description}
              </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="space-y-6">
                  {/* Benefits Section */}
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Benefits</h2>
                    <ul className="space-y-3">
                      {serviceData.serviceContent.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-[#22C55E] mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Service Types */}
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Service Options</h2>
                    <div className="space-y-4">
                      {serviceData.serviceContent.types.map((type, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                          <h3 className="text-lg font-semibold text-[#22C55E] mb-2">{type.name}</h3>
                          <p className="text-gray-600 mb-3">{type.description}</p>
                          <ul className="space-y-2">
                            {type.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-2 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seasonal Tips & Common Issues */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">Seasonal Tips</h2>
                  {Object.entries(serviceData.serviceContent.seasonalTips).map(([season, tips]) => (
                    <div key={season} className="mb-4">
                      <h3 className="text-lg font-semibold text-[#22C55E] capitalize mb-2">{season}</h3>
                      <ul className="space-y-2">
                        {tips.map((tip, index) => (
                          <li key={index} className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">Common Issues & Solutions</h2>
                  <div className="space-y-4">
                    {serviceData.serviceContent.commonIssues.map((item, index) => (
                      <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <h3 className="text-lg font-semibold text-red-500 mb-2">{item.issue}</h3>
                        <p className="text-gray-600">{item.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
} 