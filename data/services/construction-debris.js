export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Construction Debris Removal in ${city}`,
      description: `Professional construction waste removal services in ${city}...`,
      subtitle: `Expert construction debris removal throughout ${city} and surrounding areas.`
    },
    
    serviceAreas: {
      title: "Service Areas",
      description: `We provide construction debris removal services throughout ${city} and surrounding areas`,
      areas: [
        {
          name: `${city} Central`,
          zipCodes: ["02888", "02889"],
          url: `/services/${city.toLowerCase()}/construction-debris`
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

    pricing: {
      title: "Construction Debris Removal Pricing",
      note: "* Prices based on volume and material type",
      plans: [
        {
          name: "Small Load",
          price: "$275+",
          features: [
            "Up to 1/4 truck",
            "Basic debris removal",
            "Same-day service",
            "Site cleanup"
          ]
        },
        {
          name: "Medium Load",
          price: "$475+",
          features: [
            "1/2 truck load",
            "Mixed materials",
            "Heavy debris ok",
            "Complete cleanup"
          ]
        },
        {
          name: "Full Load",
          price: "$875+",
          features: [
            "Full truck capacity",
            "All debris types",
            "Multiple pickups",
            "Site restoration"
          ]
        }
      ]
    },

    services: {
      residential: [
        {
          name: "Renovation Debris",
          price: "From $275",
          description: "Removal of home renovation waste"
        },
        {
          name: "Demolition Cleanup",
          price: "From $475",
          description: "Post-demolition debris removal"
        },
        {
          name: "Concrete Removal",
          price: "Custom Quote",
          description: "Heavy material and concrete removal"
        }
      ],
      commercial: [
        {
          name: "Construction Site Cleanup",
          price: "Custom Quote",
          description: "Complete site debris removal"
        },
        {
          name: "Material Disposal",
          price: "From $375",
          description: "Construction material disposal"
        },
        {
          name: "Ongoing Service",
          price: "Contract Pricing",
          description: "Regular construction waste removal"
        }
      ]
    },

    acceptedItems: [
      "Wood",
      "Drywall",
      "Metal",
      "Concrete",
      "Tiles",
      "Flooring",
      "Windows",
      "Doors",
      "Fixtures",
      "Lumber"
    ],

    prohibitedItems: [
      "Asbestos",
      "Hazardous Materials",
      "Chemicals",
      "Paint",
      "Oil",
      "Medical Waste"
    ]
  };
}

export default generateServiceContent; 