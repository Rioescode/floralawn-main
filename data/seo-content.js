export const seoTemplates = {
  title: (city) => `Professional Junk Removal Services in ${city}, Rhode Island | RI Junk Works`,
  
  description: (city, county) => 
    `Expert junk removal and cleanout services in ${city}, ${county}, RI. Local professionals providing residential and commercial junk removal. Free estimates!`,
  
  h1: (city) => `Professional Junk Removal Services in ${city}, RI`,
  
  intro: (city, county) => `
    Looking for reliable junk removal services in ${city}? RI Junk Works provides expert 
    junk removal and cleanout services throughout ${county}. Our local team delivers 
    professional results with personalized service.
  `,
  
  serviceIntro: (city) => `
    We offer comprehensive junk removal services to ${city} homes and businesses, 
    including furniture removal, appliance disposal, estate cleanouts, and construction debris removal.
  `,

  neighborhoodContent: (neighborhood, city) => `
    Providing expert junk removal services in ${neighborhood}, ${city}. Our local team 
    understands the specific needs of ${neighborhood} properties and delivers 
    efficient junk removal solutions.
  `,

  schema: (city, county, neighborhoods, zipCodes) => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `RI Junk Works ${city}`,
    "description": `Professional junk removal services in ${city}, Rhode Island`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": "RI",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        // You would need to add actual coordinates for each city
        "latitude": "41.8240",
        "longitude": "-71.4128"
      },
      "geoRadius": "15000"
    },
    "areaServed": zipCodes.map(zip => ({
      "@type": "PostalCodeRangeSpecification",
      "postalCode": zip
    }))
  })
}; 