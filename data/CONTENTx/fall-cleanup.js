export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Cleanup",
      price: "$175",
      features: [
        "Leaf removal",
        "Lawn debris cleanup",
        "Basic yard waste removal",
        "Single visit service"
      ]
    },
    {
      name: "Complete Cleanup",
      price: "$275",
      features: [
        "Multiple visits",
        "Full property cleanup",
        "Gutter cleaning",
        "Debris hauling"
      ]
    },
    {
      name: "Premium Package",
      price: "$375",
      features: [
        "Season-long service",
        "Weekly leaf removal",
        "Complete property care",
        "Winter prep included"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Fall Cleanup",
        content: `Keep your ${name} property looking pristine with our comprehensive fall cleanup services. We handle everything from leaf removal to winter preparation, ensuring your yard stays healthy and attractive throughout the season.`
      },
      {
        title: "Our Cleanup Process",
        content: `Our thorough process includes complete leaf removal, lawn debris cleanup, garden bed cleaning, and proper disposal of all yard waste. We use professional equipment to ensure efficient and complete cleanup of your ${name} property.`
      },
      {
        title: "Additional Services",
        content: `Beyond basic cleanup, we offer gutter cleaning, lawn aeration, and winter preparation services. Our team in ${name} can customize a cleanup package that meets your specific needs and property requirements.`
      },
      {
        title: "Why Choose Professional Service",
        content: `Save time and protect your property with our expert fall cleanup service. Our trained team in ${name} has the equipment and expertise to handle properties of any size. We ensure thorough cleanup while protecting your lawn and landscape investments.`
      }
    ],
    pricing
  }
} 