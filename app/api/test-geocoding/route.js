import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Maps API key not configured' });
    }

    // Test with a simple, well-known address
    const testAddress = "1600 Amphitheatre Parkway, Mountain View, CA";
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${API_KEY}`
    );
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      testAddress,
      apiResponse: data,
      apiKey: API_KEY.substring(0, 10) + '...' // Show first 10 chars for debugging
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test geocoding: ' + error.message 
    });
  }
} 