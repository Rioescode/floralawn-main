export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Furniture Removal Services in ${city}`,
      description: `Professional furniture removal and disposal in ${city}. Fast, reliable service for all types of furniture.`,
      subtitle: `Expert furniture removal throughout ${city} and surrounding areas.`
    },
    
    pricing: {
      title: "Furniture Removal Pricing",
      note: "* Prices vary by size and quantity",
      plans: [
        {
          name: "Single Item",
          price: "$125+",
          features: [
            "One furniture piece",
            "Same-day service",
            "No heavy lifting",
            "Clean removal"
          ]
        },
        {
          name: "Room Clear",
          price: "$325+",
          features: [
            "Multiple pieces",
            "One room",
            "Complete removal",
            "Cleanup included"
          ]
        },
        {
          name: "Full House",
          price: "Custom",
          features: [
            "Multiple rooms",
            "All furniture",
            "Project planning",
            "Complete service"
          ]
        }
      ]
    },

    serviceAreas: {
      title: `Service Areas Near ${city}`,
      description: `Our furniture removal services extend beyond ${city} to neighboring communities. We're proud to serve these nearby areas:`,
      areas: [
        {
          name: `${city} Central`,
          zipCodes: ["02888", "02889"],
          url: `/services/${city.toLowerCase()}/furniture-removal`
        },
        {
          name: "Surrounding Areas",
          zipCodes: ["02886", "02887", "02885"],
          url: "/service-areas"
        },
        {
          name: "Greater Region",
          zipCodes: ["02884", "02883", "02882"],
          url: "/coverage"
        }
      ]
    },

    services: {
      residential: [
        {
          name: "Single Item Removal",
          price: "From $125",
          description: "Remove individual furniture pieces"
        },
        {
          name: "Multi-Item Removal",
          price: "From $225",
          description: "Remove multiple furniture items"
        },
        {
          name: "Full Room Clearance",
          price: "From $325",
          description: "Complete room furniture removal"
        }
      ],
      commercial: [
        {
          name: "Office Furniture",
          price: "Custom Quote",
          description: "Office furniture removal and disposal"
        },
        {
          name: "Bulk Removal",
          price: "Custom Quote",
          description: "Large-scale furniture removal"
        },
        {
          name: "Regular Service",
          price: "Contract Pricing",
          description: "Ongoing furniture removal service"
        }
      ]
    },

    acceptedItems: [
      "Sofas",
      "Chairs",
      "Tables",
      "Beds",
      "Dressers",
      "Desks",
      "Bookcases",
      "Entertainment Centers",
      "Patio Furniture",
      "Office Furniture"
    ],

    prohibitedItems: [
      "Hazardous Materials",
      "Electronics",
      "Appliances",
      "Construction Materials",
      "Yard Waste",
      "Medical Equipment"
    ]
  };
} 