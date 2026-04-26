import serviceLinks from "@/utils/service-links";

export const cities = [
  // Providence County
  {
    city: "Providence",
    county: "Providence County",
    population: 190934,
    neighborhoods: ["Downtown", "East Side", "South Providence", "West End", "Elmhurst", "Federal Hill", "Fox Point", "Hope", "Mount Hope", "Mount Pleasant", "Olneyville", "Valley", "Wanskuck", "Washington Park"],
    zipCodes: ["02903", "02904", "02905", "02906", "02907", "02908", "02909", "02912"]
  },
  {
    city: "Cranston",
    county: "Providence County",
    population: 82934,
    neighborhoods: ["Auburn", "Eden Park", "Garden City", "Dean Estates", "Oaklawn", "Stadium", "Stone Hill", "Garden Hills"],
    zipCodes: ["02910", "02920", "02921"]
  },
  {
    city: "Pawtucket",
    county: "Providence County",
    population: 75604,
    neighborhoods: ["Fairlawn", "Oak Hill", "Pleasant View", "Woodlawn", "Darlington", "Quality Hill"],
    zipCodes: ["02860", "02861", "02862"]
  },
  {
    city: "Central Falls",
    county: "Providence County",
    population: 22583,
    neighborhoods: ["Central Business District", "Historic District", "Roosevelt Avenue"],
    zipCodes: ["02863"]
  },
  {
    city: "Woonsocket",
    county: "Providence County",
    population: 43240,
    neighborhoods: ["Globe", "Social", "Bernon", "North End", "Fairmount"],
    zipCodes: ["02895"]
  },
  {
    city: "Cumberland",
    county: "Providence County",
    population: 34927,
    neighborhoods: ["Valley Falls", "Cumberland Hill", "Berkeley", "Diamond Hill"],
    zipCodes: ["02864"]
  },
  {
    city: "North Providence",
    county: "Providence County",
    population: 32078,
    neighborhoods: ["Centredale", "Fruit Hill", "Greystone", "Marieville"],
    zipCodes: ["02904", "02908", "02911"]
  },
  {
    city: "Johnston",
    county: "Providence County",
    population: 29568,
    neighborhoods: ["Graniteville", "Thornton", "Morgan Mills"],
    zipCodes: ["02919"]
  },
  {
    city: "Lincoln",
    county: "Providence County",
    population: 21105,
    neighborhoods: ["Albion", "Lonsdale", "Manville", "Saylesville"],
    zipCodes: ["02865"]
  },
  {
    city: "Smithfield",
    county: "Providence County",
    population: 21430,
    neighborhoods: ["Esmond", "Georgiaville", "Greenville"],
    zipCodes: ["02828", "02917"]
  },

  // Kent County
  {
    city: "Warwick",
    county: "Kent County",
    population: 82823,
    neighborhoods: ["Apponaug", "Oakland Beach", "Cowesett", "Potowomut", "Warwick Neck", "Governor Francis", "Greenwood", "Norwood", "Lakewood"],
    zipCodes: ["02886", "02887", "02888", "02889"]
  },
  {
    city: "West Warwick",
    county: "Kent County",
    population: 29191,
    neighborhoods: ["Arctic", "Phenix", "Crompton", "Centreville", "Lippitt"],
    zipCodes: ["02893"]
  },
  {
    city: "Coventry",
    county: "Kent County",
    population: 35014,
    neighborhoods: ["Anthony", "Washington", "Quidnick", "Harris"],
    zipCodes: ["02816"]
  },
  {
    city: "East Greenwich",
    county: "Kent County",
    population: 13146,
    neighborhoods: ["Hill District", "Waterfront", "Main Street"],
    zipCodes: ["02818"]
  },

  // Washington County
  {
    city: "North Kingstown",
    county: "Washington County",
    population: 26326,
    neighborhoods: ["Wickford", "Quidnessett", "Saunderstown", "Hamilton"],
    zipCodes: ["02852", "02874"]
  },
  {
    city: "South Kingstown",
    county: "Washington County",
    population: 30639,
    neighborhoods: ["Peace Dale", "Wakefield", "Kingston", "Matunuck"],
    zipCodes: ["02879", "02881", "02883"]
  },
  {
    city: "Westerly",
    county: "Washington County",
    population: 22787,
    neighborhoods: ["Watch Hill", "Misquamicut", "Bradford", "Downtown"],
    zipCodes: ["02891"]
  },
  {
    city: "Narragansett",
    county: "Washington County",
    population: 15868,
    neighborhoods: ["Narragansett Pier", "Point Judith", "Bonnet Shores", "Galilee"],
    zipCodes: ["02882"]
  },
  {
    city: "Charlestown",
    county: "Washington County",
    population: 7827,
    neighborhoods: ["Charlestown Beach", "Quonochontaug", "Cross Mills"],
    zipCodes: ["02813"]
  },

  // Newport County
  {
    city: "Newport",
    county: "Newport County",
    population: 24334,
    neighborhoods: ["The Point", "Historic Hill", "Broadway", "Fifth Ward"],
    zipCodes: ["02840", "02841"]
  },
  {
    city: "Middletown",
    county: "Newport County",
    population: 16150,
    neighborhoods: ["Easton's Point", "Aquidneck", "Newport State Airport Area"],
    zipCodes: ["02842"]
  },
  {
    city: "Portsmouth",
    county: "Newport County",
    population: 17389,
    neighborhoods: ["Island Park", "Common Fence Point", "Melville"],
    zipCodes: ["02871"]
  },
  {
    city: "Tiverton",
    county: "Newport County",
    population: 15780,
    neighborhoods: ["North Tiverton", "Stone Bridge", "Four Corners"],
    zipCodes: ["02878"]
  },

  // Bristol County
  {
    city: "Bristol",
    county: "Bristol County",
    population: 22493,
    neighborhoods: ["Downtown", "Bristol Harbor", "Poppasquash"],
    zipCodes: ["02809"]
  },
  {
    city: "Barrington",
    county: "Bristol County",
    population: 16310,
    neighborhoods: ["Hampden Meadows", "Nayatt Point", "Rumstick Point"],
    zipCodes: ["02806"]
  },
  {
    city: "Warren",
    county: "Bristol County",
    population: 10611,
    neighborhoods: ["Touisset", "Market Street", "Water Street"],
    zipCodes: ["02885"]
  },

  // Add Massachusetts cities
  {
    city: "Attleboro",
    county: "Bristol County, MA",
    state: "MA",
    zip: "02703",
    population: 45237,
    description: "Attleboro is a city in Bristol County, Massachusetts, located about 10 miles northeast of Providence, Rhode Island. Known for its history in jewelry manufacturing, Attleboro offers a mix of suburban neighborhoods and commercial areas with well-maintained properties.",
    lawnChallenges: [
      "Hot, humid summers requiring frequent mowing",
      "Clay-heavy soils in some neighborhoods",
      "Diverse property types from small lots to larger estates"
    ]
  },
  {
    city: "North Attleboro",
    county: "Bristol County, MA",
    state: "MA",
    zip: "02760",
    population: 30025,
    description: "North Attleboro is a town in Bristol County, Massachusetts, bordering Rhode Island. With its suburban character and mix of residential neighborhoods, North Attleboro homeowners take pride in their property maintenance.",
    lawnChallenges: [
      "Variable soil conditions across neighborhoods",
      "Seasonal temperature fluctuations",
      "Mix of new developments and established properties"
    ]
  },
  {
    city: "Seekonk",
    county: "Bristol County, MA",
    state: "MA",
    zip: "02771",
    population: 15365,
    description: "Seekonk is a town in Bristol County, Massachusetts, directly bordering East Providence, Rhode Island. With its suburban setting and larger residential lots, Seekonk properties often feature extensive lawn areas requiring regular maintenance.",
    lawnChallenges: [
      "Larger property sizes requiring extensive maintenance",
      "Proximity to wetlands in some areas",
      "Mix of sun and shade conditions"
    ]
  },
  {
    city: "Rehoboth",
    county: "Bristol County, MA",
    state: "MA",
    zip: "02769",
    population: 12502,
    description: "Rehoboth is a rural town in Bristol County, Massachusetts, known for its open spaces and larger properties. With many homes on acreage, Rehoboth residents often require comprehensive lawn and property maintenance services.",
    lawnChallenges: [
      "Large properties with extensive lawn areas",
      "Rural setting with natural landscape integration",
      "Wildlife management considerations"
    ]
  },
  {
    city: "Plainville",
    county: "Norfolk County, MA",
    state: "MA",
    zip: "02762",
    population: 9945,
    description: "Plainville is a small town in Norfolk County, Massachusetts, located between Boston and Providence. With its mix of suburban neighborhoods and commercial areas, Plainville properties feature well-maintained lawns and landscapes.",
    lawnChallenges: [
      "New development areas with establishing lawns",
      "Varied soil conditions",
      "Seasonal New England weather challenges"
    ]
  },
  {
    city: "Wrentham",
    county: "Norfolk County, MA",
    state: "MA",
    zip: "02093",
    population: 12178,
    description: "Wrentham is a town in Norfolk County, Massachusetts, known for its premium outlet shopping and scenic residential areas. With a mix of historic homes and newer developments, Wrentham properties require attentive lawn care and landscaping.",
    lawnChallenges: [
      "Historic properties with established landscapes",
      "Newer developments with young lawns",
      "Seasonal maintenance requirements"
    ]
  },
  // === NEW: Missing RI municipalities ===
  {
    city: "East Providence",
    county: "Providence County",
    population: 47139,
    neighborhoods: ["Riverside", "Rumford", "East Providence Center", "Phillipsdale", "Watchemoket"],
    zipCodes: ["02914", "02915", "02916"],
    description: "East Providence is a vibrant city with diverse residential areas, from the historic charm of Rumford to the coastal beauty of Riverside. Properties in East Providence range from classic neighborhood lots to expansive waterfront estates, each requiring tailored lawn care approach.",
    lawnChallenges: [
      "Coastal salt air affecting plant health in Riverside",
      "Varying terrain from flat lots to steeped banks",
      "Established landscapes with mature root systems"
    ]
  },
  {
    city: "Scituate",
    county: "Providence County",
    population: 10592,
    neighborhoods: ["North Scituate", "Hope", "Chopmist Hill", "Potterville"],
    zipCodes: ["02857"],
    description: "Scituate is a picturesque town known for its rural character and the expansive Scituate Reservoir. Homes in Scituate often feature larger lot sizes and natural landscapes that require professional maintenance to balance beauty with the surrounding environment.",
    lawnChallenges: [
      "Large property sizes requiring comprehensive maintenance",
      "Protecting local water quality near the reservoir",
      "Rural terrain with varied soil profiles"
    ]
  },
  {
    city: "Burrillville",
    county: "Providence County",
    population: 16158,
    neighborhoods: ["Harrisville", "Pascoag", "Oakland", "Wallum Lake"],
    zipCodes: ["02830", "02859"],
    description: "Burrillville is a historic town in Northwest Rhode Island with a rich history of textile manufacturing. Today, it offers a peaceful rural-suburban atmosphere with many homes nestled among woods and lakes, making professional lawn care essential for manageable outdoor spaces.",
    lawnChallenges: [
      "Shade management in heavily wooded areas",
      "Soil acidity from pine and oak forests",
      "Maintaining lawns on uneven, stony ground"
    ]
  },
  {
    city: "Glocester",
    county: "Providence County",
    population: 10063,
    neighborhoods: ["Chepachet", "Harmony", "West Glocester"],
    zipCodes: ["02814", "02829"],
    description: "Glocester is an quintessential New England town, famous for the historic village of Chepachet. Its properties are typically larger and rural, often featuring stone walls and established landscapes that benefit from expert landscaping and seasonal cleanups.",
    lawnChallenges: [
      "Large acreages with extensive grass areas",
      "Invasive species management in rural settings",
      "Protecting lawns during harsh Northwest RI winters"
    ]
  },
  {
    city: "Foster",
    county: "Providence County",
    population: 4606,
    neighborhoods: ["Foster Center", "Moosup Valley", "South Foster"],
    zipCodes: ["02825"],
    description: "Foster is one of the most rural towns in Rhode Island, characterized by its rolling hills and high elevations. Properties here often integrate with the natural forest and require specialized care to maintain healthy turf in a rugged environment.",
    lawnChallenges: [
      "Managing moisture in higher elevation terrain",
      "Soil nutrient density in forest-adjacent lots",
      "Shortened growing seasons due to elevation"
    ]
  },
  {
    city: "North Smithfield",
    county: "Providence County",
    population: 12402,
    neighborhoods: ["Slatersville", "Union Village", "Forestdale"],
    zipCodes: ["02876", "02896"],
    description: "North Smithfield combines suburban neighborhoods like Slatersville with more rural escapes. Homeowners here take great pride in their properties, seeking consistent and professional lawn maintenance to keep their landscapes looking sharp year-round.",
    lawnChallenges: [
      "Varying lot sizes from dense suburban to rural",
      "Managing diverse grass types on older properties",
      "Seasonal leaf accumulation from mature trees"
    ]
  },
  {
    city: "West Greenwich",
    county: "Kent County",
    population: 6135,
    neighborhoods: ["West Greenwich Center", "Nooseneck Hill"],
    zipCodes: ["02817"],
    description: "West Greenwich is known for its open space and many parks. Properties in this town are generally spacious, with home sites often surrounded by nature, requiring a balance of manicured lawn and natural landscape management.",
    lawnChallenges: [
      "Large perimeters requiring significant edging",
      "Adapting to the sandy soil common in South County",
      "Wildlife protection and repellent integration"
    ]
  },
  {
    city: "Exeter",
    county: "Washington County",
    population: 6460,
    neighborhoods: ["Exeter Center", "Wyoming"],
    zipCodes: ["02822"],
    description: "Exeter is a rural town in South County with a strong agricultural heritage. Residential properties often feature substantial lawn space and garden beds that require professional expertise to maintain throughout the New England seasons.",
    lawnChallenges: [
      "Soil compaction in former agricultural zones",
      "Managing large open spaces prone to wind exposure",
      "Seasonal weed control in rural environments"
    ]
  },
  {
    city: "Hopkinton",
    county: "Washington County",
    population: 8188,
    neighborhoods: ["Ashaway", "Hope Valley", "Hopkinton City"],
    zipCodes: ["02804", "02832"]
  },
  {
    city: "Richmond",
    county: "Washington County",
    population: 7708,
    neighborhoods: ["Carolina", "Shannock", "Wyoming"],
    zipCodes: ["02812", "02892"],
    description: "Richmond is a scenic town with many rivers and outdoor recreational opportunities. Its suburban neighborhoods and rural properties are perfect for families who enjoy their outdoor spaces, making high-quality lawn care a top priority.",
    lawnChallenges: [
      "Moisture management near local river plains",
      "Established suburban lot maintenance",
      "Balancing lawn health with eco-friendly practices"
    ]
  },
  {
    city: "Little Compton",
    county: "Newport County",
    population: 3492,
    neighborhoods: ["Little Compton Commons", "Sakonnet Point", "Adamsville"],
    zipCodes: ["02837"],
    description: "Little Compton is a uniquely beautiful coastal community with a strong sense of history. Its properties range from historic colonial farms to stunning coastal estates, all requiring the highest level of detail in landscaping and maintenance.",
    lawnChallenges: [
      "Intense coastal salt spray and wind",
      "Historic landscape preservation",
      "Strict environmental and aesthetic standards"
    ]
  },
  {
    city: "Jamestown",
    county: "Newport County",
    population: 5622,
    neighborhoods: ["Jamestown Village", "Dutch Island", "Beavertail"],
    zipCodes: ["02835"],
    description: "Jamestown, located on Conanicut Island, offers stunning Narragansett Bay views. Island properties here face unique environmental factors, requiring specialized knowledge to maintain healthy, resilient lawns and gardens.",
    lawnChallenges: [
      "Island soil composition and salinity",
      "Exposure to high winds and salt air",
      "Water conservation and moisture management"
    ]
  },
  {
    city: "New Shoreham",
    county: "Washington County",
    population: 1051,
    neighborhoods: ["Old Harbor", "New Harbor", "Block Island"],
    zipCodes: ["02807"],
    description: "New Shoreham (Block Island) is a world-class destination with fragile island ecosystems. Maintaining a property on Block Island requires a careful touch and expert knowledge of coastal-hearty plant species and lawn health.",
    lawnChallenges: [
      "Extreme island weather conditions",
      "Fragile ecosystem and environmental restrictions",
      "Resource management on a remote island"
    ]
  }
]; 