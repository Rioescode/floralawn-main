export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Service",
      price: "From $45/visit",
      features: [
        "Bi-weekly mowing",
        "Edge trimming",
        "Clipping cleanup",
        "Basic service"
      ]
    },
    {
      name: "Complete Care",
      price: "From $65/visit",
      features: [
        "Bi-weekly mowing",
        "Full trimming",
        "Blowing service",
        "Debris removal"
      ]
    },
    {
      name: "Premium Package",
      price: "From $85/visit",
      features: [
        "Custom schedule",
        "Premium service",
        "Pattern mowing",
        "Full property care"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Bi-Weekly Mowing",
        content: `Maintain your ${name} property with our reliable bi-weekly mowing service. Perfect for properties with moderate growth rates or those looking to balance maintenance needs with budget.`
      },
      {
        title: "Our Service",
        content: `Each bi-weekly visit to your ${name} property includes professional mowing, edge trimming, and cleanup. We maintain consistent cutting heights and patterns for the best appearance.`
      },
      {
        title: "Quality Equipment",
        content: `We use professional-grade equipment for all ${name} properties to ensure clean cuts and efficient service. Our equipment is regularly maintained to provide the best possible results.`
      },
      {
        title: "Flexible Scheduling",
        content: `We work with ${name} property owners to establish the ideal bi-weekly schedule. Our service can be adjusted seasonally to account for varying growth rates and maintenance needs.`
      },
      {
        title: "Additional Services",
        content: `Enhance your bi-weekly mowing service in ${name} with our additional lawn care services. We offer fertilization, weed control, and other treatments to maintain a healthy, attractive lawn.`
      }
    ],
    pricing
  }
} 