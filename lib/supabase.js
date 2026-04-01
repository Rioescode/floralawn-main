import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug environment variables
console.log('Environment variables:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

console.log('Initializing Supabase with:', { 
  url: supabaseUrl.substring(0, 20) + '...',  // Log partial URL for security
  hasKey: !!supabaseAnonKey 
});

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a service role client for admin operations if service key is available
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Test connection
const testConnection = async () => {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth error:', authError);
    } else {
      console.log('Auth initialized:', !!session);
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (dbError) {
      console.error('Database error:', dbError.message);
    } else {
      console.log('Database connected successfully');
    }
  } catch (err) {
    console.error('Connection test failed:', err);
  }
};

testConnection(); 