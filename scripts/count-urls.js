import { locations } from '../data/locations.js';
import { lawnServices } from '../data/lawn-services.js';
import { riCities } from '../data/ri-cities.js';

function countUrls() {
  let count = 1; // Homepage
  
  // Count existing cities
  riCities.forEach(city => {
    const variations = 10; // Number of service variations
    const areaVariations = 4; // Number of area variations
    count += lawnServices.length * (1 + variations + areaVariations);
  });

  // Count new locations
  locations.forEach(location => {
    count += 1; // Main city page
    const variations = 10; // Number of service variations
    const areaVariations = 4; // Number of area variations
    count += lawnServices.length * (1 + variations + areaVariations);
  });

  return count;
}

console.log('Total number of URLs in sitemap:', countUrls()); 