import { getTokensFromCode } from '@/lib/google-auth';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('No code provided in Google callback');
    return NextResponse.redirect(new URL('/admin/emails?error=no_code', request.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    const { searchParams } = new URL(request.url);
    const stateUserId = searchParams.get('state'); // This is the userId we passed
    
    // Get current user from Supabase using the standard client (browser cookie)
    const supabase = createRouteHandlerClient({ cookies });
    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // FALLBACK: If cookie auth failed, use the userId from the state
    if (!user && stateUserId) {
      console.log('Using fallback userId from state:', stateUserId);
      user = { id: stateUserId };
    }

    if (!user) {
      console.error('Auth error or no user in callback. Auth Error:', authError);
      return NextResponse.redirect(new URL('/admin/emails?error=not_authenticated', request.url));
    }

    console.log('Handshaking for user:', user.email);

    // Store tokens in Supabase using the ADMIN client to avoid RLS hurdles
    const { error: dbError } = await supabaseAdmin
      .from('google_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Failed to store tokens in DB:', dbError);
      return NextResponse.redirect(new URL('/admin/emails?error=db_save_failed', request.url));
    }

    console.log('Successfully saved Google tokens for:', user.email);

    return NextResponse.redirect(new URL('/admin/emails?connected=true', request.url));
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    return NextResponse.redirect(new URL('/admin/emails?error=auth_failed&details=' + encodeURIComponent(error.message), request.url));
  }
}
