'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { YARD_SERVICES } from '@/lib/yardServices';

const MAX_PHOTOS = 4;
const NOTICE_KEY = 'flora-yard-chat-ok';

function hideMessage(message) {
  const content = message?.content || '';
  return content === 'What quotes should I send for these photos?' || /not your yard/i.test(content);
}

function whenLabel(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fileToJpeg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 1280;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Use a JPG, PNG, or WebP photo.'));
    };
    image.src = url;
  });
}

export default function YardPhotoChat({ user, yard, address, phone, yardSize, onQuoted, sheetOnly = false }) {
  const [photos, setPhotos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState([]);
  const [customerNote, setCustomerNote] = useState('');
  const [known, setKnown] = useState('');
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [showChats, setShowChats] = useState(false);
  const [added, setAdded] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [accountUser, setAccountUser] = useState(null);
  const [accountYard, setAccountYard] = useState(null);
  const activeUser = user || accountUser;
  const activeYard = yard || accountYard;
  const activeAddress = address || activeYard?.address || '';
  const activePhone = phone || activeYard?.phone || '';
  const activeSize = yardSize || activeUser?.user_metadata?.yard_size || 'medium';
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const activeIdRef = useRef('');

  const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const latestServices = latestAssistant?.services || [];
  const offered = [...latestServices];
  if (/hedge/i.test(latestAssistant?.content || '') && !offered.includes('Hedge Trimming')) offered.push('Hedge Trimming');
  added.forEach((service) => {
    if (!offered.includes(service)) offered.push(service);
  });
  const moreServices = YARD_SERVICES.filter((service) => !offered.includes(service));

  useEffect(() => {
    if (user) return undefined;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;
      setAccountUser(session.user);
      const { data } = await supabase.from('customers').select('name, email, phone, address').eq('user_id', session.user.id).limit(1);
      if (!cancelled && data?.[0]) setAccountYard(data[0]);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const response = await fetch('/api/yard-photo-chat', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (cancelled || !response.ok) return;
      const savedChats = Array.isArray(result.chats) ? result.chats : [];
      const active = savedChats.find((chat) => chat.id === result.activeId) || savedChats[0];
      setChats(savedChats);
      setActiveId(active?.id || '');
      activeIdRef.current = active?.id || '';
      setMessages(active?.messages || (Array.isArray(result.messages) ? result.messages : []));
      if (active?.note || result.note) setCustomerNote(active?.note || result.note);
      if (result.memory) setKnown(result.memory);
      const services = result.services?.length
        ? result.services
        : [...(active?.messages || [])].reverse().find((message) => message.services?.length)?.services;
      if (services?.length) setPicked(services);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    setAccepted(window.localStorage.getItem(NOTICE_KEY) === '1');
  }, []);

  useEffect(() => {
    function show() { setOpen(true); }
    window.addEventListener('flora-open-ask-ai', show);
    if (window.location.hash === '#ask-ai') setOpen(true);
    return () => window.removeEventListener('flora-open-ask-ai', show);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
      clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [open, messages, busy, photos.length]);

  async function addPhotos(fileList) {
    const files = [...fileList].slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;
    setNote('');
    try {
      const next = [];
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
          throw new Error('Use a JPG, PNG, or WebP photo.');
        }
        next.push({ id: `${Date.now()}-${file.name}`, dataUrl: await fileToJpeg(file) });
      }
      setPhotos((current) => [...current, ...next].slice(0, MAX_PHOTOS));
    } catch (error) {
      setNote(error.message || 'That photo could not be read.');
    }
  }

  async function ask(event, preset) {
    event?.preventDefault();
    const text = (preset ?? draft).trim();
    if (!accepted) {
      setNote('Read the note and tap I understand before sending.');
      return;
    }
    if (!text && !photos.length) {
      setNote(messages.length ? 'Add what changed, or send another photo.' : 'Add a photo or ask about the yard.');
      return;
    }
    const kept = messages.filter((message) => !hideMessage(message));
    const spoken = text || 'Sent photos of the yard.';
    const chatId = activeIdRef.current || crypto.randomUUID();
    activeIdRef.current = chatId;
    setActiveId(chatId);
    setShowChats(false);
    setMessages([...kept, { role: 'user', content: spoken }]);
    setDraft('');
    setBusy(true);
    setNote('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sign in again to use photo chat.');
      const response = await fetch('/api/yard-photo-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text,
          address: activeAddress,
          chatId,
          images: photos.map((photo) => photo.dataUrl),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not read those photos.');
      if (result.memory) setKnown(result.memory);
      const nextMessages = Array.isArray(result.messages) && result.messages.length
        ? result.messages
        : [...kept, { role: 'user', content: spoken }, { role: 'assistant', content: result.reply, services: result.services || [], suggestions: result.suggestions || [] }];
      const nextId = result.chatId || chatId;
      if (activeIdRef.current === chatId) {
        setPicked(result.services || []);
        if (result.note) setCustomerNote(result.note);
        setActiveId(nextId);
        setMessages(nextMessages);
      }
      setChats((list) => {
        const next = {
          id: nextId,
          title: result.title || spoken,
          note: result.note || '',
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        };
        return [next, ...list.filter((chat) => chat.id !== nextId)];
      });
    } catch (error) {
      if (activeIdRef.current === chatId) {
        setMessages(kept);
        setDraft(text);
        setNote(error.message || 'Could not read those photos.');
      }
    } finally {
      if (activeIdRef.current === chatId) setBusy(false);
    }
  }

  async function sendQuote() {
    const services = picked.length ? picked : latestServices;
    if (!services.length) return;
    const quoteName = activeYard?.name || activeUser?.user_metadata?.full_name || '';
    const quoteEmail = activeUser?.email || activeYard?.email || '';
    const primaryAddress = (activeAddress || '').trim();
    if (!quoteName.trim() || !quoteEmail) {
      setNote('Add a name and email on the account first.');
      return;
    }
    if (!primaryAddress) {
      setNote('Add the yard address above first.');
      return;
    }
    const serviceSummary = services.join(', ');
    const quoteBody = [
      `Services: ${serviceSummary}`,
      'Sent from: Yard photo chat',
      'When: Flexible, any day',
      `Yard size: ${String(activeSize || 'medium').charAt(0).toUpperCase()}${String(activeSize || 'medium').slice(1)}`,
      `Property 1: ${primaryAddress} — ${serviceSummary}`,
      customerNote.trim() ? `Note: ${customerNote.trim()}` : '',
    ].filter(Boolean).join('\n');

    setSendingQuote(true);
    setNote('');
    try {
      const response = await fetch('/api/send-contact-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteName,
          email: quoteEmail,
          phone: activePhone || '',
          address: primaryAddress,
          service: serviceSummary,
          message: quoteBody,
          estimatePreference: 'walk_around',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send the quote.');
      const saved = {
        id: result.leadId || `new-${Date.now()}`,
        service_type: serviceSummary,
        created_at: new Date().toISOString(),
        status: 'pending',
        address: primaryAddress,
        notes: quoteBody,
      };
      onQuoted?.(saved);
      window.dispatchEvent(new CustomEvent('flora-quote-saved', { detail: saved }));
      setNote('Quote sent. We reply in 1–6 hours.');
    } catch (error) {
      setNote(error.message || 'Could not send the quote.');
    } finally {
      setSendingQuote(false);
    }
  }

  function startNewChat() {
    if (!messages.length && !photos.length) {
      setShowChats(false);
      return;
    }
    const id = crypto.randomUUID();
    const currentId = activeIdRef.current || crypto.randomUUID();
    const currentTitle = (messages.find((message) => message.role === 'user')?.content || 'Yard chat').replace(/\s+/g, ' ').trim().slice(0, 42);
    setChats((list) => {
      const current = { id: currentId, title: currentTitle, messages, note: customerNote, updatedAt: new Date().toISOString() };
      const rest = list.filter((chat) => chat.id !== currentId && chat.id !== id && chat.messages?.length);
      return [{ id, title: 'New chat', messages: [], note: '', updatedAt: new Date().toISOString() }, current, ...rest];
    });
    activeIdRef.current = id;
    setActiveId(id);
    setMessages([]);
    setPicked([]);
    setAdded([]);
    setShowAdd(false);
    setCustomerNote('');
    setPhotos([]);
    setDraft('');
    setNote('');
    setBusy(false);
    setShowChats(false);
    inputRef.current?.focus();
  }

  async function openChat(chat) {
    activeIdRef.current = chat.id;
    setActiveId(chat.id);
    setBusy(false);
    setMessages(chat.messages || []);
    setCustomerNote(chat.note || '');
    const services = [...(chat.messages || [])].reverse().find((message) => message.role === 'assistant' && message.services?.length)?.services || [];
    setPicked(services);
    setAdded([]);
    setShowAdd(false);
    setPhotos([]);
    setDraft('');
    setNote('');
    setShowChats(false);
    if (!chat.messages?.length) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch('/api/yard-photo-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'open', chatId: chat.id }),
    });
  }

  const visible = messages.filter((message) => !hideMessage(message));
  const lastAssistantIndex = visible.reduce((found, message, index) => (message.role === 'assistant' ? index : found), -1);
  const prompts = ['What should we quote?', 'The leaves are piled up', 'Please wash the driveway'];
  const savedChats = chats.filter((chat) => chat.messages?.length || chat.id === activeId);

  return (
    <>
      {!sheetOnly && <section className="mt-6 border border-[#C9D4CC] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Ask about the yard</h2>
        <p className="mt-1 text-sm text-[#5C6B62]">Photo or a question. The chat stays on this account.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 min-h-11 px-4 bg-[#1B2838] text-white font-semibold"
        >
          Open chat
        </button>
      </section>}

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#1B2838]/50 sm:items-center" role="presentation" onClick={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Yard chat"
            className="flex h-[100dvh] w-full flex-col bg-[#F3F6F4] sm:h-[min(720px,92dvh)] sm:max-w-md sm:rounded-2xl sm:shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
          >
            <header className="flex items-center justify-between gap-2 bg-[#1B2838] px-4 py-3 text-white">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Yard chat</h2>
                <p className="text-xs text-[#A9C2B3]">AI assistant, not the crew</p>
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={() => setShowChats((on) => !on)} className="min-h-11 px-2 text-sm font-semibold" aria-expanded={showChats}>
                  Chats
                </button>
                <button type="button" onClick={startNewChat} className="min-h-11 px-2 text-sm font-semibold">
                  New
                </button>
                <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-2 text-sm font-semibold">
                  Close
                </button>
              </div>
            </header>
            {showChats && (
              <div className="max-h-52 overflow-y-auto border-b border-[#C9D4CC] bg-white">
                {savedChats.length === 0 && <p className="px-4 py-3 text-sm text-[#5C6B62]">No saved chats yet.</p>}
                {savedChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => openChat(chat)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${chat.id === activeId ? 'bg-[#F3F6F4] font-semibold text-[#1B2838]' : 'text-[#1B2838]'}`}
                  >
                    <span className="truncate">{chat.title || 'New chat'}</span>
                    <span className="shrink-0 text-xs font-normal text-[#5C6B62]">{whenLabel(chat.updatedAt)}</span>
                  </button>
                ))}
              </div>
            )}
            {!accepted && (
              <div className="border-b border-[#C9D4CC] bg-white px-4 py-3 text-sm text-[#1B2838]">
                <p>This is an AI, not someone from the crew.</p>
                <p className="mt-1">Photos and messages are saved on your Flora Lawn account and sent to an AI service to suggest the work.</p>
                <p className="mt-1">A suggestion is not a price and not a booked job. The office confirms the price before any work starts.</p>
                <p className="mt-1">Do not send photos of people’s faces, children, IDs, or license plates.</p>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.setItem(NOTICE_KEY, '1');
                    setAccepted(true);
                    setNote('');
                  }}
                  className="mt-3 min-h-11 px-4 bg-[#1B2838] font-semibold text-white"
                >
                  I understand
                </button>
              </div>
            )}

            <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {visible.length === 0 && (
                <div className="pt-6">
                  <p className="text-base text-[#1B2838]">Send a photo of the yard, or ask what you want done.</p>
                  {known && <p className="mt-2 text-sm text-[#5C6B62]">This account already knows your yard, so you don’t have to explain it again.</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {prompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => ask(null, prompt)}
                        className="min-h-11 rounded-full border border-[#C9D4CC] bg-white px-4 text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {visible.map((message, index) => (
                <div key={`${message.role}-${message.at || index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`flex max-w-[85%] flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <p className={`whitespace-pre-line px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-2xl rounded-br-md bg-[#2F6B4F] text-white' : 'rounded-2xl rounded-bl-md bg-white text-[#1B2838]'}`}>
                      {message.content}
                    </p>
                    {message.role === 'assistant' && index === lastAssistantIndex && message.suggestions?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            disabled={busy || !accepted}
                            onClick={() => ask(null, suggestion)}
                            className="min-h-10 rounded-full border border-[#C9D4CC] bg-white px-3 text-sm disabled:opacity-60"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <p className="text-sm text-[#5C6B62]">Looking…</p>}
            </div>

            <div className="border-t border-[#C9D4CC] bg-white px-3 py-3">
              {photos.length > 0 && (
                <ul className="mb-3 flex gap-2 overflow-x-auto">
                  {photos.map((photo) => (
                    <li key={photo.id} className="relative shrink-0">
                      <img src={photo.dataUrl} alt="Yard photo to send" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}
                        className="absolute right-0 top-0 min-h-7 bg-white px-1.5 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {offered.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {offered.map((service) => {
                      const on = picked.includes(service);
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => setPicked((current) => (current.includes(service) ? current.filter((name) => name !== service) : [...current, service]))}
                          className={`min-h-10 rounded-full px-3 text-sm ${on ? 'bg-[#2F6B4F] text-white' : 'border border-[#C9D4CC] bg-white'}`}
                        >
                          {service}
                        </button>
                      );
                    })}
                    {moreServices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAdd((open) => !open)}
                        className="min-h-10 rounded-full border border-dashed border-[#C9D4CC] px-3 text-sm"
                        aria-expanded={showAdd}
                      >
                        Add a service
                      </button>
                    )}
                  </div>
                  {showAdd && (
                    <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                      {moreServices.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => {
                            setAdded((current) => (current.includes(service) ? current : [...current, service]));
                            setPicked((current) => (current.includes(service) ? current : [...current, service]));
                            setShowAdd(false);
                          }}
                          className="min-h-10 rounded-full border border-[#C9D4CC] bg-white px-3 text-sm"
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={sendQuote}
                    disabled={sendingQuote || picked.length === 0}
                    className="mt-2 min-h-11 px-4 bg-[#E8C547] text-sm font-semibold text-[#1B2838] disabled:opacity-50"
                  >
                    {sendingQuote ? 'Sending' : 'Send this quote'}
                  </button>
                </div>
              )}

              {note && <p className="mb-2 text-sm">{note}</p>}

              <form onSubmit={ask} className="flex items-end gap-2">
                <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F3F6F4] text-sm font-semibold text-[#1B2838]">
                  <span className="sr-only">Add photos</span>
                  +
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      addPhotos(event.target.files || []);
                      event.target.value = '';
                    }}
                  />
                </label>
                <label className="sr-only" htmlFor="yard-photo-question">Message</label>
                <input
                  id="yard-photo-question"
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about the yard"
                  className="min-h-11 flex-1 rounded-full border border-[#C9D4CC] px-4"
                />
                <button type="submit" disabled={busy || !accepted} className="h-11 shrink-0 rounded-full bg-[#2F6B4F] px-4 text-sm font-semibold text-white disabled:opacity-60">
                  {busy ? '…' : 'Send'}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
