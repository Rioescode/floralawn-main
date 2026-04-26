import { NextResponse } from 'next/server';

export async function GET() {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  const results = [];

  if (!API_KEY) {
    return NextResponse.json({
      error: 'Google Maps API key not found in environment variables',
      results: []
    });
  }

  // Test Maps JavaScript API
  try {
    const jsResponse = await fetch(`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`);
    if (jsResponse.ok) {
      const text = await jsResponse.text();
      if (text.includes('google.maps')) {
        results.push({ api: 'Maps JavaScript API', status: 'ENABLED', success: true });
      } else {
        results.push({ api: 'Maps JavaScript API', status: 'INVALID_RESPONSE', success: false });
      }
    } else {
      results.push({ 
        api: 'Maps JavaScript API', 
        status: `HTTP_${jsResponse.status}`, 
        error: jsResponse.statusText,
        success: false 
      });
    }
  } catch (error) {
    results.push({ 
      api: 'Maps JavaScript API', 
      status: 'NETWORK_ERROR', 
      error: error.message,
      success: false 
    });
  }

  // Test Geocoding API
  try {
    const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${API_KEY}`);
    if (geocodeResponse.ok) {
      const data = await geocodeResponse.json();
      if (data.status === 'OK') {
        results.push({ api: 'Geocoding API', status: 'ENABLED', success: true });
      } else {
        results.push({ 
          api: 'Geocoding API', 
          status: data.status, 
          error: data.error_message || 'Unknown error',
          success: false 
        });
      }
    } else {
      results.push({ 
        api: 'Geocoding API', 
        status: `HTTP_${geocodeResponse.status}`, 
        error: geocodeResponse.statusText,
        success: false 
      });
    }
  } catch (error) {
    results.push({ 
      api: 'Geocoding API', 
      status: 'NETWORK_ERROR', 
      error: error.message,
      success: false 
    });
  }

  // Test Places API
  try {
    const placesResponse = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Museum%20of%20Contemporary%20Art%20Australia&inputtype=textquery&fields=place_id,name&key=${API_KEY}`);
    if (placesResponse.ok) {
      const data = await placesResponse.json();
      if (data.status === 'OK') {
        results.push({ api: 'Places API', status: 'ENABLED', success: true });
      } else {
        results.push({ 
          api: 'Places API', 
          status: data.status, 
          error: data.error_message || 'Unknown error',
          success: false 
        });
      }
    } else {
      results.push({ 
        api: 'Places API', 
        status: `HTTP_${placesResponse.status}`, 
        error: placesResponse.statusText,
        success: false 
      });
    }
  } catch (error) {
    results.push({ 
      api: 'Places API', 
      status: 'NETWORK_ERROR', 
      error: error.message,
      success: false 
    });
  }

  const enabledCount = results.filter(r => r.success).length;
  const allEnabled = enabledCount === 3;

  return NextResponse.json({
    apiKey: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Missing',
    results,
    summary: {
      enabled: enabledCount,
      total: 3,
      allEnabled,
      message: allEnabled 
        ? 'All APIs are enabled! Your autocomplete should work.' 
        : `Only ${enabledCount}/3 APIs are enabled. Enable the missing ones in Google Cloud Console.`
    }
  });
} 