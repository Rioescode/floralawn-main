import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutes cache

// In-memory cache to guarantee fast response
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000;

const RI_COORDS = {
  lat: 41.8781,
  lon: -71.3826,
  name: 'Rhode Island & SE Massachusetts'
};

function formatDayLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWeatherIcon(code, isSnow, isRain, isFreeze) {
  if (isSnow) return 'snow';
  if (isRain) return 'rain';
  if (isFreeze) return 'frost';
  if (code === 0) return 'sun';
  if (code <= 3) return 'partly_cloudy';
  return 'cloud';
}

function analyzeTurfConditions(current, daily) {
  const currentTemp = Math.round(current?.temperature_2m ?? 42);
  const days = daily?.time || [];
  const minTemps = daily?.temperature_2m_min || [];
  const maxTemps = daily?.temperature_2m_max || [];
  const snowfall = daily?.snowfall_sum || [];
  const precip = daily?.precipitation_sum || [];
  const precipProb = daily?.precipitation_probability_max || [];
  const codes = daily?.weather_code || [];

  // Check 1: Inbound Snow (highest urgency)
  let snowIndex = snowfall.findIndex(s => s > 0.1);
  if (snowIndex === -1) {
    snowIndex = codes.findIndex(c => [71, 73, 75, 77, 85, 86].includes(c));
  }

  if (snowIndex !== -1 && snowIndex < 10) {
    const snowDate = formatDayLabel(days[snowIndex]);
    const snowAmount = snowfall[snowIndex] ? `${snowfall[snowIndex]}"` : 'Accumulation';
    return {
      urgencyLevel: 'critical',
      badge: '❄️ INBOUND SNOW ADVISORY',
      headline: `Snow Forecasted in Rhode Island: ${snowDate} (${snowAmount})`,
      targetDate: snowDate,
      turfAlert: 'Fallen leaves buried under snow compress into a suffocating mat, trapping damp moisture that causes destructive snow mold (Microdochium patch) and turf rot before spring.',
      incentive: `Get your yard cleared and leaves hauled away before ${snowDate} to prevent winter lawn kill and avoid frozen removal costs.`,
      ctaText: 'Book Pre-Snow Leaf Cleanup',
      serviceQuery: 'Fall Cleanup',
      accentColor: 'red'
    };
  }

  // Check 2: Hard Freeze (< 30°F) or Frost (< 33°F)
  const hardFreezeIdx = minTemps.findIndex(t => t <= 29);
  const frostIdx = minTemps.findIndex(t => t <= 32);

  if (hardFreezeIdx !== -1 && hardFreezeIdx < 10) {
    const freezeDate = formatDayLabel(days[hardFreezeIdx]);
    const lowTemp = Math.round(minTemps[hardFreezeIdx]);
    return {
      urgencyLevel: 'high',
      badge: '🧊 HARD FREEZE WARNING',
      headline: `Hard Freeze Predicted in RI: ${lowTemp}°F on ${freezeDate}`,
      targetDate: freezeDate,
      turfAlert: 'Sub-freezing temperatures freeze wet leaves directly onto grass blades. Once the topsoil hardens, decomposing leaf tannin burns dormant root crowns.',
      incentive: `Slots are filling fast before the ${freezeDate} freeze. Clear leaves now while turf is workable and avoid spring reseeding costs.`,
      ctaText: 'Lock In Pre-Freeze Cleanup',
      serviceQuery: 'Fall Cleanup',
      accentColor: 'amber'
    };
  }

  if (frostIdx !== -1 && frostIdx < 7) {
    const frostDate = formatDayLabel(days[frostIdx]);
    const lowTemp = Math.round(minTemps[frostIdx]);
    return {
      urgencyLevel: 'high',
      badge: '❄️ FIRST FROST WINDOW',
      headline: `Sub-Freezing Frost Approaching: ${lowTemp}°F on ${frostDate}`,
      targetDate: frostDate,
      turfAlert: 'Frost hardens wet turf and locks in moisture under decaying foliage. Grass roots need sunlight and air circulation to store carbohydrates for winter survival.',
      incentive: `Schedule your seasonal property cleanup before ${frostDate} to safeguard your yard before the deep ground freeze sets in.`,
      ctaText: 'Claim Your Fall Cleanup Spot',
      serviceQuery: 'Fall Cleanup',
      accentColor: 'amber'
    };
  }

  // Check 3: Heavy Rain storm window
  const heavyRainIdx = precip.findIndex((p, i) => p >= 0.5 || precipProb[i] >= 65);
  if (heavyRainIdx !== -1 && heavyRainIdx < 6) {
    const rainDate = formatDayLabel(days[heavyRainIdx]);
    return {
      urgencyLevel: 'medium',
      badge: '🌧️ HEAVY RAIN WINDOW',
      headline: `Heavy Rain System Inbound: ${rainDate}`,
      targetDate: rainDate,
      turfAlert: 'Heavy rainfall soaks leaf piles, making them up to 3x heavier and turning lawns into waterlogged sponge beds that suffocate perennial grass.',
      incentive: `Dry leaf removal is 2x faster and cleaner. Secure your service before the rain arrives on ${rainDate}.`,
      ctaText: 'Schedule Before the Rain',
      serviceQuery: 'Fall Cleanup',
      accentColor: 'blue'
    };
  }

  // Check 4: Ideal Working / Cleanup window
  return {
    urgencyLevel: 'standard',
    badge: '🌤️ PRIME YARD WEATHER WINDOW',
    headline: `Ideal Weather in RI: Clear & ${currentTemp}°F`,
    targetDate: 'This Week',
    turfAlert: 'Clear skies and dry ground provide peak conditions for seasonal cleanups, final mowing, and winter property preparation.',
    incentive: 'Beat the upcoming winter rush. Our crew is operating across Pawtucket, Providence, Warwick, and surrounding areas today.',
    ctaText: 'Get Free Same-Day Quote',
    serviceQuery: 'Fall Cleanup',
    accentColor: 'green'
  };
}

