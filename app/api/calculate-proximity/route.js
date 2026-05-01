import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { homeBase, customers } = await request.json();
    
    if (!homeBase || !customers || customers.length === 0) {
      return NextResponse.json({ success: false, error: 'Home base and customers are required' });
    }

    // 1. Geocode Home Base
    let homeCoords = homeBaseCoords;
    if (!homeCoords) {
      console.error("Home Base missing coordinates. Proximity will be inaccurate.");
      homeCoords = { lat: 41.7, lng: -71.5 }; // Default fallback center of RI
    }

    // 2. Efficiently calculate proximity using math (FREE)
    const proximityData = {};
    
    for (const customer of customers) {
      let lat = parseFloat(customer.latitude);
      let lng = parseFloat(customer.longitude);

      // Only geocode if coordinates are missing from DB
      if (isNaN(lat) || isNaN(lng)) {
        const coords = await geocodeAddress(customer.address, API_KEY);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      if (!isNaN(lat) && !isNaN(lng)) {
        const distMiles = haversineDistance(homeBaseCoords.lat, homeBaseCoords.lng, lat, lng);
        proximityData[customer.id] = {
          distance: distMiles * 1609.34, // meters
          duration: (distMiles / 25) * 3600, // seconds (est 25mph)
          distanceText: `${distMiles.toFixed(1)} mi`,
          durationText: `${Math.round(distMiles / 25 * 60)} min`,
          customerName: customer.name,
          customerAddress: customer.address
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      proximityData,
      homeBaseCoords,
      totalCustomers: Object.keys(proximityData).length
    });

  } catch (error) {
    console.error('Proximity calculation error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

// geocodeAddress removed to eliminate costs.

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