'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  EnvelopeIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const RANGES = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: 'year', label: 'This year', days: null },
  { id: 'all', label: 'All time', days: null }
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function localParts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    year: d.getFullYear(),
    month: d.getMonth(),
    weekday: d.getDay(),
    hour: d.getHours()
  };
}

function titleCase(str) {
  return String(str || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitServices(raw) {
  if (!raw) return ['Unspecified'];
  const parts = String(raw)
    .split(/[,|/&]+|\band\b/i)
    .map((s) => titleCase(s))
    .filter(Boolean);
  return parts.length ? parts : ['Unspecified'];
}

function BarRow({ label, value, max, color = 'from-green-500 to-emerald-400', suffix = '', onClick, active }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  const inner = (
    <>
      <div className="w-28 shrink-0 text-[11px] font-bold text-gray-400 truncate" title={label}>{label}</div>
      <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-lg flex items-center justify-end pr-2 transition-all duration-500`}
          style={{ width: `${pct}%` }}
        >
          {value > 0 && pct > 18 && (
            <span className="text-[10px] font-black text-white">{value}{suffix}</span>
          )}
        </div>
      </div>
      {(pct <= 18 || value === 0) && (
        <span className="w-10 text-right text-[11px] font-black text-white">{value}{suffix}</span>
      )}
    </>
  );
  if (!onClick) return <div className="flex items-center gap-3">{inner}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left rounded-lg px-1 -mx-1 py-0.5 ${active ? 'bg-green-500/10 ring-1 ring-green-500/30' : 'hover:bg-white/5'}`}
    >
      {inner}
    </button>
  );
}

export default function LeadAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [range, setRange] = useState('90d');
  const [error, setError] = useState('');
  const [view, setView] = useState('charts'); // charts | emails
  const [serviceFilter, setServiceFilter] = useState('all');
  const [messageSearch, setMessageSearch] = useState('');
  const [openLead, setOpenLead] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/leads/analytics');
        return;
      }
      await fetchLeads();
    })();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const [contactRes, apptRes, logsRes] = await Promise.all([
        supabase.from('contact_leads').select('*').order('created_at', { ascending: false }).limit(5000),
        supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(5000),
        supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(2000)
      ]);

      setEmailLogs(logsRes.error ? [] : (logsRes.data || []));

      const contacts = contactRes.data || [];
      const appts = (apptRes.data || []).filter((a) => {
        const source = (a.lead_source || '').toLowerCase();
        const booking = (a.booking_type || '').toLowerCase();
        return source === 'contact_form'
          || booking.includes('hire')
          || booking.includes('contract')
          || booking.includes('consult')
          || a.status === 'pending';
      });

      const seen = new Set();
      const merged = [];

      const push = (row, source) => {
        const email = (row.customer_email || row.email || '').toLowerCase();
        const when = (row.created_at || '').slice(0, 10);
        const key = row.id ? `${source}:${row.id}` : `${email}|${when}|${row.service_type || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push({
          id: `${source}-${row.id}`,
          created_at: row.created_at,
          service_type: row.service_type || row.service || '',
          city: row.city || (row.address ? String(row.address).split(',').slice(-2, -1)[0]?.trim() : '') || '',
          status: row.status || 'pending',
          name: row.customer_name || row.name || '',
          email,
          phone: row.customer_phone || row.phone || '',
          notes: row.notes || row.message || row.service_description || '',
          source
        });
      };

      contacts.forEach((r) => push(r, 'lead'));
      appts.forEach((r) => push(r, 'appt'));

      setLeads(merged);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const cfg = RANGES.find((r) => r.id === range) || RANGES[2];
    return leads.filter((lead) => {
      const d = new Date(lead.created_at);
      if (Number.isNaN(d.getTime())) return false;
      if (range === 'all') return true;
      if (range === 'year') return d.getFullYear() === now.getFullYear();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - cfg.days);
      cutoff.setHours(0, 0, 0, 0);
      return d >= cutoff;
    });
  }, [leads, range]);

  const inbox = useMemo(() => {
    const q = messageSearch.trim().toLowerCase();
    const items = filtered
      .filter((lead) => {
        if (serviceFilter !== 'all' && !splitServices(lead.service_type).includes(serviceFilter)) return false;
        const inbound = emailLogs.filter((log) => {
          const addr = (log.recipient_email || log.from_email || '').toLowerCase();
          return lead.email && addr === lead.email && String(log.direction || log.type || '').toUpperCase().includes('INBOUND');
        });
        const hay = `${lead.name} ${lead.email} ${lead.notes} ${lead.service_type} ${inbound.map((l) => `${l.subject} ${stripHtml(l.body_html)}`).join(' ')}`.toLowerCase();
        if (q && !hay.includes(q)) return false;
        return true;
      })
      .map((lead) => {
        const inbound = emailLogs.filter((log) => {
          const addr = (log.recipient_email || log.from_email || '').toLowerCase();
          return lead.email && addr === lead.email && String(log.direction || log.type || '').toUpperCase().includes('INBOUND');
        });
        return { ...lead, inbound };
      });
    return items;
  }, [filtered, emailLogs, serviceFilter, messageSearch]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

    const serviceCounts = {};
    const weekdayCounts = Array(7).fill(0);
    const hourCounts = Array(24).fill(0);
    const monthCounts = {};
    const cityCounts = {};
    const statusCounts = {};
    const weekCounts = {};
    let thisMonthCount = 0;
    let lastMonthCount = 0;
    const thisMonthServices = {};
    const lastMonthServices = {};

    filtered.forEach((lead) => {
      const p = localParts(lead.created_at);
      if (!p) return;

      splitServices(lead.service_type).forEach((svc) => {
        serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
        if (p.year === thisYear && p.month === thisMonth) {
          thisMonthServices[svc] = (thisMonthServices[svc] || 0) + 1;
        }
        if (p.year === lastMonthDate.getFullYear() && p.month === lastMonthDate.getMonth()) {
          lastMonthServices[svc] = (lastMonthServices[svc] || 0) + 1;
        }
      });

      weekdayCounts[p.weekday] += 1;
      hourCounts[p.hour] += 1;

      const mk = `${p.year}-${String(p.month + 1).padStart(2, '0')}`;
      monthCounts[mk] = (monthCounts[mk] || 0) + 1;

      const city = titleCase(lead.city || 'Unknown');
      cityCounts[city] = (cityCounts[city] || 0) + 1;

      const st = (lead.status || 'pending').toLowerCase();
      statusCounts[st] = (statusCounts[st] || 0) + 1;

      if (p.year === thisYear && p.month === thisMonth) thisMonthCount += 1;
      if (p.year === lastMonthDate.getFullYear() && p.month === lastMonthDate.getMonth()) lastMonthCount += 1;

      const dt = new Date(lead.created_at);
      const monday = new Date(dt);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
      const wk = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      weekCounts[wk] = (weekCounts[wk] || 0) + 1;
    });

    const services = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
    const cities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
    const months = Object.keys(monthCounts).sort().slice(-12).map((k) => {
      const [y, m] = k.split('-');
      return { key: k, label: `${MONTHS[Number(m) - 1]} ${y.slice(2)}`, value: monthCounts[k] };
    });
    const weeks = Object.keys(weekCounts).sort().slice(-10).map((k) => {
      const [, m, d] = k.split('-');
      return { key: k, label: `${Number(m)}/${Number(d)}`, value: weekCounts[k] };
    });

    const converted = (statusCounts.confirmed || 0) + (statusCounts.completed || 0) + (statusCounts.scheduled || 0);
    const conversion = filtered.length ? Math.round((converted / filtered.length) * 100) : 0;
    const topService = services[0] || ['—', 0];
    const busiestDayIdx = weekdayCounts.indexOf(Math.max(...weekdayCounts, 0));
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts, 0));
    const monthDelta = lastMonthCount === 0
      ? (thisMonthCount > 0 ? 100 : 0)
      : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);

    const topThis = Object.entries(thisMonthServices).sort((a, b) => b[1] - a[1])[0];
    const topLast = Object.entries(lastMonthServices).sort((a, b) => b[1] - a[1])[0];

    return {
      total: filtered.length,
      thisMonthCount,
      lastMonthCount,
      monthDelta,
      conversion,
      pending: statusCounts.pending || statusCounts.new || 0,
      confirmed: statusCounts.confirmed || 0,
      completed: statusCounts.completed || 0,
      waitlist: statusCounts.waitlist || 0,
      services,
      cities,
      weekdayCounts,
      hourCounts,
      months,
      weeks,
      statusCounts,
      topService,
      busiestDay: WEEKDAYS[busiestDayIdx] || '—',
      peakHour,
      topThis,
      topLast
    };
  }, [filtered]);

  const maxService = stats.services[0]?.[1] || 1;
  const maxWeekday = Math.max(...stats.weekdayCounts, 1);
  const maxMonth = Math.max(...stats.months.map((m) => m.value), 1);
  const maxCity = stats.cities[0]?.[1] || 1;
  const maxWeek = Math.max(...stats.weeks.map((w) => w.value), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-green-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Crunching lead demand…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <Link href="/schedule" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white mb-2">
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Schedule
            </Link>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Lead Demand</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">What people ask for, when they ask, and the emails they sent.</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button onClick={() => setView('charts')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider ${view === 'charts' ? 'bg-green-500 text-white' : 'text-gray-500'}`}>Demand</button>
              <button onClick={() => setView('emails')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider ${view === 'emails' ? 'bg-green-500 text-white' : 'text-gray-500'}`}>Emails</button>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                  range === r.id ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Kpi label="Leads" value={stats.total} sub={range === 'all' ? 'all time' : RANGES.find((r) => r.id === range)?.label} />
          <Kpi
            label="This month"
            value={stats.thisMonthCount}
            sub={`${stats.monthDelta >= 0 ? '+' : ''}${stats.monthDelta}% vs last month`}
            accent={stats.monthDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <Kpi label="Conversion" value={`${stats.conversion}%`} sub={`${stats.confirmed + stats.completed} booked / done`} />
          <Kpi label="Still open" value={stats.pending} sub={`${stats.waitlist} waitlist`} accent="text-amber-400" />
        </div>

        {view === 'emails' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                <input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search name, email, or message…"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600"
                />
              </div>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-[#161922] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="all">All services</option>
                {stats.services.map(([name]) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500">
              {inbox.length} {serviceFilter === 'all' ? 'leads' : `${serviceFilter} leads`} — tap one to read what they sent
            </p>

            <div className="space-y-2">
              {inbox.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">No messages in this range.</div>
              ) : inbox.map((lead) => {
                const preview = stripHtml(lead.notes) || stripHtml(lead.inbound[0]?.body_html) || 'No message text on file';
                return (
                  <button
                    key={lead.id}
                    onClick={() => setOpenLead(lead)}
                    className="w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-white truncate">{lead.name || 'Unknown'}</p>
                        <p className="text-[11px] text-gray-500 truncate">{lead.email || 'No email'}{lead.phone ? ` · ${lead.phone}` : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-400">{titleCase(lead.service_type) || 'Service'}</p>
                        <p className="text-[10px] text-gray-600">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{preview}</p>
                    {lead.inbound.length > 0 && (
                      <p className="text-[10px] font-bold text-blue-400 mt-2">{lead.inbound.length} inbound email{lead.inbound.length === 1 ? '' : 's'}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Insight
            icon={ChartBarIcon}
            title="Most requested"
            body={`${stats.topService[0]} · ${stats.topService[1]} leads`}
          />
          <Insight
            icon={CalendarDaysIcon}
            title="Busiest request day"
            body={`${stats.busiestDay}s · people inquire most then`}
          />
          <Insight
            icon={ArrowTrendingUpIcon}
            title="This month’s #1"
            body={stats.topThis ? `${stats.topThis[0]} (${stats.topThis[1]})` : 'No leads this month yet'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Panel title="Services requested" hint="Tap a service to read those emails">
            {stats.services.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-2">
                {stats.services.slice(0, 12).map(([name, count]) => (
                  <BarRow
                    key={name}
                    label={name}
                    value={count}
                    max={maxService}
                    active={serviceFilter === name}
                    onClick={() => {
                      setServiceFilter(serviceFilter === name ? 'all' : name);
                      setView('emails');
                    }}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Requests by weekday" hint="When the form gets submitted">
            <div className="space-y-2">
              {WEEKDAYS.map((d, i) => (
                <BarRow key={d} label={d} value={stats.weekdayCounts[i]} max={maxWeekday} color="from-blue-500 to-indigo-500" />
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Panel title="By month" hint="Last 12 months in range">
            {stats.months.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {stats.months.map((m) => (
                  <BarRow key={m.key} label={m.label} value={m.value} max={maxMonth} color="from-purple-500 to-fuchsia-500" />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Last 10 weeks" hint="Week starting Monday">
            {stats.weeks.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {stats.weeks.map((w) => (
                  <BarRow key={w.key} label={w.label} value={w.value} max={maxWeek} color="from-teal-500 to-cyan-400" />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Panel title="Towns / cities" hint="From lead city field">
            {stats.cities.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {stats.cities.slice(0, 12).map(([name, count]) => (
                  <BarRow key={name} label={name} value={count} max={maxCity} color="from-orange-500 to-amber-400" />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Pipeline" hint="Current status mix">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatusCard label="Pending" value={stats.pending} color="text-amber-400" />
              <StatusCard label="Confirmed" value={stats.confirmed} color="text-blue-400" />
              <StatusCard label="Waitlist" value={stats.waitlist} color="text-orange-400" />
              <StatusCard label="Completed" value={stats.completed} color="text-green-400" />
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
              {[
                { n: stats.pending, c: 'bg-amber-500' },
                { n: stats.confirmed, c: 'bg-blue-500' },
                { n: stats.waitlist, c: 'bg-orange-500' },
                { n: stats.completed, c: 'bg-green-500' }
              ].map((s, i) => (
                <div key={i} className={s.c} style={{ width: `${stats.total ? (s.n / stats.total) * 100 : 0}%` }} />
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Time of day" hint="Local hour the inquiry came in">
          <div className="flex items-end gap-1 h-28">
            {stats.hourCounts.map((v, h) => {
              const maxH = Math.max(...stats.hourCounts, 1);
              return (
                <div key={h} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <div
                    className={`w-full rounded-t ${h === stats.peakHour ? 'bg-green-400' : 'bg-white/20'}`}
                    style={{ height: `${Math.max(4, (v / maxH) * 100)}%` }}
                    title={`${h}:00 — ${v}`}
                  />
                  {(h % 3 === 0) && <span className="text-[8px] text-gray-600">{h}</span>}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Peak hour: {stats.peakHour}:00</p>
        </Panel>
          </>
        )}

        {openLead && (
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setOpenLead(null)}>
            <div className="bg-[#12141c] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex items-start justify-between gap-3 sticky top-0 bg-[#12141c]">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-400">{titleCase(openLead.service_type)}</p>
                  <h3 className="text-xl font-black text-white">{openLead.name || 'Unknown'}</h3>
                  <p className="text-xs text-gray-500">{openLead.email || 'No email'}{openLead.phone ? ` · ${openLead.phone}` : ''}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{openLead.created_at ? new Date(openLead.created_at).toLocaleString() : ''} · {openLead.status}</p>
                </div>
                <button onClick={() => setOpenLead(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">What they sent on the form</p>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 whitespace-pre-wrap">
                    {stripHtml(openLead.notes) || 'No form message saved.'}
                  </div>
                </div>
                {openLead.email && (
                  <a href={`mailto:${openLead.email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-wider">
                    Reply by email
                  </a>
                )}
                {openLead.inbound?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Inbound emails from this customer</p>
                    {openLead.inbound.map((log) => (
                      <div key={log.id} className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                        <p className="text-sm font-bold text-white">{log.subject || '(no subject)'}</p>
                        <p className="text-[11px] text-gray-500 mb-2">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</p>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">{stripHtml(log.body_html) || 'Empty body'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <Link href="/schedule" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10">
            Back to schedule
          </Link>
          <Link href="/leads" className="px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-300 font-bold hover:bg-purple-500/25 inline-flex items-center gap-2">
            <EnvelopeIcon className="h-4 w-4" /> Open lead inbox
          </Link>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent = 'text-white' }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Insight({ icon: Icon, title, body }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
        <p className="text-sm font-bold text-white mt-0.5">{body}</p>
      </div>
    </div>
  );
}

function Panel({ title, hint, children }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-black text-white">{title}</h2>
        {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function StatusCard({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-gray-500">No leads in this range.</p>;
}
