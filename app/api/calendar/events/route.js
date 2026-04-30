import { createEvent } from '@/lib/calendar';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('google_tokens');

  if (!tokenCookie) {
    return NextResponse.json({ error: 'Not connected to Google' }, { status: 401 });
  }

  try {
    const tokens = JSON.parse(tokenCookie.value);
    const body = await request.json();
    
    // Basic validation
    if (!body.summary || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: 'Missing required event details' }, { status: 400 });
    }

    const event = await createEvent(tokens, body);
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}
