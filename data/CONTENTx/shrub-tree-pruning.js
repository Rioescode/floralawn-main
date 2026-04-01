export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Pruning",
      price: "$125",
      features: [
        "Small shrubs and bushes",
        "Basic shaping",
        "Debris removal",
        "Health inspection"
      ]
    },
    {
      name: "Complete Care",
      price: "$225",
      features: [
        "Shrubs and small trees",
        "Detailed pruning",
        "Disease prevention",
        "Growth guidance"
      ]
    },
    {
      name: "Premium Service",
      price: "$375",
      features: [
        "Large trees included",
        "Expert pruning",
        "Full property service",
        "Seasonal planning"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Pruning Services",
        content: `Maintain the health and beauty of your ${name} property's trees and shrubs with our expert pruning services. We provide careful, strategic pruning to promote healthy growth and enhance your landscape's appearance.`
      },
      {
        title: "Our Pruning Process",
        content: `Our skilled team in ${name} uses professional techniques and equipment to properly shape and maintain your trees and shrubs. We focus on promoting healthy growth while maintaining the natural form of each plant.`
      },
      {
        title: "Benefits of Professional Pruning",
        content: `Regular professional pruning in ${name} helps prevent disease, removes damaged branches, and promotes healthy growth. It also helps maintain proper clearance from structures and improves the overall appearance of your landscape.`
      },
      {
        title: "Seasonal Timing",
        content: `We schedule pruning services in ${name} based on the specific needs of different plant species and seasonal timing. This ensures optimal results and minimal stress on your trees and shrubs.`
      },
      {
        title: "Tree Health Services",
        content: `Beyond pruning, we offer comprehensive tree health services in ${name}. Our experts can identify and treat potential issues, helping to maintain the long-term health and beauty of your landscape investment.`
      }
    ],
    pricing
  }
} 