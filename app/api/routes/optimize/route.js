import { NextResponse } from 'next/server';
import { geocodingService, routeOptimizer } from '../../../../lib/geocoding.js';

export async function POST(request) {
  try {
    const { customers, settings } = await request.json();

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'Customers array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Default settings
    const optimizationSettings = {
      maxStopsPerRoute: 8,
      maxDrivingTime: 480, // 8 hours
      serviceTimePerCustomer: 30, // minutes
      startLocation: null,
      optimizationMethod: 'proximity',
      ...settings
    };

    // Step 1: Geocode all customer addresses
    console.log(`Starting geocoding for ${customers.length} customers...`);
    const geocodedCustomers = [];
    const geocodingErrors = [];

    for (const customer of customers) {
      if (!customer.address) {
        geocodingErrors.push({
          customer: customer.name || 'Unknown',
          error: 'No address provided'
        });
        continue;
      }

      try {
        const coordinates = await geocodingService.geocodeAddress(customer.address);
        geocodedCustomers.push({
          ...customer,
          lat: coordinates.lat,
          lng: coordinates.lng,
          formatted_address: coordinates.formatted_address
        });
      } catch (error) {
        geocodingErrors.push({
          customer: customer.name || 'Unknown',
          address: customer.address,
          error: error.message
        });
      }
    }

    if (geocodedCustomers.length === 0) {
      return NextResponse.json(
        { error: 'No customers could be geocoded', geocodingErrors },
        { status: 400 }
      );
    }

    console.log(`Successfully geocoded ${geocodedCustomers.length} customers`);

    // Step 2: Calculate optimal number of routes
    const numRoutes = Math.ceil(geocodedCustomers.length / optimizationSettings.maxStopsPerRoute);

    // Step 3: Cluster customers into routes
    console.log(`Clustering customers into ${numRoutes} routes...`);
    const clusters = await routeOptimizer.clusterCustomers(geocodedCustomers, numRoutes);

    // Step 4: Optimize order within each route
    console.log('Optimizing route order...');
    const optimizedRoutes = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      if (cluster.customers.length === 0) continue;

      // Optimize the order of customers within this cluster
      const optimizedOrder = routeOptimizer.optimizeRouteOrder(
        cluster.customers,
        optimizationSettings.startLocation
      );

      // Calculate route statistics
      const stats = routeOptimizer.calculateRouteStats(
        optimizedOrder,
        optimizationSettings.serviceTimePerCustomer
      );

      // Check if route exceeds time limits
      if (stats.totalTime > optimizationSettings.maxDrivingTime) {
        console.warn(`Route ${i + 1} exceeds max driving time: ${stats.totalTime} minutes`);
      }

      optimizedRoutes.push({
        id: i + 1,
        name: `Route ${i + 1}`,
        customers: optimizedOrder,
        center: cluster.center,
        ...stats,
        color: getRouteColor(i)
      });
    }

    // Step 5: Calculate overall statistics
    const overallStats = calculateOverallStats(optimizedRoutes);

    // Step 6: Generate route recommendations
    const recommendations = generateRecommendations(optimizedRoutes, optimizationSettings);

    console.log(`Route optimization completed: ${optimizedRoutes.length} routes generated`);

    return NextResponse.json({
      success: true,
      routes: optimizedRoutes,
      stats: overallStats,
      recommendations,
      geocodingErrors: geocodingErrors.length > 0 ? geocodingErrors : undefined,
      settings: optimizationSettings
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize routes', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get route colors
function getRouteColor(index) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500',
    'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'
  ];
  return colors[index % colors.length];
}

// Calculate overall statistics across all routes
function calculateOverallStats(routes) {
  const stats = routes.reduce((acc, route) => ({
    totalRoutes: acc.totalRoutes + 1,
    totalCustomers: acc.totalCustomers + route.customers,
    totalDistance: acc.totalDistance + route.distance,
    totalTime: acc.totalTime + route.totalTime,
    totalEarnings: acc.totalEarnings + route.earnings,
    totalDrivingTime: acc.totalDrivingTime + route.drivingTime,
    totalServiceTime: acc.totalServiceTime + route.serviceTime
  }), {
    totalRoutes: 0,
    totalCustomers: 0,
    totalDistance: 0,
    totalTime: 0,
    totalEarnings: 0,
    totalDrivingTime: 0,
    totalServiceTime: 0
  });

  return {
    ...stats,
    averageCustomersPerRoute: Math.round(stats.totalCustomers / stats.totalRoutes * 100) / 100,
    averageDistancePerRoute: Math.round(stats.totalDistance / stats.totalRoutes * 100) / 100,
    averageTimePerRoute: Math.round(stats.totalTime / stats.totalRoutes),
    averageEarningsPerRoute: Math.round(stats.totalEarnings / stats.totalRoutes * 100) / 100,
    overallEfficiency: stats.totalTime > 0 ? Math.round(stats.totalEarnings / (stats.totalTime / 60) * 100) / 100 : 0,
    estimatedFuelCost: Math.round(stats.totalDistance * 0.15 * 100) / 100, // Assume $0.15 per mile
    netEarnings: Math.round((stats.totalEarnings - (stats.totalDistance * 0.15)) * 100) / 100
  };
}

// Generate optimization recommendations
function generateRecommendations(routes, settings) {
  const recommendations = [];

  // Check for unbalanced routes
  const customerCounts = routes.map(r => r.customers);
  const maxCustomers = Math.max(...customerCounts);
  const minCustomers = Math.min(...customerCounts);
  
  if (maxCustomers - minCustomers > 2) {
    recommendations.push({
      type: 'balance',
      priority: 'medium',
      message: `Routes are unbalanced (${minCustomers}-${maxCustomers} customers). Consider redistributing customers for better efficiency.`
    });
  }

  // Check for long routes
  const longRoutes = routes.filter(r => r.totalTime > settings.maxDrivingTime);
  if (longRoutes.length > 0) {
    recommendations.push({
      type: 'time',
      priority: 'high',
      message: `${longRoutes.length} route(s) exceed the maximum driving time of ${settings.maxDrivingTime / 60} hours. Consider splitting these routes.`
    });
  }

  // Check for inefficient routes (low earnings per hour)
  const inefficientRoutes = routes.filter(r => r.efficiency < 30); // Less than $30/hour
  if (inefficientRoutes.length > 0) {
    recommendations.push({
      type: 'efficiency',
      priority: 'medium',
      message: `${inefficientRoutes.length} route(s) have low efficiency (< $30/hour). Consider grouping customers differently or adjusting pricing.`
    });
  }

  // Check for short routes that could be combined
  const shortRoutes = routes.filter(r => r.customers < 4);
  if (shortRoutes.length > 1) {
    recommendations.push({
      type: 'consolidation',
      priority: 'low',
      message: `${shortRoutes.length} routes have fewer than 4 customers. Consider combining nearby short routes for better efficiency.`
    });
  }

  // Fuel cost recommendations
  const totalStats = calculateOverallStats(routes);
  if (totalStats.estimatedFuelCost > totalStats.totalEarnings * 0.2) {
    recommendations.push({
      type: 'fuel',
      priority: 'medium',
      message: `Fuel costs are high (${Math.round(totalStats.estimatedFuelCost / totalStats.totalEarnings * 100)}% of earnings). Consider optimizing routes further or adjusting service areas.`
    });
  }

  return recommendations;
}

// GET endpoint for route optimization settings and cache stats
export async function GET() {
  try {
    const cacheStats = geocodingService.getCacheStats();
    
    return NextResponse.json({
      success: true,
      cacheStats,
      defaultSettings: {
        maxStopsPerRoute: 8,
        maxDrivingTime: 480,
        serviceTimePerCustomer: 30,
        optimizationMethod: 'proximity'
      }
    });
  } catch (error) {
    console.error('Error getting route optimization info:', error);
    return NextResponse.json(
      { error: 'Failed to get optimization info' },
      { status: 500 }
    );
  }
} 