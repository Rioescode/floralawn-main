'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/app/admin/error-boundary';
import '@/lib/error-handler';

function AdminLoyaltyContent() {
  const [loyaltyRewards, setLoyaltyRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rewards');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedReward, setSelectedReward] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchLoyaltyRewards();
    } else {
      fetchTransactions();
    }
  }, [activeTab]);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'esckoofficial@gmail.com') {
        window.location.href = '/';
        return;
      }
      fetchLoyaltyRewards();
    } catch (error) {
      console.error('Error checking admin:', error);
      window.location.href = '/';
    }
  };

  const fetchLoyaltyRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/loyalty?all=true');
      const data = await response.json();
      setLoyaltyRewards(data.rewards || []);
    } catch (error) {
      console.error('Error fetching loyalty rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedReward || !pointsToAdd) return;

    const points = parseInt(pointsToAdd);
    if (points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'earn',
          userId: selectedReward.user_id,
          customerId: selectedReward.customer_id,
          points: points,
          description: notes || `Admin adjustment: ${points} points`,
          serviceType: 'Admin Adjustment'
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Successfully added ${points} points!`);
        setShowEditModal(false);
        setPointsToAdd('');
        setNotes('');
        setSelectedReward(null);
        fetchLoyaltyRewards();
      } else {
        alert(data.error || 'Failed to add points');
      }
    } catch (error) {
      console.error('Error adding points:', error);
      alert('Error adding points. Please try again.');
    }
  };

  const getTierInfo = (tier) => {
    const tiers = {
      bronze: { name: 'Bronze', color: 'bg-amber-100 text-amber-800', icon: '🥉' },
      silver: { name: 'Silver', color: 'bg-gray-100 text-gray-800', icon: '🥈' },
      gold: { name: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: '🥇' },
      platinum: { name: 'Platinum', color: 'bg-purple-100 text-purple-800', icon: '💎' }
    };
    return tiers[tier] || tiers.bronze;
  };

  const getStats = () => {
    const totalMembers = loyaltyRewards.length;
    const totalPoints = loyaltyRewards.reduce((sum, r) => sum + (r.total_points || 0), 0);
    const totalRedeemed = loyaltyRewards.reduce((sum, r) => sum + (r.redeemed_points || 0), 0);
    const totalRewards = loyaltyRewards.reduce((sum, r) => sum + ((r.available_points || 0) * 0.02), 0);
    const tierCounts = {
      bronze: loyaltyRewards.filter(r => r.loyalty_tier === 'bronze').length,
      silver: loyaltyRewards.filter(r => r.loyalty_tier === 'silver').length,
      gold: loyaltyRewards.filter(r => r.loyalty_tier === 'gold').length,
      platinum: loyaltyRewards.filter(r => r.loyalty_tier === 'platinum').length
    };

    return { totalMembers, totalPoints, totalRedeemed, totalRewards, tierCounts };
  };

  const stats = getStats();
  const filteredRewards = loyaltyRewards.filter(reward => {
    const matchesSearch = !searchTerm || 
      reward.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || reward.loyalty_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  if (loading && loyaltyRewards.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading loyalty data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Rewards Dashboard</h1>
            <p className="text-gray-600">Manage customer loyalty program, points, and rewards</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{stats.totalMembers}</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.totalRedeemed.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Points Redeemed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">${stats.totalRewards.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Reward Balance</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.tierCounts.platinum + stats.tierCounts.gold}</div>
              <div className="text-sm text-gray-600">Premium Members</div>
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <div className="text-xl font-bold text-amber-800">🥉 {stats.tierCounts.bronze}</div>
              <div className="text-sm text-amber-600">Bronze</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="text-xl font-bold text-gray-800">🥈 {stats.tierCounts.silver}</div>
              <div className="text-sm text-gray-600">Silver</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="text-xl font-bold text-yellow-800">🥇 {stats.tierCounts.gold}</div>
              <div className="text-sm text-yellow-600">Gold</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="text-xl font-bold text-purple-800">💎 {stats.tierCounts.platinum}</div>
              <div className="text-sm text-purple-600">Platinum</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('rewards')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rewards'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Loyalty Members ({loyaltyRewards.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions ({transactions.length})
              </button>
            </nav>
          </div>

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <>
              {/* Search and Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>

              {/* Rewards Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRewards.map((reward) => {
                      const tierInfo = getTierInfo(reward.loyalty_tier);
                      return (
                        <tr key={reward.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reward.customer_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">{reward.customer_email || 'No email'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
                              {tierInfo.icon} {tierInfo.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{reward.total_points || 0}</div>
                            <div className="text-xs text-gray-500">
                              {reward.available_points || 0} available
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reward.total_services_completed || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              ${((reward.available_points || 0) * 0.02).toFixed(2)}
                            </div>
                            {(reward.available_reward_balance || 0) > 0 && (
                              <div className="text-xs text-gray-500">
                                Redeemed: ${(reward.available_reward_balance || 0).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedReward(reward);
                                setShowEditModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Add Points
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'earned' || transaction.transaction_type === 'bonus'
                            ? 'bg-green-100 text-green-800'
                            : transaction.transaction_type === 'redeemed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {transaction.transaction_type === 'earned' || transaction.transaction_type === 'bonus' ? '+' : ''}
                        {transaction.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.point_value?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description || transaction.service_type || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Points</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer: {selectedReward.customer_name || selectedReward.customer_email}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Points: {selectedReward.total_points || 0}
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points to Add
              </label>
              <input
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                placeholder="Enter points"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adding points..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddPoints}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Points
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedReward(null);
                  setPointsToAdd('');
                  setNotes('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminLoyaltyDashboard() {
  return (
    <ErrorBoundary>
      <AdminLoyaltyContent />
    </ErrorBoundary>
  );
}

