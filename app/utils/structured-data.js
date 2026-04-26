export function generateStructuredData({ type, name, description, areaServed, serviceType }) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "name": name,
    "description": description,
    "areaServed": {
      "@type": "City",
      "name": areaServed,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": areaServed,
        "addressRegion": "RI",
        "addressCountry": "US"
      }
    },
    "provider": {
      "@type": "LocalBusiness",
      "name": "Flora Lawn & Landscaping Inc",
      "description": "Professional lawn care and landscaping services in Rhode Island",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "45 Vernon St",
        "addressLocality": "Pawtucket",
        "addressRegion": "RI",
        "postalCode": "02860",
        "addressCountry": "US"
      },
      "telephone": "(401) 389-0913",
      "email": "floralawncareri@gmail.com",
      "areaServed": "Rhode Island",
      "openingHours": [
        "Mo-Fr 07:00-18:00",
        "Sa 08:00-16:00"
      ],
      "priceRange": "$$"
    },
    "serviceType": serviceType,
    "availableService": {
      "@type": "Service",
      "serviceType": serviceType,
      "provider": {
        "@type": "LocalBusiness",
        "name": "Flora Lawn & Landscaping Inc"
      }
    }
  };
}

export const generateBusinessStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Flora Lawn & Landscaping Inc",
    "image": [
      "https://floralawn.com/flora-logo-final.png"
    ],
    "@id": "https://floralawn.com",
    "url": "https://floralawn.com",
    "telephone": "+14013890913",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "45 Vernon St",
      "addressLocality": "Pawtucket",
      "addressRegion": "RI",
      "postalCode": "02860",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.8781,
      "longitude": -71.3826
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday", 
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "07:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "08:00",
        "closes": "16:00"
      }
    ],
    "email": "floralawncareri@gmail.com",
    "sameAs": [
      "https://www.facebook.com/floralawn",
      "https://www.instagram.com/floralawn"
    ],
    "priceRange": "$$",
    "areaServed": [
      {
        "@type": "City",
        "name": "Providence",
        "addressRegion": "RI"
      },
      {
        "@type": "City", 
        "name": "Pawtucket",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "Cranston", 
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "East Providence",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "Woonsocket",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "North Providence",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "Cumberland",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "Lincoln",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "Johnston",
        "addressRegion": "RI"
      },
      {
        "@type": "City",
        "name": "Attleboro",
        "addressRegion": "MA"
      },
      {
        "@type": "City",
        "name": "North Attleboro", 
        "addressRegion": "MA"
      },
      {
        "@type": "City",
        "name": "Seekonk",
        "addressRegion": "MA"
      },
      {
        "@type": "City",
        "name": "Rehoboth",
        "addressRegion": "MA"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Lawn Care and Landscaping Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Lawn Mowing",
            "description": "Professional lawn mowing services for residential and commercial properties"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Landscaping",
            "description": "Complete landscaping design and installation services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Seasonal Cleanup",
            "description": "Spring and fall cleanup services including leaf removal and debris cleanup"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Snow Removal", 
            "description": "Professional snow removal services for driveways and walkways"
          }
        }
      ]
    }
  };
}; 