import { google } from 'googleapis';
import { setCredentials } from './google-auth';

export async function listEvents(tokens, timeMin = new Date().toISOString()) {
  const auth = setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items;
}

export async function createEvent(tokens, eventDetails) {
  const auth = setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const { summary, description, location, startTime, endTime, attendeeEmail } = eventDetails;

  const event = {
    summary,
    location,
    description,
    start: {
      dateTime: startTime,
      timeZone: 'America/New_York', // Should be configurable
    },
    end: {
      dateTime: endTime,
      timeZone: 'America/New_York',
    },
    attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
    reminders: {
      useDefault: true,
    },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return res.data;
}
