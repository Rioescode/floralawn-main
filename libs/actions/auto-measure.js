'use server';

import Anthropic from '@anthropic-ai/sdk';

/**
 * AUTO-MEASURE LAWN — AI VISION POWERED
 * Uses Claude 3.5 Sonnet to analyze satellite imagery and estimate lawn area.
 */
export async function autoMeasureLawn({ lat, lng, address }) {
  console.log(`[SERVICE] Starting AI auto-measure for: ${address} (${lat}, ${lng})`);
  
  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!googleApiKey) throw new Error('Google Maps API Key missing.');
    if (!anthropicApiKey) throw new Error('Anthropic API Key missing.');

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

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        temperature: 0,
        system: "You are a professional lawn care assessor. Your task is to analyze satellite imagery and precisely estimate the square footage of lawn (grass) for the property MARKED WITH A RED PIN at the image center. Focus ONLY on the marked property grounds. Exclude: neighbor properties, driveways, sidewalks, buildings, pools, and non-grass areas. BE EXTREMELY STINGY. Identify exactly what grass you see and explain based on the RED MARKER position.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `This satellite image shows a residential property at ${address}. 
                **TARGET PROPERTY**: Analysis must focus exclusively on the property marked with the **RED MARKER PIN** at the center of this image.
                
                The scale is approximately ${metersPerPixel.toFixed(4)} meters per pixel.
                
                OFFICIAL PROPERTY DATA (Source: RentCast / Ground Truth):
                - Total Lot Area: ${parcelData.lotSize ? parcelData.lotSize + ' sqft' : 'Unknown'}
                - Primary Building Size (Total Living Area): ${parcelData.buildingSize ? parcelData.buildingSize + ' sqft' : 'Unknown'}
                
                Note: In some cases, 'Primary Building Size' includes multiple floors (Total Living Area) and may exceed 'Total Lot Area'. Do not assume the building footprint covers the entire lot; instead, use this info as a general scale and prioritize the VISIBLE satellite footprint to estimate the remaining lawn/grass area. 
                
                Task: Estimate the total square footage of the lawn/grass area that needs mowing on this property ONLY.
                Use the OFFICIAL PROPERTY DATA to guide your mental model (e.g., if the lot is 5,000 sqft and the house is 2,000 sqft, the grass cannot be 4,000 sqft unless the yard is very optimized).
                
                Output your response as a JSON object with these fields:
                - 'areaSqFt': (number) The TOTAL estimated lawn area in square feet.
                - 'confidence': (number 0-1)
                - 'reasoning': (string) A detailed literal explanation of what you see. Mention specific landmarks (e.g., 'front patch between driveway and sidewalk').
                - 'estimatedTotalLotSize': (number) Total property size estimate for context.
                - 'sections': (array of {label: string, areaSqFt: number}) ONLY include sections that are visibly grass. DO NOT use placeholders. If there is no rear yard, do not include it.
                - 'lawnPolygons': (array of arrays of {x, y}) EXACT boundaries...`
              }
            ],
          },
        ],
      })
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      throw new Error(`Anthropic AI Error: ${anthropicResponse.status} ${JSON.stringify(errorData)}`);
    }

    const data = await anthropicResponse.json();
    const responseText = data.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI failed to return valid data segment.');
    
    const aiData = JSON.parse(jsonMatch[0]);

    console.log(`[SERVICE] AI Result: ${aiData.areaSqFt} SQFT (${aiData.confidence * 100}% confidence)`);

    return {
      success: true,
      areaSqFt: aiData.areaSqFt,
      confidence: aiData.confidence,
      reasoning: aiData.reasoning,
      sections: aiData.sections || [],
      lawnPolygons: aiData.lawnPolygons || [],
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

