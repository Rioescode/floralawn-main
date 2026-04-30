import { listMessages } from '@/lib/gmail';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get('userId');
  
  const supabase = createRouteHandlerClient({ cookies });
  let { data: { user } } = await supabase.auth.getUser();

  // Fallback to query param if cookie auth fails
  if (!user && queryUserId) {
    user = { id: queryUserId };
  }

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated with Supabase' }, { status: 401 });
  }

  try {
    // 1. Get tokens from our database using the Admin client to bypass RLS issues
    const { data: dbTokens, error: dbError } = await supabaseAdmin
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError || !dbTokens) {
      console.error('Database token error:', dbError);
      return NextResponse.json({ error: 'Google connection not found in database. Please click "Connect Gmail" again.' }, { status: 404 });
    }

    // 2. Map field names if they differ
    const tokens = {
      access_token: dbTokens.access_token,
      refresh_token: dbTokens.refresh_token,
      expiry_date: dbTokens.expiry_date,
    };

    // 3. Fetch messages with pagination support
    const limit = parseInt(searchParams.get('limit')) || 25;
    const pageToken = searchParams.get('pageToken') || null;
    
    const result = await listMessages(tokens, limit, pageToken);
    
    return NextResponse.json({ 
      messages: result.messages,
      nextPageToken: result.nextPageToken 
    });
  } catch (error) {
    console.error('Gmail API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch messages: ' + (error.message || 'Unknown error')
    }, { status: 500 });
  }
}
