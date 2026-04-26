'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaiverCheckbox({ onAccept = () => {}, userType = 'customer' }) {
  const [accepted, setAccepted] = useState(false);

  const handleChange = (e) => {
    setAccepted(e.target.checked);
    if (e.target.checked) {
      onAccept();
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="waiver"
            name="waiver"
            type="checkbox"
            checked={accepted}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="waiver" className="font-medium text-gray-700">
            I accept the{' '}
            <Link
              href={userType === 'professional' ? '/legal/pro/contractor-agreement' : '/liability-waiver'}
              target="_blank"
              className="text-blue-600 hover:text-blue-500"
            >
              {userType === 'professional' ? 'Contractor Agreement' : 'Liability Waiver'}
            </Link>
          </label>
          <p className="text-gray-500">
            By checking this box, you acknowledge that you have read and agree to our terms.
          </p>
        </div>
      </div>
    </div>
  );
} 