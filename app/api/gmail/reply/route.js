import { sendReply } from '@/lib/gmail';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { to, subject, threadId, body, userId } = await request.json();
    
    // Auth Check
    const supabase = createRouteHandlerClient({ cookies });
    let { data: { user } } = await supabase.auth.getUser();

    if (!user && userId) {
      user = { id: userId };
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated with Supabase' }, { status: 401 });
    }

    // Get tokens
    const { data: dbTokens, error: dbError } = await supabaseAdmin
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError || !dbTokens) {
      return NextResponse.json({ error: 'Google tokens not found' }, { status: 404 });
    }

    // Send the actual email
    await sendReply(dbTokens, { to, subject, threadId, body });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reply Error:', error);
    return NextResponse.json({ error: 'Failed to send reply: ' + error.message }, { status: 500 });
  }
}
