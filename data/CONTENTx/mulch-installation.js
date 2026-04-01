export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Installation",
      price: "From $8/yard",
      features: [
        "Standard mulch",
        "2-inch depth",
        "Edge definition",
        "Basic prep work"
      ]
    },
    {
      name: "Premium Service",
      price: "From $12/yard",
      features: [
        "Premium mulch",
        "3-inch depth",
        "Weed barrier",
        "Full preparation"
      ]
    },
    {
      name: "Complete Package",
      price: "From $15/yard",
      features: [
        "Designer mulch",
        "Custom depth",
        "Complete service",
        "Maintenance plan"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Mulch Installation",
        content: `Enhance your ${name} landscape with our professional mulch installation service. We provide quality materials and expert installation to improve your property's appearance and plant health.`
      },
      {
        title: "Our Process",
        content: `Our mulch installation in ${name} includes proper bed preparation, precise depth control, and clean edging. We ensure even coverage and proper application techniques for optimal results.`
      },
      {
        title: "Mulch Options",
        content: `We offer a variety of mulch options for ${name} properties, including hardwood, pine, cedar, and decorative varieties. Our team can help you select the best type for your landscape needs and aesthetic preferences.`
      },
      {
        title: "Benefits of Mulching",
        content: `Professional mulch installation in ${name} helps retain soil moisture, suppress weeds, regulate soil temperature, and improve soil health. It also enhances landscape appearance and reduces maintenance needs.`
      },
      {
        title: "Maintenance Services",
        content: `Beyond installation, we offer mulch maintenance services in ${name} to keep your landscape looking fresh. We can provide touch-ups, re-edging, and seasonal maintenance to maintain appearance and functionality.`
      }
    ],
    pricing
  }
} 