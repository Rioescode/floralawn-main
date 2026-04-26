// generateSlugs.js
import { lawnServices } from './data/lawn-services.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate a URL-friendly slug from a title
function createSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()                      // Trim leading/trailing whitespace
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-');        // Replace multiple consecutive hyphens with a single one
}

// Process the services
const updatedServices = lawnServices.map(service => {
  const slug = createSlug(service.title);
  // Keep the original structure if title is missing
  if (!slug) return service;

  return {
    ...service, // Keep all other properties
    slug: slug, // Set the generated slug
    urlPath: `${slug}-service`, // Generate urlPath based on the new slug and "-service" suffix
  };
});

// Format the output as a JavaScript export statement
const outputString = `export const lawnServices = ${JSON.stringify(updatedServices, null, 2)};
`;

// Write directly to a new file
const outputPath = path.resolve(__dirname, 'data/lawn-services-updated.js');
try {
  // Ensure the data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)){
      fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, outputString, 'utf-8');
  console.log(`Updated data successfully written to: ${outputPath}`);
} catch (error) {
  console.error(`Error writing file: ${error.message}`);
  process.exit(1); // Exit if writing fails
} 