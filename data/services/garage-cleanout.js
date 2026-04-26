export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Garage Cleanout Services in ${city}`,
      description: `Professional garage cleanout and organization services in ${city}. From cluttered to clean - we handle it all.`,
      subtitle: `Expert garage cleanout services throughout ${city} and surrounding areas.`
    },
    
    pricing: {
      title: "Garage Cleanout Pricing",
      note: "* Prices based on garage size and contents",
      plans: [
        {
          name: "Basic Cleanout",
          price: "$275+",
          features: [
            "Single car garage",
            "Basic items only",
            "Same-day service",
            "Sweep clean"
          ]
        },
        {
          name: "Standard Cleanout",
          price: "$425+",
          features: [
            "Two car garage",
            "Mixed items",
            "Heavy items ok",
            "Complete cleanup"
          ]
        },
        {
          name: "Deep Cleanout",
          price: "$575+",
          features: [
            "Large garage",
            "All contents",
            "Organization help",
            "Deep cleaning"
          ]
        }
      ]
    },

    services: {
      residential: [
        {
          name: "Basic Garage Cleanout",
          price: "From $275",
          description: "Remove basic garage clutter and junk"
        },
        {
          name: "Workshop Cleanout",
          price: "From $375",
          description: "Clear tools, equipment, and materials"
        },
        {
          name: "Storage Cleanout",
          price: "From $425",
          description: "Complete garage storage cleanup"
        }
      ],
      commercial: [
        {
          name: "Commercial Garage",
          price: "Custom Quote",
          description: "Commercial garage and storage cleanup"
        },
        {
          name: "Auto Shop Cleanout",
          price: "Custom Quote",
          description: "Auto repair shop junk removal"
        },
        {
          name: "Warehouse Section",
          price: "Contract Pricing",
          description: "Partial warehouse cleanout services"
        }
      ]
    },

    acceptedItems: [
      "Old Tools",
      "Equipment",
      "Storage Boxes",
      "Auto Parts",
      "Lawn Equipment",
      "Sports Gear",
      "Shelving Units",
      "Workshop Items",
      "Holiday Decorations",
      "General Clutter"
    ],

    prohibitedItems: [
      "Hazardous Waste",
      "Oil Drums",
      "Paint Thinners",
      "Car Batteries",
      "Chemicals",
      "Asbestos Materials"
    ],

    serviceAreas: {
      title: `Service Areas Near ${city}`,
      description: `Our garage cleanout services extend beyond ${city} to neighboring communities. We're proud to serve these nearby areas:`,
      areas: [
        {
          name: `${city} Central`,
          zipCodes: ["02888", "02889"],
          url: `/services/${city.toLowerCase()}/garage-cleanout`
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
    }
  };
} 