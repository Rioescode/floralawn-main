import { getBaseUrl } from '@/utils/seo-helpers';

export default function robots() {
  const baseUrl = getBaseUrl();
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/customer/',
          '/admin/',
          '/admin-dashboard/',
          '/_next/',
          '/private/',
          '/schedule',
          '/schedule/',
          '/customers/',
          '/invoices/',
          '/email-marketing/',
          '/notes/',
          '/routes/',
          '/analytics/',
          '/login/',
          '/profile/',
          '/contracts/',
          '/test-address/',
          '/test-distance/',
          '/test-maps/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/customer/',
          '/admin/',
          '/admin-dashboard/',
          '/_next/',
          '/private/',
          '/schedule',
          '/schedule/',
          '/customers/',
          '/invoices/',
          '/email-marketing/',
          '/notes/',
          '/routes/',
          '/analytics/',
          '/login/',
          '/profile/',
          '/contracts/',
          '/test-address/',
          '/test-distance/',
          '/test-maps/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


