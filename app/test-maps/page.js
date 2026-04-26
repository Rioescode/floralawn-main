"use client";

import { useEffect, useState } from 'react';

export default function TestMapsPage() {
  const [testResults, setTestResults] = useState({
    apiKey: null,
    domain: null,
    simpleMapTest: null,
    error: null
  });

  useEffect(() => {
    const runTests = async () => {
      const results = { ...testResults };
      
      // Test 1: Check if API key exists
      results.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
        `Present (${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...)` : 
        'Missing';
      
      // Test 2: Check current domain
      results.domain = window.location.hostname;
      
      // Test 3: Try to load Google Maps
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        
        script.onload = () => {
          results.simpleMapTest = 'Google Maps script loaded successfully';
          setTestResults({ ...results });
        };
        
        script.onerror = (error) => {
          results.simpleMapTest = 'Failed to load Google Maps script';
          results.error = error.message || 'Script loading error';
          setTestResults({ ...results });
        };
        
        document.head.appendChild(script);
        
        // Clean up
        return () => {
          document.head.removeChild(script);
        };
      } catch (error) {
        results.simpleMapTest = 'Error testing Google Maps';
        results.error = error.message;
        setTestResults({ ...results });
      }
    };

    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Google Maps API Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">API Key Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                testResults.apiKey?.includes('Present') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {testResults.apiKey || 'Checking...'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Current Domain:</span>
              <span className="text-gray-700">{testResults.domain || 'Checking...'}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Maps Script Test:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                testResults.simpleMapTest?.includes('successfully') ? 'bg-green-100 text-green-800' : 
                testResults.simpleMapTest?.includes('Failed') ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {testResults.simpleMapTest || 'Testing...'}
              </span>
            </div>
            
            {testResults.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <span className="font-medium text-red-800">Error Details:</span>
                <p className="text-red-700 text-sm mt-1">{testResults.error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Troubleshooting Steps</h2>
          
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">1. Check Google Cloud Console</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Go to <a href="https://console.cloud.google.com" target="_blank" className="underline">Google Cloud Console</a></li>
                <li>• Navigate to "APIs & Services" → "Credentials"</li>
                <li>• Find your Maps API key and click edit</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-900 mb-2">2. Set Application Restrictions</h3>
              <ul className="text-green-800 space-y-1">
                <li>• Choose "HTTP referrers (websites)"</li>
                <li>• Add: <code className="bg-white px-1 rounded">localhost:*</code> (for development)</li>
                <li>• Add: <code className="bg-white px-1 rounded">*.yourdomain.com/*</code> (for production)</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-900 mb-2">3. Enable Required APIs</h3>
              <ul className="text-yellow-800 space-y-1">
                <li>• Maps JavaScript API</li>
                <li>• Places API</li>
                <li>• Geocoding API (if needed)</li>
              </ul>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded">
              <h3 className="font-semibold text-purple-900 mb-2">4. Set Up Billing</h3>
              <ul className="text-purple-800 space-y-1">
                <li>• Google requires a billing account even for free usage</li>
                <li>• Go to "Billing" in Google Cloud Console</li>
                <li>• Add a credit card (you get $200 free monthly credit)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Rerun Tests
          </button>
        </div>
      </div>
    </div>
  );
} 