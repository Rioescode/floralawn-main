'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import { 
  EnvelopeIcon, 
  CalendarIcon, 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLongRightIcon,
  FireIcon,
  InboxIcon,
  ChevronDownIcon,
  MapPinIcon,
  XMarkIcon,
  PencilSquareIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';

export default function GmailDashboard() {
  const [userName, setUserName] = useState('');
  const [emails, setEmails] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [viewMode, setViewMode] = useState('inbox');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [nextPageToken, setNextPageToken] = useState(null);
  
  // Booking Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [bookingData, setBookingData] = useState({
    summary: '', location: '', description: '', startTime: '', endTime: ''
  });

  useEffect(() => { checkConnection(); }, []);

  const checkConnection = async () => {
    fetchEmails(); fetchCalendar();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserName(user.email);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setIsConnected(true);
  };

  const fetchEmails = async (loadMore = false) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tokenParam = loadMore && nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const response = await fetch(`/api/gmail/messages?limit=50${tokenParam}&userId=${user?.id}`);
      const data = await response.json();
      if (response.ok) {
        if (loadMore) setEmails(prev => [...prev, ...data.messages]);
        else setEmails(data.messages || []);
        setNextPageToken(data.nextPageToken);
      }
    } finally { setLoading(false); }
  };

  const fetchCalendar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const response = await fetch(`/api/gmail/calendar?userId=${user?.id}`);
    const data = await response.json();
    if (response.ok) setCalendarEvents(data.events || []);
  };

  const handleUpdateStatus = async (event, status) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Clean previous status tags
      const cleanSummary = event.summary.replace(/✅ \[DONE\] /g, '').replace(/❌ \[CANCEL] /g, '');
      const prefix = status === 'done' ? '✅ [DONE] ' : (status === 'cancel' ? '❌ [CANCEL] ' : '');
      
      const response = await fetch('/api/gmail/calendar/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id, 
          eventId: event.id,
          summary: `${prefix}${cleanSummary}`,
          location: event.location,
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date
        })
      });
      if (response.ok) {
        fetchCalendar();
        if (status === 'done') {
          import('canvas-confetti').then(c => c.default({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#4f46e5'], zIndex: 9999 }));
        }
      }
    } finally { setLoading(false); }
  };

  const handleSaveJob = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...bookingData, userId: user?.id, eventId: editingEventId };
      const url = isEditing ? '/api/gmail/calendar/update' : '/api/gmail/calendar/create';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        import('canvas-confetti').then(c => c.default({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#4f46e5'], zIndex: 9999 }));
        setShowBookingModal(false); fetchCalendar();
      }
    } finally { setLoading(false); }
  };

  const startBooking = (email) => {
    setIsEditing(false); setEditingEventId(null);
    const allBody = email.messages?.map(m => m.body).join(' ') || '';
    const getF = (re) => allBody.match(re)?.[1]?.trim();
    const isV2 = allBody.toLowerCase().includes('[flora_lead_v2]');
    const name = isV2 ? getF(/Lead from (.*?) for/i) : (getF(/Alert\s+(.*?)\b/) || email.from?.split(' <')[0]);
    const srv = isV2 ? getF(/for (.*?)\. Address/i) : getF(/🏗️ Service Requested\s+(.*)/);
    const addr = isV2 ? getF(/Address: (.*?)\./i) : getF(/📍 Address\s+(.*)/)?.split(']')[0]?.replace('[', '');
    
    setBookingData({
      summary: `${name} | ${srv || 'Job'}`, location: addr || '',
      description: `Job via Reader.\nFrom: ${email.from}`,
      startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm")
    });
    setShowBookingModal(true);
  };

  const startEdit = (event) => {
    setIsEditing(true); setEditingEventId(event.id);
    setBookingData({
      summary: event.summary.replace('✅ [DONE] ', '').replace('❌ [CANCEL] ', '') || '',
      location: event.location || '',
      description: event.description || '',
      startTime: event.start?.dateTime ? format(new Date(event.start.dateTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endTime: event.end?.dateTime ? format(new Date(event.end.dateTime), "yyyy-MM-dd'T'HH:mm") : format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm")
    });
    setShowBookingModal(true);
  };

  const handleAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    window.location.href = `/api/auth/google?userId=${user?.id}`;
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedEmail) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/gmail/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: selectedEmail.from, 
          subject: `Re: ${selectedEmail.subject}`, 
          threadId: selectedEmail.threadId, 
          body: replyText, 
          userId: user?.id 
        }),
      });
      if (response.ok) {
        setReplyText('');
        fetchEmails();
        alert('Intelligence Submitted: Reply Sent.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isVerifiedLead = (e) => {
    const content = (e.snippet + (e.messages?.[0]?.body || '') + (e.subject || '')).toLowerCase();
    return content.includes('[flora_lead_v2]') || e.subject?.includes('🔥 NEW LEAD:');
  };

  const filteredEmails = emails.filter(e => (e.subject + e.from).toLowerCase().includes(searchTerm.toLowerCase()) && (filterTab === 'all' || isVerifiedLead(e)));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navigation />
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100 blur-[120px] rounded-full" />
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 relative border border-white/20">
            <button onClick={() => setShowBookingModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter tracking-tighter uppercase italic">{isEditing ? 'Update Command' : 'Booking Engine'}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Sync Active</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Command Subject</label><input type="text" value={bookingData.summary} onChange={e => setBookingData({...bookingData, summary: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Service Coordinates</label><input type="text" value={bookingData.location} onChange={e => setBookingData({...bookingData, location: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Deployment Start</label><input type="datetime-local" value={bookingData.startTime} onChange={e => setBookingData({...bookingData, startTime: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Deployment End</label><input type="datetime-local" value={bookingData.endTime} onChange={e => setBookingData({...bookingData, endTime: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm" /></div>
              </div>
              <button onClick={handleSaveJob} disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[2.2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">{loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CalendarIcon className="w-5 h-5 text-emerald-400" />} {isEditing ? 'Execute Update' : 'Establish Job'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-[1780px] mx-auto px-6 py-4 h-[calc(100vh-84px)] flex flex-col gap-6">
        <div className="flex items-center justify-between bg-white border border-slate-200 px-8 py-5 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border-2 transition-all ${viewMode === 'schedule' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              {viewMode === 'schedule' ? <CalendarIcon className="w-7 h-7" /> : <FireIcon className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 italic">{viewMode === 'schedule' ? 'Job Ops Center' : 'Lead Intelligence'}</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Security: {isConnected ? 'Synchronized' : 'Offline'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { fetchEmails(); fetchCalendar(); }} className="p-3.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100"><ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
            {userName && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
                <div className="relative"><UserCircleIcon className="w-8 h-8 text-emerald-600" /><div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" /></div>
                <div className="hidden lg:block text-left"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Pilot</p><p className="text-[11px] font-black text-slate-700 leading-none">{userName}</p></div>
              </div>
            )}
            {!isConnected && <button onClick={handleAuth} className="bg-emerald-600 text-white px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all">Establish Link</button>}
            <div className="h-14 w-px bg-slate-200 mx-1" />
            <div className="bg-slate-100 p-1.5 flex rounded-[1.8rem]"><button onClick={() => setViewMode('inbox')} className={`px-7 py-3 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'inbox' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Inbox</button><button onClick={() => setViewMode('schedule')} className={`px-7 py-3 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'schedule' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Schedule</button></div>
          </div>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          <div className="w-[480px] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            {viewMode === 'inbox' ? (
              <>
                <div className="p-2.5 grid grid-cols-2 gap-1 bg-slate-50 border-b border-slate-200">
                  <button onClick={() => setFilterTab('all')} className={`flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'all' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}>All Comms</button>
                  <button onClick={() => setFilterTab('leads')} className={`flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${filterTab === 'leads' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-400'}`}>Elite Leads</button>
                </div>
                <div className="p-5 border-b border-slate-200 bg-slate-50/20"><div className="relative"><MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Intercept Intelligence..." className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-[1.5rem] text-[11px] font-bold text-slate-700 outline-none shadow-sm focus:border-emerald-300" /></div></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar-light p-4 space-y-3 bg-slate-50/50">
                  {filteredEmails.map((e) => (
                    <div key={e.id} onClick={() => setSelectedEmail(e)} className={`p-5 rounded-[2.2rem] cursor-pointer transition-all border-2 ${selectedEmail?.id === e.id ? 'bg-white border-emerald-400 shadow-2xl scale-[1.02]' : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-1 text-[14px] font-black text-slate-800">
                        <span className="truncate">{isVerifiedLead(e) && <FireIcon className="w-4 h-4 text-emerald-500 inline mr-1.5 align-middle" />}{e.from?.split(' <')[0]}</span>
                        <span className="text-[10px] font-black text-slate-400 shrink-0 ml-2 uppercase">{e.date ? formatDistanceToNow(new Date(e.date), { addSuffix: true }) : ''}</span>
                      </div>
                      <div className="text-[12px] font-black text-slate-500 truncate mb-1.5 tracking-tight uppercase">{e.subject}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed lowercase">{e.snippet}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center"><h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 italic">Deployment Map</h3><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /><div className="w-3 h-3 rounded-full bg-indigo-500" /></div></div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                  {calendarEvents.map((event) => {
                    const isDone = event.summary.includes('✅');
                    const isCancel = event.summary.includes('❌');
                    return (
                      <div key={event.id} className={`p-5 rounded-[2.2rem] border-2 shadow-sm flex items-center justify-between group transition-all hover:scale-[1.02] ${isDone ? 'bg-emerald-50 border-emerald-100' : (isCancel ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl')}`}>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-2 h-10 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : (isCancel ? 'bg-red-500' : 'bg-indigo-500')}`} />
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-black text-slate-800 truncate leading-tight uppercase underline-offset-4">{event.summary.replace('✅ [DONE] ', '').replace('❌ [CANCEL] ', '')}</h4>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-emerald-600' : (isCancel ? 'text-red-600' : 'text-indigo-600')}`}>{event.start?.dateTime ? format(new Date(event.start.dateTime), 'h:mm a') : 'Full Phase'}</p>
                            {event.location && (
                              <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`); }} className="flex items-center gap-1.5 mt-1 text-[9px] font-black text-slate-400 hover:text-emerald-700 transition-colors uppercase">
                                <MapPinIcon className="w-3 h-3" /> <span className="underline truncate">{event.location}</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleUpdateStatus(event, 'done')} className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200"><CheckCircleIcon className="w-5 h-5" /></button>
                          <button onClick={() => startEdit(event)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"><PencilSquareIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleUpdateStatus(event, 'cancel')} className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"><NoSymbolIcon className="w-5 h-5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            {viewMode === 'schedule' ? (
              <div className="flex-1 overflow-y-auto p-14 bg-slate-50/20 custom-scrollbar-light">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-end justify-between mb-14">
                    <div><h2 className="text-6xl font-black text-slate-800 tracking-tighter mb-2 italic uppercase">Operational Grid</h2><p className="text-slate-400 font-black uppercase text-[12px] tracking-[0.5em]">Optimizing Terrain Logic</p></div>
                    <button onClick={() => { setIsEditing(false); setBookingData({summary:'', location:'', description:'', startTime:format(new Date(),"yyyy-MM-dd'T'HH:mm"), endTime:format(new Date(Date.now()+3600000),"yyyy-MM-dd'T'HH:mm")}); setShowBookingModal(true); }} className="bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all flex items-center gap-3 active:scale-95"><PlusIcon className="w-6 h-6 stroke-[3.5px]" /> Deploy Job</button>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {calendarEvents.map((event) => {
                      const isDone = event.summary.includes('✅');
                      const isCancel = event.summary.includes('❌');
                      return (
                        <div key={event.id} className={`p-10 rounded-[3.5rem] border-2 shadow-sm flex items-center justify-between group transition-all hover:shadow-2xl ${isDone ? 'bg-emerald-50/50 border-emerald-300 shadow-emerald-100' : (isCancel ? 'bg-red-50/50 border-red-300 shadow-red-100' : 'bg-white border-slate-200 hover:border-indigo-400')}`}>
                          <div className="flex items-center gap-14">
                            <div className="text-center w-24"><p className={`text-[12px] font-black uppercase tracking-widest mb-1.5 ${isDone ? 'text-emerald-500' : (isCancel ? 'text-red-500' : 'text-indigo-500')}`}>{event.start?.dateTime ? format(new Date(event.start.dateTime), 'MMM') : ''}</p><p className="text-5xl font-black text-slate-800 tracking-tighter italic">{event.start?.dateTime ? format(new Date(event.start.dateTime), 'dd') : ''}</p></div>
                            <div className="h-24 w-px bg-slate-100" />
                            <div className="min-w-0">
                              <h3 className={`text-3xl font-black mb-3 truncate max-w-lg uppercase tracking-tight ${isDone ? 'text-emerald-900' : (isCancel ? 'text-red-900' : 'text-slate-800')}`}>{event.summary.replace('✅ [DONE] ', '').replace('❌ [CANCEL] ', '')}</h3>
                              <div className="flex items-center gap-10 text-slate-500 text-[12px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-2"><ClockIcon className={`w-5 h-5 ${isDone ? 'text-emerald-500' : (isCancel ? 'text-red-500' : 'text-indigo-500')}`} /> {event.start?.dateTime ? format(new Date(event.start.dateTime), 'h:mm a') : 'Full Phase'}</span>
                                {event.location && (
                                  <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`); }} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors">
                                    <MapPinIcon className="w-5 h-5 text-emerald-400" /> <span className="truncate underline decoration-slate-200 underline-offset-4">{event.location}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => handleUpdateStatus(event, 'done')} className={`p-5 rounded-[2rem] transition-all hover:scale-110 shadow-lg ${isDone ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white'}`}><CheckCircleIcon className="w-8 h-8" /></button>
                            <button onClick={() => startEdit(event)} className="p-5 bg-slate-50 text-slate-400 rounded-[2rem] border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 transition-all shadow-lg"><PencilSquareIcon className="w-8 h-8" /></button>
                            <button onClick={() => handleUpdateStatus(event, 'cancel')} className={`p-5 rounded-[2rem] transition-all hover:scale-110 shadow-lg ${isCancel ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white'}`}><NoSymbolIcon className="w-8 h-8" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : selectedEmail ? (
              <div className="flex flex-col h-full bg-slate-50/5">
                <div className="p-10 border-b border-slate-200 flex items-center justify-between bg-white"><div className="min-w-0"><h2 className="text-3xl font-black text-slate-800 tracking-tighter truncate leading-tight uppercase italic">{selectedEmail.subject}</h2><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60">Source Coordinates: {selectedEmail.from}</p></div><div className="flex gap-3"><button onClick={() => startBooking(selectedEmail)} className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 active:scale-95 hover:bg-indigo-600 hover:text-white transition-all"><CalendarIcon className="w-8 h-8" /></button><button className="p-4 bg-slate-100 text-slate-400 rounded-[1.5rem] border-2 border-transparent hover:border-slate-200 transition-all"><ArchiveBoxIcon className="w-8 h-8" /></button><button className="p-4 bg-red-50 text-red-500 rounded-[1.5rem] border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all"><TrashIcon className="w-8 h-8" /></button></div></div>
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar-light bg-slate-50/20">
                  {selectedEmail.messages?.map((msg) => {
                    const isAlert = msg.body?.toLowerCase().includes('lead');
                    if (isVerifiedLead(selectedEmail)) {
                      const allText = selectedEmail.messages?.map(m => m.body).join('\n') || '';
                      
                      const findData = (keys) => {
                        for (const key of keys) {
                          const regex = new RegExp(`${key}:?\\s*(.*)`, 'i');
                          const match = allText.match(regex);
                          if (match && match[1].trim()) return match[1].trim().split('\n')[0].replace(/[^\w\s-@.]/g, '').trim();
                        }
                        return '';
                      };

                      // Emergency Phone Pattern Hunter
                      const phonePattern = allText.match(/(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
                      
                      const subjectMatch = selectedEmail.subject?.match(/🔥 NEW LEAD: (.*?) \((.*?)\)/i);
                      
                      const leadData = {
                        name: subjectMatch?.[1] || findData(['Lead from', 'Alert', 'Name']),
                        email: findData(['Email', '📧 Email', 'Contact']),
                        phone: findData(['Phone', '📱 Phone', 'Contact Number']) || (phonePattern ? phonePattern[0] : ''),
                        address: subjectMatch?.[2] || findData(['Address', '📍 Address', 'Location']),
                        service: findData(['Service Requested', 'Service', '🏗️ Service', 'for (.*?) Address']),
                        frequency: findData(['Frequency', '📅 Frequency', 'Schedule']),
                        message: allText.split('💬 Notes:')[1]?.split('---')[0]?.trim() || allText.split('Message:')[1]?.trim() || ''
                      };

                      return (
                        <div key={msg.id} className="max-w-6xl mx-auto my-8 p-14 rounded-[4.5rem] border-4 border-emerald-400 bg-white shadow-[0_50px_100px_-20px_rgba(16,185,129,0.15)] relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12"><FireIcon className="w-48 h-48 text-emerald-500" /></div>
                          <span className="px-7 py-3 bg-emerald-500 text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-10 inline-block shadow-lg shadow-emerald-200">Elite Project Assessment</span>
                          <h2 className="text-6xl font-black text-slate-800 mb-10 tracking-tighter italic uppercase">Intelligence Feed</h2>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="space-y-6">
                              <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 group hover:border-emerald-300 transition-all">
                                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Primary Target</p>
                                <p className="text-3xl font-black text-slate-800 italic uppercase">{leadData.name}</p>
                              </div>
                              {(leadData.email || leadData.phone) && (
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 flex items-center justify-between group hover:border-indigo-300 transition-all">
                                  <div>
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Comms Channel</p>
                                    {leadData.email && <p className="text-sm font-black text-indigo-600">{leadData.email}</p>}
                                    {leadData.phone && <p className="text-lg font-black text-slate-700">{leadData.phone}</p>}
                                  </div>
                                  {leadData.phone && (
                                    <div className="flex flex-col gap-2"><a href={`tel:${leadData.phone}`} className="p-3 bg-white shadow-sm rounded-xl text-emerald-600 hover:scale-110 mb-1 transition-all flex items-center justify-center"><Navigation className="w-5 h-5 rotate-90" /></a></div>
                                  )}
                                </div>
                              )}
                            </div>

                            {leadData.address && (
                              <div className="md:col-span-2 p-10 bg-slate-50 rounded-[3rem] border-2 border-slate-100 relative group hover:border-emerald-300 transition-all">
                                <div className="flex justify-between items-start mb-8">
                                  <div><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Deployment Coordinates</p><p className="text-2xl font-black text-slate-800 max-w-md">{leadData.address}</p></div>
                                  <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(leadData.address)}`)} className="bg-slate-900 text-white px-8 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all">Launch Maps</button>
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-slate-200/50">
                                  {leadData.service && <div><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Service Logic</p><p className="text-emerald-700 font-black uppercase text-sm tracking-widest">{leadData.service}</p></div>}
                                  {leadData.frequency && <div><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Frequency</p><p className="text-indigo-700 font-black uppercase text-sm tracking-widest">{leadData.frequency}</p></div>}
                                </div>
                              </div>
                            )}
                          </div>

                          {leadData.message && (
                            <div className="mb-12 p-10 bg-slate-950 rounded-[3rem] text-slate-300 relative">
                               <div className="absolute top-8 right-8 text-emerald-400/20"><ExclamationCircleIcon className="w-12 h-12" /></div>
                               <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Deep Intelligence (Client Voice)</p>
                               <p className="text-xl font-medium leading-relaxed italic">"{leadData.message}"</p>
                            </div>
                          )}

                          <div className="flex gap-4">
                            <button onClick={() => startBooking(selectedEmail)} className="flex-1 bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"><CalendarIcon className="w-7 h-7" /> Establish Mission Link (Book Job)</button>
                            <button className="px-10 bg-slate-100 text-slate-400 rounded-[2.5rem] hover:bg-slate-200 transition-all inline-flex items-center"><ArchiveBoxIcon className="w-8 h-8" /></button>
                          </div>
                        </div>
                      );
                    }
                    const isMe = msg.from?.includes('floralawn');
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-5 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[11px] font-black border-2 shadow-sm ${isMe ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-100' : 'bg-white text-slate-400 border-slate-100'}`}>{isMe ? 'ME' : msg.from?.charAt(0)}</div>
                          <div className={`p-8 rounded-[2.8rem] shadow-xl relative border-2 ${isMe ? 'bg-emerald-50 text-emerald-900 border-emerald-100 rounded-br-none shadow-emerald-50' : 'bg-white text-slate-800 border-slate-100 rounded-bl-none shadow-slate-100'}`}><p className="text-[17px] font-medium leading-[1.65] whitespace-pre-wrap lowercase align-middle tracking-tight">{msg.body.replace(/^>+\s?/gm, '').trim()}</p></div>
                        </div>
                        <p className="text-[11px] font-black text-slate-300 mt-4 px-20 uppercase tracking-[0.2em]">{msg.date ? format(new Date(msg.date), 'EEEE, MMM dd · h:mm a') : ''}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="p-10 border-t border-slate-200 bg-white shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.05)]"><div className="relative"><textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Formulate professional outreach protocol..." className="w-full h-44 p-10 bg-slate-50 border-2 border-slate-100 rounded-[3rem] focus:ring-8 focus:ring-emerald-500/5 outline-none text-slate-700 font-bold text-lg placeholder:text-slate-300" /><button onClick={handleSendReply} className="absolute bottom-8 right-8 bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 leading-none transition-all">Submit Intelligence</button></div></div>
              </div>
            ) : (
              viewMode === 'inbox' && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white"><div className="w-32 h-32 bg-slate-50 rounded-[4rem] flex items-center justify-center mb-8"><FireIcon className="w-16 h-16 text-slate-200 animate-pulse" /></div><h3 className="text-3xl font-black text-slate-300 tracking-tighter uppercase italic opacity-60">Intelligence Sync: Standby</h3></div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
