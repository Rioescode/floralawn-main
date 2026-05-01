const address = "45 vernon st pawtucket, RI";
const destination = "100 Main St, Pawtucket, RI";
const apiKey = "AIzaSyCx_V4S4VviNKgYNQhHpUov2QJwYc4Yyp0";

async function fullDiagnostic() {
  console.log("--- Google Maps API Diagnostic ---");
  
  // 1. Test Geocoding
  console.log("\n[1/2] Testing Geocoding API...");
  try {
    const geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
    const geoData = await geoResp.json();
    console.log(`Status: ${geoData.status}`);
    if (geoData.status === 'OK') {
      console.log(`✅ SUCCESS: Found address "${geoData.results[0].formatted_address}"`);
    } else {
      console.log(`❌ FAILED: ${geoData.error_message || 'No error message'}`);
    }
  } catch (e) { console.log(`❌ Error: ${e.message}`); }

  // 2. Test Distance Matrix
  console.log("\n[2/2] Testing Distance Matrix API...");
  try {
    const distResp = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(address)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`);
    const distData = await distResp.json();
    console.log(`Status: ${distData.status}`);
    if (distData.status === 'OK') {
      const element = distData.rows[0].elements[0];
      if (element.status === 'OK') {
        console.log(`✅ SUCCESS: Calculated ${element.distance.text} and ${element.duration.text}`);
      } else {
        console.log(`❌ FAILED (Element): ${element.status}`);
      }
    } else {
      console.log(`❌ FAILED: ${distData.error_message || 'No error message'}`);
    }
  } catch (e) { console.log(`❌ Error: ${e.message}`); }
}

fullDiagnostic();
