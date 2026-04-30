import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { homeBase, customers, day } = await request.json();
    
    if (!homeBase || !customers || customers.length === 0) {
      return NextResponse.json({ success: false, error: 'Home base and customers are required' });
    }

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Maps API key not configured' });
    }

    console.log(`Calculating ZERO-COST route for ${day} with ${customers.length} customers`);

    // 1. Get Home Base Coordinates (Geocode only if not a lat/lng string)
    let homeCoords = null;
    if (typeof homeBase === 'string' && homeBase.includes(',')) {
      const [lat, lng] = homeBase.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) homeCoords = { lat, lng };
    }
    
    if (!homeCoords) {
      homeCoords = await geocodeAddress(homeBase, API_KEY);
    }

    if (!homeCoords) {
      return NextResponse.json({ success: false, error: `Could not geocode home base address` });
    }

    // 2. Ensure all customers have coordinates (Prioritize DB coords)
    const processedCustomers = [];
    for (const customer of customers) {
      let lat = parseFloat(customer.latitude);
      let lng = parseFloat(customer.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        // Only geocode if missing (this is the only cost-path, and it's one-time)
        const coords = await geocodeAddress(customer.address, API_KEY);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      processedCustomers.push({ ...customer, lat, lng });
    }

    // 3. Optimize Route using Haversine (Crow-fly) - COMPLETELY FREE
    const optimizedList = optimizeRouteFree(homeCoords, processedCustomers);
    
    // 4. Calculate estimated travel times/distances (Free Math)
    const routeData = calculateRouteMetricsFree(homeCoords, optimizedList);
    
    return NextResponse.json({
      success: true,
      routeData: routeData.customers,
      totalDistance: routeData.totalDistance,
      totalTime: routeData.totalTime,
      day: day
    });

  } catch (error) {
    console.error('Day route calculation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to calculate day route: ' + error.message 
    });
  }
}

async function geocodeAddress(address, apiKey) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Optimization Logic: Uses Haversine distance (FREE)
function optimizeRouteFree(homeBase, customers) {
  if (customers.length <= 1) return customers;
  
  const ordered = [];
  const remaining = [...customers];
  let current = homeBase;
  
  while (remaining.length > 0) {
    let closestIdx = -1;
    let minGroupDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(
        current.lat, current.lng,
        remaining[i].lat || 0, remaining[i].lng || 0
      );
      if (dist < minGroupDist) {
        minGroupDist = dist;
        closestIdx = i;
      }
    }
    
    if (closestIdx !== -1) {
      const found = remaining.splice(closestIdx, 1)[0];
      ordered.push(found);
      current = { lat: found.lat, lng: found.lng };
    } else {
      ordered.push(...remaining);
      break;
    }
  }
  return ordered;
}

// Metrics Logic: Uses estimated speed and haversine (FREE)
function calculateRouteMetricsFree(homeBase, customers) {
  const route = [];
  let totalMeters = 0;
  let totalSeconds = 0;
  let current = homeBase;

  customers.forEach((customer, i) => {
    const distToNext = i < customers.length - 1 
      ? haversineDistance(customer.lat, customer.lng, customers[i+1].lat, customers[i+1].lng)
      : 0;
    
    const distFromPrev = haversineDistance(current.lat, current.lng, customer.lat, customer.lng);
    totalMeters += distFromPrev * 1609.34;
    // Estimate: 20mph average in residential neighborhoods
    totalSeconds += (distFromPrev / 20) * 3600;

    route.push({
      ...customer,
      order: i + 1,
      distanceToNext: i < customers.length - 1 ? `${distToNext.toFixed(1)} mi` : 'End of route',
      travelTimeToNext: i < customers.length - 1 ? `${Math.round(distToNext / 20 * 60)} mins` : 'Return to base'
    });
    
    current = { lat: customer.lat, lng: customer.lng };
  });

  return {
    customers: route,
    totalDistance: `${(totalMeters / 1609.34).toFixed(1)} miles`,
    totalTime: `${Math.round(totalSeconds / 60)} minutes`
  };
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