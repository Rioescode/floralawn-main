import { google } from 'googleapis';
import { setCredentials } from '@/lib/google-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 });

  try {
    const { data: dbTokens } = await supabaseAdmin
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!dbTokens) return NextResponse.json({ error: 'Not connected' }, { status: 404 });

    const tokens = {
      access_token: dbTokens.access_token,
      refresh_token: dbTokens.refresh_token,
      expiry_date: dbTokens.expiry_date,
    };

    const auth = setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 15,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json({ events: res.data.items || [] });
  } catch (error) {
    console.error('Calendar Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
