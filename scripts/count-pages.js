const importData = async () => {
  const { cities } = await import("../data/city-details.js");
  const { serviceLinks } = await import("../utils/service-links.js");
  
  // Count static pages
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/marketplace',
    '/privacy-policy',
    '/services',
    '/tos'
  ];

  // Count resource pages
  const resourcePages = [
    '/resources/junk-removal-cost-guide',
    '/resources/what-we-take',
    '/resources/eco-friendly-disposal'
  ];

  // Count city-level junk removal pages
  const cityJunkRemovalPages = cities.map(city => 
    `/${city.city.toLowerCase().replace(/\s+/g, '-')}/junk-removal`
  );

  // Count service pages
  const totalServicePages = cities.length * serviceLinks.mainServices.length;

  // Print statistics
  console.log('\n=== Page Generation Analysis ===');
  console.log('\nStatic Pages:', staticPages.length);
  staticPages.forEach(page => console.log(`- ${page}`));

  console.log('\nResource Pages:', resourcePages.length);
  resourcePages.forEach(page => console.log(`- ${page}`));

  console.log('\nCity Junk Removal Pages:', cityJunkRemovalPages.length);
  cityJunkRemovalPages.forEach(page => console.log(`- ${page}`));

  console.log('\nCity Pages:', cities.length);
  cities.forEach(city => console.log(`- /${city.city.toLowerCase().replace(/\s+/g, '-')}`));

  console.log('\nServices:', serviceLinks.mainServices.length);
  serviceLinks.mainServices.forEach(service => console.log(`- ${service.name}`));

  console.log('\n=== Totals ===');
  console.log('Static Pages:', staticPages.length);
  console.log('Resource Pages:', resourcePages.length);
  console.log('City Pages:', cities.length);
  console.log('City Junk Removal Pages:', cityJunkRemovalPages.length);
  console.log('Service Pages:', totalServicePages);
  console.log('Total Pages:', 
    staticPages.length + 
    resourcePages.length + 
    cities.length + 
    cityJunkRemovalPages.length + 
    totalServicePages
  );

  console.log('\n=== Service Pages Breakdown ===');
  console.log('Cities × Services:', `${cities.length} × ${serviceLinks.mainServices.length} = ${totalServicePages}`);

  // Sample URLs
  console.log('\n=== Sample URLs ===');
  const sampleCity = cities[0].city.toLowerCase().replace(/\s+/g, '-');
  const sampleService = serviceLinks.mainServices[0];
  console.log('Sample City Page:', `/${sampleCity}`);
  console.log('Sample City Junk Removal:', `/${sampleCity}/junk-removal`);
  console.log('Sample Service Page:', `/services/${sampleCity}/${sampleService.path}`);
  console.log('\n===============================');
};

importData().catch(console.error); 