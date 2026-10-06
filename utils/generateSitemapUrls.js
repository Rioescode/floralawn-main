import { locations } from '@/data/locations';
import { lawnServices } from '@/data/lawn-services';
import { getBaseUrl } from '@/utils/seo-helpers';

export function generateSitemapUrls() {
  const urls = [];
  const baseUrl = getBaseUrl();

  // Homepage (already handled in sitemap.js but good for safety)
  urls.push({
    url: baseUrl,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 1.0
  });

  // === City landing pages (using locations.js — [city]/page.js) ===
  locations.forEach(location => {
    urls.push({
      url: `${baseUrl}/${location.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9
    });

    // === City + Service pages ([city]/[service]/page.js) ===
    lawnServices.forEach(service => {
      urls.push({
        url: `${baseUrl}/${location.slug}/${service.urlPath}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8
      });
    });

    // === Specialty Hubs ([specialty]/[city]/page.js) ===
    urls.push({
      url: `${baseUrl}/lawn-care-services/${location.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7
    });

    urls.push({
      url: `${baseUrl}/junk-removal-services/${location.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7
    });
  });

  return urls;
}