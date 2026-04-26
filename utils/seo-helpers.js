import config from '@/config';

// Get the base URL consistently
export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domainName}`;
}

// Generate structured data for local business
export function generateLocalBusinessSchema(businessInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${getBaseUrl()}#organization`,
    name: businessInfo.name || 'Flora Lawn & Landscaping Inc',
    image: `${getBaseUrl()}/flora-logo-final.png`,
    '@id': `${getBaseUrl()}`,
    url: getBaseUrl(),
    telephone: businessInfo.phone || '(401) 389-0913',
    email: businessInfo.email || 'floralawncareri@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.address?.street || '45 Vernon St',
      addressLocality: businessInfo.address?.city || 'Pawtucket',
      addressRegion: businessInfo.address?.state || 'RI',
      postalCode: businessInfo.address?.zip || '02860',
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: businessInfo.coordinates?.lat || '41.8781',
      longitude: businessInfo.coordinates?.lng || '-71.3826'
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '16:00'
      }
    ],
    areaServed: {
      '@type': 'State',
      name: 'Rhode Island'
    },
    serviceType: [
      'Lawn Mowing',
      'Landscaping',
      'Mulch Installation',
      'Leaf Removal',
      'Snow Removal',
      'Lawn Care',
      'Hedge Trimming',
      'Spring Cleanup',
      'Fall Cleanup'
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '85',
      bestRating: '5',
      worstRating: '1'
    }
  };
}

// Generate service schema
export function generateServiceSchema(service, city) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.title,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Flora Lawn & Landscaping Inc',
      telephone: '(401) 389-0913'
    },
    areaServed: {
      '@type': 'City',
      name: city
    },
    description: service.description || service.metaDescription
  };
}

// Generate breadcrumb schema
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// Generate FAQ schema
export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}


