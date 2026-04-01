'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function LoyaltyRewards({ userId, customerId }) {
  const [loyaltyReward, setLoyaltyReward] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (userId || customerId) {
      fetchLoyaltyData();
    }
  }, [userId, customerId]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      
      // Fetch loyalty reward
      const rewardResponse = await fetch(`/api/loyalty?userId=${userId || ''}&customerId=${customerId || ''}`);
      const rewardData = await rewardResponse.json();
      
      if (rewardData.reward) {
        setLoyaltyReward(rewardData.reward);
        
        // Fetch transactions
        const transResponse = await fetch(`/api/loyalty/transactions?userId=${userId || ''}&customerId=${customerId || ''}`);
        const transData = await transResponse.json();
        setTransactions(transData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    const points = parseInt(pointsToRedeem);
    
    if (!points || points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    if (points > (loyaltyReward?.available_points || 0)) {
      alert(`You only have ${loyaltyReward?.available_points || 0} available points`);
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem',
          userId,
          customerId,
          pointsToRedeem: points,
          rewardDescription: `Redeemed ${points} loyalty points`
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setPointsToRedeem('');
        fetchLoyaltyData();
      } else {
        alert(data.error || 'Failed to redeem points');
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      alert('Error redeeming points. Please try again.');
    } finally {
      setRedeeming(false);
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

  const getPointsValue = (points) => {
    return (points * 0.02).toFixed(2); // 1 point = $0.02 (2% back)
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!loyaltyReward) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">No loyalty account found. Your account will be created automatically after your first service.</p>
      </div>
    );
  }

  const tierInfo = getTierInfo(loyaltyReward.loyalty_tier);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loyalty Rewards</h2>
        <p className="text-gray-600">
          Earn points with every service and redeem them for discounts!
        </p>
      </div>

      {/* Tier and Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${tierInfo.color} rounded-lg p-6 text-center`}>
          <div className="text-4xl mb-2">{tierInfo.icon}</div>
          <div className="text-xl font-bold">{tierInfo.name} Member</div>
          <div className="text-sm mt-1">Current Tier</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-green-200">
          <div className="text-3xl font-bold text-green-600">{loyaltyReward.available_points || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Available Points</div>
          <div className="text-xs text-gray-500 mt-1">${getPointsValue(loyaltyReward.available_points || 0)} value</div>
          <div className="text-xs text-orange-600 mt-1 font-medium">Points expire 1 year after earning</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{loyaltyReward.total_services_completed || 0}</div>
          <div className="text-sm text-gray-600 mt-1">Services Completed</div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-gray-900">{loyaltyReward.total_points || 0}</div>
          <div className="text-xs text-gray-600">Total Points</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-green-600">{loyaltyReward.available_points || 0}</div>
          <div className="text-xs text-gray-600">Available</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-purple-600">{loyaltyReward.redeemed_points || 0}</div>
          <div className="text-xs text-gray-600">Redeemed</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-yellow-600">${getPointsValue(loyaltyReward.available_points || 0)}</div>
          <div className="text-xs text-gray-600">Reward Balance</div>
          {(loyaltyReward.available_reward_balance || 0) > 0 && (
            <div className="text-xs text-gray-500 mt-1">Redeemed: ${(loyaltyReward.available_reward_balance || 0).toFixed(2)}</div>
          )}
        </div>
      </div>

      {/* Redeem Points */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 border-2 border-green-200">
        <h3 className="font-semibold text-gray-900 mb-3">Redeem Points</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
            placeholder="Enter points to redeem"
            min="1250"
            max={loyaltyReward.available_points || 0}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleRedeemPoints}
            disabled={redeeming || !pointsToRedeem}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {redeeming ? 'Redeeming...' : `Redeem ($${getPointsValue(parseInt(pointsToRedeem) || 0)})`}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          💡 1 point = $0.02 credit (2% back). Minimum redemption: 1250 points ($25.00)
        </p>
      </div>

      {/* Tier Benefits */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Tier Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className={`p-3 rounded-lg border-2 ${loyaltyReward.loyalty_tier === 'bronze' ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
            <div className="text-sm font-semibold">🥉 Bronze</div>
            <div className="text-xs text-gray-600 mt-1">1 point per $1 spent</div>
            <div className="text-xs text-gray-500 mt-1">0-999 points</div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${loyaltyReward.loyalty_tier === 'silver' ? 'border-gray-400 bg-gray-50' : 'border-gray-200'}`}>
            <div className="text-sm font-semibold">🥈 Silver</div>
            <div className="text-xs text-gray-600 mt-1">1.2 points per $1</div>
            <div className="text-xs text-gray-500 mt-1">1000-1999 points</div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${loyaltyReward.loyalty_tier === 'gold' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
            <div className="text-sm font-semibold">🥇 Gold</div>
            <div className="text-xs text-gray-600 mt-1">1.5 points per $1</div>
            <div className="text-xs text-gray-500 mt-1">2000-4999 points</div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${loyaltyReward.loyalty_tier === 'platinum' ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
            <div className="text-sm font-semibold">💎 Platinum</div>
            <div className="text-xs text-gray-600 mt-1">2 points per $1</div>
            <div className="text-xs text-gray-500 mt-1">100000+ points</div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {transaction.description || `${transaction.transaction_type} ${Math.abs(transaction.points)} points`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.service_type && `${transaction.service_type} • `}
                    {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                    {transaction.transaction_type === 'earned' && transaction.expiration_date && (
                      <span className="ml-2 text-xs text-orange-600">
                        • Expires {format(new Date(transaction.expiration_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.transaction_type === 'earned' || transaction.transaction_type === 'bonus'
                      ? 'bg-green-100 text-green-800'
                      : transaction.transaction_type === 'redeemed'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.transaction_type === 'earned' || transaction.transaction_type === 'bonus' ? '+' : ''}
                    {transaction.points} pts
                  </span>
                  {transaction.transaction_type === 'earned' && transaction.expiration_date && new Date(transaction.expiration_date) < new Date() && (
                    <div className="text-xs text-red-600 font-semibold mt-1">Expired</div>
                  )}
                  {transaction.point_value > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      ${transaction.point_value.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">How It Works</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Earn points automatically with every completed service</li>
          <li>• Higher tiers earn more points per dollar spent</li>
          <li>• Redeem points for service credits (1 point = $0.02, 2% back)</li>
          <li>• Points expire 1 year after being earned - use them before they expire!</li>
          <li>• Reach higher tiers for better earning rates and exclusive benefits</li>
        </ul>
      </div>
    </div>
  );
}

