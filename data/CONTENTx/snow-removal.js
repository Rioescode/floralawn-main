export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Per Visit Service",
      price: "From $45",
      features: [
        "Snow plowing",
        "Walkway clearing",
        "24/7 availability",
        "Pay per service"
      ]
    },
    {
      name: "Monthly Contract",
      price: "From $175/month",
      features: [
        "Unlimited visits",
        "Priority service",
        "Ice management",
        "Seasonal coverage"
      ]
    },
    {
      name: "Seasonal Contract",
      price: "From $750/season",
      features: [
        "Full winter coverage",
        "Best value",
        "Guaranteed service",
        "Payment plans available"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Snow Removal",
        content: `Keep your ${name} property safe and accessible all winter with our reliable snow removal service. We provide 24/7 coverage with fast response times to ensure your property is always clear and safe.`
      },
      {
        title: "Our Services",
        content: `We offer complete winter weather management including snow plowing, sidewalk clearing, and ice control. Our team in ${name} uses professional equipment and environmentally safe materials to protect your property while ensuring safety.`
      },
      {
        title: "Commercial Services",
        content: `For businesses in ${name}, we provide comprehensive commercial snow removal services. Our team understands the importance of keeping your business accessible and safe for customers and employees. We offer custom contracts to meet your specific needs.`
      },
      {
        title: "Residential Services",
        content: `Homeowners in ${name} can rely on our prompt and thorough residential snow removal. From driveways to walkways, we ensure your property is safe and accessible. Our services include both on-demand and contract options to fit your needs.`
      },
      {
        title: "Ice Management",
        content: `Beyond snow removal, we provide professional ice management services in ${name}. We use effective de-icing products and preventive treatments to keep your property safe during winter weather events.`
      }
    ],
    pricing
  }
} 