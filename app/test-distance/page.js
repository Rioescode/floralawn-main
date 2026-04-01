'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Calculator, Plus, Trash2, Navigation } from 'lucide-react';

export default function TestDistancePage() {
  const [addresses, setAddresses] = useState(['', '']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [apiError, setApiError] = useState(null);
  const autocompleteRefs = useRef([]);

  // Load Google Maps Places API
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps API already loaded');
        setGoogleMapsLoaded(true);
        return;
      }

      // Remove any existing scripts
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setApiError('Google Maps API key is missing from environment');
        return;
      }

      console.log('Loading Google Maps API...');
      
      // Create a unique callback name to avoid conflicts
      const callbackName = `initGoogleMaps${Date.now()}`;
      
      // Create the callback function
      window[callbackName] = () => {
        console.log('Google Maps callback executed');
        
        // Check if everything loaded properly
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Google Maps and Places API loaded successfully');
          setGoogleMapsLoaded(true);
          setApiError(null);
        } else {
          console.error('❌ Google Maps loaded but Places API missing');
          setApiError('Google Maps loaded but Places API is not available');
        }
        
        // Clean up the callback
        delete window[callbackName];
      };
      
      // Handle loading errors
      window.gm_authFailure = () => {
        console.error('❌ Google Maps authentication failed');
        setApiError('Google Maps authentication failed. Check your API key.');
        delete window[callbackName];
      };
      
      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script:', error);
        setApiError('Failed to load Google Maps script. Check your internet connection.');
        delete window[callbackName];
      };
      
      // Add to document
      document.head.appendChild(script);
      
      // Set a timeout as backup
      setTimeout(() => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          console.error('❌ Google Maps loading timeout');
          setApiError('Google Maps loading timeout. Please refresh the page.');
          delete window[callbackName];
        }
      }, 10000); // 10 second timeout
    };

    loadGoogleMaps();

    // Cleanup function
    return () => {
      // Clean up any remaining callbacks
      Object.keys(window).forEach(key => {
        if (key.startsWith('initGoogleMaps')) {
          delete window[key];
        }
      });
      
      // Clean up auth failure handler
      if (window.gm_authFailure) {
        delete window.gm_authFailure;
      }
    };
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!googleMapsLoaded) return;

    const initializeAutocomplete = () => {
      try {
        // Double-check that everything is available
        if (!window.google?.maps?.places?.Autocomplete) {
          console.error('❌ Google Maps Places Autocomplete not available');
          setApiError('Google Maps Places Autocomplete not available');
          return;
        }

        console.log('✅ Initializing autocomplete...');

        const fromInput = document.getElementById('from-address');
        const toInput = document.getElementById('to-address');

        if (!fromInput || !toInput) {
          console.error('❌ Address input elements not found');
          return;
        }

        // Clear any existing autocomplete
        if (fromAutocomplete) {
          google.maps.event.clearInstanceListeners(fromAutocomplete);
        }
        if (toAutocomplete) {
          google.maps.event.clearInstanceListeners(toAutocomplete);
        }

        // Create new autocomplete instances with optimized options
        const autocompleteOptions = {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'geometry', 'name'],
          strictBounds: false,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(25.7617, -80.1918), // Southwest (Miami)
            new google.maps.LatLng(30.4518, -81.3724)  // Northeast (Jacksonville)
          )
        };

        const newFromAutocomplete = new google.maps.places.Autocomplete(fromInput, autocompleteOptions);
        const newToAutocomplete = new google.maps.places.Autocomplete(toInput, autocompleteOptions);

        // Set up event listeners
        newFromAutocomplete.addListener('place_changed', () => {
          const place = newFromAutocomplete.getPlace();
          if (place.formatted_address) {
            setFromAddress(place.formatted_address);
            console.log('✅ From address selected:', place.formatted_address);
          }
        });

        newToAutocomplete.addListener('place_changed', () => {
          const place = newToAutocomplete.getPlace();
          if (place.formatted_address) {
            setToAddress(place.formatted_address);
            console.log('✅ To address selected:', place.formatted_address);
          }
        });

        // Store references
        setFromAutocomplete(newFromAutocomplete);
        setToAutocomplete(newToAutocomplete);

        console.log('✅ Autocomplete initialized successfully');
        setApiError(null);

      } catch (error) {
        console.error('❌ Error initializing autocomplete:', error);
        setApiError(`Error initializing autocomplete: ${error.message}`);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeAutocomplete, 100);
    return () => clearTimeout(timer);

  }, [googleMapsLoaded]);

  // Add CSS for better autocomplete styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Make autocomplete dropdown more visible */
      .pac-container {
        z-index: 9999 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        border: 1px solid #e5e7eb !important;
        margin-top: 2px !important;
      }
      
      /* Style autocomplete items */
      .pac-item {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
        cursor: pointer !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
      }
      
      .pac-item:hover {
        background-color: #f8fafc !important;
      }
      
      .pac-item-selected {
        background-color: #3b82f6 !important;
        color: white !important;
      }
      
      /* Style the matched text */
      .pac-matched {
        font-weight: 600 !important;
        color: #1f2937 !important;
      }
      
      .pac-item-selected .pac-matched {
        color: white !important;
      }
      
      /* Remove Google logo (optional) */
      .pac-logo:after {
        display: none !important;
      }
      
      /* Style input when focused */
      .autocomplete-input:focus {
        outline: none !important;
        ring: 2px !important;
        ring-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const addAddress = () => {
    setAddresses([...addresses, '']);
  };

  const removeAddress = (index) => {
    if (addresses.length > 2) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(newAddresses);
      // Remove the corresponding ref
      autocompleteRefs.current = autocompleteRefs.current.filter((_, i) => i !== index);
    }
  };

  const updateAddress = (index, value) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

  const calculateDistances = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: addresses.filter(addr => addr.trim()) })
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        alert(data.error || 'Error calculating distances');
      }
    } catch (error) {
      console.error('Error calculating distances:', error);
      alert('Error calculating distances');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Distance Calculator</h1>
          <p className="text-gray-600">Test addresses to see distances between them - start typing for suggestions</p>
          
          {/* Loading/Error States */}
          {!googleMapsLoaded && !apiError && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">Loading Google Maps autocomplete...</p>
            </div>
          )}
          
          {apiError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{apiError}</p>
              <p className="text-xs text-red-600 mt-1">
                Make sure Places API is enabled in Google Cloud Console
              </p>
            </div>
          )}
          
          {/* Debug Info */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing'}</p>
            <p>Google Maps Loaded: {googleMapsLoaded ? '✅ Yes' : '❌ No'}</p>
            <p>Places API Available: {typeof window !== 'undefined' && window.google?.maps?.places ? '✅ Yes' : '❌ No'}</p>
            <p>Error: {apiError || 'None'}</p>
          </div>
        </div>

        {/* Address Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Enter Addresses</h2>
          
          {googleMapsLoaded && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>Quick tip:</strong> Start typing any address and click on suggestions that appear. 
                You can also use arrow keys ↑↓ to navigate and Enter to select.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {addresses.map((address, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <input
                  ref={el => autocompleteRefs.current[index] = el}
                  type="text"
                  value={address}
                  onChange={(e) => updateAddress(index, e.target.value)}
                  placeholder={googleMapsLoaded ? "Type address for instant suggestions..." : "Enter full address (e.g., 123 Main St, Providence, RI)"}
                  className="autocomplete-input flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {addresses.length > 2 && (
                  <button
                    onClick={() => removeAddress(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={addAddress}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </button>

            <button
              onClick={calculateDistances}
              disabled={loading || addresses.filter(addr => addr.trim()).length < 2}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Distances
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Distance Results</h2>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        From: {result.from.address}
                      </h3>
                      <p className="text-sm text-gray-500">
                        To: {result.to.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {result.distance} miles
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.drivingTime} min drive
                      </div>
                      {result.fallback && (
                        <div className="text-xs text-red-500 mt-1">
                          ⚠️ Estimated (API failed)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Driving Distance:</span>
                      <div className="font-semibold text-blue-600">{result.distance} miles</div>
                      <span className="text-gray-500">Straight Line:</span>
                      <div className="text-gray-600">{result.straightLineDistance} miles</div>
                    </div>
                    <div>
                      <span className="text-gray-500">From Coordinates:</span>
                      <br />
                      <span className="font-mono text-xs">
                        {result.from.lat.toFixed(6)}, {result.from.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <span>Route Type: </span>
                    <span className={result.fallback ? 'text-red-600' : 'text-green-600'}>
                      {result.fallback ? 'Estimated (straight-line)' : 'Real driving route via Google Maps'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Addresses:</span>
                  <div className="font-semibold">{addresses.filter(addr => addr.trim()).length}</div>
                </div>
                <div>
                  <span className="text-blue-700">Total Distance:</span>
                  <div className="font-semibold">
                    {results.reduce((sum, r) => sum + r.distance, 0).toFixed(1)} miles
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Total Drive Time:</span>
                  <div className="font-semibold">
                    {results.reduce((sum, r) => sum + r.drivingTime, 0)} minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 