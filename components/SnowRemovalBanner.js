'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SnowRemovalBanner() {
  const router = useRouter();
  const [tierInfo, setTierInfo] = useState(null);

  useEffect(() => {
    const getTierInfo = () => {
      const now = new Date();
      const winterStart = new Date(now.getFullYear(), 11, 21); // December 21st

      if (now > winterStart) {
        return null; // Don't show banner during winter
      }

      const months = winterStart.getMonth() - now.getMonth() + 
        (winterStart.getFullYear() - now.getFullYear()) * 12;

      if (months >= 6) {
        return {
          tier: 'Ultra Early Bird',
          discount: 25,
          description: 'Maximum savings! Lock in 25% off for booking 6+ months early.',
          color: 'purple'
        };
      } else if (months >= 4) {
        return {
          tier: 'Super Early Bird',
          discount: 20,
          description: 'Great value! Get 20% off for booking 4-6 months early.',
          color: 'blue'
        };
      } else if (months >= 2) {
        return {
          tier: 'Early Bird',
          discount: 15,
          description: 'Smart planning! Save 15% for booking 2-4 months early.',
          color: 'green'
        };
      } else {
        return {
          tier: 'Last Minute Bird',
          discount: 10,
          description: 'Quick decision discount! Get 10% off for advance booking.',
          color: 'yellow'
        };
      }
    };

    setTierInfo(getTierInfo());
  }, []);

  if (!tierInfo) return null;

  return (
    <div className={`bg-gradient-to-r from-${tierInfo.color}-500 to-${tierInfo.color}-600 shadow-lg`}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="sm:text-center sm:px-16">
          <div className="flex items-center justify-center">
            <span className="flex p-2 rounded-lg bg-white/10">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="ml-3 font-medium text-white truncate">
                {tierInfo.tier} Snow Removal Discount - Save {tierInfo.discount}% Off!
              </span>
            </span>
            <div className="flex-1 flex justify-center ml-4">
              <button
                onClick={() => router.push('/snow-removal')}
                className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${tierInfo.color}-600 bg-white hover:bg-${tierInfo.color}-50`}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 