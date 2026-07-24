import { getBaseUrl } from '@/utils/seo-helpers';

const baseUrl = getBaseUrl();

export const metadata = {
  title: 'We\'re Hiring - Landscaping Jobs in Rhode Island | Fall Cleanups Services',
  description: 'Join Fall Cleanups Services! Hiring landscaping workers in Rhode Island. Full training provided, $17-20/hour starting pay. No experience required. Apply today!',
  keywords: 'landscaping jobs RI, lawn care jobs Rhode Island, landscaping careers, hiring landscapers, landscaping employment RI, lawn care jobs',
  openGraph: {
    title: 'We\'re Hiring - Landscaping Jobs in Rhode Island',
    description: 'Join our team! Full training provided for landscaping positions. $17-20/hour starting pay. Apply today!',
    url: `${baseUrl}/careers`,
    locale: 'en_US',
    type: 'website',
    siteName: 'Fall Cleanups Services'
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


