export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Basement Cleanout Services in ${city}`,
      description: `Professional basement cleanout and junk removal in ${city}...`,
      subtitle: `Expert basement cleanout services throughout ${city} and surrounding areas`
    },
    
    pricing: {
      title: "Basement Cleanout Pricing",
      note: "* Prices based on basement size and contents",
      plans: [
        {
          name: "Basic Cleanout",
          price: "$275+",
          features: [
            "Small basement",
            "Basic items only",
            "Same-day service",
            "Sweep clean"
          ]
        },
        {
          name: "Standard Cleanout",
          price: "$475+",
          features: [
            "Medium basement",
            "Mixed items",
            "Heavy items ok",
            "Complete cleanup"
          ]
        },
        {
          name: "Deep Cleanout",
          price: "$675+",
          features: [
            "Large basement",
            "All contents",
            "Water damage items",
            "Deep cleaning"
          ]
        }
      ]
    },

    serviceAreas: {
      title: "Service Areas",
      description: `We provide basement cleanout services throughout ${city} and surrounding areas`,
      areas: [
        {
          name: `${city} Central`,
          zipCodes: ["02888", "02889"],
          url: `/services/${city.toLowerCase()}/basement-cleanout`
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
          name: "Basic Cleanout",
          price: "From $275",
          description: "Remove basic basement clutter"
        },
        {
          name: "Storage Cleanout",
          price: "From $475",
          description: "Clear stored items and junk"
        },
        {
          name: "Complete Cleanout",
          price: "From $675",
          description: "Full basement transformation"
        }
      ],
      commercial: [
        {
          name: "Commercial Storage",
          price: "Custom Quote",
          description: "Commercial basement cleanup"
        },
        {
          name: "Multi-Unit Property",
          price: "Custom Quote",
          description: "Multiple basement cleanouts"
        },
        {
          name: "Regular Service",
          price: "Contract Pricing",
          description: "Ongoing basement maintenance"
        }
      ]
    }
  };
} 