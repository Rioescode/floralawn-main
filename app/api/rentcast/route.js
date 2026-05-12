import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RentCast API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`, {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`RentCast API responded with ${response.status}`);
    }

    const data = await response.json();
    const property = Array.isArray(data) ? data[0] : data;

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({
      lotSize: property.lotSize,
      squareFootage: property.squareFootage, // building size
      address: property.addressLine1,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode
    });
  } catch (error) {
    console.error('RentCast API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
