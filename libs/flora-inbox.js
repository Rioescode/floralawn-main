import config from '@/config';
import { sendEmail } from '@/libs/resend';

export const FLORA_AGENT_ID = 'agent_6201m84xpezvfsctcgkasw8cx0hm';
export const FLORA_INBOX = config.resend.supportEmail || 'floralawncareri@gmail.com';

export function formatEastern(unixSeconds) {
  const date = Number.isFinite(unixSeconds) ? new Date(unixSeconds * 1000) : new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function subjectPiece(value, fallback) {
  const clean = String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (clean || fallback).slice(0, 80);
}

export function sendToInbox({ subject, text, html, replyTo, type }) {
  return sendEmail({
    to: FLORA_INBOX,
    subject,
    text,
    html,
    replyTo,
    type,
    recipientName: 'Flora Lawn',
  });
}
