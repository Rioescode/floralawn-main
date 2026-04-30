import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { origin, destination } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json({ success: false, error: 'Origin and destination are required' }, { status: 400 });
    }

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Origin can be coordinates or address string
    const originStr = typeof origin === 'object' ? `${origin.lat},${origin.lng}` : origin;
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originStr)}&destinations=${encodeURIComponent(destination)}&departure_time=now&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      // Use live traffic duration if available, otherwise fallback to standard duration
      const durationSeconds = element.duration_in_traffic ? element.duration_in_traffic.value : element.duration.value;
      const text = element.duration_in_traffic ? element.duration_in_traffic.text : element.duration.text;
      const minutes = Math.ceil(durationSeconds / 60);
      
      return NextResponse.json({ 
        success: true, 
        minutes,
        text: text
      });
    } else {
      console.error("Distance Matrix API error:", data);
      return NextResponse.json({ 
        success: false, 
        error: 'Could not calculate distance' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching driving time:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
