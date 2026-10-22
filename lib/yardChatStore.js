import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'yard-chats';
const MAX_STORED = 40;
const MAX_CHATS = 12;

export function chatTitle(messages) {
  const first = (messages || []).find((message) => message.role === 'user' && message.content);
  const text = String(first?.content || 'New chat').replace(/\s+/g, ' ').trim();
  if (!text) return 'New chat';
  return text.length > 42 ? `${text.slice(0, 41)}…` : text;
}

function emptyStore() {
  return { memory: '', chats: [], activeId: '' };
}

function cleanMessage(message) {
  return {
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: String(message.content || '').slice(0, 1500),
    services: Array.isArray(message.services) ? message.services.slice(0, 6) : [],
    suggestions: Array.isArray(message.suggestions)
      ? message.suggestions.map((item) => String(item || '').replace(/\s+/g, ' ').trim().slice(0, 48)).filter(Boolean).slice(0, 3)
      : [],
    at: message.at || new Date().toISOString(),
  };
}

function cleanChat(chat) {
  const messages = (chat.messages || []).slice(-MAX_STORED).map(cleanMessage);
  return {
    id: String(chat.id || crypto.randomUUID()),
    title: chatTitle(messages),
    note: String(chat.note || '').slice(0, 600),
    updatedAt: chat.updatedAt || new Date().toISOString(),
    messages,
  };
}

function fromParsed(parsed) {
  if (Array.isArray(parsed?.chats)) {
    const chats = parsed.chats.map(cleanChat).filter((chat) => chat.messages.length).slice(0, MAX_CHATS);
    const activeId = chats.some((chat) => chat.id === parsed.activeId) ? parsed.activeId : (chats[0]?.id || '');
    return {
      memory: String(parsed.memory || '').slice(0, 1200),
      chats,
      activeId,
    };
  }
  const messages = Array.isArray(parsed?.messages) ? parsed.messages : [];
  if (!messages.length && !parsed?.memory && !parsed?.note) return emptyStore();
  const chat = cleanChat({
    id: 'main',
    note: parsed?.note || '',
    messages,
    updatedAt: messages[messages.length - 1]?.at,
  });
  return {
    memory: String(parsed?.memory || '').slice(0, 1200),
    chats: chat.messages.length ? [chat] : [],
    activeId: chat.messages.length ? chat.id : '',
  };
}

async function ensureBucket() {
  if (!supabaseAdmin) return false;
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) return true;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  return !error;
}

async function readJson(userId) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(`${userId}.json`);
  if (error || !data) return null;
  const text = typeof data.text === 'function' ? await data.text() : Buffer.from(await data.arrayBuffer()).toString('utf8');
  return JSON.parse(text);
}

export async function loadYardChats(userId) {
  if (!supabaseAdmin || !userId) return emptyStore();
  const ready = await ensureBucket();
  if (!ready) return emptyStore();
  try {
    const parsed = await readJson(userId);
    if (!parsed) return emptyStore();
    return fromParsed(parsed);
  } catch {
    return emptyStore();
  }
}

export async function saveYardChats(userId, store) {
  if (!supabaseAdmin || !userId) return false;
  const ready = await ensureBucket();
  if (!ready) return false;
  const chats = (store.chats || []).map(cleanChat).filter((chat) => chat.messages.length).slice(0, MAX_CHATS);
  const activeId = chats.some((chat) => chat.id === store.activeId) ? store.activeId : (chats[0]?.id || '');
  const body = JSON.stringify({
    memory: String(store.memory || '').slice(0, 1200),
    activeId,
    chats,
  });
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(`${userId}.json`, Buffer.from(body), {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) console.error('Yard chat save failed:', error.message);
  return !error;
}
