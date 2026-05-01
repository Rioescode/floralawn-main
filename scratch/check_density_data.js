const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDensity() {
  const { data, error } = await supabase
    .from('customers')
    .select('city');
  
  if (error) {
    console.error(error);
    return;
  }
  
  const cities = {};
  data.forEach(c => {
    if (c.city) {
      const city = c.city.trim().toLowerCase();
      cities[city] = (cities[city] || 0) + 1;
    }
  });
  
  console.log(JSON.stringify(cities, null, 2));
}

checkDensity();
