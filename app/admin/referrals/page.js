'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/app/admin/error-boundary';
import '@/lib/error-handler';
import { format } from 'date-fns';

function AdminReferralsContent() {
  const [referrals, setReferrals] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // all, leaderboard, recent, invitations
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || currentUser.email !== 'esckoofficial@gmail.com') {
      router.push('/');
      return;
    }
    setUser(currentUser);
    fetchReferrals();
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const [referralsRes, invitationsRes] = await Promise.all([
        fetch('/api/referrals?all=true'),
        fetch('/api/referrals/invite?all=true')
      ]);
      
      const referralsData = await referralsRes.json();
      const invitationsData = await invitationsRes.json();
      
      setReferrals(referralsData.referrals || []);
      setInvitations(invitationsData.invitations || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate reward amount based on referral number
  const calculateReward = (referralNumber) => {
    if (referralNumber <= 5) {
      return 20 + (referralNumber * 5); // $25, $30, $35, $40, $45
    } else if (referralNumber <= 24) {
      return 45 + ((referralNumber - 5) * 2); // $47, $49, $51... up to $83
    } else {
      return 100; // Maximum at 25th+
    }
  };

  const updateReferralStatus = async (referralId, status, rewardStatus, rewardAmount) => {
    try {
      console.log('Updating referral:', { referralId, status, rewardStatus, rewardAmount });
      
      const response = await fetch('/api/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId,
          status,
          rewardStatus,
          rewardAmount
        })
      });

      const data = await response.json();
      console.log('API response:', data);

      if (response.ok) {
        await fetchReferrals();
        // Show success message
        if (rewardStatus === 'awarded') {
          alert(`Successfully awarded $${rewardAmount} reward!`);
        } else if (rewardStatus === 'pending' && rewardAmount === 0) {
          alert('Reward denied successfully.');
        }
      } else {
        alert(`Error: ${data.error || 'Failed to update referral status'}`);
        console.error('Error updating referral:', data);
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      alert(`Error: ${error.message || 'Failed to update referral status'}`);
    }
  };

  // Function to update missing referrer info for existing referrals
  const updateMissingReferrerInfo = async () => {
    try {
      const response = await fetch('/api/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'backfill'
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Successfully updated ${data.updated} referrals with missing referrer info!`);
        fetchReferrals();
      } else {
        alert('Error updating referrals: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating referrer info:', error);
      alert('Error updating referrals. Please try again.');
    }
  };

  // Get top referrers (leaderboard) - includes sent invitations count
  const getTopReferrers = () => {
    const referrerMap = {};
    
    // Process referrals
    referrals.forEach(ref => {
      const key = ref.referrer_email || ref.referrer_id || 'unknown';
      if (!referrerMap[key]) {
        referrerMap[key] = {
          name: ref.referrer_name || ref.referrer_email || 'Unknown',
          email: ref.referrer_email,
          code: ref.referral_code,
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          sentInvitations: 0,
          totalRewards: 0,
          referrals: []
        };
      }
      
      referrerMap[key].referrals.push(ref);
      referrerMap[key].totalReferrals++;
      
      if (ref.status === 'completed' || ref.status === 'rewarded') {
        referrerMap[key].completedReferrals++;
        // Calculate reward based on completed referral count
        const rewardAmount = calculateReward(referrerMap[key].completedReferrals);
        referrerMap[key].totalRewards += rewardAmount;
      } else if (ref.status === 'pending') {
        referrerMap[key].pendingReferrals++;
      }
    });
    
    // Add sent invitations count
    invitations.forEach(inv => {
      const key = inv.referrer_email || inv.referrer_id || 'unknown';
      if (!referrerMap[key]) {
        referrerMap[key] = {
          name: inv.referrer_name || inv.referrer_email || 'Unknown',
          email: inv.referrer_email,
          code: inv.referral_code,
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          sentInvitations: 0,
          totalRewards: 0,
          referrals: []
        };
      }
      referrerMap[key].sentInvitations++;
    });
    
    return Object.values(referrerMap)
      .sort((a, b) => b.completedReferrals - a.completedReferrals || b.sentInvitations - a.sentInvitations)
      .slice(0, 20); // Top 20
  };

  const topReferrers = getTopReferrers();

  // Filter referrals
  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = !searchTerm || 
      ref.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referrer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referral_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: referrals.length,
    completed: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    rewarded: referrals.filter(r => r.referrer_reward_status === 'awarded' || r.referrer_reward_status === 'redeemed').length,
    totalReferrers: new Set(referrals.map(r => r.referrer_email || r.referrer_id)).size,
    totalReferees: new Set(referrals.filter(r => r.referee_email).map(r => r.referee_email)).size,
    totalRewardsValue: topReferrers.reduce((sum, ref) => sum + ref.totalRewards, 0),
    sentInvitations: invitations.length,
    pendingInvitations: invitations.filter(i => i.status === 'invited').length,
    convertedInvitations: invitations.filter(i => i.status !== 'invited').length
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program Dashboard</h1>
          <p className="text-gray-600 mt-2">Track referrals, top performers, and manage rewards</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Referrals</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.rewarded}</div>
            <div className="text-xs text-gray-600">Rewarded</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
            <div className="text-2xl font-bold">${stats.totalRewardsValue}</div>
            <div className="text-xs opacity-90">Total Rewards</div>
          </div>
        </div>
        
        {/* Invitations Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{stats.sentInvitations}</div>
            <div className="text-xs text-orange-700">📨 Sent Invitations</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pendingInvitations}</div>
            <div className="text-xs text-gray-600">⏳ Pending Invites</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-teal-600">{stats.convertedInvitations}</div>
            <div className="text-xs text-gray-600">✅ Converted</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalReferrers}</div>
            <div className="text-xs text-gray-600">Active Referrers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.totalReferees}</div>
            <div className="text-xs text-gray-600">New Signups</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Referrals ({referrals.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'invitations'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📨 Sent Invitations ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏆 Leaderboard ({topReferrers.length})
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'recent'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Signups
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        {activeTab === 'all' && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rewarded">Rewarded</option>
            </select>
            {referrals.some(r => r.referrer_id && (!r.referrer_email || !r.referrer_name)) && (
              <button
                onClick={updateMissingReferrerInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Update Missing Info
              </button>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">🏆 Top Referrers</h2>
              <p className="text-sm text-gray-600 mt-1">Ranked by completed referrals</p>
            </div>
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : topReferrers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No referrers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">📨 Sent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rewards</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topReferrers.map((referrer, index) => (
                      <tr key={referrer.email || index} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                            {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                            {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                            <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{referrer.name}</div>
                          {referrer.email && (
                            <div className="text-sm text-gray-500">{referrer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                            {referrer.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            {referrer.sentInvitations}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{referrer.totalReferrals}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {referrer.completedReferrals}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            {referrer.pendingReferrals}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600">${referrer.totalRewards}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sent Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">📨 Sent Invitations</h2>
              <p className="text-sm text-gray-600 mt-1">Track all email invitations sent by customers to their friends</p>
            </div>
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : invitations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No invitations sent yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited Friend</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Sent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Converted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.referrer_name || invitation.referrer_email || 'Unknown'}
                          </div>
                          {invitation.referrer_email && (
                            <div className="text-sm text-gray-500">{invitation.referrer_email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.friend_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{invitation.friend_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                            {invitation.referral_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            invitation.status === 'rewarded'
                              ? 'bg-green-100 text-green-800'
                              : invitation.status === 'first_service_completed'
                              ? 'bg-blue-100 text-blue-800'
                              : invitation.status === 'signed_up'
                              ? 'bg-purple-100 text-purple-800'
                              : invitation.status === 'expired'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invitation.status === 'invited' && '⏳ Pending'}
                            {invitation.status === 'signed_up' && '✅ Signed Up'}
                            {invitation.status === 'first_service_completed' && '🎉 Service Done'}
                            {invitation.status === 'rewarded' && '🏆 Rewarded'}
                            {invitation.status === 'expired' && '⌛ Expired'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(invitation.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.signed_up_at ? (
                            <span className="text-green-600">
                              ✓ {format(new Date(invitation.signed_up_at), 'MMM d')}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Recent Signups Tab */}
        {activeTab === 'recent' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Signups via Referrals</h2>
              <p className="text-sm text-gray-600 mt-1">New customers who signed up using referral codes</p>
            </div>
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referee (New Signup)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signup Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referrals
                      .filter(r => r.referee_email)
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 50)
                      .map((referral) => (
                        <tr key={referral.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referee_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">{referral.referee_email}</div>
                            {referral.referee_phone && (
                              <div className="text-xs text-gray-400">{referral.referee_phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referrer_name || referral.referrer_email || 'Unknown'}
                            </div>
                            {referral.referrer_email && (
                              <div className="text-sm text-gray-500">{referral.referrer_email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                              {referral.referral_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              referral.status === 'completed' || referral.status === 'rewarded'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(referral.created_at), 'MMM d, yyyy h:mm a')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* All Referrals Tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">All Referrals</h2>
              <span className="text-sm text-gray-500">Showing {filteredReferrals.length} of {referrals.length}</span>
            </div>
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No referrals found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referee (Signup)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReferrals.map((referral) => {
                      // Find referral number for this referrer
                      const referrerRefs = referrals
                        .filter(r => (r.referrer_email === referral.referrer_email || r.referrer_id === referral.referrer_id) && 
                                   (r.status === 'completed' || r.status === 'rewarded'))
                        .sort((a, b) => new Date(a.completed_at || a.created_at) - new Date(b.completed_at || b.created_at));
                      const referralNumber = referrerRefs.findIndex(r => r.id === referral.id) + 1;
                      const rewardAmount = referral.status === 'completed' || referral.status === 'rewarded' 
                        ? calculateReward(referralNumber) 
                        : 0;
                      
                      return (
                        <tr key={referral.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {referral.referrer_id ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {referral.referrer_name || referral.referrer_email || 'Loading...'}
                                </div>
                                {referral.referrer_email && (
                                  <div className="text-sm text-gray-500">{referral.referrer_email}</div>
                                )}
                                {!referral.referrer_email && referral.referrer_id && (
                                  <div className="text-xs text-gray-400">ID: {referral.referrer_id.substring(0, 8)}...</div>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No referrer info</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referee_name || referral.referee_email || 'Pending'}
                            </div>
                            {referral.referee_email && (
                              <div className="text-sm text-gray-500">{referral.referee_email}</div>
                            )}
                            {referral.referee_phone && (
                              <div className="text-xs text-gray-400">{referral.referee_phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                              {referral.referral_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              referral.status === 'completed' || referral.status === 'rewarded'
                                ? 'bg-green-100 text-green-800'
                                : referral.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rewardAmount > 0 ? (
                              <div>
                                <span className="text-sm font-bold text-green-600">${rewardAmount}</span>
                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                  referral.referrer_reward_status === 'awarded' || referral.referrer_reward_status === 'redeemed'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {referral.referrer_reward_status || 'pending'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(referral.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              {referral.status === 'completed' && referral.referrer_reward_status === 'pending' && (
                                <button
                                  onClick={() => updateReferralStatus(referral.id, 'rewarded', 'awarded', rewardAmount)}
                                  className="text-green-600 hover:text-green-900 font-semibold text-left"
                                  title="Approve and award reward"
                                >
                                  ✓ Award ${rewardAmount}
                                </button>
                              )}
                              {referral.status === 'completed' && referral.referrer_reward_status === 'pending' && (
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to deny this reward? The referral will remain completed but no reward will be awarded.')) {
                                      updateReferralStatus(referral.id, 'completed', 'pending', 0);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 font-semibold text-left text-xs"
                                  title="Disapprove reward (keep as pending)"
                                >
                                  ✗ Deny Reward
                                </button>
                              )}
                              {(referral.referrer_reward_status === 'awarded' || referral.referrer_reward_status === 'redeemed') && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to revoke the ${referral.referrer_reward_status} reward of $${referral.referrer_reward_amount || rewardAmount}?`)) {
                                      updateReferralStatus(referral.id, 'completed', 'pending', 0);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 font-semibold text-left text-xs"
                                  title="Revoke awarded reward"
                                >
                                  ↻ Revoke Reward
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminReferralsPage() {
  return (
    <ErrorBoundary>
      <AdminReferralsContent />
    </ErrorBoundary>
  );
}

