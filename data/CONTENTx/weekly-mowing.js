export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Mowing",
      price: "From $35/week",
      features: [
        "Weekly mowing",
        "Edge trimming",
        "Clipping cleanup",
        "Basic service"
      ]
    },
    {
      name: "Complete Care",
      price: "From $45/week",
      features: [
        "Weekly mowing",
        "Full trimming",
        "Blowing service",
        "Debris removal"
      ]
    },
    {
      name: "Premium Service",
      price: "From $65/week",
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
        title: "Professional Lawn Mowing",
        content: `Keep your ${name} property looking its best with our professional weekly mowing service. We provide consistent, reliable care that promotes healthy grass growth and maintains your lawn's appearance.`
      },
      {
        title: "Our Mowing Process",
        content: `Our experienced team in ${name} uses professional equipment and proper mowing techniques to ensure the best results. We adjust cutting heights seasonally and alternate mowing patterns to promote even growth and prevent ruts.`
      },
      {
        title: "Complete Service",
        content: `Each mowing service in ${name} includes edge trimming around obstacles, sidewalks, and driveways. We clean up all clippings and debris, leaving your property looking neat and professional.`
      },
      {
        title: "Flexible Scheduling",
        content: `We offer flexible scheduling options for ${name} properties, including weekly, bi-weekly, and custom frequencies. Our reliable service ensures your lawn maintains a consistent, well-groomed appearance throughout the growing season.`
      },
      {
        title: "Additional Services",
        content: `Enhance your regular mowing service in ${name} with our additional lawn care services. We offer fertilization, weed control, aeration, and other treatments to keep your lawn healthy and beautiful.`
      }
    ],
    pricing
  }
} 