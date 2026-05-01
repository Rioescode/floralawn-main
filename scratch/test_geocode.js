const address = "45 vernon st pawtucket";
const apiKey = "AIzaSyCx_V4S4VviNKgYNQhHpUov2QJwYc4Yyp0";

async function testGeocode() {
  console.log(`Testing geocode for: "${address}"`);
  
  const tryAddr = async (addr) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${apiKey}`
      );
      const data = await response.json();
      console.log(`\nResults for "${addr}":`);
      console.log(`Status: ${data.status}`);
      if (data.error_message) console.log(`Error Message: ${data.error_message}`);
      if (data.results && data.results.length > 0) {
        console.log(`Formatted Address: ${data.results[0].formatted_address}`);
        console.log(`Location: ${JSON.stringify(data.results[0].geometry.location)}`);
      }
      return data.status === 'OK';
    } catch (error) {
      console.error(`Fetch error for "${addr}":`, error.message);
      return false;
    }
  };

  const success1 = await tryAddr(address);
  if (!success1) {
    console.log("\nFirst attempt failed, trying with RI...");
    await tryAddr(`${address}, RI`);
  }
}

testGeocode();
