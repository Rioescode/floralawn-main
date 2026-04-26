'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/app/admin/error-boundary';
import '@/lib/error-handler';
import { format, parseISO } from 'date-fns';
import {
  UserPlusIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PaperClipIcon,
  SparklesIcon,
  TrashIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  MapIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

function SignUpsLeadsContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signUps, setSignUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [aiQuotes, setAiQuotes] = useState([]);
  const [filteredSignUps, setFilteredSignUps] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [filteredAiQuotes, setFilteredAiQuotes] = useState([]);
  const [emailConsentCount, setEmailConsentCount] = useState(0);
  const [smsConsentCount, setSmsConsentCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('signups');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSignUps();
      fetchLeads();
      fetchAiQuotes();
      
      // Set up real-time subscription for new leads
      const channel = supabase
        .channel('signups-leads-changes')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: 'status=eq.pending'
          },
          (payload) => {
            const newLead = payload.new;
            // Only refresh for contact form leads
            if (newLead.booking_type === 'Ready to Hire' || newLead.booking_type === 'Contract Request') {
              console.log('New lead detected in Sign Ups & Leads:', newLead);
              fetchLeads(); // Refresh leads list
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments'
          },
          () => {
            fetchLeads(); // Refresh when lead status changes
          }
        )
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profiles'
          },
          () => {
            fetchSignUps(); // Refresh when new user signs up
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterData();
  }, [searchTerm, statusFilter, sourceFilter, signUps, leads, aiQuotes]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || currentUser.email !== 'esckoofficial@gmail.com') {
        router.push('/');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignUps = async () => {
    try {
      // Use supabaseAdmin if available (server), otherwise fallback to supabase (client)
      const client = supabaseAdmin || supabase;
      
      // Fetch profiles (users who signed up)
      const { data: profiles, error: profilesError } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Format sign ups data
      const signUpsData = profiles.map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.email?.split('@')[0] || 'N/A',
        email: profile.email || 'N/A',
        phone: profile.phone || 'N/A',
        role: profile.role || (profile.is_professional ? 'professional' : 'customer'),
        created_at: profile.created_at,
        city: profile.location || profile.city || 'N/A',
        address: profile.address || 'N/A'
      }));

      setSignUps(signUpsData);
      setFilteredSignUps(signUpsData);
    } catch (error) {
      console.error('Error fetching sign ups:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      // Use supabaseAdmin if available (server), otherwise fallback to supabase (client)
      const client = supabaseAdmin || supabase;
      
      console.log('Fetching leads from appointments table...');
      
      // Fetch ALL leads from appointments table (no filter)
      const { data: leadsData, error } = await client
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching leads:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Fetched leads raw data:', leadsData?.length || 0, 'leads');
      console.log('leadsData is null/undefined?', leadsData === null || leadsData === undefined);
      console.log('Sample lead:', leadsData?.[0]);
      
      // Ensure leadsData is an array
      if (!leadsData || !Array.isArray(leadsData)) {
        console.warn('leadsData is not an array:', leadsData);
        setLeads([]);
        setFilteredLeads([]);
        return;
      }

      // Fetch email subscribers to get consent info for mapping to leads
      const { data: emailSubscribers, error: subscribersError } = await client
        .from('email_subscribers')
        .select('email, sms_consent, is_active, preferences');

      console.log('Fetched email subscribers:', emailSubscribers?.length || 0);

      // Query database directly for total email consent count
      // Count all subscribers where preferences.email.subscribe = true
      const { count: emailConsentCount, error: emailCountError } = await client
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('preferences->email->>subscribe', 'true')
        .is('is_active', null)
        .or('is_active.eq.true');

      // Also try alternative query in case the JSONB path is different
      const { count: emailConsentCountAlt, error: emailCountErrorAlt } = await client
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .not('preferences->email->>subscribe', 'is', null)
        .eq('preferences->email->>subscribe', 'true');

      // Query for SMS consent count
      const { count: smsConsentCount, error: smsCountError } = await client
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('sms_consent', true);

      console.log('Email consent count (query 1):', emailConsentCount);
      console.log('Email consent count (query 2):', emailConsentCountAlt);
      console.log('SMS consent count:', smsConsentCount);

      // Use the count from database query, or fallback to counting from fetched data
      let totalEmailConsent = emailConsentCount || emailConsentCountAlt || 0;
      let totalSmsConsent = smsConsentCount || 0;

      // Always count from fetched subscribers to ensure accuracy
      // Count ALL records where preferences.email.subscribe = true (regardless of is_active)
      totalEmailConsent = 0;
      totalSmsConsent = 0;
      
      if (emailSubscribers && !subscribersError) {
        emailSubscribers.forEach((sub, index) => {
          const emailKey = sub.email?.toLowerCase()?.trim();
          if (emailKey) {
            // Email consent: count ALL where preferences.email.subscribe = true
            // Don't check is_active - count all with email subscribe = true
            const hasEmailSubscribe = sub.preferences?.email?.subscribe === true;
            
            const smsConsent = sub.sms_consent === true;
            
            // Debug first 10 to see data structure
            if (index < 10) {
              console.log(`Subscriber ${index + 1}:`, {
                email: emailKey,
                is_active: sub.is_active,
                preferences: JSON.stringify(sub.preferences),
                emailSubscribe: sub.preferences?.email?.subscribe,
                hasEmailSubscribe,
                sms_consent: sub.sms_consent,
                smsConsent
              });
            }
            
            // Count ALL with email subscribe = true (for stats display)
            if (hasEmailSubscribe) {
              totalEmailConsent++;
            }
            if (smsConsent) {
              totalSmsConsent++;
            }
          }
        });
      }
      
      console.log('Counted from fetched subscribers - Email consent:', totalEmailConsent);
      console.log('Counted from fetched subscribers - SMS consent:', totalSmsConsent);

      // Build subscribers map for matching with leads
      const subscribersMap = {};
      if (emailSubscribers && !subscribersError) {
        emailSubscribers.forEach(sub => {
          const emailKey = sub.email?.toLowerCase()?.trim();
          if (emailKey) {
            const isActive = sub.is_active !== false;
            const hasEmailSubscribe = sub.preferences?.email?.subscribe === true;
            const emailConsent = isActive && hasEmailSubscribe;
            
            subscribersMap[emailKey] = {
              emailConsent: emailConsent,
              smsConsent: sub.sms_consent === true
            };
          }
        });
      }

      console.log('Total email consent from database:', totalEmailConsent);
      console.log('Total SMS consent from database:', totalSmsConsent);
      
      // Update consent counts for display in stats cards
      setEmailConsentCount(totalEmailConsent);
      setSmsConsentCount(totalSmsConsent);

      const formattedLeads = (leadsData || []).map(lead => {
        const emailKey = lead.customer_email?.toLowerCase()?.trim();
        const subscriberConsent = subscribersMap[emailKey] || { emailConsent: false, smsConsent: false };
        
        // Email consent ONLY from explicit checkbox in contact form (email_subscribers table)
        // Having an email address does NOT count as consent for marketing emails
        const emailConsent = subscriberConsent.emailConsent; // Only explicit consent
        const smsConsent = subscriberConsent.smsConsent; // SMS consent only from explicit opt-in
        
        // Track if they have email at all (for display purposes, not consent)
        const hasEmail = lead.customer_email && lead.customer_email !== 'N/A';
        
        return {
          id: lead.id,
          name: lead.customer_name || 'N/A',
          email: lead.customer_email || 'N/A',
          phone: lead.customer_phone || 'N/A',
          service: lead.service_type || 'N/A',
          city: lead.city || 'N/A',
          address: lead.street_address || 'N/A',
          date: lead.date,
          status: lead.status || 'pending',
          booking_type: lead.booking_type || 'N/A',
          notes: lead.notes || '',
          created_at: lead.created_at,
          customer_id: lead.customer_id,
          emailConsent: emailConsent,
          smsConsent: smsConsent,
          hasEmailAddress: hasEmail // Track if they have email at all
        };
      });
      
      console.log('Formatted leads consent stats:', {
        total: formattedLeads.length,
        withEmail: formattedLeads.filter(l => l.hasEmailAddress).length,
        emailConsent: formattedLeads.filter(l => l.emailConsent).length,
        smsConsent: formattedLeads.filter(l => l.smsConsent).length,
        subscribersTotal: emailSubscribers?.length || 0
      });

      console.log('Formatted leads:', formattedLeads?.length || 0, 'leads');
      console.log('Sample formatted lead:', formattedLeads?.[0]);
      
      setLeads(formattedLeads || []);
      setFilteredLeads(formattedLeads || []);
      
      console.log('Leads state updated. Total leads:', formattedLeads?.length || 0);
    } catch (error) {
      console.error('Error fetching leads:', error);
      console.error('Error stack:', error.stack);
      // Set empty array on error to prevent undefined state
      setLeads([]);
      setFilteredLeads([]);
    }
  };

  const fetchAiQuotes = async () => {
    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAiQuotes(data || []);
      setFilteredAiQuotes(data || []);
    } catch (error) {
      console.error('Error fetching AI quotes:', error);
    }
  };

  const deleteAiQuote = async (id) => {
    if (confirm('Permanently delete this AI property quote?')) {
      try {
        const client = supabaseAdmin || supabase;
        await client.from('leads').delete().eq('id', id);
        fetchAiQuotes();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const filterData = () => {
    // Filter sign ups
    let filtered = signUps.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.phone && item.phone.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
    setFilteredSignUps(filtered);

    // Filter leads
    let filteredLeadsData = leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.service && lead.service.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.booking_type === sourceFilter;
      
      return matchesSearch && matchesStatus && matchesSource;
    });
    setFilteredLeads(filteredLeadsData);

    // Filter AI Quotes
    let filteredAiQuotesData = aiQuotes.filter(quote => {
      const matchesSearch = searchTerm === '' || 
        quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.address && quote.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredAiQuotes(filteredAiQuotesData);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const uniqueBookingTypes = [...new Set(leads.map(lead => lead.booking_type))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Ups & Leads</h1>
          <p className="text-gray-600">View all user sign-ups and lead inquiries</p>
        </div>

        {/* Premium Stat HUD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 font-['Outfit']">Global Sign-ups</p>
                <h3 className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tighter">{signUps.length}</h3>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                <UsersIcon className="h-6 w-6 text-emerald-600 group-hover:text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 font-['Outfit']">Pending Leads</p>
                <h3 className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tighter">{leads.filter(l => l.status === 'pending').length}</h3>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                <ClockIcon className="h-6 w-6 text-amber-600 group-hover:text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 font-['Outfit']">Active Quotes</p>
                <h3 className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tighter">{aiQuotes.length}</h3>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                <SparklesIcon className="h-6 w-6 text-emerald-600 group-hover:text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1 font-['Outfit']">Consent Vault</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tighter">{leads.filter(l => l.emailConsent || l.smsConsent).length}</span>
                   <span className="text-[10px] font-bold text-slate-400 font-['Outfit'] uppercase">OPT-IN</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                <CheckCircleIcon className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* High-Fidelity Tab Switcher */}
        <div className="mb-10">
          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-2 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between overflow-x-auto no-scrollbar">
            <nav className="flex items-center p-1 gap-2" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('signups')}
                className={`flex items-center gap-2 px-8 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-widest transition-all duration-500 font-['Outfit'] ${
                  activeTab === 'signups'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 ring-4 ring-slate-900/10'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Sign Ups <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'signups' ? 'bg-white/20' : 'bg-slate-100'}`}>{signUps.length}</span>
              </button>
              
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center gap-2 px-8 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-widest transition-all duration-500 font-['Outfit'] ${
                  activeTab === 'leads'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-600/10'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                In-Bound Leads <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'leads' ? 'bg-white/20' : 'bg-emerald-100/50'}`}>{leads.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('aiQuotes')}
                className={`relative flex items-center gap-2 px-8 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-widest transition-all duration-500 font-['Outfit'] ${
                  activeTab === 'aiQuotes'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 ring-4 ring-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <SparklesIcon className={`w-4 h-4 ${activeTab === 'aiQuotes' ? 'text-emerald-400 animate-pulse' : ''}`} />
                AI Quotes Dossier
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'aiQuotes' ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>{aiQuotes.length}</span>
                {activeTab !== 'aiQuotes' && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full animate-ping"></span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            {activeTab === 'leads' && (
              <>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none"
                  >
                    <option value="all">All Sources</option>
                    {uniqueBookingTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sign Ups Table */}
        {activeTab === 'signups' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign Up Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSignUps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No sign-ups found
                      </td>
                    </tr>
                  ) : (
                    filteredSignUps.map((signUp) => (
                      <tr key={signUp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{signUp.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{signUp.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{signUp.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {signUp.city !== 'N/A' ? signUp.city : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {signUp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {signUp.created_at ? format(parseISO(signUp.created_at), 'MMM d, yyyy h:mm a') : '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Traditional Leads Table */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opt-In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No traditional leads found</td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{lead.name}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{lead.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-900">{lead.email}</div>
                          <div className="text-[10px] text-gray-400">{lead.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-xs text-slate-600 font-bold">{lead.service}</div>
                           <div className="text-[9px] text-purple-600 uppercase font-black">{lead.booking_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                           <div className="flex flex-col gap-1 items-center">
                             {lead.emailConsent && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold">EMAIL ✓</span>}
                             {lead.smsConsent && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold">SMS ✓</span>}
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {lead.created_at ? format(parseISO(lead.created_at), 'MMM d, h:mm a') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setEmailSubject(`Re: Your ${lead.service} Inquiry`);
                              setEmailMessage(`Hi ${lead.name},\n\nThank you for reaching out to Flora Lawn...`);
                              setShowEmailModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-all"
                          >
                            Reply
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Quotes Command Center */}
        {activeTab === 'aiQuotes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAiQuotes.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <SparklesIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold font-['Outfit']">No High-Fidelity AI Quotes captured yet.</p>
              </div>
            ) : (
              filteredAiQuotes.map((quote) => (
                <div key={quote.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-20 -mt-20 group-hover:bg-emerald-100 transition-all duration-700 blur-2xl opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full -ml-16 -mb-16 group-hover:bg-slate-100 transition-all duration-700 blur-2xl opacity-50"></div>
                  
                  {/* Header: Name & Status */}
                  <div className="relative flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2 font-['Outfit'] italic underline decoration-emerald-500/30 decoration-4 underline-offset-4">{quote.name}</h3>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <ShieldCheckIcon className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none font-['Outfit']">AI Verified Result</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block font-['Outfit']">{format(parseISO(quote.created_at), 'MMM d, yyyy')}</span>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter font-['Outfit']">{format(parseISO(quote.created_at), 'h:mm a')}</span>
                    </div>
                  </div>

                  {/* Core Metrics: HUD Style */}
                  <div className="relative grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-[1.5rem] p-5 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-['Outfit']">Mowable Area</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tighter">{quote.area?.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-slate-400 font-['Outfit']">SQFT</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50/80 backdrop-blur-sm rounded-[1.5rem] p-5 border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 font-['Outfit']">Total Quote</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-600 italic tracking-tighter font-['Outfit']">${quote.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="relative space-y-4 mb-10 pb-8 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 p-2.5 rounded-2xl shadow-inner group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all duration-500">
                        <MapIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 font-['Outfit']">Property Information</p>
                        <p className="text-sm font-bold text-slate-700 leading-snug font-['Outfit']">{quote.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 pl-14">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5 font-['Outfit']">Email Terminal</span>
                          <span className="text-xs font-bold text-slate-500 font-['Outfit']">{quote.email}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5 font-['Outfit']">Direct Secure</span>
                          <span className="text-xs font-bold text-slate-500 font-['Outfit']">{quote.phone}</span>
                       </div>
                    </div>
                  </div>

                  {/* Action Terminal */}
                  <div className="relative flex items-center justify-between">
                    <div>
                      {quote.discount > 0 ? (
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1.5 animate-bounce font-['Outfit']">Multi-Service Reward</span>
                           <div className="flex items-center gap-1.5">
                              <span className="text-2xl font-black text-amber-500 tracking-tighter font-['Outfit']">-${quote.discount.toLocaleString()}</span>
                              <span className="text-[10px] font-black text-amber-400/50 uppercase font-['Outfit'] italic">SAVED</span>
                           </div>
                        </div>
                      ) : (
                        <div className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Standard Rate</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => deleteAiQuote(quote.id)}
                         className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-100 rounded-2xl transition-all duration-300"
                       >
                         <TrashIcon className="w-5 h-5" />
                       </button>
                       <a 
                         href={`mailto:${quote.email}`}
                         className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 shadow-2xl shadow-slate-900/40 hover:shadow-emerald-500/40 flex items-center gap-3 active:scale-95 group/btn"
                       >
                         Execute Follow-up <PaperAirplaneIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                       </a>
                    </div>
                  </div>
                  
                  {/* Subtle Gradient Glow */}
                  <div className="absolute -bottom-1 top-auto left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Send Email to Lead</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLead.name} ({selectedLead.email})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEmailModal(false);
                      setSelectedLead(null);
                      setEmailSubject('');
                      setEmailMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Email subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Your message..."
                    />
                  </div>

                  {selectedLead.notes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-xs font-medium text-gray-700 mb-1">Lead's Original Message:</p>
                      <p className="text-sm text-gray-600">{selectedLead.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowEmailModal(false);
                        setSelectedLead(null);
                        setEmailSubject('');
                        setEmailMessage('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!emailSubject || !emailMessage) {
                          alert('Please fill in both subject and message');
                          return;
                        }

                        setSendingEmail(true);
                        try {
                          const response = await fetch('/api/leads/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              to: selectedLead.email,
                              subject: emailSubject,
                              message: emailMessage,
                              leadName: selectedLead.name
                            })
                          });

                          const result = await response.json();

                          if (response.ok && result.success) {
                            alert('Email sent successfully!');
                            setShowEmailModal(false);
                            setSelectedLead(null);
                            setEmailSubject('');
                            setEmailMessage('');
                          } else {
                            throw new Error(result.error || 'Failed to send email');
                          }
                        } catch (error) {
                          console.error('Error sending email:', error);
                          alert('Failed to send email: ' + error.message);
                        } finally {
                          setSendingEmail(false);
                        }
                      }}
                      disabled={sendingEmail}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {sendingEmail ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignUpsLeadsPage() {
  return (
    <ErrorBoundary>
      <SignUpsLeadsContent />
    </ErrorBoundary>
  );
}

