import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Server-side auth for API routes. The browser keeps the Supabase session in
// localStorage, so pages send it as "Authorization: Bearer <access token>"
// (see lib/auth-fetch.js). Admin is the same rule the admin pages use:
// profiles.role === 'admin' or the owner email.

const OWNER_EMAILS = ['esckoofficial@gmail.com'];

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

export async function getRequestUser(request) {
  const token = bearerToken(request);
  if (!token) return null;
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (error) {
    console.error('Auth check failed:', error?.message || error);
    return null;
  }
}

export async function isAdminUser(user) {
  if (!user) return false;
  const email = String(user.email || '').toLowerCase().trim();
  if (OWNER_EMAILS.includes(email)) return true;
  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return data?.role === 'admin';
}

// Returns { user } when the caller is signed in, otherwise { response } with a 401.
export async function requireUser(request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: 'Please sign in first.' }, { status: 401 }) };
  }
  return { user, isAdmin: await isAdminUser(user) };
}

// Returns { user } for admins, otherwise { response } with a 401 or 403.
export async function requireAdmin(request) {
  const user = await getRequestUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  if (!(await isAdminUser(user))) {
    return { response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { user, isAdmin: true };
}
