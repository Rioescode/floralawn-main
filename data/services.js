export const services = {
  'lawn-care': {
    id: 'lawn-care',
    path: 'lawn-care',
    data: () => import('./services/lawn-care').then(mod => mod.generateServiceContent)
  },
  'lawn-mowing': {
    id: 'lawn-mowing',
    path: 'lawn-mowing',
    data: () => import('./services/lawn-mowing').then(mod => mod.generateServiceContent)
  },
  'yard-cleanup': {
    id: 'yard-cleanup',
    path: 'yard-cleanup',
    data: () => import('./services/yard-cleanup').then(mod => mod.generateServiceContent)
  },
  'lawn-fertilization': {
    id: 'lawn-fertilization',
    path: 'lawn-fertilization',
    data: () => import('./services/lawn-fertilization').then(mod => mod.generateServiceContent)
  }
};

// Service categories/groups
export const serviceCategories = {
  residential: {
    title: 'Residential Services',
    services: ['lawn-care', 'lawn-mowing', 'yard-cleanup', 'lawn-fertilization']
  },
  commercial: {
    title: 'Commercial Services',
    services: ['lawn-care', 'lawn-mowing', 'yard-cleanup', 'lawn-fertilization']
  }
};

// Enhanced validation to check path, id, and aliases
export const isValidService = (service) => {
  return Object.values(services).some(s => 
    s.id === service || 
    s.path === service || 
    (s.aliases && s.aliases.includes(service))
  );
};

// Helper to get service by path
export const getServiceByPath = (path) => {
  return Object.values(services).find(s => 
    s.id === path || 
    s.path === path || 
    (s.aliases && s.aliases.includes(path))
  );
};

// Helper to get canonical path
export const getCanonicalPath = (path) => {
  const service = getServiceByPath(path);
  return service ? service.path : path;
};

export default services; 