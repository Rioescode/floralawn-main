import { google } from 'googleapis';
import { setCredentials } from './google-auth';

export async function listMessages(tokens, maxResults = 25, pageToken = null) {
  const auth = setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Fetch Threads instead of individual messages
  const res = await gmail.users.threads.list({
    userId: 'me',
    maxResults,
    pageToken
  });

  if (!res.data.threads) return { messages: [], nextPageToken: null };

  // 2. Fetch details for each thread
  const threads = await Promise.all(
    res.data.threads.map(async (t) => {
      const threadDetail = await gmail.users.threads.get({
        userId: 'me',
        id: t.id,
      });

      const messages = threadDetail.data.messages.map(formatMessage);
      const latestMsg = messages[messages.length - 1];

      return {
        id: t.id,
        messages: messages,
        subject: latestMsg.subject,
        from: latestMsg.from,
        date: latestMsg.date,
        snippet: latestMsg.snippet,
        threadId: t.id
      };
    })
  );

  return { 
    messages: threads, 
    nextPageToken: res.data.nextPageToken || null 
  };
}

export async function getMessage(tokens, id) {
  const auth = setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.get({
    userId: 'me',
    id,
  });

  return formatMessage(res.data);
}

export async function sendReply(tokens, { to, subject, threadId, body }) {
  const auth = setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth });

  // Simple email formatting for Gmail API
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    '',
    body,
  ];
  const message = messageParts.join('\n');

  // The body needs to be base64url encoded
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
      threadId,
    },
  });
}

function formatMessage(msg) {
  const headers = msg.payload.headers;
  const getHeader = (name) => headers.find((h) => h.name === name)?.value;

  // Extracting plain text snippet or full body
  let snippet = msg.snippet;
  let body = '';

  if (msg.payload.parts) {
    const textPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString();
    }
  } else if (msg.payload.body.data) {
    body = Buffer.from(msg.payload.body.data, 'base64').toString();
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: getHeader('From'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    snippet,
    body: body || snippet,
    labels: msg.labelIds,
  };
}
