import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safe localStorage access for mobile browsers
const getStorage = () => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    // Test if localStorage is available and accessible
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch (e) {
    // localStorage not available (e.g., in private browsing mode or insecure context)
    console.warn('localStorage not available, using memory storage');
    return undefined;
  }
};

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'flora-lawn-auth',
    storage: getStorage(),
    flowType: 'pkce', // Use PKCE flow for better security
  },
  global: {
    headers: {
      'X-Flora-Client': 'flora-lawn-web',
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options); 