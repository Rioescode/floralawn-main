export const riLocations = [
  {
    city: "Providence",
    county: "Providence County",
    population: 190934,
    neighborhoods: ["Downtown", "East Side", "South Providence", "West End"],
    zipCodes: ["02903", "02904", "02905", "02906", "02907", "02908", "02909"]
  },
  {
    city: "Warwick",
    county: "Kent County",
    population: 82823,
    neighborhoods: ["Apponaug", "Oakland Beach", "Cowesett", "Potowomut"],
    zipCodes: ["02886", "02887", "02888", "02889"]
  },
  // Add more RI cities...
];

export const serviceAreas = [
  "Residential Lawn Care",
  "Commercial Lawn Maintenance",
  "Lawn Mowing",
  "Hedge Trimming",
  "Leaf Removal",
  "Spring Cleanup",
  "Fall Cleanup",
  "Lawn Fertilization",
  "Weed Control",
  "Mulch Installation"
];

export const generateMetadata = (location) => {
  const title = `Lawn Care Services in ${location.city}, RI | GreenCare Pro`;
  const description = `Professional lawn care services in ${location.city}, Rhode Island. Local experts providing mowing, maintenance, and landscaping. Free estimates! Serving ${location.neighborhoods.join(", ")}.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/images/${location.city.toLowerCase()}-lawn-care.jpg`],
    },
  };
}; 