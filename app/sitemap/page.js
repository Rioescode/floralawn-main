import { lawnServices } from '@/data/lawn-services'
import { riCities } from '@/data/ri-cities'

export default function sitemap() {
  const baseUrl = 'https://riyardwork.com' // Updated domain

  // Generate city service pages
  const servicePages = []
  lawnServices.forEach(service => {
    riCities.forEach(city => {
      servicePages.push({
        url: `${baseUrl}/${service.urlPath}/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8
      })
    })
  })

  // Generate service landing pages
  const serviceLandingPages = lawnServices.map(service => ({
    url: `${baseUrl}/${service.urlPath}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9
  }))

  // Generate city landing pages
  const cityLandingPages = riCities.map(city => ({
    url: `${baseUrl}/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9
  }))

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/liability-waiver`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    }
  ]

  return [
    ...staticPages,
    ...serviceLandingPages,
    ...cityLandingPages,
    ...servicePages
  ]
} 