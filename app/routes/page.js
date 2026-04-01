'use client';

import { useState, useEffect } from 'react';
import { MapPin, Route, Users, Clock, Fuel, Navigation, Settings, Download, Play, AlertTriangle, CheckCircle, Info, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function RoutesPage() {
  const [customers, setCustomers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [settings, setSettings] = useState({
    maxStopsPerRoute: 8,
    maxDrivingTime: 480, // 8 hours in minutes
    startLocation: '',
    optimizationMethod: 'proximity' // proximity, time, mixed
  });
  const [selectedDay, setSelectedDay] = useState('monday');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRoutes: 0,
    estimatedTime: 0,
    estimatedDistance: 0,
    totalEarnings: 0,
    estimatedFuelCost: 0,
    netEarnings: 0,
    overallEfficiency: 0
  });

  const daysOfWeek = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' }
  ];

  useEffect(() => {
    fetchCustomers();
  }, [selectedDay]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      
      // Filter customers scheduled for the selected day
      const dayCustomers = data.filter(customer => {
        const scheduledDay = customer.scheduledDay?.toLowerCase();
        return scheduledDay === selectedDay;
      });

      setCustomers(dayCustomers);
      setStats(prev => ({ ...prev, totalCustomers: dayCustomers.length }));
      
      // Clear routes when day changes
      setRoutes([]);
      setRecommendations([]);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoutes = async () => {
    setOptimizing(true);
    try {
      const response = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customers,
          settings: settings
        })
      });

      const data = await response.json();

      if (data.success) {
        setRoutes(data.routes);
        setRecommendations(data.recommendations || []);
        
        // Update stats with comprehensive data
        setStats(prev => ({
          ...prev,
          totalRoutes: data.stats.totalRoutes,
          estimatedTime: data.stats.totalTime,
          estimatedDistance: data.stats.totalDistance,
          totalEarnings: data.stats.totalEarnings,
          estimatedFuelCost: data.stats.estimatedFuelCost,
          netEarnings: data.stats.netEarnings,
          overallEfficiency: data.stats.overallEfficiency
        }));

        // Show geocoding errors if any
        if (data.geocodingErrors && data.geocodingErrors.length > 0) {
          console.warn('Geocoding errors:', data.geocodingErrors);
          // You could show a toast notification here
        }
      } else {
        console.error('Route optimization failed:', data.error);
        alert('Route optimization failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error optimizing routes:', error);
      alert('Error optimizing routes. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const getRouteColor = (index) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportRoutes = () => {
    const exportData = {
      day: selectedDay,
      generatedAt: new Date().toISOString(),
      settings: settings,
      stats: stats,
      routes: routes.map(route => ({
        routeName: route.name,
        customers: route.customers.map(customer => ({
          name: customer.name,
          address: customer.address,
          phone: customer.phone,
          serviceType: customer.serviceType,
          price: customer.price,
          coordinates: { lat: customer.lat, lng: customer.lng }
        })),
        stats: {
          distance: route.distance,
          totalTime: route.totalTime,
          drivingTime: route.drivingTime,
          serviceTime: route.serviceTime,
          earnings: route.earnings,
          efficiency: route.efficiency,
          customerCount: route.customers.length
        }
      })),
      recommendations: recommendations
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-routes-${selectedDay}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Route Optimizer</h1>
              <p className="text-gray-600">Group customers by proximity to optimize service routes and maximize efficiency</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <Link
                href="/test-distance"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Test Distances
              </Link>
              <button
                onClick={optimizeRoutes}
                disabled={optimizing || customers.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {optimizing ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Route className="w-4 h-4 mr-2" />
                    Optimize Routes
                  </>
                )}
              </button>
              {routes.length > 0 && (
                <button
                  onClick={exportRoutes}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Day Selection */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  selectedDay === day.id
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Route className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Routes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRoutes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Time</p>
                <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.estimatedTime / 60)}h</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Fuel className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Distance</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.estimatedDistance}mi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        {routes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-semibold text-green-600">${stats.totalEarnings}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Fuel Cost</p>
                <p className="text-2xl font-semibold text-red-600">${stats.estimatedFuelCost}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Net Profit</p>
                <p className="text-2xl font-semibold text-blue-600">${stats.netEarnings}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow mb-6 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Optimization Settings</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Stops per Route
              </label>
              <input
                type="number"
                value={settings.maxStopsPerRoute}
                onChange={(e) => setSettings(prev => ({ ...prev, maxStopsPerRoute: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Driving Time (hours)
              </label>
              <input
                type="number"
                value={settings.maxDrivingTime / 60}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDrivingTime: parseInt(e.target.value) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Location
              </label>
              <input
                type="text"
                value={settings.startLocation}
                onChange={(e) => setSettings(prev => ({ ...prev, startLocation: e.target.value }))}
                placeholder="Your starting address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Optimization Method
              </label>
              <select
                value={settings.optimizationMethod}
                onChange={(e) => setSettings(prev => ({ ...prev, optimizationMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="proximity">Proximity</option>
                <option value="time">Time-based</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <div className="mr-3 mt-0.5">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{rec.type} Recommendation</p>
                    <p className="text-sm text-gray-600">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Routes Display */}
        {routes.length > 0 ? (
          <div className="space-y-6">
            {routes.map(route => (
              <div key={route.id} className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${route.color} mr-3`}></div>
                      <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {route.customers.length}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.round(route.totalTime / 60)}h {route.totalTime % 60}m
                      </span>
                      <span className="flex items-center">
                        <Navigation className="w-4 h-4 mr-1" />
                        {route.distance}mi
                      </span>
                      <span className="flex items-center text-green-600">
                        <span className="font-medium">${route.earnings}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {route.customers.map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${customer.price}</p>
                          <p className="text-xs text-gray-500">{customer.serviceType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : customers.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Optimize</h3>
            <p className="text-gray-500 mb-4">
              {customers.length} customers scheduled for {daysOfWeek.find(d => d.id === selectedDay)?.name}
            </p>
            <button
              onClick={optimizeRoutes}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <Route className="w-4 h-4 mr-2" />
              Generate Optimized Routes
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Scheduled</h3>
            <p className="text-gray-500">
              No customers are scheduled for {daysOfWeek.find(d => d.id === selectedDay)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 