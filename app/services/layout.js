import { getBaseUrl } from '@/utils/seo-helpers';

const baseUrl = getBaseUrl();

export const metadata = {
  title: 'Lawn Care & Landscaping Services | Flora Lawn and Landscaping Inc',
  description: 'Explore our professional lawn care, landscaping, fertilization, seasonal cleanup, and yard maintenance services across Rhode Island. Get a free estimate!',
  keywords: 'lawn care services, landscaping services, lawn mowing, mulch installation, leaf removal, snow removal, Rhode Island landscaping, professional lawn care',
  openGraph: {
    title: 'Lawn Care & Landscaping Services | Flora Lawn and Landscaping Inc',
    description: 'Professional lawn care and landscaping services throughout Rhode Island. Free estimates available!',
    url: `${baseUrl}/services`,
    locale: 'en_US',
    type: 'website',
    siteName: 'Flora Lawn and Landscaping Inc'
  },
  alternates: {
    canonical: `${baseUrl}/services`
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
  }
};

export default function ServicesLayout({ children }) {
  return children;
} 