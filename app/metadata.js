import config from '@/config';
import { getBaseUrl } from '@/utils/seo-helpers';

const baseUrl = getBaseUrl();

export const metadata = {
  title: 'Flora Lawn and Landscaping Inc | Professional Lawn Care & Landscaping',
  description: 'Fast, reliable yard maintenance and landscaping services throughout Rhode Island. Same-day service available. We handle lawn care, landscaping, yard cleanup and more.',
  keywords: 'lawn care, landscaping, lawn mowing, mulch installation, leaf removal, snow removal, Rhode Island, RI, professional landscaping, yard maintenance',
  openGraph: {
    title: 'Flora Lawn and Landscaping Inc | Rhode Island Landscaping Experts',
    description: 'Professional yard maintenance and landscaping services. From basic lawn care to complete landscape transformations. Serving all of Rhode Island.',
    images: [
      {
        url: `${baseUrl}/images/2024-09-18.jpg`,
        width: 1200,
        height: 630,
        alt: 'Professional lawn care service by Flora Lawn and Landscaping Inc'
      }
    ],
    url: baseUrl,
    locale: 'en_US',
    type: 'website',
    siteName: 'Flora Lawn and Landscaping Inc'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flora Lawn and Landscaping Inc | Professional Landscaping Services',
    description: 'Expert landscaping services in Rhode Island. Fast, reliable, and eco-friendly yard care.',
    images: [`${baseUrl}/images/2024-09-18.jpg`],
  },
  alternates: {
    canonical: baseUrl
  },
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  }
}; 