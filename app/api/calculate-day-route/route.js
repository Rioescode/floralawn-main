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

    console.log(`Calculating route for ${day} with ${customers.length} customers`);

    // First, geocode the home base address
    const homeBaseCoords = await geocodeAddress(homeBase, API_KEY);
    if (!homeBaseCoords) {
      return NextResponse.json({ 
        success: false, 
        error: `Could not geocode home base address: "${homeBase}"` 
      });
    }

    // Calculate optimized route
    const routeData = await calculateOptimizedRoute(homeBaseCoords, customers, API_KEY);
    
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
  const tryGeocode = async (addr) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formatted_address: data.results[0].formatted_address
        };
      }
      console.log(`Geocoding status for "${addr}":`, data.status, data.error_message || '');
      return null;
    } catch (error) {
      console.error('Geocoding fetch error:', error);
      return null;
    }
  };

  // First try: exact address
  let result = await tryGeocode(address);
  
  // Second try: append RI if it seems to be a local address
  if (!result && !address.toLowerCase().includes(', ri') && !address.toLowerCase().includes(' rhode island')) {
    console.log('Retrying geocoding with RI appended...');
    result = await tryGeocode(`${address}, RI`);
  }

  return result;
}

async function calculateOptimizedRoute(homeBase, customers, apiKey) {
  // First, reorder customers by proximity for optimal routing
  const optimizedCustomers = await reorderCustomersByProximity(homeBase, customers, apiKey);
  
  // Then calculate the route with the optimized order
  return await calculateFallbackRoute(homeBase, optimizedCustomers, apiKey);
}

async function reorderCustomersByProximity(homeBase, customers, apiKey) {
  if (customers.length <= 1) return customers;
  
  const orderedCustomers = [];
  const remainingCustomers = [...customers];
  let currentLocation = homeBase;
  
  // Start from home base and find closest customer each time
  while (remainingCustomers.length > 0) {
    let closestCustomer = null;
    let shortestDistance = Infinity;
    let closestIndex = -1;
    
    // Find the closest remaining customer to current location
    for (let i = 0; i < remainingCustomers.length; i++) {
      const customer = remainingCustomers[i];
      
      try {
        const origin = typeof currentLocation === 'object' 
          ? `${currentLocation.lat},${currentLocation.lng}`
          : encodeURIComponent(currentLocation);
        const destination = encodeURIComponent(customer.address);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&departure_time=now&traffic_model=best_guess&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
          const distance = data.rows[0].elements[0].distance.value; // in meters
          
          if (distance < shortestDistance) {
            shortestDistance = distance;
            closestCustomer = customer;
            closestIndex = i;
          }
        }
      } catch (error) {
        console.error('Error calculating distance to customer:', error);
      }
    }
    
    // Add the closest customer to ordered list
    if (closestCustomer) {
      orderedCustomers.push(closestCustomer);
      remainingCustomers.splice(closestIndex, 1);
      currentLocation = closestCustomer.address; // Update current location
    } else {
      // If we can't find distances, just add remaining customers in original order
      orderedCustomers.push(...remainingCustomers);
      break;
    }
  }
  
  console.log('Optimized customer order:', orderedCustomers.map(c => c.name));
  return orderedCustomers;
}

async function calculateFallbackRoute(homeBase, customers, apiKey) {
  // Calculate distance between consecutive customers in the route
  const routeData = [];
  let totalDistance = 0;
  let totalTime = 0;
  
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    
    // Calculate distance TO the next customer (not from home base)
    let travelTimeToNext = 'End of route';
    let distanceToNext = 'Return to base';
    let distanceToNextMeters = 0;
    let timeToNextSeconds = 0;
    
    if (i < customers.length - 1) {
      // There is a next customer
      const nextCustomer = customers[i + 1];
      const origin = encodeURIComponent(customer.address);
      const destination = encodeURIComponent(nextCustomer.address);
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&departure_time=now&traffic_model=best_guess&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
          const element = data.rows[0].elements[0];
          travelTimeToNext = element.duration.text;
          distanceToNext = element.distance.text;
          distanceToNextMeters = element.distance.value;
          timeToNextSeconds = element.duration.value;
        } else {
          travelTimeToNext = 'Unknown';
          distanceToNext = 'Unknown';
        }
      } catch (error) {
        console.error('Fallback route calculation error:', error);
        travelTimeToNext = 'Error';
        distanceToNext = 'Error';
      }
    }
    
    // Also calculate distance from previous location for total calculation
    if (i === 0) {
      // First customer - calculate from home base
      const origin = `${homeBase.lat},${homeBase.lng}`;
      const destination = encodeURIComponent(customer.address);
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&departure_time=now&traffic_model=best_guess&key=${apiKey}`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
          const element = data.rows[0].elements[0];
          totalDistance += element.distance.value;
          totalTime += element.duration.value;
        }
      } catch (error) {
        console.error('Error calculating distance from home base:', error);
      }
    }
    
    routeData.push({
      ...customer,
      order: i + 1,
      travelTimeToNext: travelTimeToNext,
      distanceToNext: distanceToNext,
      distanceToNextMeters: distanceToNextMeters,
      timeToNextSeconds: timeToNextSeconds
    });
  }
  
  return {
    customers: routeData,
    totalDistance: `${(totalDistance / 1609.34).toFixed(1)} miles`,
    totalTime: `${Math.round(totalTime / 60)} minutes`,
    totalDistanceMeters: totalDistance,
    totalTimeSeconds: totalTime
  };
} 