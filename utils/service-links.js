const serviceLinks = {
  services: {
    "lawn-care": {
      title: "Lawn Care",
      path: "lawn-care",
      relatedServices: ["lawn-mowing", "yard-cleanup", "lawn-fertilization"]
    },
    "lawn-mowing": {
      title: "Lawn Mowing",
      path: "lawn-mowing",
      relatedServices: ["lawn-care", "yard-cleanup", "lawn-fertilization"]
    },
    "yard-cleanup": {
      title: "Yard Cleanup",
      path: "yard-cleanup",
      relatedServices: ["lawn-care", "lawn-mowing", "lawn-fertilization"]
    },
    "lawn-fertilization": {
      title: "Lawn Fertilization",
      path: "lawn-fertilization",
      relatedServices: ["lawn-care", "lawn-mowing", "yard-cleanup"]
    }
  },

  getRelatedServices(service, city) {
    const serviceData = this.services[service];
    if (!serviceData) return [];
    
    return serviceData.relatedServices.map(relatedService => {
      const related = this.services[relatedService];
      return {
        title: related.title,
        path: `/${city.toLowerCase().replace(/\s+/g, '-')}/${related.path}`
      };
    });
  }
};

export default serviceLinks; 