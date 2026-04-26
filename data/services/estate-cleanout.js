export function generateServiceContent({ city }) {
  return {
    hero: {
      title: `Estate Cleanout Services in ${city}`,
      description: `Professional estate cleanout and junk removal services in ${city}. Complete property cleanouts with eco-friendly disposal.`,
      subtitle: `Comprehensive estate cleanout services throughout ${city} and surrounding areas.`
    },
    
    pricing: {
      title: "Estate Cleanout Pricing",
      note: "* Prices vary based on volume and complexity",
      plans: [
        {
          name: "Small Estate",
          price: "$450+",
          features: [
            "1-2 rooms",
            "Basic furniture removal",
            "Sorting services",
            "Donation coordination"
          ]
        },
        {
          name: "Medium Estate",
          price: "$850+",
          features: [
            "3-4 rooms",
            "Full house cleanout",
            "Appliance removal",
            "Recycling service"
          ]
        },
        {
          name: "Large Estate",
          price: "Custom",
          features: [
            "5+ rooms",
            "Complete property clearance",
            "Multiple truck loads",
            "Project management"
          ]
        }
      ]
    },

    services: {
      residential: [
        {
          name: "Property Cleanout",
          price: "From $450",
          description: "Complete estate and property cleanout services"
        },
        {
          name: "Furniture Removal",
          price: "From $125",
          description: "Removal of all furniture and large items"
        },
        {
          name: "Appliance Disposal",
          price: "From $95",
          description: "Safe disposal of all appliances"
        }
      ],
      commercial: [
        {
          name: "Storage Unit Cleanout",
          price: "Custom Quote",
          description: "Complete storage unit clearance"
        },
        {
          name: "Multi-Property Cleanout",
          price: "Custom Quote",
          description: "Large scale property cleanouts"
        },
        {
          name: "Hoarding Cleanup",
          price: "Custom Quote",
          description: "Specialized hoarding situation cleanup"
        }
      ]
    },

    acceptedItems: [
      "Furniture",
      "Appliances",
      "Personal Items",
      "Clothing",
      "Books and Papers",
      "Electronics",
      "Household Goods",
      "Garage Items",
      "Yard Items",
      "Storage Items"
    ],

    prohibitedItems: [
      "Hazardous Materials",
      "Chemicals",
      "Paint",
      "Oil",
      "Asbestos",
      "Medical Waste"
    ]
  };
} 