'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function ServiceAccordion({ lawnServices, cityData }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Ensure cityData is available and has at least one city for default links
  const defaultCitySlug = cityData?.[0]?.name.toLowerCase().replace(/\s+/g, '-') || 'providence';

  return (
    <div className="space-y-4">
      {lawnServices.map((service, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Accordion Header Button */}
            <button
              onClick={() => handleToggle(index)}
              className="w-full flex justify-between items-center text-left p-6 focus:outline-none focus-visible:ring focus-visible:ring-green-500 focus-visible:ring-opacity-75"
            >
              <h3 className="text-xl font-bold text-[#22C55E]">
                {service.title}
              </h3>
              <ChevronDownIcon 
                className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
              />
            </button>

            {/* Accordion Content (Conditionally Rendered) */}
            {isOpen && (
              <div className="p-6 pt-0">
                <p className="text-gray-600 mb-6 border-t border-gray-200 pt-4">{service.description}</p>

                {/* Benefits Section */}
                {service.serviceContent?.benefits && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Benefits</h4>
                    <div className="space-y-2">
                      {service.serviceContent.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start text-sm text-gray-600">
                          <CheckIcon className="w-4 h-4 mr-2 text-[#22C55E] mt-0.5 flex-shrink-0" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Options Section */}
                {service.serviceContent?.types && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Service Options</h4>
                    <div className="space-y-4">
                      {service.serviceContent.types.map((type, i) => (
                        <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                          <h5 className="font-medium text-gray-700 mb-2">{type.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {type.benefits.map((benefit, j) => (
                              <li key={j} className="text-sm text-gray-600 flex items-center">
                                <span className="text-[#22C55E] mr-2">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Common Issues Section */}
                {service.serviceContent?.commonIssues && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Common Issues & Solutions</h4>
                    <div className="space-y-3">
                      {service.serviceContent.commonIssues.map((issue, i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <h5 className="font-medium text-gray-700 mb-1">{issue.issue}</h5>
                          <p className="text-sm text-gray-600">{issue.solution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learn More Link */}
                <div className="mt-6 text-right">
                  <Link
                    href={`/${defaultCitySlug}/${service.urlPath}`}
                    className="inline-flex items-center text-[#22C55E] font-medium hover:text-[#1EA34B] transition-colors"
                  >
                    Learn More 
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 