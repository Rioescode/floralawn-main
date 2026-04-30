import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  try {
    const { userId, eventId, summary, location, description, startTime, endTime } = await request.json();

    if (!userId || !eventId || !summary || !startTime) {
      return NextResponse.json({ error: 'Missing required update fields' }, { status: 400 });
    }

    const { data: dbTokens } = await supabaseAdmin
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!dbTokens) return NextResponse.json({ error: 'Not connected' }, { status: 404 });

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

    const event = {
      summary,
      location,
      description,
      start: { dateTime: new Date(startTime).toISOString() },
      end: { dateTime: new Date(endTime || new Date(startTime).getTime() + 3600000).toISOString() },
    };

    const res = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return NextResponse.json({ success: true, event: res.data });
  } catch (error) {
    console.error('Calendar Update Error:', error);
    const errorMessage = error.response?.data?.error_description || error.errors?.[0]?.message || error.message;
    return NextResponse.json({ error: `Google Update Refusal: ${errorMessage}` }, { status: 500 });
  }
}
