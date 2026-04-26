import { cities } from "@/data/city-details";
import { lawnServices } from "@/data/lawn-services";
import ServicePage from "../../ServicePage";
import { getBaseUrl, generateServiceSchema, generateBreadcrumbSchema } from '@/utils/seo-helpers';

export async function generateStaticParams() {
  // Define RI cities
  const riCities = [
    'Providence',
    'Warwick',
    'Cranston',
    'Pawtucket',
    'East Providence',
    'Woonsocket',
    'Coventry',
    'Cumberland',
    'North Providence',
    'South Kingstown',
    'West Warwick',
    'Johnston',
    'North Kingstown',
    'Newport',
    'Bristol',
    'Westerly',
    'Smithfield',
    'Lincoln',
    'Central Falls',
    'Portsmouth',
    'Barrington',
    'Middletown',
    'Burrillville',
    'Narragansett'
  ];
  
  // Generate all city/service combinations
  const paths = [];
  
  riCities.forEach(city => {
    lawnServices.forEach(service => {
      paths.push({
        city: city.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        service: service.urlPath
      });
    });
  });

  return paths;
}

export async function generateMetadata({ params }) {
  const { city, service } = params;
  const serviceData = lawnServices.find(s => s.urlPath === service);
  
  if (!serviceData) return {};

  const formattedCity = city.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const baseUrl = getBaseUrl();
  // Construct the canonical URL for this specific page
  const canonicalUrl = `${baseUrl}/services/${city}/${service}`;

  return {
    title: `${serviceData.title} in ${formattedCity}, RI | Flora Lawn and Landscaping Inc`,
    description: serviceData.metaDescription.replace('{city}', formattedCity),
    keywords: `${serviceData.title.toLowerCase()}, ${formattedCity} landscaping, ${formattedCity} lawn care, Rhode Island landscaping`,
    // Add canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    // Add robots tag
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `${serviceData.title} - ${formattedCity}, RI`,
      description: serviceData.metaDescription.replace('{city}', formattedCity),
      url: canonicalUrl,
      locale: 'en_US',
      type: 'website',
      siteName: 'Flora Lawn and Landscaping Inc',
      images: [
        {
          url: `${baseUrl}/images/${serviceData.slug || serviceData.urlPath}.jpg`,
          width: 1200,
          height: 630,
          alt: `${serviceData.title} in ${formattedCity}, RI`
        }
      ]
    }
  };
}

export default function Page({ params }) {
  const { city, service } = params;
  
  const formattedCity = city.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const serviceData = lawnServices.find(s => s.urlPath === service);
  const baseUrl = getBaseUrl();

  // Generate structured data
  const serviceSchema = serviceData ? generateServiceSchema(serviceData, formattedCity) : null;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Services', url: `${baseUrl}/services` },
    { name: serviceData?.title || service, url: `${baseUrl}/services/${city}/${service}` }
  ]);

  return (
    <>
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ServicePage 
        city={formattedCity}
        service={service}
      />
    </>
  );
} 