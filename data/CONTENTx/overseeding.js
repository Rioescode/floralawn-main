export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Overseeding",
      price: "$125",
      features: [
        "Up to 5,000 sq ft",
        "Quality seed blend",
        "Basic preparation",
        "Single application"
      ]
    },
    {
      name: "Premium Service",
      price: "$225",
      features: [
        "Up to 10,000 sq ft",
        "Premium seed mix",
        "Soil preparation",
        "Starter fertilizer"
      ]
    },
    {
      name: "Complete Package",
      price: "$325",
      features: [
        "10,000+ sq ft",
        "Custom seed blend",
        "Full soil prep",
        "Follow-up care"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Overseeding",
        content: `Improve your ${name} lawn's thickness and health with our professional overseeding service. We use premium grass seed varieties selected specifically for your local conditions.`
      },
      {
        title: "Our Process",
        content: `Our overseeding service in ${name} includes proper soil preparation, even seed distribution, and essential aftercare instructions. We ensure optimal seed-to-soil contact for maximum germination.`
      },
      {
        title: "Benefits of Overseeding",
        content: `Regular overseeding in ${name} helps fill in bare spots, improve grass density, and enhance your lawn's resistance to disease and drought. It's an essential service for maintaining a healthy, attractive lawn.`
      },
      {
        title: "Timing and Results",
        content: `We schedule overseeding in ${name} during optimal growing conditions to ensure the best results. Most customers see new grass growth within 7-14 days, with full results visible in 4-6 weeks.`
      },
      {
        title: "Additional Services",
        content: `Enhance your overseeding results in ${name} with our complementary services including aeration, fertilization, and proper irrigation management. We can create a complete lawn renovation package for your property.`
      }
    ],
    pricing
  }
} 