export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Maintenance",
      price: "$95/visit",
      features: [
        "Weed removal",
        "Basic pruning",
        "Debris cleanup",
        "Monthly service"
      ]
    },
    {
      name: "Complete Care",
      price: "$145/visit",
      features: [
        "Bi-weekly service",
        "Full maintenance",
        "Plant health checks",
        "Seasonal flowers"
      ]
    },
    {
      name: "Premium Package",
      price: "$195/visit",
      features: [
        "Weekly service",
        "Complete care",
        "Plant replacement",
        "Design updates"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Garden Bed Maintenance",
        content: `Keep your ${name} garden beds looking beautiful year-round with our professional maintenance service. We provide comprehensive care to ensure your landscape stays healthy and attractive.`
      },
      {
        title: "Our Services",
        content: `Our garden bed maintenance in ${name} includes weed control, pruning, mulch maintenance, and seasonal cleanup. We ensure your beds stay neat and your plants remain healthy throughout the growing season.`
      },
      {
        title: "Plant Health Care",
        content: `We monitor plant health in your ${name} garden beds, identifying and addressing any issues before they become problems. Our team can recommend and implement changes to improve plant growth and appearance.`
      },
      {
        title: "Seasonal Services",
        content: `Throughout the year, we adjust our ${name} garden bed maintenance services to match seasonal needs. From spring cleanup to fall preparation, we ensure your beds receive appropriate care year-round.`
      },
      {
        title: "Design and Updates",
        content: `Beyond maintenance, we can help enhance your ${name} garden beds with seasonal color, new plantings, and design updates. Our team can recommend improvements to keep your landscape fresh and engaging.`
      }
    ],
    pricing
  }
} 