const fs = require('fs');
const xml2js = require('xml2js');

// Read the sitemap XML file
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf-8');

// Parse XML to JSON
xml2js.parseString(sitemap, (err, result) => {
    if (err) {
        console.error('Error parsing sitemap:', err);
        return;
    }

    const urls = result.urlset.url.map(url => url.loc[0]);
    
    // Organize URLs by section
    const sections = {
        static: [],
        cities: [],
        services: [],
        resources: [],
    };

    urls.forEach(url => {
        // Remove base URL for cleaner output
        const path = url.replace('https://rijunkremovall.com', '');
        
        // Categorize URLs
        if (path === '/' || 
            ['/about', '/contact', '/marketplace', '/privacy-policy', '/services', '/tos'].includes(path)) {
            sections.static.push(path);
        }
        else if (path.startsWith('/resources/')) {
            sections.resources.push(path);
        }
        else if (path.startsWith('/services/')) {
            sections.services.push(path);
        }
        else if (!path.includes('/') || path.split('/').length === 2) {
            sections.cities.push(path);
        }
    });

    // Print organized URLs
    console.log('\n=== Sitemap Analysis ===');
    
    console.log('\n=== Static Pages ===');
    sections.static.sort().forEach(url => console.log(url));

    console.log('\n=== Resource Pages ===');
    sections.resources.sort().forEach(url => console.log(url));

    console.log('\n=== City Pages ===');
    sections.cities.sort().forEach(url => console.log(url));

    console.log('\n=== Service Pages ===');
    console.log(`Total service pages: ${sections.services.length}`);
    console.log('Sample service pages:');
    sections.services.sort().slice(0, 5).forEach(url => console.log(url));
    console.log('...');

    // Print totals
    console.log('\n=== URL Counts ===');
    Object.entries(sections).forEach(([section, urls]) => {
        console.log(`${section}: ${urls.length} URLs`);
    });
    console.log(`Total: ${urls.length} URLs`);
    
    // Service type analysis
    const serviceTypes = new Set();
    sections.services.forEach(url => {
        const service = url.split('/').pop();
        serviceTypes.add(service);
    });
    
    console.log('\n=== Service Types ===');
    console.log(`Total unique services: ${serviceTypes.size}`);
    console.log('Services:');
    Array.from(serviceTypes).sort().forEach(service => console.log(`- ${service}`));
}); 