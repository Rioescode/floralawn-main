'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  EnvelopeIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function EmailMarketingPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;

      // Filter active subscribers who opted in for email marketing
      // Check preferences.email.subscribe === true (the checkbox they checked)
      const activeSubscribers = data.filter(sub => 
        sub.is_active !== false && // Active or null/undefined (defaults to active)
        sub.preferences?.email?.subscribe === true && // Explicit email marketing consent
        !sub.unsubscribed_at
      );

      setSubscribers(activeSubscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const emailTemplates = {
    spring_cleanup: {
      name: 'Spring Cleanup',
      subject: '🌱 Spring is Here! Time for Your Lawn Cleanup',
      season: 'Spring',
      image: '/images/marketing/spring-cleanup.png',
      months: ['March', 'April', 'May'],
      content: `Hi [Name],

Spring is the perfect time to give your lawn a fresh start! After a long winter, your yard needs some TLC to look its best.

🌿 Our Spring Cleanup Service Includes:
• Leaf and debris removal
• Lawn raking and dethatching
• Pruning and trimming
• Garden bed preparation
• Mulch application

💰 Special Spring Offer: 15% OFF your first spring cleanup!
Use code: SPRING15

📞 Schedule your spring cleanup today: (401) 389-0913

Let's make your lawn the envy of the neighborhood!

Best regards,
Flora Lawn & Landscaping Team`
    },
    mulch_season: {
      name: 'Mulch Season',
      subject: '🌿 Mulch Season is Here - Protect Your Landscaping',
      season: 'Spring/Summer',
      image: '/images/marketing/mulch-installation.png',
      months: ['April', 'May', 'June'],
      content: `Hi [Name],

It's mulch season! Fresh mulch not only makes your landscaping look beautiful, but it also:
• Retains moisture for your plants
• Prevents weed growth
• Protects plant roots from temperature changes
• Adds nutrients to your soil

🌳 We offer premium mulch in various types:
• Hardwood mulch
• Pine bark mulch
• Colored mulch (black, brown, red)
• Organic compost mulch

💰 Special Offer: 20% OFF mulch installation this month!
Use code: MULCH20

📞 Call us to schedule: (401) 389-0913

Transform your landscaping today!

Best regards,
Flora Lawn & Landscaping Team`
    },
    summer_maintenance: {
      name: 'Summer Maintenance',
      subject: '☀️ Keep Your Lawn Green All Summer Long',
      season: 'Summer',
      image: '/images/marketing/summer-maintenance.png',
      months: ['June', 'July', 'August'],
      content: `Hi [Name],

Summer heat can be tough on your lawn! Regular maintenance is key to keeping it healthy and green.

🌱 Our Summer Maintenance Includes:
• Regular mowing and edging
• Fertilization and weed control
• Proper watering guidance
• Pest and disease prevention
• Aeration if needed

💧 Summer Lawn Care Tips:
• Water early morning (6-10 AM)
• Mow higher to protect roots
• Keep mower blades sharp
• Watch for brown patches

💰 Summer Special: 10% OFF recurring maintenance services
Use code: SUMMER10

📞 Schedule your summer maintenance: (401) 389-0913

Keep your lawn looking great all season!

Best regards,
Flora Lawn & Landscaping Team`
    },
    fall_cleanup: {
      name: 'Fall Cleanup',
      subject: '🍂 Fall Cleanup - Prepare Your Yard for Winter',
      season: 'Fall',
      image: '/images/marketing/fall-cleanup.png',
      months: ['September', 'October', 'November'],
      content: `Hi [Name],

Fall is here, and it's time to prepare your yard for winter! Proper fall cleanup ensures a healthy lawn next spring.

🍁 Our Fall Cleanup Service Includes:
• Leaf removal and disposal
• Lawn aeration
• Overseeding for thicker grass
• Pruning and trimming
• Winter preparation

🌰 Why Fall Cleanup Matters:
• Prevents disease and pests
• Protects your lawn over winter
• Ensures healthy spring growth
• Keeps your property looking neat

💰 Fall Special: 15% OFF fall cleanup services
Use code: FALL15

📞 Schedule your fall cleanup: (401) 389-0913

Prepare your yard for a beautiful spring!

Best regards,
Flora Lawn & Landscaping Team`
    },
    holiday_coupon: {
      name: 'Holiday Coupon',
      subject: '🎁 Special Holiday Discount - Limited Time!',
      season: 'Holiday',
      image: '/images/marketing/holiday-specials.png',
      months: ['December', 'January'],
      content: `Hi [Name],

Happy Holidays from Flora Lawn & Landscaping! We're grateful for your business this year.

🎁 Special Holiday Offer:
Get 25% OFF any service when you book before [Date]!

Perfect for:
• Gift certificates
• Pre-paying for spring services
• One-time cleanups
• New service installations

💰 Use code: HOLIDAY25

📞 Call us today: (401) 389-0913

Thank you for choosing Flora Lawn & Landscaping!

Best regards,
Flora Lawn & Landscaping Team`
    },
    seasonal_reminder: {
      name: 'Seasonal Reminder',
      subject: '📅 Time for Your Seasonal Service',
      season: 'All Seasons',
      image: '/images/marketing/summer-maintenance.png',
      months: ['All'],
      content: `Hi [Name],

It's that time of year again! Regular seasonal maintenance keeps your lawn healthy and beautiful.

🌿 This Season's Services:
• [Season-specific service 1]
• [Season-specific service 2]
• [Season-specific service 3]

Don't wait - schedule now to ensure availability!

📞 Call us: (401) 389-0913

We look forward to serving you!

Best regards,
Flora Lawn & Landscaping Team`
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) return;

    setSending(true);
    try {
      const template = emailTemplates[selectedTemplate];
      const activeSubscribers = filteredSubscribers.filter(sub => sub.is_active);

      // Send emails via API
      const response = await fetch('/api/send-marketing-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          subscribers: activeSubscribers.map(sub => ({
            email: sub.email,
            name: sub.name
          }))
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Successfully sent ${result.sent} emails!`);
        setShowSendModal(false);
        setSelectedTemplate(null);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('❌ Failed to send emails. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-green-400 mb-6 border border-green-500/20">
              <EnvelopeIcon className="w-3 h-3" />
              Elite Marketing Suite
           </div>
           <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase">Email <span className="text-green-500">Marketing</span></h1>
           <p className="text-xl text-slate-400 font-medium italic">Manage elite subscribers and deploy premium seasonal campaigns.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Total Subscribers', value: subscribers.length, icon: UserGroupIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Active Subscribers', value: subscribers.filter(s => s.is_active).length, icon: EnvelopeIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Current Season', value: getCurrentSeason(), icon: CalendarIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-all group overflow-hidden relative">
              <div className={`absolute -right-4 -bottom-4 w-32 h-32 ${stat.bg} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity`} />
              <div className="relative z-10 flex items-center gap-6">
                <div className={`w-16 h-16 ${stat.bg} rounded-2xl flex items-center justify-center border border-white/5`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-4xl font-black italic tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Email Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 h-full">
              <h2 className="text-2xl font-black italic uppercase tracking-wider mb-8 flex items-center gap-3">
                 Templates <PaperAirplaneIcon className="w-5 h-5 text-green-500" />
              </h2>
              <div className="space-y-4">
                {Object.entries(emailTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedTemplate(key);
                      setShowSendModal(true);
                    }}
                    className="w-full group text-left p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-green-500 hover:bg-green-500/5 transition-all outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-green-400 transition-colors mb-1">{template.season}</p>
                        <p className="text-xl font-black italic text-white leading-tight">{template.name}</p>
                      </div>
                      <PaperAirplaneIcon className="w-6 h-6 text-slate-600 group-hover:text-green-500 group-hover:translate-x-2 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subscribers List */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] h-full overflow-hidden flex flex-col">
              <div className="p-10 border-b border-white/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <h2 className="text-2xl font-black italic uppercase tracking-wider">Subscribers</h2>
                  <div className="relative w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search Elite Clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-80 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:border-green-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-x-auto">
                {loading ? (
                  <div className="p-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
                  </div>
                ) : filteredSubscribers.length === 0 ? (
                  <div className="p-20 text-center">
                    <UserGroupIcon className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-20" />
                    <p className="text-slate-500 font-bold italic">No elite subscribers matching your criteria.</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Preferences</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredSubscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="font-black text-white italic group-hover:text-green-500 transition-colors uppercase tracking-tight">{subscriber.name}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{subscriber.city || 'Rhode Island'}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-300 text-sm mb-1">{subscriber.email}</div>
                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                               Joined {new Date(subscriber.subscribed_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-2">
                              {subscriber.preferences?.email?.subscribe && (
                                <span className="px-3 py-1 text-[8px] font-black bg-green-500/10 text-green-400 rounded-full border border-green-500/20 uppercase tracking-widest">Marketing</span>
                              )}
                              {subscriber.preferences?.email?.coupons && (
                                <span className="px-3 py-1 text-[8px] font-black bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20 uppercase tracking-widest">VIP</span>
                              )}
                              {subscriber.sms_consent && (
                                <span className="px-3 py-1 text-[8px] font-black bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-widest">SMS</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Email Modal */}
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-4xl relative">
            <div className="p-10 border-b border-white/5 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl z-10">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 leading-none">Campaign Deployment</p>
                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tight">
                        {emailTemplates[selectedTemplate].name}
                    </h3>
                </div>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-10">
              <div className="mb-8">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block text-center">Campaign Header Asset:</label>
                <div className="relative h-64 w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                    <img 
                        src={emailTemplates[selectedTemplate].image} 
                        alt="Campaign Header"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Elite Asset Connected</span>
                    </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Subject Line:</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black italic text-green-400">
                    {emailTemplates[selectedTemplate].subject}
                </div>
              </div>
              <div className="mb-10">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Elite Content Preview:</label>
                <div className="bg-[#1e293b] p-8 rounded-3xl border border-white/5 shadow-inner">
                  <pre className="whitespace-pre-wrap font-bold text-slate-300 font-sans leading-relaxed">
                    {emailTemplates[selectedTemplate].content}
                  </pre>
                </div>
              </div>
              
              <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-2xl mb-10 flex items-center gap-4">
                 <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-green-400" />
                 </div>
                 <p className="text-sm font-semibold text-slate-400 leading-tight">
                    This selection will be deployed to <span className="text-white font-black">{filteredSubscribers.length}</span> verified active subscribers.
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-8 py-5 border border-white/10 rounded-2xl text-white font-black uppercase text-xs tracking-widest hover:bg-white/5 transition-all"
                >
                  Abandone Campaign
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="flex-[2] px-8 py-5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-500 disabled:opacity-30 transition-all shadow-2xl shadow-green-900/40 relative overflow-hidden group"
                >
                   {sending ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        DEPLOYING...
                    </div>
                   ) : (
                    <div className="flex items-center justify-center gap-3">
                        DEPLOY CAMPAIGN <PaperAirplaneIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                   )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

