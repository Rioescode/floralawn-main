export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Appliance Removal Services in ${city}`,
      description: `Professional appliance removal and recycling in ${city}. We handle all types of appliances including refrigerators, washers, dryers, ovens, and more.`,
      subtitle: `Expert appliance removal throughout ${city} and surrounding areas.`
    },
    
    pricing: {
      title: "Appliance Removal Pricing",
      note: "* Prices based on appliance type and quantity",
      plans: [
        {
          name: "Single Appliance",
          price: "$125+",
          features: [
            "One appliance",
            "Same-day service",
            "Safe removal",
            "Proper disposal"
          ]
        },
        {
          name: "Multi-Appliance",
          price: "$225+",
          features: [
            "2-3 appliances",
            "Complete removal",
            "Recycling included",
            "Site cleanup"
          ]
        },
        {
          name: "Full Service",
          price: "Custom",
          features: [
            "Multiple appliances",
            "All types accepted",
            "Property cleanup",
            "Eco-friendly disposal"
          ]
        }
      ]
    },

    services: {
      residential: [
        {
          name: "Single Appliance",
          price: "From $125",
          description: "Remove one household appliance"
        },
        {
          name: "Multiple Items",
          price: "From $225",
          description: "Remove multiple appliances"
        },
        {
          name: "Full Property",
          price: "Custom Quote",
          description: "Complete appliance removal"
        }
      ],
      commercial: [
        {
          name: "Commercial Property",
          price: "Custom Quote",
          description: "Business appliance removal"
        },
        {
          name: "Restaurant Equipment",
          price: "Custom Quote",
          description: "Food service equipment removal"
        },
        {
          name: "Regular Service",
          price: "Contract Pricing",
          description: "Ongoing appliance removal"
        }
      ]
    },

    acceptedItems: [
      "Refrigerators",
      "Freezers",
      "Washers",
      "Dryers",
      "Ovens",
      "Dishwashers",
      "Microwaves",
      "Water Heaters",
      "Air Conditioners",
      "Commercial Appliances"
    ],

    prohibitedItems: [
      "Hazardous Materials",
      "Chemical Containers",
      "Paint",
      "Oil",
      "Medical Equipment",
      "Radioactive Materials"
    ]
  };
}

export default generateServiceContent; 