import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { chatTitle, loadYardChats, saveYardChats } from '@/lib/yardChatStore';
import { YARD_SERVICES as SERVICES } from '@/lib/yardServices';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$/;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_MESSAGES = 12;
const MAX_TEXT = 1500;

const hits = globalThis.__yardPhotoHits || new Map();
globalThis.__yardPhotoHits = hits;

function allowRequest(userId) {
  const now = Date.now();
  const recent = (hits.get(userId) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 24) return false;
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

function cleanServices(list) {
  if (!Array.isArray(list)) return [];
  const picked = [];
  list.forEach((item) => {
    const match = SERVICES.find((service) => service.toLowerCase() === String(item || '').trim().toLowerCase());
    if (match && !picked.includes(match)) picked.push(match);
  });
  return picked.slice(0, 6);
}

function cleanSuggestions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => String(item || '').replace(/\s+/g, ' ').trim().slice(0, 48))
    .filter(Boolean)
    .slice(0, 3);
}

function cleanChatId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9-]{8,80}$/.test(id) ? id : '';
}

function latestServices(messages) {
  return [...(messages || [])].reverse().find((message) => message.role === 'assistant' && message.services?.length)?.services || [];
}

function parseModelJson(text) {
  const trimmed = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function requireUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Sign in to use photo chat.' }, { status: 401 }) };
  }
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Sign in to use photo chat.' }, { status: 401 }) };
  }
  return { user };
}

function imagePart(dataUrl) {
  const match = DATA_URL.exec(String(dataUrl || '').trim());
  if (!match) return null;
  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
  return {
    type: 'image_url',
    image_url: {
      url: `data:image/${match[1]};base64,${match[2].replace(/\s/g, '')}`,
      detail: 'low',
    },
  };
}

export async function GET(request) {
  const { user, error } = await requireUser(request);
  if (error) return error;
  const saved = await loadYardChats(user.id);
  const active = saved.chats.find((chat) => chat.id === saved.activeId) || saved.chats[0] || null;
  return NextResponse.json({
    memory: saved.memory,
    activeId: active?.id || '',
    chats: saved.chats,
    messages: active?.messages || [],
    note: active?.note || '',
    services: latestServices(active?.messages),
  });
}

