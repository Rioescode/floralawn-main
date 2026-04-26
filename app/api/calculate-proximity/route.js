import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { homeBase, customers } = await request.json();
    
    if (!homeBase || !customers || customers.length === 0) {
      return NextResponse.json({ success: false, error: 'Home base and customers are required' });
    }

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Maps API key not configured' });
    }

    console.log('Processing proximity calculation for home base:', homeBase);
    console.log('Number of customers:', customers.length);

    // First, geocode the home base address
    const homeBaseCoords = await geocodeAddress(homeBase, API_KEY);
    if (!homeBaseCoords) {
      return NextResponse.json({ 
        success: false, 
        error: `Could not geocode home base address: "${homeBase}". Please check the address format and try again.` 
      });
    }

    console.log('Home base geocoded successfully:', homeBaseCoords);

    // Calculate distances from home base to all customers
    const proximityData = await calculateDistancesFromHomeBase(homeBaseCoords, customers, API_KEY);
    
    return NextResponse.json({
      success: true,
      proximityData,
      homeBaseCoords,
      totalCustomers: Object.keys(proximityData).length
    });

  } catch (error) {
    console.error('Proximity calculation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to calculate proximity: ' + error.message 
    });
  }
}

async function geocodeAddress(address, apiKey) {
  try {
    console.log('Geocoding address:', address);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    const data = await response.json();
    console.log('Geocoding response status:', data.status);
    console.log('Geocoding response:', JSON.stringify(data, null, 2));
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('Successfully geocoded to:', location);
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.results[0].formatted_address
      };
    } else {
      console.error('Geocoding failed:', data.status, data.error_message || 'No error message');
      return null;
    }
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function calculateDistancesFromHomeBase(homeBase, customers, apiKey) {
  const proximityData = {};
  const batchSize = 25; // Google Maps API limit
  
  // Process customers in batches
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    
    try {
      const destinations = batch.map(c => encodeURIComponent(c.address)).join('|');
      const origin = `${homeBase.lat},${homeBase.lng}`;
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&units=imperial&departure_time=now&traffic_model=best_guess&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows.length > 0) {
        const row = data.rows[0];
        
        row.elements.forEach((element, index) => {
          const customer = batch[index];
          
          if (element.status === 'OK') {
            proximityData[customer.id] = {
              distance: element.distance.value, // meters
              duration: element.duration.value, // seconds
              distanceText: element.distance.text,
              durationText: element.duration.text,
              customerName: customer.name,
              customerAddress: customer.address
            };
          } else {
            // Fallback to straight-line distance if API fails
            const straightLineDistance = haversineDistance(
              homeBase.lat, homeBase.lng,
              parseFloat(customer.lat) || 0, parseFloat(customer.lng) || 0
            );
            
            proximityData[customer.id] = {
              distance: straightLineDistance * 1609.34, // convert to meters
              duration: (straightLineDistance / 30) * 3600, // estimate at 30mph
              distanceText: `~${straightLineDistance.toFixed(1)} mi`,
              durationText: `~${Math.round(straightLineDistance / 30 * 60)} min`,
              customerName: customer.name,
              customerAddress: customer.address,
              estimated: true
            };
          }
        });
      }
    } catch (error) {
      console.error('Distance calculation error for batch:', error);
    }
  }
  
  return proximityData;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
} 