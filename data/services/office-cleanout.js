export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Office Cleanout Services in ${city}`,
      description: `Professional office and commercial cleanout services in ${city}. Complete office furniture and equipment removal.`,
      subtitle: `Expert office cleanout services throughout ${city} and surrounding areas.`
    },
    
    pricing: {
      title: "Office Cleanout Pricing",
      note: "* Prices based on office size and contents",
      plans: [
        {
          name: "Small Office",
          price: "$375+",
          features: [
            "Up to 1000 sq ft",
            "Furniture removal",
            "Electronics recycling",
            "Complete cleanup"
          ]
        },
        // ... pricing plans
      ]
    },

    serviceAreas: {
      title: `Service Areas Near ${city}`,
      description: `Our office cleanout services extend beyond ${city} to neighboring communities. We're proud to serve these nearby areas:`,
      areas: [
        {
          name: `${city} Central`,
          zipCodes: ["02888", "02889"],
          url: `/services/${city.toLowerCase()}/office-cleanout`
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
          name: "Small Office Cleanout",
          price: "From $375",
          description: "Complete small office removal and cleanup"
        },
        {
          name: "Medium Office Cleanout",
          price: "From $675",
          description: "Mid-size office space clearance"
        },
        {
          name: "Large Office Cleanout",
          price: "Custom Quote",
          description: "Full office building cleanout services"
        }
      ],
      commercial: [
        {
          name: "Corporate Relocation",
          price: "Custom Quote",
          description: "Office moving and cleanout services"
        },
        {
          name: "Multi-Floor Cleanout",
          price: "Custom Quote",
          description: "Complete building cleanout"
        },
        {
          name: "Regular Service",
          price: "Contract Pricing",
          description: "Ongoing office cleanout services"
        }
      ]
    },

    acceptedItems: [
      "Office Furniture",
      "Desks",
      "Chairs",
      "Filing Cabinets",
      "Electronics",
      "Cubicles",
      "Conference Tables",
      "Office Equipment",
      "Storage Units",
      "Break Room Items"
    ],

    prohibitedItems: [
      "Hazardous Materials",
      "Chemical Waste",
      "Medical Waste",
      "Radioactive Materials",
      "Toxic Substances",
      "Biohazards"
    ]
  };
} 