export async function GET() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_DURATION_MS) {
    return NextResponse.json(cachedData);
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${RI_COORDS.lat}&longitude=${RI_COORDS.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=10`;

    const res = await fetch(weatherUrl, {
      next: { revalidate: 1800 },
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Weather service returned ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;

    const analysis = analyzeTurfConditions(current, daily);

    // Build 5-day mini forecast preview
    const forecastPreview = (daily?.time || []).slice(0, 5).map((dateStr, idx) => {
      const isSnow = (daily?.snowfall_sum?.[idx] || 0) > 0;
      const isRain = (daily?.precipitation_sum?.[idx] || 0) >= 0.1;
      const isFreeze = (daily?.temperature_2m_min?.[idx] || 50) <= 32;
      return {
        dateStr,
        dayLabel: formatDayLabel(dateStr).split(',')[0],
        dateNum: dateStr.split('-').slice(1).join('/'),
        maxTemp: Math.round(daily?.temperature_2m_max?.[idx] ?? 50),
        minTemp: Math.round(daily?.temperature_2m_min?.[idx] ?? 35),
        snowAmount: daily?.snowfall_sum?.[idx] || 0,
        rainProb: daily?.precipitation_probability_max?.[idx] || 0,
        icon: getWeatherIcon(daily?.weather_code?.[idx] ?? 0, isSnow, isRain, isFreeze)
      };
    });

    const payload = {
      success: true,
      location: RI_COORDS.name,
      lastUpdated: new Date().toISOString(),
      current: {
        temp: Math.round(current?.temperature_2m ?? 42),
        windMph: Math.round(current?.wind_speed_10m ?? 6),
        weatherCode: current?.weather_code ?? 0
      },
      analysis,
      forecast: forecastPreview
    };

    cachedData = payload;
    lastFetchTime = now;

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Weather Advisory API error:', error);
    // Return graceful fallback so page never breaks
    return NextResponse.json({
      success: false,
      location: RI_COORDS.name,
      current: { temp: 42, windMph: 7, weatherCode: 1 },
      analysis: {
        urgencyLevel: 'high',
        badge: '❄️ SEASONAL WEATHER ADVISORY',
        headline: 'Sub-Freezing Temperatures Approaching Rhode Island',
        targetDate: 'This Week',
        turfAlert: 'Ground temperatures are dropping below freezing. Trapped moisture beneath uncollected leaves leads to snow mold, rot, and dead turf patches by spring.',
        incentive: 'Book your fall cleanup and property winterization before the ground hardens and winter precipitation begins.',
        ctaText: 'Lock In Pre-Freeze Cleanup',
        serviceQuery: 'Fall Cleanup',
        accentColor: 'amber'
      },
      forecast: []
    });
  }
}
