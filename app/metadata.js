import { getBaseUrl } from '@/utils/seo-helpers';

const baseUrl = getBaseUrl();

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Lawn Care, Mulch & Cleanup in RI & MA | Flora Lawn',
  description: 'Lawn mowing, dethatching, spring and fall cleanup, mulch, hedge trimming, aeration, and snow removal in Rhode Island and Massachusetts. Free quote in 1 to 6 hours.',
  keywords: 'lawn mowing, lawn care, dethatching, spring cleanup, fall cleanup, leaf removal, mulch, hedge trimming, bush trimming, aeration, overseeding, fertilization, snow removal, Rhode Island, Massachusetts, Providence, Pawtucket, Warwick',
  openGraph: {
    title: 'Lawn Care, Mulch & Cleanup in RI & MA | Flora Lawn',
    description: 'Mowing, dethatch, spring and fall cleanup, mulch, hedge trimming, and aeration for Rhode Island and Massachusetts homes. Free quote in 1 to 6 hours.',
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
    title: 'Lawn Care, Mulch & Cleanup in RI & MA | Flora Lawn',
    description: 'Free quote for lawn mowing, dethatch, cleanup, mulch, and hedge trimming in Rhode Island and Massachusetts.',
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