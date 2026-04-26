import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { customers, currentSchedule, maxCustomersPerDay = 8 } = await request.json();
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Google Maps API key not configured' 
      });
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No customers provided' 
      });
    }

    // Filter customers with valid addresses
    const validCustomers = customers.filter(c => c.address && c.address.trim());
    
    if (validCustomers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No customers with valid addresses found' 
      });
    }

    // Calculate distances between all customers using Distance Matrix API
    const distanceMatrix = await calculateDistanceMatrix(validCustomers);
    
    // Group customers by proximity using clustering algorithm
    const clusters = createProximityClusters(validCustomers, distanceMatrix, maxCustomersPerDay);
    
    // Assign clusters to days, balancing workload
    const assignments = assignClustersTodays(clusters, currentSchedule);
    
    // Prepare response with cluster information
    const clustersInfo = clusters.map((cluster, index) => ({
      clusterIndex: index,
      totalCustomers: cluster.length,
      customerNames: cluster.map(c => c.name),
      averageDistance: calculateAverageDistance(cluster, distanceMatrix).toFixed(1)
    }));

    return NextResponse.json({
      success: true,
      assignments,
      clustersInfo,
      totalCustomers: validCustomers.length
    });

  } catch (error) {
    console.error('Smart assignment error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to calculate smart assignments' 
    });
  }
}

async function calculateDistanceMatrix(customers) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const maxLocations = 10; // Reduced limit to avoid MAX_ELEMENTS_EXCEEDED (10x10 = 100 elements)
  
  // If we have too many customers, use a sampling approach or fallback to geographic clustering
  if (customers.length > maxLocations) {
    console.log(`Too many customers (${customers.length}), using geographic clustering fallback`);
    return await fallbackGeographicClustering(customers);
  }
  
  const locations = customers.slice(0, maxLocations);
  
  try {
    const origins = locations.map(c => encodeURIComponent(c.address)).join('|');
    const destinations = origins; // Same locations as both origins and destinations
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=imperial&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      if (data.status === 'MAX_ELEMENTS_EXCEEDED') {
        console.log('MAX_ELEMENTS_EXCEEDED, falling back to geographic clustering');
        return await fallbackGeographicClustering(customers);
      }
      throw new Error(`Distance Matrix API error: ${data.error_message || data.status}`);
    }
    
    // Convert to distance matrix (2D array)
    const matrix = [];
    for (let i = 0; i < locations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < locations.length; j++) {
        const element = data.rows[i].elements[j];
        if (element.status === 'OK') {
          matrix[i][j] = element.distance.value; // Distance in meters
        } else {
          matrix[i][j] = Infinity; // No route found
        }
      }
    }
    
    return { matrix, locations };
  } catch (error) {
    console.log('Distance Matrix API failed, using geographic clustering fallback:', error.message);
    return await fallbackGeographicClustering(customers);
  }
}

// Fallback clustering using geocoding for large customer lists
async function fallbackGeographicClustering(customers) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const geocodedCustomers = [];
  
  // Geocode customer addresses in batches
  for (let i = 0; i < customers.length; i += 5) {
    const batch = customers.slice(i, i + 5);
    
    for (const customer of batch) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(customer.address)}&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          geocodedCustomers.push({
            ...customer,
            lat: location.lat,
            lng: location.lng
          });
        }
      } catch (error) {
        console.error(`Error geocoding ${customer.name}:`, error);
      }
    }
    
    // Add delay between batches to avoid rate limiting
    if (i + 5 < customers.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Create distance matrix using haversine formula
  const matrix = [];
  for (let i = 0; i < geocodedCustomers.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < geocodedCustomers.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const distance = haversineDistance(
          geocodedCustomers[i].lat, geocodedCustomers[i].lng,
          geocodedCustomers[j].lat, geocodedCustomers[j].lng
        );
        matrix[i][j] = distance * 1609.34; // Convert miles to meters
      }
    }
  }
  
  return { matrix, locations: geocodedCustomers };
}

// Haversine distance calculation
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

function createProximityClusters(customers, distanceData, maxCustomersPerDay) {
  const { matrix, locations } = distanceData;
  const clusters = [];
  const used = new Set();
  
  // Simple clustering algorithm: for each unused customer, find nearby customers
  for (let i = 0; i < locations.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = [locations[i]];
    used.add(i);
    
    // Find nearby customers for this cluster
    const distances = matrix[i].map((dist, idx) => ({ idx, dist }))
      .filter(item => !used.has(item.idx) && item.dist < Infinity)
      .sort((a, b) => a.dist - b.dist);
    
    // Add closest customers to cluster (up to maxCustomersPerDay - 1)
    for (let j = 0; j < Math.min(distances.length, maxCustomersPerDay - 1); j++) {
      const { idx } = distances[j];
      if (!used.has(idx)) {
        cluster.push(locations[idx]);
        used.add(idx);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

function assignClustersTodays(clusters, currentSchedule) {
  const days = [
    'Monday Week 1', 'Monday Week 2',
    'Tuesday Week 1', 'Tuesday Week 2', 
    'Wednesday Week 1', 'Wednesday Week 2',
    'Thursday Week 1', 'Thursday Week 2',
    'Friday Week 1', 'Friday Week 2',
    'Saturday Week 1', 'Saturday Week 2',
    'Sunday Week 1', 'Sunday Week 2'
  ];
  const assignments = {};
  
  // Initialize assignments
  days.forEach(day => {
    assignments[day] = [];
  });
  
  // Count current customers per day
  const currentCounts = {};
  days.forEach(day => {
    currentCounts[day] = currentSchedule[day] ? currentSchedule[day].length : 0;
  });
  
  // Sort clusters by size (largest first) for better distribution
  const sortedClusters = clusters.sort((a, b) => b.length - a.length);
  
  // Assign each cluster to the day with least customers
  sortedClusters.forEach(cluster => {
    // Find day with minimum customers
    const availableDays = days.filter(day => currentCounts[day] + cluster.length <= 12); // Max 12 customers per day
    
    if (availableDays.length === 0) {
      // If no day can accommodate the full cluster, assign to least busy day
      const leastBusyDay = days.reduce((min, day) => 
        currentCounts[day] < currentCounts[min] ? day : min
      );
      assignments[leastBusyDay].push(...cluster.map(c => c.id));
      currentCounts[leastBusyDay] += cluster.length;
    } else {
      // Assign to least busy available day
      const bestDay = availableDays.reduce((min, day) => 
        currentCounts[day] < currentCounts[min] ? day : min
      );
      assignments[bestDay].push(...cluster.map(c => c.id));
      currentCounts[bestDay] += cluster.length;
    }
  });
  
  return assignments;
}

function calculateAverageDistance(cluster, distanceData) {
  const { matrix, locations } = distanceData;
  let totalDistance = 0;
  let pairCount = 0;
  
  for (let i = 0; i < cluster.length; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      const idx1 = locations.findIndex(loc => loc.id === cluster[i].id);
      const idx2 = locations.findIndex(loc => loc.id === cluster[j].id);
      
      if (idx1 !== -1 && idx2 !== -1 && matrix[idx1] && matrix[idx1][idx2] < Infinity) {
        totalDistance += matrix[idx1][idx2];
        pairCount++;
      }
    }
  }
  
  return pairCount > 0 ? (totalDistance / pairCount) / 1609.34 : 0; // Convert to miles
} 