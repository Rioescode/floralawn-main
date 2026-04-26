export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Cleanup",
      price: "$175",
      features: [
        "Winter debris removal",
        "Basic lawn cleanup",
        "Single visit service",
        "Light yard waste removal"
      ]
    },
    {
      name: "Complete Cleanup",
      price: "$275",
      features: [
        "Full property cleanup",
        "Garden bed prep",
        "Debris hauling",
        "Pre-season inspection"
      ]
    },
    {
      name: "Premium Package",
      price: "$375",
      features: [
        "Comprehensive service",
        "Mulch installation",
        "Fertilizer application",
        "Season preparation"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Spring Cleanup",
        content: `Get your ${name} property ready for the growing season with our comprehensive spring cleanup service. We remove winter debris, prepare garden beds, and set your landscape up for success.`
      },
      {
        title: "Our Cleanup Process",
        content: `Our thorough spring cleanup in ${name} includes removing winter debris, cleaning up garden beds, trimming perennials, and preparing your property for new growth. We use professional equipment to ensure efficient and complete service.`
      },
      {
        title: "Lawn Preparation",
        content: `Spring is crucial for lawn health in ${name}. Our cleanup service includes removing thatch, clearing winter debris, and preparing your lawn for the growing season. We can also identify any winter damage that needs attention.`
      },
      {
        title: "Garden Bed Care",
        content: `For ${name} properties, we provide complete garden bed preparation including debris removal, edge definition, and preparation for new plantings. We can also apply fresh mulch to protect plants and enhance appearance.`
      },
      {
        title: "Additional Services",
        content: `Enhance your spring cleanup in ${name} with our additional services including fertilization, pre-emergent weed control, and mulch installation. We can create a complete spring preparation package for your property.`
      }
    ],
    pricing
  }
}