export async function POST(request) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const body = await request.json();
    if (body.action === 'open') {
      const chatId = cleanChatId(body.chatId);
      const saved = await loadYardChats(user.id);
      if (chatId && saved.chats.some((chat) => chat.id === chatId)) {
        await saveYardChats(user.id, { ...saved, activeId: chatId });
      }
      return NextResponse.json({ ok: true });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'Photo chat is not configured.' }, { status: 500 });
    }

    if (!allowRequest(user.id)) {
      return NextResponse.json({ error: 'Too many photo questions this hour. Try again later.' }, { status: 429 });
    }

    const images = Array.isArray(body.images) ? body.images.map(imagePart).filter(Boolean) : [];
    if (images.length > MAX_IMAGES) {
      return NextResponse.json({ error: 'Add up to 4 photos.' }, { status: 400 });
    }
    const typed = String(body.text || '').trim().slice(0, MAX_TEXT);
    const saved = await loadYardChats(user.id);
    if (!typed && images.length === 0) {
      return NextResponse.json({ error: 'Ask about the yard, or add a photo.' }, { status: 400 });
    }

    const chatId = cleanChatId(body.chatId) || crypto.randomUUID();
    let chat = saved.chats.find((item) => item.id === chatId);
    if (!chat) {
      chat = { id: chatId, title: 'New chat', note: '', messages: [], updatedAt: new Date().toISOString() };
      saved.chats.unshift(chat);
    }

    const spoken = typed || 'Sent photos of the yard.';
    const thread = [...chat.messages, { role: 'user', content: spoken, at: new Date().toISOString() }];
    const recent = thread.slice(-MAX_MESSAGES);
    const modelMessages = recent.slice(0, -1).map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || '').slice(0, MAX_TEXT),
    }));
    const askText = typed || 'The customer sent photos. Use what you already know about them and say which quotes fit. Do not ask them to repeat details you already have.';
    modelMessages.push(images.length
      ? { role: 'user', content: [{ type: 'text', text: askText }, ...images] }
      : { role: 'user', content: askText });

    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
    const address = String(body.address || '').trim().slice(0, 200);
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-flash',
        temperature: 0.3,
        max_tokens: 900,
        thinking: { type: 'disabled' },
        messages: [
          {
            role: 'system',
            content: `You are the Flora Lawn yard chat for Rhode Island and Massachusetts. You already know this customer. Name: ${name}. Email: ${user.email || 'unknown'}. Address: ${address || 'not on file'}. What you already know, do not ask again: ${saved.memory || 'nothing yet'}. Answer their latest question first, in the same language they used. Keep "reply" short: at most 4 short lines, with a blank line between points. Do not write a long paragraph. Only write a longer reply if they ask for more detail, a full explanation, or say "tell me more". If it is about the yard work, the photos, a service, a visit, or a quote, answer that. Use the photos only to support the answer. A person or crew in a photo is still the yard. Someone mowing is Lawn Mowing. Hedges, bushes, or shrubs are Hedge Trimming. If you say a service can be added, include that exact name in "services". Leaves are Leaf Removal or Fall Cleanup. Junk is Junk Removal. A dirty driveway or siding is Power Washing. Snow is Snow Removal. Put fitting services in "services", only from: ${SERVICES.join(', ')}. If the question is not about the yard work, say this chat is only for the yard job. You are an AI, not a person on the crew. Never give a dollar amount. If they ask the price, say the office confirms it before any work is booked. Never say the photo is not their yard. Do not identify faces. Write "note" in English: one short crew note from this chat only. Write "memory" in English: one short paragraph of facts to remember next time, keeping old facts and adding new ones from this chat and the photos. Add "suggestions": exactly 2 short replies the customer can tap next, each under 6 words, in their language, about this yard. No prices. Return only JSON: {"reply":"answer","services":["exact names or empty"],"suggestions":["short reply","short reply"],"note":"crew note","memory":"facts to remember"}`,
          },
          ...modelMessages,
        ],
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.error?.message || response.statusText;
      console.error('DeepSeek yard photo error:', response.status, detail);
      return NextResponse.json({ error: 'The photo reader is busy. Try again in a moment.' }, { status: 502 });
    }

    const text = payload?.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = parseModelJson(text);
    } catch {
      parsed = null;
    }
    const reply = String(parsed?.reply || text || '').trim().slice(0, 1200);
    if (!reply) {
      return NextResponse.json({ error: 'No recommendation came back. Try another photo.' }, { status: 502 });
    }

    const note = String(parsed?.note || chat.note || '').trim().slice(0, 600);
    const services = cleanServices(parsed?.services);
    if (/hedge|bush|shrub/i.test(reply) && !services.includes('Hedge Trimming')) services.push('Hedge Trimming');
    const suggestions = cleanSuggestions(parsed?.suggestions);
    const nextSuggestions = suggestions.length ? suggestions : ['Tell me more', 'What should we do next?'];
    const memory = String(parsed?.memory || saved.memory || '').trim().slice(0, 1200);
    const messages = [...thread, {
      role: 'assistant',
      content: reply,
      services,
      suggestions: nextSuggestions,
      at: new Date().toISOString(),
    }];
    chat.messages = messages;
    chat.note = note;
    chat.title = chatTitle(messages);
    chat.updatedAt = new Date().toISOString();
    await saveYardChats(user.id, { memory, chats: saved.chats, activeId: chat.id });
    return NextResponse.json({
      reply,
      services,
      suggestions: nextSuggestions,
      note,
      memory,
      messages,
      chatId: chat.id,
      title: chat.title,
    });
  } catch (error) {
    console.error('Yard photo chat failed:', error?.message || error);
    return NextResponse.json({ error: 'Could not read those photos.' }, { status: 500 });
  }
}
