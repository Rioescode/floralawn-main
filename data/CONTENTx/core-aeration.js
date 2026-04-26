export function generateSeasonalContent({ name }) {
  const pricing = [
    {
      name: "Basic Aeration",
      price: "$125",
      features: [
        "Up to 5,000 sq ft",
        "Core aeration",
        "Plug removal",
        "Basic inspection"
      ]
    },
    {
      name: "Aeration Plus",
      price: "$175",
      features: [
        "Up to 10,000 sq ft",
        "Core aeration",
        "Overseeding option",
        "Soil analysis"
      ]
    },
    {
      name: "Complete Package",
      price: "$225",
      features: [
        "10,000+ sq ft",
        "Double pass aeration",
        "Fertilization included",
        "Full soil testing"
      ]
    }
  ]

  return {
    sections: [
      {
        title: "Professional Core Aeration",
        content: `Improve your ${name} lawn's health with our professional core aeration service. This essential service reduces soil compaction, allowing water, air, and nutrients to reach grass roots more effectively.`
      },
      {
        title: "The Aeration Process",
        content: `Our core aeration service in ${name} uses professional equipment to remove small plugs of soil from your lawn. This process creates pathways for essential elements to reach the root zone, promoting stronger, healthier grass growth.`
      },
      {
        title: "Benefits of Aeration",
        content: `Regular aeration in ${name} helps reduce thatch, alleviate soil compaction, and strengthen grass roots. It's particularly beneficial before overseeding and helps your lawn better absorb water and nutrients.`
      },
      {
        title: "Timing and Frequency",
        content: `For ${name} properties, we recommend core aeration during the growing season when grass can best recover and take advantage of the improved soil conditions. Most lawns benefit from annual aeration, while high-traffic areas may need it twice yearly.`
      },
      {
        title: "Additional Services",
        content: `Enhance your aeration results with our complementary services in ${name}. We offer overseeding, fertilization, and soil testing to maximize the benefits of your aeration service.`
      }
    ],
    pricing
  }
}
