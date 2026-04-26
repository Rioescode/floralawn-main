export const businessInfo = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Flora Lawn & Landscaping Inc',
  email: 'esckoofficial@gmail.com',
  phone: '(401) 389-0913',
  address: {
    street: '45 Vernon St',
    city: 'Pawtucket',
    state: 'RI',
    zip: '02860'
  },
  hours: {
    monday: '7:00 AM - 6:00 PM',
    tuesday: '7:00 AM - 6:00 PM',
    wednesday: '7:00 AM - 6:00 PM',
    thursday: '7:00 AM - 6:00 PM',
    friday: '7:00 AM - 6:00 PM',
    saturday: '8:00 AM - 4:00 PM',
    sunday: 'Closed'
  },
  social: {
    facebook: 'https://facebook.com/floralawnandlandscaping',
    instagram: 'https://instagram.com/floralawnandlandscaping',
  },
  services: {
    residential: [
      "Furniture Removal",
      "Appliance Removal",
      "Estate Cleanouts",
      "Yard Debris Removal",
      "Basement Cleanouts",
      "Garage Cleanouts"
    ],
    commercial: [
      "Office Cleanouts",
      "Construction Debris",
      "Property Cleanouts",
      "Warehouse Cleanouts"
    ]
  },
  areas: [
    "Providence",
    "Warwick",
    "Cranston",
    "Pawtucket",
    "East Providence",
    "Woonsocket",
    "Newport"
  ],
  description: "Flora Lawn & Landscaping Inc is Rhode Island's premier provider of professional lawn care, landscaping, and property maintenance. Based in Pawtucket, we serve homeowners across RI and SE Massachusetts with reliable, high-quality outdoor services.",
  shortDescription: "Rhode Island's trusted lawn care & landscaping experts"
};

export default businessInfo; 