export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Small Yard",
      price: "$75",
      features: [
        "Up to 2,000 sq ft",
        "Targeted spot treatment",
        "Pre and post-emergent",
        "Seasonal monitoring"
      ]
    },
    {
      name: "Medium Yard",
      price: "$95",
      features: [
        "2,000-5,000 sq ft",
        "Full coverage treatment",
        "Pre and post-emergent",
        "Quarterly inspections"
      ]
    },
    {
      name: "Large Yard",
      price: "$125",
      features: [
        "5,000+ sq ft",
        "Comprehensive treatment",
        "Custom application plan",
        "Monthly monitoring"
      ]
    }
  ]

  // Spring (March-May)
  if (month >= 2 && month <= 4) {
    return {
      sections: [
        {
          title: "Spring Weed Prevention",
          content: `Get ahead of weeds in your ${name} lawn with our early-season treatment. Our professional team uses targeted pre-emergent treatments to stop weeds before they start. We focus on preventing dandelions, crabgrass, and other common spring weeds.`
        },
        {
          title: "Our Treatment Process",
          content: `We begin with a thorough lawn analysis to identify potential problem areas. Then, we apply specialized pre-emergent herbicides that create a barrier against weed seeds. Our treatments are carefully timed to maximize effectiveness while protecting your existing grass.`
        },
        {
          title: "Why Choose Professional Treatment",
          content: `Early spring is crucial for effective weed control in ${name}. Our professional-grade products and expert application methods provide superior results compared to DIY treatments. We understand the local climate and weed patterns specific to Rhode Island.`
        }
      ],
      pricing
    }
  }

  // Summer (June-August)
  if (month >= 5 && month <= 7) {
    return {
      sections: [
        {
          title: "Summer Weed Control",
          content: `Keep your ${name} lawn weed-free during peak growing season. Our summer treatments target actively growing weeds while protecting your grass from heat stress. We specialize in controlling stubborn summer weeds like crabgrass and nutsedge.`
        },
        {
          title: "Heat-Safe Application",
          content: `Our summer treatments are specifically formulated for hot weather application. We use selective herbicides that eliminate weeds without damaging your grass, even in high temperatures. Our technicians are trained to apply treatments during optimal times of day.`
        },
        {
          title: "Ongoing Protection",
          content: `Summer weed control in ${name} requires vigilance and expertise. We provide regular monitoring and follow-up treatments as needed. Our program includes preventive measures to stop new weeds from establishing throughout the season.`
        }
      ],
      pricing
    }
  }

  // Fall (September-November)
  if (month >= 8 && month <= 10) {
    return {
      sections: [
        {
          title: "Fall Weed Control",
          content: `Prepare your ${name} lawn for winter with our comprehensive fall weed treatment. Fall is the ideal time to eliminate perennial weeds and prevent spring growth. Our treatments target the entire plant, including the root system.`
        },
        {
          title: "Winter Preparation",
          content: `Our fall treatments focus on eliminating weeds before winter dormancy. We use systemic herbicides that are absorbed into the plant's root system, providing complete control of persistent weeds. This approach helps prevent weed regrowth in spring.`
        },
        {
          title: "Long-Term Benefits",
          content: `Fall weed control in ${name} is an investment in next year's lawn. By eliminating weeds now, you'll have fewer problems in spring. Our treatments also help prepare your lawn for winter, promoting better spring green-up.`
        }
      ],
      pricing
    }
  }

  // Winter/Off-season (December-February)
  return {
    sections: [
      {
        title: "Winter Planning",
        content: `Plan your ${name} property's weed control strategy for the upcoming season. Winter is the perfect time to develop a customized treatment plan. Our experts will assess your lawn's specific needs and create a targeted approach.`
      },
      {
        title: "Early Booking Benefits",
        content: `Schedule your spring treatments now to ensure priority service when the season begins. Early planning allows us to target weeds at the optimal time, maximizing the effectiveness of our treatments. We offer special pricing for early bookings.`
      },
      {
        title: "Comprehensive Programs",
        content: `Our year-round weed control programs in ${name} provide complete protection. We'll create a custom treatment schedule based on your lawn's specific needs and local weather patterns. Our programs include regular monitoring and adjustments as needed.`
      }
    ],
    pricing
  }
} 