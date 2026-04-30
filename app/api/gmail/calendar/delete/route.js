import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, eventId, action } = await request.json();

    if (action !== 'delete' || !userId || !eventId) {
      return NextResponse.json({ error: 'Invalid delete request' }, { status: 400 });
    }

    const { data: dbTokens } = await supabaseAdmin
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!dbTokens) return NextResponse.json({ error: 'No stored credentials found' }, { status: 404 });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: dbTokens.access_token,
      refresh_token: dbTokens.refresh_token,
      expiry_date: dbTokens.expiry_date,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Explicitly delete using the ID sent in the secure data package
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar Delete Error:', error);
    const errorMessage = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: `Google Refusal: ${errorMessage}` }, { status: 500 });
  }
}
