import { getTokensFromCode } from '@/lib/google-auth';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/admin/emails?error=no_code', request.url));
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    // Get current user from Supabase to link tokens to them
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('User not authenticated via Supabase:', authError);
      return NextResponse.redirect(new URL('/admin/emails?error=not_authenticated', request.url));
    }

    // Store tokens in Supabase google_tokens table
    const { error: dbError } = await supabase
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
      console.error('Failed to store tokens in Supabase:', dbError);
      throw dbError;
    }

    // Set a session cookie for immediate access
    const cookieStore = cookies();
    cookieStore.set('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return NextResponse.redirect(new URL('/admin/emails?connected=true', request.url));
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    return NextResponse.redirect(new URL('/admin/emails?error=auth_failed', request.url));
  }
}
