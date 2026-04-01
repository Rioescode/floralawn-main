'use client';

import { useState, useEffect } from 'react';

export default function CompletionChecklist({ onAccept, initialState = {} }) {
  const [checklist, setChecklist] = useState({
    properDisposal: false,
    areaClean: false,
    noDamage: false,
    recycling: false,
    estimateAccurate: false,
    photosUploaded: false,
    ...initialState
  });

  const handleChange = (item) => (e) => {
    const newChecklist = {
      ...checklist,
      [item]: e.target.checked
    };
    setChecklist(newChecklist);
    onAccept(newChecklist);
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progress = (completedCount / totalCount) * 100;

  const checklistItems = [
    {
      id: 'properDisposal',
      label: 'All items were properly disposed of at authorized facilities',
      description: 'Confirm that all waste was taken to licensed disposal facilities'
    },
    {
      id: 'areaClean',
      label: 'Work area has been swept and cleaned of all debris',
      description: 'Ensure the work site is clean and presentable'
    },
    {
      id: 'noDamage',
      label: 'No damage was caused to customer property during removal',
      description: 'Verify that no property damage occurred during the service'
    },
    {
      id: 'recycling',
      label: 'Recyclable materials were properly sorted and recycled',
      description: 'Confirm that recyclable items were separated and sent for recycling'
    },
    {
      id: 'estimateAccurate',
      label: 'Total weight/volume was within quoted estimate',
      description: 'Verify that the job stayed within the original scope'
    },
    {
      id: 'photosUploaded',
      label: 'Before and after photos have been uploaded',
      description: 'Ensure documentation photos are uploaded to the platform'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Job Completion Checklist</h3>
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{completedCount} of {totalCount} tasks completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div key={item.id} className="relative flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex h-6 items-center">
              <input
                id={item.id}
                name={item.id}
                type="checkbox"
                checked={checklist[item.id]}
                onChange={handleChange(item.id)}
                className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor={item.id} className="font-medium text-gray-700">
                {item.label}
              </label>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {!Object.values(checklist).every(Boolean) && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please complete all checklist items before marking the job as complete
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 