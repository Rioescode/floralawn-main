/** @type {import('next-sitemap').IConfig} */
// Use environment variable or default domain - don't import config.js (ES modules)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://floralawn-and-landscaping.com';

module.exports = {
  siteUrl: siteUrl,
  generateRobotsTxt: true,
  exclude: [
    "/twitter-image.*", 
    "/opengraph-image.*", 
    "/icon.*", 
    "/api/*", 
    "/dashboard/*",
    "/utils/*",
    "/components/*",
    "/marketplace/components/*"
  ],
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,
  autoLastmod: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api', '/dashboard']
      }
    ]
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
  additionalPaths: async (config) => {
    const result = []
    
    // Add static pages with high priority
    const staticPages = [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/about', changefreq: 'monthly', priority: 0.8 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.8 },
      { loc: '/schedule', changefreq: 'daily', priority: 0.9 },
      { loc: '/privacy-policy', changefreq: 'monthly', priority: 0.5 },
      { loc: '/services', changefreq: 'weekly', priority: 0.9 },
      { loc: '/tos', changefreq: 'monthly', priority: 0.5 }
    ]
    result.push(...staticPages)

    // Add resource pages
    const resourcePages = [
      { loc: '/resources/lawn-care-guide', changefreq: 'monthly', priority: 0.8 },
      { loc: '/resources/seasonal-maintenance', changefreq: 'monthly', priority: 0.8 },
      { loc: '/resources/eco-friendly-landscaping', changefreq: 'monthly', priority: 0.8 }
    ]
    result.push(...resourcePages)

    // All 39 Rhode Island Municipalities + Massachusetts Territories
    const locations = [
      // RI - Providence County
      'providence-ri', 'cranston-ri', 'pawtucket-ri', 'east-providence-ri', 'woonsocket-ri', 
      'cumberland-ri', 'north-providence-ri', 'johnston-ri', 'lincoln-ri', 'smithfield-ri', 
      'scituate-ri', 'burrillville-ri', 'johnston-ri', 'north-smithfield-ri', 'glocester-ri', 
      'foster-ri', 'central-falls-ri',
      
      // RI - Kent County
      'warwick-ri', 'coventry-ri', 'west-warwick-ri', 'east-greenwich-ri', 'west-greenwich-ri',
      
      // RI - Washington County
      'south-kingstown-ri', 'north-kingstown-ri', 'westerly-ri', 'hopkinton-ri', 'richmond-ri', 
      'charlestown-ri', 'exeter-ri', 'narragansett-ri', 'new-shoreham-ri',
      
      // RI - Newport County
      'newport-ri', 'middletown-ri', 'portsmouth-ri', 'tiverton-ri', 'little-compton-ri', 'jamestown-ri',
      
      // RI - Bristol County
      'bristol-ri', 'barrington-ri', 'warren-ri',
      
      // Massachusetts Edge
      'attleboro-ma', 'north-attleboro-ma', 'seekonk-ma', 'rehoboth-ma', 'plainville-ma', 'wrentham-ma'
    ]
    
    // Add main location pages
    locations.forEach(location => {
      result.push({
        loc: `/${location}`,
        changefreq: 'weekly',
        priority: 0.9
      })
    })

    // Unified Year-Round Service Architecture
    const servicesArr = [
      'lawn-mowing',
      'mulching',
      'dethatching',
      'overseeding',
      'spring-cleanup',
      'fall-cleanup',
      'aeration',
      'tree-trimming',
      'snow-removal',
      'fertilization',
      'weed-control',
      'shrub-pruning',
      'gutter-cleaning',
      'landscaping'
    ]

    // Generate Global Service Grid (Locations x Services)
    servicesArr.forEach(service => {
      locations.forEach(location => {
        result.push({ 
          loc: `/${location}/${service}`,
          changefreq: 'weekly',
          priority: 0.8
        })
      })
    })

    return result
  },
  outDir: 'public',
}
