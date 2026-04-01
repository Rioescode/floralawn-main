'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ServiceAreasGrid({ cityData, lawnServices }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine number of items to show initially (roughly half)
  const initialShowCount = Math.ceil(cityData.length / 2);
  const itemsToShow = isExpanded ? cityData : cityData.slice(0, initialShowCount);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {itemsToShow.map((location, index) => (
          <Link
            key={index}
            href={`/${location.slug || (location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + (location.state || 'RI').toLowerCase())}`}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all group"
          >
            <h3 className="text-xl font-bold text-[#22C55E] mb-2 group-hover:text-[#1EA34B] transition-colors">
              {location.name}, {location.state || 'RI'} {/* Add state if available */}
            </h3>
            <p className="text-gray-600 mb-4">{location.county}</p>
            <div className="mt-4 text-[#22C55E] font-medium group-hover:text-[#1EA34B] transition-colors flex items-center">
              View Services 
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="mt-3 space-y-1">
              {(lawnServices || []).slice(0, 3).map((service, i) => (
                <div key={i} className="text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {service.title}
                </div>
              ))}
              {(lawnServices?.length > 3) && (
                 <div className="text-sm text-gray-400">And more services...</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Show More/Less Button */}
      {cityData.length > initialShowCount && (
        <div className="text-center mt-12">
          <button
            onClick={toggleExpansion}
            className="inline-block border border-green-600 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            {isExpanded ? 'Show Less Locations' : 'Show More Locations'}
          </button>
        </div>
      )}
    </div>
  );
} 