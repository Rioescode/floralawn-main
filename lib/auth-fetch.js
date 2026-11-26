import { supabase } from '@/lib/supabase';

// fetch() that sends the signed-in user's Supabase access token, for API
// routes that check auth with lib/api-auth.js.
export async function authFetch(url, options = {}) {
  let token = '';
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || '';
  } catch (error) {
    console.error('Could not read the session:', error);
  }
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
