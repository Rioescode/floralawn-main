'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CONDITIONS = {
  1: { label: 'Light', color: '#22c55e' },
  2: { label: 'Moderate', color: '#84cc16' },
  3: { label: 'Heavy', color: '#f59e0b' },
  4: { label: 'Overgrown', color: '#f97316' },
  5: { label: 'Severe', color: '#ef4444' },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending | scheduled | scratched | all
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeadForReview, setSelectedLeadForReview] = useState(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { fetchLeads(); }, []);

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads? This cannot be undone.`)) return;

    setActionLoading('bulk-delete');
    const { error } = await supabase
      .from('appointments')
      .delete()
      .in('id', selectedIds);

    if (!error) {
      showToast(`Successfully deleted ${selectedIds.length} leads`);
      setSelectedIds([]);
      fetchLeads();
    } else {
      showToast('Error deleting leads', 'error');
    }
    setActionLoading(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(l => l.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'esckoofficial@gmail.com') {
      router.push('/login');
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('lead_source', 'contact_form')
      .order('created_at', { ascending: false });

    if (!error) setLeads(data || []);
    setLoading(false);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSchedule = async (lead) => {
    setActionLoading(lead.id + '-schedule');
    const { error } = await supabase.from('appointments').update({
      status: 'scheduled',
      notes: scheduleNote
        ? (lead.notes ? lead.notes + '\n\n📅 Scheduled note: ' + scheduleNote : '📅 Scheduled note: ' + scheduleNote)
        : lead.notes,
      scheduled_date: scheduleDate || null,
    }).eq('id', lead.id);

    if (!error) {
      showToast(`✅ ${lead.customer_name} scheduled!`);
      setSelectedLead(null);
      setScheduleDate('');
      setScheduleNote('');
      fetchLeads();
    } else {
      showToast('❌ Error scheduling lead', 'error');
    }
    setActionLoading(null);
  };

  const handleScratch = async (lead) => {
    if (!confirm(`Scratch lead for ${lead.customer_name}? This marks them as not moving forward.`)) return;
    setActionLoading(lead.id + '-scratch');
    const { error } = await supabase.from('appointments').update({ status: 'scratched' }).eq('id', lead.id);
    if (!error) {
      showToast(`🗑️ ${lead.customer_name} scratched.`, 'info');
      fetchLeads();
    } else {
      showToast('❌ Error scratching lead', 'error');
    }
    setActionLoading(null);
  };

  const handleRestore = async (lead) => {
    setActionLoading(lead.id + '-restore');
    const { error } = await supabase.from('appointments').update({ status: 'pending' }).eq('id', lead.id);
    if (!error) {
      showToast(`↩️ ${lead.customer_name} restored to pending.`, 'info');
      fetchLeads();
    }
    setActionLoading(null);
  };

  const handleConfirm = async (lead) => {
    setActionLoading(lead.id + '-confirm');
    const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', lead.id);
    if (!error) {
      showToast(`✨ ${lead.customer_name} confirmed!`, 'success');
      fetchLeads();
    } else {
      showToast('❌ Error confirming lead', 'error');
    }
    setActionLoading(null);
  };

  const handleSendReview = async () => {
    if (!selectedLeadForReview) return;
    
    setActionLoading(selectedLeadForReview.id + '-review');
    try {
      const response = await fetch('/api/customers/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: `review-${selectedLeadForReview.id}`,
          message: reviewMessage,
          sendEmail: true,
          sendSMS: false,
          type: 'review',
          subject: 'Help us grow! 🌿 - Flora Lawn & Landscaping',
          customerData: {
            customer_name: selectedLeadForReview.customer_name,
            customer_email: selectedLeadForReview.customer_email,
            customer_phone: selectedLeadForReview.customer_phone,
            service_type: selectedLeadForReview.service_type || 'service'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        showToast(`⭐ Review request sent to ${selectedLeadForReview.customer_name}!`);
        setShowReviewModal(false);
      } else {
        showToast('Error sending review: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error sending review:', error);
      showToast('Error sending review', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const REVIEW_TEMPLATE = (name) => `Hi ${name}, will you help us with a review in our google profile? Flora Lawn & Landscaping Inc would love your feedback. Post a review to our profile: https://g.page/r/CQjJ-AbEL4N2EBE/review - Thank you very much!`;

  const filtered = leads.filter(l => {
    // Status Filter
    if (filter === 'upcoming') {
      if (l.status !== 'confirmed' || !l.scheduled_date) return false;
      const d = new Date(l.scheduled_date);
      const now = new Date();
      now.setHours(0,0,0,0);
      const weekLater = new Date();
      weekLater.setDate(now.getDate() + 7);
      weekLater.setHours(23,59,59,999);
      if (!(d >= now && d <= weekLater)) return false;
    } else if (filter !== 'all' && l.status !== filter) {
      return false;
    }

    // Search Filter
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.customer_name?.toLowerCase().includes(s) ||
      l.customer_email?.toLowerCase().includes(s) ||
      l.city?.toLowerCase().includes(s) ||
      l.service_type?.toLowerCase().includes(s)
    );
  });

  const counts = {
    pending: leads.filter(l => l.status === 'pending').length,
    scheduled: leads.filter(l => l.status === 'scheduled').length,
    confirmed: leads.filter(l => l.status === 'confirmed').length,
    upcoming: leads.filter(l => {
      if (l.status !== 'confirmed' || !l.scheduled_date) return false;
      const d = new Date(l.scheduled_date);
      const now = new Date();
      now.setHours(0,0,0,0);
      const weekLater = new Date();
      weekLater.setDate(now.getDate() + 7);
      weekLater.setHours(23,59,59,999);
      return d >= now && d <= weekLater;
    }).length,
    scratched: leads.filter(l => l.status === 'scratched').length,
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Segoe UI', sans-serif", padding: '0' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#334155' : '#22c55e',
          color: '#fff', padding: '14px 22px', borderRadius: 12,
          fontWeight: 800, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderBottom: '2px solid #22c55e', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900, fontStyle: 'italic' }}>Lead Pipeline</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Review · Schedule · Scratch</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/customers" style={{ padding: '10px 18px', background: '#1e293b', color: '#94a3b8', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 800, border: '1px solid #334155' }}>
              👥 Customers
            </Link>
            <Link href="/contracts" style={{ padding: '10px 18px', background: '#1e293b', color: '#94a3b8', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 800, border: '1px solid #334155' }}>
              📋 Contracts
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Stat Tabs & Bulk Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'pending', label: '🕐 Pending', count: counts.pending, color: '#f59e0b' },
            { key: 'upcoming', label: '🚀 Upcoming', count: counts.upcoming, color: '#ec4899' },
            { key: 'confirmed', label: '✅ Confirmed', count: counts.confirmed, color: '#3b82f6' },
            { key: 'scheduled', label: '📅 Scheduled', count: counts.scheduled, color: '#22c55e' },
            { key: 'scratched', label: '🗑️ Scratched', count: counts.scratched, color: '#64748b' },
            { key: 'all', label: '📋 All', count: leads.length, color: '#94a3b8' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setFilter(tab.key); setSelectedIds([]); }} style={{
              padding: '12px 20px', borderRadius: 12, border: filter === tab.key ? `2px solid ${tab.color}` : '2px solid #334155',
              background: filter === tab.key ? `${tab.color}18` : '#1e293b',
              color: filter === tab.key ? tab.color : '#64748b',
              fontWeight: 900, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {tab.label}
              <span style={{
                background: filter === tab.key ? tab.color : '#334155',
                color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 900
              }}>{tab.count}</span>
            </button>
          ))}

          {/* Bulk Action Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={actionLoading === 'bulk-delete'}
              style={{
                background: '#ef4444', color: '#fff', border: 'none', padding: '12px 20px',
                borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer',
                animation: 'fadeIn 0.2s ease', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              🗑️ Delete Selected ({selectedIds.length})
            </button>
          )}

          {/* Search */}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, city…"
              style={{
                padding: '12px 16px 12px 40px', borderRadius: 12, border: '1px solid #334155',
                background: '#1e293b', color: '#fff', fontSize: 13, width: 240, outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          </div>
        </div>

        {/* List Header with Select All */}
        {filtered.length > 0 && (
          <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22c55e' }}
            />
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Select All Visible Leads ({filtered.length})
            </span>
          </div>
        )}

        {/* Lead Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#475569', fontSize: 16, fontWeight: 700 }}>Loading leads…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#475569', fontWeight: 700, fontSize: 16 }}>No leads in this view</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map(lead => {
              const condition = CONDITIONS[lead.cleanup_condition_level];
              const isCleanup = lead.cleanup_condition_level != null;

              return (
                <div key={lead.id} style={{
                  background: '#1e293b', border: lead.status === 'pending' ? '1px solid #334155' : lead.status === 'scheduled' ? '1px solid #22c55e44' : '1px solid #334155',
                  borderRadius: 18, overflow: 'hidden', transition: 'transform 0.15s',
                }}>
                  {/* Card Top */}
                  <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>

                    {/* Checkbox */}
                    <div style={{ paddingTop: 14 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleSelectOne(lead.id)}
                        style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#22c55e' }}
                      />
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                    }}>
                      {lead.customer_name?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>{lead.customer_name}</span>
                        <span style={{
                          background: lead.status === 'pending' ? '#f59e0b22' : lead.status === 'scheduled' ? '#22c55e22' : lead.status === 'confirmed' ? '#3b82f622' : '#33415522',
                          color: lead.status === 'pending' ? '#f59e0b' : lead.status === 'scheduled' ? '#22c55e' : lead.status === 'confirmed' ? '#3b82f6' : '#64748b',
                          border: `1px solid ${lead.status === 'pending' ? '#f59e0b44' : lead.status === 'scheduled' ? '#22c55e44' : lead.status === 'confirmed' ? '#3b82f644' : '#334155'}`,
                          borderRadius: 99, padding: '2px 10px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em'
                        }}>
                          {lead.status}
                        </span>
                        <span style={{ color: '#475569', fontSize: 11, fontWeight: 700 }}>{timeAgo(lead.created_at)}</span>
                      </div>

                      {/* Contact chips */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {lead.customer_phone && (
                          <a href={`tel:${lead.customer_phone}`} style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                            📞 {lead.customer_phone}
                          </a>
                        )}
                        {lead.customer_email && (
                          <a href={`mailto:${lead.customer_email}`} style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                            📧 {lead.customer_email}
                          </a>
                        )}
                        {lead.address && (
                          <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>📍 {lead.address}</span>
                        )}
                      </div>

                      {/* Service + Estimate Preference */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {lead.service_type && (
                          <span style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 800 }}>
                            🏗️ {lead.service_type}
                          </span>
                        )}
                        {lead.estimate_preference && (
                          <span style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
                            {lead.estimate_preference === 'meet_person' ? '🤝 Wants In-Person' : '📧 Email Pricing OK'}
                          </span>
                        )}
                        {lead.scheduled_date && (
                          <span style={{ background: '#3b82f622', border: '1px solid #3b82f644', color: '#3b82f6', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 800 }}>
                            📅 {new Date(lead.scheduled_date).toLocaleDateString()}
                          </span>
                        )}
                        {lead.discount_applied && (
                          <span style={{ background: '#14532d22', border: '1px solid #22c55e44', color: '#86efac', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 800 }}>
                            💎 10% Visual Credit
                          </span>
                        )}
                        {lead.has_media && (
                          <span style={{ background: '#1e3a5f', border: '1px solid #3b82f644', color: '#93c5fd', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
                            📸 Has Photos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      {lead.status !== 'scratched' && lead.status !== 'scheduled' && (
                        <>
                          <button onClick={() => setSelectedLead(lead)} style={{
                            padding: '10px 18px', background: '#22c55e', color: '#fff', border: 'none',
                            borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer'
                          }}>
                            📅 Schedule
                          </button>
                          <button onClick={() => {
                            setSelectedLeadForReview(lead);
                            setReviewMessage(REVIEW_TEMPLATE(lead.customer_name));
                            setShowReviewModal(true);
                          }} style={{
                            padding: '10px 14px', background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44',
                            borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer'
                          }}>
                            ⭐ Review
                          </button>
                          <button onClick={() => handleScratch(lead)} disabled={actionLoading === lead.id + '-scratch'} style={{
                            padding: '10px 14px', background: '#1e293b', color: '#ef4444', border: '1px solid #ef444444',
                            borderRadius: 10, fontWeight: 900, fontSize: 13, cursor: 'pointer'
                          }}>
                            🗑️ Scratch
                          </button>
                        </>
                      )}
                      {lead.status === 'scheduled' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 13 }}>📅 Scheduled</span>
                          <button onClick={() => handleConfirm(lead)} disabled={actionLoading === lead.id + '-confirm'} style={{
                            padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none',
                            borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}>
                            ✅ Confirm Job
                          </button>
                        </div>
                      )}
                      {lead.status === 'confirmed' && (
                        <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          ✨ Confirmed Job
                        </span>
                      )}
                      {lead.status === 'scratched' && (
                        <button onClick={() => handleRestore(lead)} disabled={actionLoading === lead.id + '-restore'} style={{
                          padding: '10px 14px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                          borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer'
                        }}>
                          ↩️ Restore
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cleanup Assessment Bar */}
                  {isCleanup && (
                    <div style={{ background: '#0f172a', padding: '12px 24px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🍂 Cleanup</span>
                      {lead.cleanup_last_cleaned && (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Last Cleaned: <strong style={{ color: '#fff' }}>{lead.cleanup_last_cleaned}</strong></span>
                      )}
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
                        Condition: <strong style={{ color: condition?.color }}>{lead.cleanup_condition_level}/5 — {condition?.label || lead.cleanup_condition_label}</strong>
                      </span>
                      <div style={{ flex: 1, minWidth: 80, height: 6, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${lead.cleanup_condition_level * 20}%`, background: `linear-gradient(to right, #22c55e, ${condition?.color})`, borderRadius: 99 }} />
                      </div>
                    </div>
                  )}

                  {/* Message preview */}
                  {lead.notes && (
                    <div style={{ padding: '10px 24px 16px', borderTop: '1px solid #334155' }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontStyle: 'italic', lineHeight: 1.6, borderLeft: '3px solid #22c55e', paddingLeft: 12 }}>
                        "{lead.notes.length > 160 ? lead.notes.slice(0, 160) + '…' : lead.notes}"
                      </p>
                    </div>
                  )}

                  {/* Media links */}
                  {lead.media_urls && lead.media_urls.length > 0 && (
                    <div style={{ padding: '0 24px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {lead.media_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                          padding: '6px 12px', background: '#0f172a', border: '1px solid #334155',
                          borderRadius: 8, color: '#93c5fd', fontSize: 11, fontWeight: 800, textDecoration: 'none'
                        }}>🖼️ Photo {i + 1}</a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Review Request Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 20, fontWeight: 900 }}>⭐ Send Review Request</h2>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Sending to {selectedLeadForReview?.customer_name}</p>

            <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Message
            </label>
            <textarea
              value={reviewMessage}
              onChange={e => setReviewMessage(e.target.value)}
              rows={6}
              style={{ width: '100%', padding: '16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff', fontSize: 13, resize: 'none', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={handleSendReview}
                disabled={actionLoading === selectedLeadForReview?.id + '-review'}
                style={{ flex: 1, padding: '14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
              >
                {actionLoading === selectedLeadForReview?.id + '-review' ? 'Sending…' : '⭐ Send Request'}
              </button>
              <button
                onClick={() => { setShowReviewModal(false); setSelectedLeadForReview(null); }}
                style={{ padding: '14px 20px', background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Schedule Modal */}
      {selectedLead && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 6px', color: '#fff', fontSize: 20, fontWeight: 900 }}>📅 Schedule Lead</h2>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>{selectedLead.customer_name} — {selectedLead.service_type}</p>

            <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Service Date (optional)
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
            />

            <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Internal Note (optional)
            </label>
            <textarea
              value={scheduleNote}
              onChange={e => setScheduleNote(e.target.value)}
              placeholder="e.g. Quoted $180, crew available Thursday…"
              rows={3}
              style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => handleSchedule(selectedLead)}
                disabled={actionLoading === selectedLead.id + '-schedule'}
                style={{ flex: 1, padding: '14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
              >
                {actionLoading === selectedLead.id + '-schedule' ? 'Saving…' : '✅ Confirm Schedule'}
              </button>
              <button
                onClick={() => { setSelectedLead(null); setScheduleDate(''); setScheduleNote(''); }}
                style={{ padding: '14px 20px', background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input[type='date']::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>
    </div>
  );
}
