"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const CustomerMap = ({ 
  customers, 
  homeBase, 
  selectedWeek, 
  completedCustomers, 
  movedCustomers,
  onCustomerClick 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Day colors for different pins
  const dayColors = {
    'Monday': '#FF6B6B',    // Red
    'Tuesday': '#4ECDC4',   // Teal
    'Wednesday': '#45B7D1', // Blue
    'Thursday': '#96CEB4',  // Green
    'Friday': '#FFEAA7',    // Yellow
    'Saturday': '#DDA0DD',  // Plum
    'Sunday': '#FFB347',    // Orange
    'Unassigned': '#95A5A6' // Gray
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('Initializing Google Maps...');
        console.log('API Key present:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
        console.log('Current domain:', window.location.hostname);
        
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        console.log('Google Maps loaded successfully');
        
        // Default center (Rhode Island area)
        const defaultCenter = { lat: 41.5801, lng: -71.4774 }; // Rhode Island
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 10,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        console.log('Map instance created');
        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        
        // Provide specific error messages based on common issues
        let errorMessage = 'Failed to load Google Maps. ';
        
        if (err.message.includes('RefererNotAllowedMapError')) {
          errorMessage += 'The current domain is not authorized to use this API key. Please check your API key restrictions in Google Cloud Console.';
        } else if (err.message.includes('InvalidKeyMapError')) {
          errorMessage += 'The API key is invalid. Please check your API key in the environment variables.';
        } else if (err.message.includes('MissingKeyMapError')) {
          errorMessage += 'No API key provided. Please check your NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.';
        } else if (err.message.includes('ApiNotActivatedMapError')) {
          errorMessage += 'The Maps JavaScript API is not enabled. Please enable it in Google Cloud Console.';
        } else if (err.message.includes('QuotaExceededError')) {
          errorMessage += 'API quota exceeded. Please check your billing account and quotas.';
        } else {
          errorMessage += `Error: ${err.message}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    // Only initialize if API key is present
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      initMap();
    } else {
      setError('Google Maps API key is missing. Please check your environment variables.');
      setIsLoading(false);
    }
  }, []);

  // Update markers when customers or other props change
  useEffect(() => {
    if (!map || !customers.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers = [];
    const bounds = new google.maps.LatLngBounds();
    const geocoder = new google.maps.Geocoder();

    // Add home base marker if provided
    if (homeBase) {
      geocoder.geocode({ address: homeBase }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const homeMarker = new google.maps.Marker({
            position: results[0].geometry.location,
            map: map,
            title: 'Home Base',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#2ECC71" stroke="#27AE60" stroke-width="2"/>
                  <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">🏠</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20)
            }
          });
          bounds.extend(results[0].geometry.location);
          newMarkers.push(homeMarker);
        }
      });
    }

    // Add customer markers - only for customers with addresses
    const customersWithAddresses = customers.filter(customer => customer.address);
    
    customersWithAddresses.forEach(customer => {
      geocoder.geocode({ address: customer.address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const position = results[0].geometry.location;
          
          // Determine day and color
          const scheduledDay = customer.scheduled_day || 'Unassigned';
          const baseDay = scheduledDay.replace(' Week 1', '').replace(' Week 2', '');
          const dayColor = dayColors[baseDay] || dayColors['Unassigned'];
          
          // Check if customer is completed or moved
          const isCompleted = completedCustomers[scheduledDay]?.includes(customer.id);
          const isMoved = movedCustomers[scheduledDay]?.includes(customer.id);
          
          // Create custom marker icon
          const markerIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.7 0 0 6.7 0 15c0 8.3 15 25 15 25s15-16.7 15-25C30 6.7 23.3 0 15 0z" 
                      fill="${dayColor}" 
                      stroke="${isCompleted ? '#27AE60' : isMoved ? '#E67E22' : '#2C3E50'}" 
                      stroke-width="${isCompleted || isMoved ? '3' : '2'}"/>
                <circle cx="15" cy="15" r="8" fill="white"/>
                <text x="15" y="20" text-anchor="middle" fill="${dayColor}" font-family="Arial" font-size="12" font-weight="bold">
                  ${customer.frequency === 'weekly' ? 'W' : 'B'}
                </text>
                ${isCompleted ? '<circle cx="22" cy="8" r="4" fill="#27AE60"/><text x="22" y="11" text-anchor="middle" fill="white" font-size="8">✓</text>' : ''}
                ${isMoved ? '<circle cx="22" cy="8" r="4" fill="#E67E22"/><text x="22" y="11" text-anchor="middle" fill="white" font-size="8">→</text>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(30, 40),
            anchor: new google.maps.Point(15, 40)
          };

          const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: customer.name,
            icon: markerIcon
          });

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #2C3E50;">${customer.name}</h3>
                <p style="margin: 4px 0; color: #7F8C8D;"><strong>Day:</strong> ${scheduledDay}</p>
                <p style="margin: 4px 0; color: #7F8C8D;"><strong>Frequency:</strong> ${customer.frequency.replace('_', '-')}</p>
                <p style="margin: 4px 0; color: #7F8C8D;"><strong>Price:</strong> $${customer.price}</p>
                <p style="margin: 4px 0; color: #7F8C8D;"><strong>Phone:</strong> ${customer.phone}</p>
                <p style="margin: 4px 0; color: #7F8C8D;"><strong>Address:</strong> ${customer.address}</p>
                ${customer.distance_miles ? `<p style="margin: 4px 0; color: #7F8C8D;"><strong>Distance:</strong> ${customer.distance_miles} mi</p>` : ''}
                ${customer.travel_time ? `<p style="margin: 4px 0; color: #7F8C8D;"><strong>Travel Time:</strong> ${customer.travel_time}</p>` : ''}
                ${customer.notes ? `<p style="margin: 4px 0; color: #7F8C8D;"><strong>Notes:</strong> ${customer.notes}</p>` : ''}
                ${isCompleted ? '<p style="margin: 8px 0 4px 0; color: #27AE60; font-weight: bold;">✅ Completed</p>' : ''}
                ${isMoved ? '<p style="margin: 8px 0 4px 0; color: #E67E22; font-weight: bold;">→ Moved to Next Day</p>' : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            if (onCustomerClick) {
              onCustomerClick(customer);
            }
          });

          bounds.extend(position);
          newMarkers.push(marker);
        }
      });
    });

    setMarkers(newMarkers);

    // Fit map to show all markers after a delay to let geocoding complete
    setTimeout(() => {
      if (bounds.isEmpty() === false) {
        map.fitBounds(bounds);
        // Don't zoom in too much for single markers
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      }
    }, 2000);

  }, [map, customers, homeBase, selectedWeek, completedCustomers, movedCustomers]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg font-semibold mb-4">Google Maps Error</div>
          <div className="text-red-700 text-sm mb-4">{error}</div>
          <div className="text-xs text-gray-600 space-y-2">
            <p><strong>Common fixes:</strong></p>
            <ul className="text-left space-y-1">
              <li>• Check API key restrictions in Google Cloud Console</li>
              <li>• Ensure billing account is set up (even for free usage)</li>
              <li>• Verify Maps JavaScript API is enabled</li>
              <li>• Add your domain to API key restrictions</li>
            </ul>
            <p className="mt-3">
              <strong>Current domain:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading Google Maps...</div>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-gray-200" />
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Map Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(dayColors).map(([day, color]) => (
            <div key={day} className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-gray-700">{day}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full mr-2 flex items-center justify-center text-white text-xs">🏠</div>
              <span>Home Base</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border-2 border-green-500 rounded-full mr-2 flex items-center justify-center text-xs">✓</div>
              <span>Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border-2 border-orange-500 rounded-full mr-2 flex items-center justify-center text-xs">→</div>
              <span>Moved</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-400 rounded-full mr-2 flex items-center justify-center text-xs font-bold">W</div>
              <span>Weekly</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-400 rounded-full mr-2 flex items-center justify-center text-xs font-bold">B</div>
              <span>Bi-weekly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMap; 