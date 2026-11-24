import { getBaseUrl } from '@/utils/seo-helpers';

const baseUrl = getBaseUrl();

export const metadata = {
  title: 'Work with Flora in Rhode Island | Flora Lawn & Landscaping',
  description: 'Apply to work with Flora Lawn & Landscaping in Rhode Island. Lawn care, landscaping, yard cleanups, and snow removal.',
  keywords: 'landscaping jobs RI, lawn care jobs Rhode Island, landscaping careers, hiring landscapers, landscaping employment RI, lawn care jobs',
  openGraph: {
    title: 'Work with Flora in Rhode Island',
    description: 'Apply to work with Flora Lawn & Landscaping. Lawn care, landscaping, yard cleanups, and snow removal.',
    url: `${baseUrl}/careers`,
    locale: 'en_US',
    type: 'website',
    siteName: 'Flora Lawn and Landscaping Inc'
  },
  alternates: {
    canonical: `${baseUrl}/careers`
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

export default function CareersLayout({ children }) {
  return children;
}


