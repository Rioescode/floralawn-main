// Geocoding utilities for converting addresses to coordinates

class GeocodingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.cache = new Map(); // Simple in-memory cache
  }

  // Geocode a single address
  async geocodeAddress(address) {
    if (!address) {
      throw new Error('Address is required');
    }

    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          address_components: result.address_components
        };

        // Cache the result
        this.cache.set(cacheKey, coordinates);
        return coordinates;
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error(`Error geocoding address "${address}":`, error);
      throw error;
    }
  }

  // Geocode multiple addresses in batch
  async geocodeAddresses(addresses) {
    const results = [];
    const errors = [];

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchPromises = batch.map(async (address, index) => {
        try {
          const coordinates = await this.geocodeAddress(address);
          return { index: i + index, address, coordinates, success: true };
        } catch (error) {
          return { index: i + index, address, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return { results, errors };
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return {
          formatted_address: data.results[0].formatted_address,
          address_components: data.results[0].address_components
        };
      } else {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error(`Error reverse geocoding coordinates (${lat}, ${lng}):`, error);
      throw error;
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2, unit = 'miles') {
    const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get distance matrix for multiple origins and destinations
  async getDistanceMatrix(origins, destinations) {
    try {
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${this.apiKey}&units=imperial`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data;
      } else {
        throw new Error(`Distance matrix failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw error;
    }
  }

  // Clear the geocoding cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Route optimization algorithms
export class RouteOptimizer {
  constructor(geocodingService) {
    this.geocodingService = geocodingService;
  }

  // K-means clustering for grouping customers by proximity
  async clusterCustomers(customers, numClusters, maxIterations = 10) {
    if (customers.length <= numClusters) {
      return customers.map((customer, index) => ({
        id: index,
        customers: [customer],
        center: { lat: customer.lat, lng: customer.lng }
      }));
    }

    // Initialize centroids using k-means++
    let centroids = this.initializeCentroidsKMeansPlusPlus(customers, numClusters);
    
    let clusters = [];
    let iterations = 0;

    while (iterations < maxIterations) {
      // Assign customers to nearest centroid
      clusters = Array(numClusters).fill().map(() => []);
      
      customers.forEach(customer => {
        let minDistance = Infinity;
        let closestCluster = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = this.geocodingService.calculateDistance(
            customer.lat, customer.lng, centroid.lat, centroid.lng
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCluster = index;
          }
        });
        
        clusters[closestCluster].push(customer);
      });

      // Update centroids
      const newCentroids = clusters.map((cluster, index) => {
        if (cluster.length === 0) return centroids[index];
        
        const avgLat = cluster.reduce((sum, customer) => sum + customer.lat, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, customer) => sum + customer.lng, 0) / cluster.length;
        return { lat: avgLat, lng: avgLng };
      });

      // Check for convergence
      let converged = true;
      for (let i = 0; i < centroids.length; i++) {
        const distance = this.geocodingService.calculateDistance(
          centroids[i].lat, centroids[i].lng, 
          newCentroids[i].lat, newCentroids[i].lng
        );
        if (distance > 0.001) {
          converged = false;
          break;
        }
      }

      centroids = newCentroids;
      iterations++;

      if (converged) break;
    }

    return clusters.map((cluster, index) => ({
      id: index,
      customers: cluster.filter(c => c), // Remove any undefined customers
      center: centroids[index]
    })).filter(cluster => cluster.customers.length > 0);
  }

  // K-means++ initialization for better clustering
  initializeCentroidsKMeansPlusPlus(customers, k) {
    const centroids = [];
    
    // Choose first centroid randomly
    centroids.push({
      lat: customers[Math.floor(Math.random() * customers.length)].lat,
      lng: customers[Math.floor(Math.random() * customers.length)].lng
    });

    // Choose remaining centroids
    for (let i = 1; i < k; i++) {
      const distances = customers.map(customer => {
        let minDistance = Infinity;
        centroids.forEach(centroid => {
          const distance = this.geocodingService.calculateDistance(
            customer.lat, customer.lng, centroid.lat, centroid.lng
          );
          minDistance = Math.min(minDistance, distance);
        });
        return minDistance * minDistance; // Square the distance for probability
      });

      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      const random = Math.random() * totalDistance;
      
      let cumulative = 0;
      for (let j = 0; j < customers.length; j++) {
        cumulative += distances[j];
        if (cumulative >= random) {
          centroids.push({ lat: customers[j].lat, lng: customers[j].lng });
          break;
        }
      }
    }

    return centroids;
  }

  // Optimize route order using nearest neighbor algorithm
  optimizeRouteOrder(customers, startLocation = null) {
    if (customers.length <= 1) return customers;

    const optimized = [];
    const remaining = [...customers];
    
    // Start from specified location or first customer
    let current = startLocation || remaining[0];
    if (!startLocation) {
      remaining.shift();
      optimized.push(current);
    }

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      remaining.forEach((customer, index) => {
        const distance = this.geocodingService.calculateDistance(
          current.lat, current.lng, customer.lat, customer.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      });

      current = remaining[nearestIndex];
      optimized.push(current);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  // Calculate comprehensive route statistics
  calculateRouteStats(route, serviceTimePerCustomer = 30) {
    if (route.length === 0) {
      return { distance: 0, time: 0, customers: 0, earnings: 0 };
    }

    let totalDistance = 0;
    let totalDrivingTime = 0;

    // Calculate driving distance and time between consecutive customers
    for (let i = 0; i < route.length - 1; i++) {
      const distance = this.geocodingService.calculateDistance(
        route[i].lat, route[i].lng,
        route[i + 1].lat, route[i + 1].lng
      );
      totalDistance += distance;
      // Assume average speed of 30 mph in residential areas
      totalDrivingTime += (distance / 30) * 60; // Convert to minutes
    }

    // Add service time for each customer
    const totalServiceTime = route.length * serviceTimePerCustomer;
    const totalTime = totalDrivingTime + totalServiceTime;

    // Calculate total earnings
    const totalEarnings = route.reduce((sum, customer) => {
      return sum + (parseFloat(customer.price) || 0);
    }, 0);

    return {
      distance: Math.round(totalDistance * 100) / 100,
      drivingTime: Math.round(totalDrivingTime),
      serviceTime: totalServiceTime,
      totalTime: Math.round(totalTime),
      customers: route.length,
      earnings: totalEarnings,
      efficiency: route.length > 0 ? totalEarnings / (totalTime / 60) : 0 // Earnings per hour
    };
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
export const routeOptimizer = new RouteOptimizer(geocodingService); 