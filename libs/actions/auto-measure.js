'use server';

/**
 * AUTO-MEASURE LAWN — API DATA POWERED
 * Uses public property records (Lot Size - Building Size) to estimate lawn area.
 */
export async function autoMeasureLawn({ lat, lng, address }) {
  console.log(`[SERVICE] Starting AI auto-measure for: ${address} (${lat}, ${lng})`);
  
  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) throw new Error('Google Maps API Key missing.');

    // 1. Fetch Static Map (Zoom 20 for full property context + Marker for clarity)
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&scale=2&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${googleApiKey}`;
    
    const response = await fetch(staticMapUrl, { 
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000) 
    });

    if (!response.ok) {
      throw new Error(`Satellite Image Fetch Failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    
    // 1. Fetch official property data from RentCast for context
    let parcelData = { lotSize: null, buildingSize: null };
    try {
      const rentCastRes = await fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`, {
        headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY },
        signal: AbortSignal.timeout(5000)
      });
      if (rentCastRes.ok) {
        const pData = await rentCastRes.json();
        console.log(`[SERVICE] RentCast Raw:`, JSON.stringify(pData).substring(0, 200));
        // RentCast returns an array or single object
        const prop = Array.isArray(pData) ? pData[0] : pData;
        if (prop) {
           parcelData.lotSize = prop.lotSize || null;
           parcelData.buildingSize = prop.squareFootage || null;
           console.log(`[SERVICE] RentCast Result: Lot=${parcelData.lotSize}, Bldg=${parcelData.buildingSize}`);
        }
      } else {
        console.warn(`[SERVICE] RentCast API returned status ${rentCastRes.status}`);
      }
    } catch (err) {
      console.warn('[SERVICE] RentCast failed, continuing with vision-only analysis.', err.message);
    }
    
    // 2. Calculate scale (Meters per pixel - Adjusted for Zoom 20)
    const metersPerPixel = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, 20);

    const estimatedLawn = Math.max(0, (parcelData.lotSize || 0) - (parcelData.buildingSize || 0));
    
    if (estimatedLawn <= 0) {
       throw new Error('Property records could not be found to calculate sqft automatically. Please use the map to draw the lawn manually.');
    }

    console.log(`[SERVICE] API Math Result: ${estimatedLawn} SQFT (Lot: ${parcelData.lotSize} - Bldg: ${parcelData.buildingSize})`);

    return {
      success: true,
      areaSqFt: estimatedLawn,
      confidence: 1.0,
      reasoning: `Mathematical calculation derived from official property records: Lot Size (${parcelData.lotSize || 0} sqft) minus the Building Footprint (${parcelData.buildingSize || 0} sqft) equals ${estimatedLawn} sqft.`,
      sections: [],
      lawnPolygons: [],
      base64Image,
      metersPerPixel,
      lat,
      lng,
      address,
      parcelData
    };

  } catch (error) {
    console.error('[SERVICE] AI MEASURE ERROR:', error);
    return { 
      success: false, 
      error: error.message || 'The AI property scanner is currently unavailable. Please measure manually.' 
    };
  }
}

