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

    // Optimization: If we have pre-saved coordinates in the DB, use those instead of calling Distance Matrix API
    // This saves significant API costs.
    const distanceMatrix = await calculateDistanceMatrixEfficiently(validCustomers);
    
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

// Highly Efficient Distance Matrix - Uses Saved DB Coords First
async function calculateDistanceMatrixEfficiently(customers) {
  // Geocoding removed to eliminate costs. Smart-assign now only works with customers already having GPS data.
  const geocodedCustomers = customers.filter(c => !isNaN(parseFloat(c.latitude)) && !isNaN(parseFloat(c.longitude))).map(c => ({
    ...c,
    lat: parseFloat(c.latitude),
    lng: parseFloat(c.longitude)
  }));

  // Generate Matrix using Haversine (Zero Cost Math)
  // We use Haversine (crow-fly distance) because it's FREE and extremely fast.
  const matrix = [];
  for (let i = 0; i < geocodedCustomers.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < geocodedCustomers.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const dist = haversineDistance(
          geocodedCustomers[i].lat, geocodedCustomers[i].lng,
          geocodedCustomers[j].lat, geocodedCustomers[j].lng
        );
        matrix[i][j] = dist * 1609.34; // Convert miles to meters
      }
    }
  }

  return { matrix, locations: geocodedCustomers };
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

function createProximityClusters(customers, distanceData, maxCustomersPerDay) {
  const { matrix, locations } = distanceData;
  const clusters = [];
  const used = new Set();
  
  for (let i = 0; i < locations.length; i++) {
    if (used.has(i)) continue;
    const cluster = [locations[i]];
    used.add(i);
    const distances = matrix[i].map((dist, idx) => ({ idx, dist }))
      .filter(item => !used.has(item.idx))
      .sort((a, b) => a.dist - b.dist);
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
    'Monday Week 1', 'Monday Week 2', 'Tuesday Week 1', 'Tuesday Week 2', 
    'Wednesday Week 1', 'Wednesday Week 2', 'Thursday Week 1', 'Thursday Week 2',
    'Friday Week 1', 'Friday Week 2', 'Saturday Week 1', 'Saturday Week 2',
    'Sunday Week 1', 'Sunday Week 2'
  ];
  const assignments = {};
  days.forEach(day => { assignments[day] = []; });
  const currentCounts = {};
  days.forEach(day => { currentCounts[day] = currentSchedule[day] ? currentSchedule[day].length : 0; });
  const sortedClusters = clusters.sort((a, b) => b.length - a.length);
  sortedClusters.forEach(cluster => {
    const availableDays = days.filter(day => currentCounts[day] + cluster.length <= 12);
    const bestDay = (availableDays.length > 0 ? availableDays : days).reduce((min, day) => 
      currentCounts[day] < currentCounts[min] ? day : min
    );
    assignments[bestDay].push(...cluster.map(c => c.id));
    currentCounts[bestDay] += cluster.length;
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
      if (idx1 !== -1 && idx2 !== -1) {
        totalDistance += matrix[idx1][idx2];
        pairCount++;
      }
    }
  }
  return pairCount > 0 ? (totalDistance / pairCount) / 1609.34 : 0;
}