import { NextResponse } from 'next/server';
import { geocodingService } from '../../../lib/geocoding.js';

export async function POST(request) {
  try {
    const { addresses } = await request.json();

    if (!addresses || !Array.isArray(addresses) || addresses.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 addresses are required' },
        { status: 400 }
      );
    }

    // Geocode all addresses
    console.log(`Geocoding ${addresses.length} addresses...`);
    const geocodedAddresses = [];
    const errors = [];

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i].trim();
      if (!address) continue;

      try {
        const coordinates = await geocodingService.geocodeAddress(address);
        geocodedAddresses.push({
          index: i,
          address: address,
          formatted_address: coordinates.formatted_address,
          lat: coordinates.lat,
          lng: coordinates.lng
        });
      } catch (error) {
        errors.push({
          index: i,
          address: address,
          error: error.message
        });
      }
    }

    if (geocodedAddresses.length < 2) {
      return NextResponse.json(
        { 
          error: 'Not enough valid addresses could be geocoded',
          geocodingErrors: errors
        },
        { status: 400 }
      );
    }

    // Use Google Distance Matrix API for real driving distances
    console.log('Getting real driving distances from Google Distance Matrix API...');
    const results = [];
    
    // Process in batches to avoid API limits
    for (let i = 0; i < geocodedAddresses.length; i++) {
      for (let j = i + 1; j < geocodedAddresses.length; j++) {
        const from = geocodedAddresses[i];
        const to = geocodedAddresses[j];
        
        try {
          // Use Google Distance Matrix API for real driving distance/time
          const distanceData = await getRealDrivingDistance(from, to);
          
          results.push({
            from: {
              address: from.formatted_address || from.address,
              lat: from.lat,
              lng: from.lng
            },
            to: {
              address: to.formatted_address || to.address,
              lat: to.lat,
              lng: to.lng
            },
            distance: distanceData.distance,
            drivingTime: distanceData.duration,
            straightLineDistance: Math.round(geocodingService.calculateDistance(
              from.lat, from.lng, to.lat, to.lng, 'miles'
            ) * 100) / 100
          });
        } catch (error) {
          console.error(`Error getting distance between ${from.address} and ${to.address}:`, error);
          
          // Fallback to straight-line distance if Distance Matrix fails
          const straightDistance = geocodingService.calculateDistance(
            from.lat, from.lng, to.lat, to.lng, 'miles'
          );
          const estimatedTime = Math.round((straightDistance / 30) * 60);
          
          results.push({
            from: {
              address: from.formatted_address || from.address,
              lat: from.lat,
              lng: from.lng
            },
            to: {
              address: to.formatted_address || to.address,
              lat: to.lat,
              lng: to.lng
            },
            distance: Math.round(straightDistance * 100) / 100,
            drivingTime: estimatedTime,
            straightLineDistance: Math.round(straightDistance * 100) / 100,
            fallback: true
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      geocodedAddresses: geocodedAddresses.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distances', details: error.message },
      { status: 500 }
    );
  }
}

// Get real driving distance and time using Google Distance Matrix API
async function getRealDrivingDistance(from, to) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const origin = `${from.lat},${from.lng}`;
  const destination = `${to.lat},${to.lng}`;
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&mode=driving&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
    const element = data.rows[0].elements[0];
    
    return {
      distance: parseFloat(element.distance.text.replace(' mi', '')),
      duration: Math.round(element.duration.value / 60) // Convert seconds to minutes
    };
  } else {
    throw new Error(`Distance Matrix API error: ${data.status}`);
  }
} 