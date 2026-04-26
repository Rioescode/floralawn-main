'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ReferralProgram({ userId, customerId }) {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    rewards: 0.00 // Total dollar amount of rewards
  });
  const [manualCode, setManualCode] = useState('');
  const [submittingManualCode, setSubmittingManualCode] = useState(false);
  const [manualCodeError, setManualCodeError] = useState('');
  const [manualCodeSuccess, setManualCodeSuccess] = useState('');
  const [usedReferralCode, setUsedReferralCode] = useState(null); // The code they used (as referee)
  
  // Invite friend state
  const [friendEmail, setFriendEmail] = useState('');
  const [friendName, setFriendName] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [sentInvitations, setSentInvitations] = useState([]);

  useEffect(() => {
    if (userId || customerId) {
      fetchReferralCode();
      fetchReferrals();
    }
  }, [userId, customerId]);

  // Fetch invitations when referral code is available
  useEffect(() => {
    if (referralCode) {
      fetchSentInvitations();
    }
  }, [referralCode]);

  const fetchReferralCode = async () => {
    try {
      const response = await fetch(`/api/referrals?userId=${userId || ''}&customerId=${customerId || ''}`);
      const data = await response.json();
      
      if (data.referrals && data.referrals.length > 0) {
        // Find the user's referral code (where they are the referrer)
        const myReferral = data.referrals.find(r => 
          r.referrer_id === userId || r.referrer_customer_id === customerId
        );
        if (myReferral) {
          // Check if code is in old format (doesn't start with FLORA)
          if (!myReferral.referral_code.startsWith('FLORA')) {
            // Auto-regenerate to new format
            regenerateReferralCode(myReferral.id);
          } else {
            setReferralCode(myReferral.referral_code);
          }
        } else {
          // Create one if doesn't exist
          createReferralCode();
        }
      } else {
        createReferralCode();
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
      createReferralCode();
    } finally {
      setLoading(false);
    }
  };

  const regenerateReferralCode = async (referralId) => {
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          referralId,
          userId,
          customerId
        })
      });

      const data = await response.json();
      if (data.referralCode) {
        setReferralCode(data.referralCode);
        // Refresh referrals list
        fetchReferrals();
      }
    } catch (error) {
      console.error('Error regenerating referral code:', error);
    }
  };

  const createReferralCode = async () => {
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId,
          customerId
        })
      });

      const data = await response.json();
      if (data.referralCode) {
        setReferralCode(data.referralCode);
      }
    } catch (error) {
      console.error('Error creating referral code:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch(`/api/referrals?userId=${userId || ''}&customerId=${customerId || ''}`);
      const data = await response.json();
      
      if (data.referrals) {
        const myReferrals = data.referrals.filter(r => 
          r.referrer_id === userId || r.referrer_customer_id === customerId
        );
        setReferrals(myReferrals);

        // Find if this user was referred by someone (they are a referee)
        const myRefereeRecord = data.referrals.find(r => 
          (r.referee_id === userId || r.referee_customer_id === customerId) &&
          r.referrer_id !== userId && r.referrer_customer_id !== customerId
        );
        if (myRefereeRecord) {
          setUsedReferralCode(myRefereeRecord.referral_code);
        }

        // Calculate stats and total rewards
        const completedReferrals = myReferrals.filter(r => r.status === 'completed' || r.status === 'rewarded');
        const pendingReferrals = myReferrals.filter(r => r.status === 'pending');
        
        // Calculate total reward amount (sum of all reward amounts, or calculate based on referral number)
        const calculateRewardAmount = (referralNumber) => {
          if (referralNumber <= 5) {
            return 20 + (referralNumber * 5); // $25, $30, $35, $40, $45
          } else if (referralNumber <= 24) {
            return 45 + ((referralNumber - 5) * 2); // $47, $49, $51... up to $83
          } else {
            return 100; // Maximum at 25th+
          }
        };
        
        // Sort completed referrals by date to calculate reward amounts
        const sortedCompleted = [...completedReferrals].sort((a, b) => 
          new Date(a.completed_at || a.created_at) - new Date(b.completed_at || b.created_at)
        );
        
        // Calculate total rewards: sum of actual reward amounts if set, otherwise calculate based on position
        let totalRewards = 0;
        sortedCompleted.forEach((referral, index) => {
          const referralNumber = index + 1;
          if (referral.referrer_reward_amount && parseFloat(referral.referrer_reward_amount) > 0) {
            totalRewards += parseFloat(referral.referrer_reward_amount);
          } else {
            // Calculate expected reward if not yet awarded
            totalRewards += calculateRewardAmount(referralNumber);
          }
        });
        
        setStats({
          total: myReferrals.length,
          completed: completedReferrals.length,
          pending: pendingReferrals.length,
          rewards: totalRewards // Total dollar amount of rewards
        });
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const fetchSentInvitations = async () => {
    try {
      const response = await fetch(`/api/referrals/invite?userId=${userId || ''}&customerId=${customerId || ''}&referralCode=${referralCode || ''}`);
      const data = await response.json();
      
      if (data.invitations) {
        setSentInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Error fetching sent invitations:', error);
    }
  };

  const handleManualCodeSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode || manualCode.trim() === '') {
      setManualCodeError('Please enter a referral code');
      return;
    }

    setSubmittingManualCode(true);
    setManualCodeError('');
    setManualCodeSuccess('');

    try {
      // Get user info for tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to use a referral code');
      }

      // Get customer info
      let customerInfo = null;
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('id, name, email, phone')
          .eq('id', customerId)
          .single();
        customerInfo = customer;
      }

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track',
          referralCode: manualCode.trim().toUpperCase(),
          userId: user.id,
          customerId: customerInfo?.id || customerId || null,
          refereeEmail: user.email || null,
          refereeName: customerInfo?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
          refereePhone: customerInfo?.phone || user.user_metadata?.phone || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyUsed) {
          setManualCodeError('You have already used this referral code');
        } else {
          setManualCodeError(data.error || 'Failed to apply referral code. Please check the code and try again.');
        }
        return;
      }

      setManualCodeSuccess(`✅ Successfully applied referral code ${manualCode.trim().toUpperCase()}! Both you and the referrer will be eligible for rewards.`);
      setManualCode('');
      setUsedReferralCode(manualCode.trim().toUpperCase());
      
      // Refresh referrals to show the new record
      await fetchReferrals();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setManualCodeSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting manual code:', error);
      setManualCodeError(error.message || 'An error occurred. Please try again.');
    } finally {
      setSubmittingManualCode(false);
    }
  };

  const copyReferralLink = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const referralLink = `${baseUrl}/?ref=${referralCode}`;
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = typeof window !== 'undefined' && (
      window.isSecureContext || 
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );

    try {
      // Try modern clipboard API first (works in secure contexts)
      if (navigator.clipboard && navigator.clipboard.writeText && isSecureContext) {
        try {
          await navigator.clipboard.writeText(referralLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (err) {
          console.warn('Clipboard API failed, trying fallback:', err);
          // Fall through to fallback method
        }
      }
      
      // Fallback method for mobile/insecure contexts
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('execCommand copy failed');
        }
      } catch (err) {
        document.body.removeChild(textArea);
        console.error('Fallback copy failed:', err);
        // Still show copied state even if there's an error
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Still show copied state even if there's an error
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnFacebook = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const referralLink = `${baseUrl}/?ref=${referralCode}`;
    const text = encodeURIComponent(`Check out Flora Lawn & Landscaping! Use my referral code ${referralCode} for special offers!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${text}`, '_blank');
  };

  const shareOnTwitter = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const referralLink = `${baseUrl}/?ref=${referralCode}`;
    const text = encodeURIComponent(`Check out Flora Lawn & Landscaping! Use my referral code ${referralCode} for special offers! ${referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const referralLink = `${baseUrl}/?ref=${referralCode}`;
    const subject = encodeURIComponent('Check out Flora Lawn & Landscaping!');
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to share Flora Lawn & Landscaping with you. They provide excellent lawn care services!\n\n` +
      `Use my referral code ${referralCode} when you sign up for special offers.\n\n` +
      `Visit: ${referralLink}\n\n` +
      `Thanks!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const sendInviteToFriend = async (e) => {
    e.preventDefault();
    
    if (!friendEmail || !friendEmail.includes('@')) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setSendingInvite(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const referralLink = `${baseUrl}/contact?ref=${referralCode}`;
      
      const response = await fetch('/api/referrals/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendEmail: friendEmail.trim(),
          friendName: friendName.trim() || '',
          referralCode,
          referralLink,
          referrerName: '', // Will be filled by API from user data
          userId,
          customerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setInviteSuccess(`✅ Invitation sent to ${friendEmail}! They'll receive an email with your referral link.`);
      setFriendEmail('');
      setFriendName('');
      
      // Refresh sent invitations
      fetchSentInvitations();
      
      // Clear success message after 5 seconds
      setTimeout(() => setInviteSuccess(''), 5000);
    } catch (error) {
      console.error('Error sending invite:', error);
      setInviteError(error.message || 'Failed to send invite. Please try again.');
    } finally {
      setSendingInvite(false);
    }
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Referral Program</h2>
        <p className="text-gray-600">
          Refer friends and earn rewards! Share your unique code and get rewarded when they sign up.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{sentInvitations.length}</div>
          <div className="text-sm text-gray-600">📨 Invitations Sent</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Friends Signed Up</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">${stats.rewards.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Total Rewards</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Referral Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralCode}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg font-bold text-center"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-500">
            Share this code: <span className="font-mono font-bold">{referralCode}</span>
          </p>
          {referralCode && !referralCode.startsWith('FLORA') && (
            <button
              onClick={() => {
                const myReferral = referrals.find(r => 
                  r.referrer_id === userId || r.referrer_customer_id === customerId
                );
                if (myReferral) {
                  regenerateReferralCode(myReferral.id);
                } else {
                  // If no referral found, try to find it from the code
                  fetch(`/api/referrals?code=${referralCode}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.referral && data.referral.id) {
                        regenerateReferralCode(data.referral.id);
                      }
                    });
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Update to FLORA format
            </button>
          )}
        </div>
      </div>

      {/* Manual Referral Code Entry */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter a Referral Code</h3>
        <p className="text-sm text-gray-600 mb-4">
          Did someone refer you? Enter their referral code here to ensure both of you get rewarded!
        </p>
        
        {usedReferralCode && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✓ You've already used referral code:</strong> <span className="font-mono font-bold">{usedReferralCode}</span>
            </p>
            <p className="text-xs text-green-700 mt-1">
              Both you and the referrer will be eligible for rewards when you complete your first service.
            </p>
          </div>
        )}

        {manualCodeSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm text-green-800">{manualCodeSuccess}</p>
          </div>
        )}

        {manualCodeError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-800">{manualCodeError}</p>
          </div>
        )}

        {!usedReferralCode && (
          <form onSubmit={handleManualCodeSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  setManualCodeError('');
                  setManualCodeSuccess('');
                }}
                placeholder="Enter referral code (e.g., FLORA123456)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                disabled={submittingManualCode}
              />
              <button
                type="submit"
                disabled={submittingManualCode || !manualCode.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingManualCode ? 'Applying...' : 'Apply Code'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              💡 If something went wrong during signup, you can enter the referral code here to ensure proper tracking and rewards.
            </p>
          </form>
        )}
      </div>

      {/* Share Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Share Your Referral
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareOnFacebook}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
          <button
            onClick={shareOnTwitter}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Twitter
          </button>
          <button
            onClick={shareViaEmail}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
        </div>
      </div>

      {/* Invite Friend by Email */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="text-xl">✉️</span> Invite a Friend
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your friend's email and we'll send them a personalized invitation with your referral link!
        </p>

        {inviteSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm text-green-800">{inviteSuccess}</p>
          </div>
        )}

        {inviteError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-800">{inviteError}</p>
          </div>
        )}

        <form onSubmit={sendInviteToFriend} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Friend's Name (optional)</label>
              <input
                type="text"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={sendingInvite}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Friend's Email *</label>
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => {
                  setFriendEmail(e.target.value);
                  setInviteError('');
                }}
                placeholder="friend@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={sendingInvite}
                required
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sendingInvite || !friendEmail.trim()}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {sendingInvite ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Invitation
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            💡 Your friend will receive an email with your referral code and a direct link to sign up. When they complete their first service, you both earn rewards!
          </p>
        </form>
      </div>

      {/* Sent Invitations */}
      {sentInvitations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📨</span> Sent Invitations
          </h3>
          <div className="space-y-2">
            {sentInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {invitation.friend_name || invitation.friend_email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invitation.friend_email}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Invited {new Date(invitation.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    invitation.status === 'rewarded'
                      ? 'bg-green-100 text-green-800'
                      : invitation.status === 'first_service_completed'
                      ? 'bg-blue-100 text-blue-800'
                      : invitation.status === 'signed_up'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invitation.status === 'invited' && '⏳ Pending'}
                    {invitation.status === 'signed_up' && '✅ Signed Up'}
                    {invitation.status === 'first_service_completed' && '🎉 First Service Done'}
                    {invitation.status === 'rewarded' && '🏆 Rewarded'}
                    {invitation.status === 'expired' && '⌛ Expired'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Status updates when your friend signs up and completes their first service
          </p>
        </div>
      )}

      {/* Referral List */}
      {referrals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referrals</h3>
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {referral.referee_name || referral.referee_email || 'Pending'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {referral.referee_email && <span>{referral.referee_email}</span>}
                    {referral.referee_email && referral.referee_phone && <span> • </span>}
                    {referral.referee_phone && <span>{referral.referee_phone}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    referral.status === 'completed' || referral.status === 'rewarded'
                      ? 'bg-green-100 text-green-800'
                      : referral.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {referral.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Info */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">How It Works</h4>
        <ul className="text-sm text-gray-700 space-y-2 mb-4">
          <li>• Share your referral code with friends and family</li>
          <li>• When they sign up using your code and complete their first service, you earn service credits</li>
          <li>• Track your referrals and rewards here</li>
        </ul>
        
        <div className="mt-4 pt-4 border-t border-green-200">
          <h5 className="font-semibold text-gray-900 mb-3">Your Progressive Rewards</h5>
          
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">🚀 Fast Growth (First 5):</p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-lg border-2 border-green-300 text-center shadow-sm">
                <div className="text-xs text-green-800 mb-1">1st</div>
                <div className="text-lg font-bold text-green-700">$25</div>
                <div className="text-xs text-green-600">+$5</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-lg border-2 border-green-300 text-center shadow-sm">
                <div className="text-xs text-green-800 mb-1">2nd</div>
                <div className="text-lg font-bold text-green-700">$30</div>
                <div className="text-xs text-green-600">+$5</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-lg border-2 border-green-300 text-center shadow-sm">
                <div className="text-xs text-green-800 mb-1">3rd</div>
                <div className="text-lg font-bold text-green-700">$35</div>
                <div className="text-xs text-green-600">+$5</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-lg border-2 border-green-300 text-center shadow-sm">
                <div className="text-xs text-green-800 mb-1">4th</div>
                <div className="text-lg font-bold text-green-700">$40</div>
                <div className="text-xs text-green-600">+$5</div>
              </div>
              <div className="bg-gradient-to-br from-green-200 to-green-300 p-2 rounded-lg border-2 border-green-400 text-center shadow-md">
                <div className="text-xs font-semibold text-green-800 mb-1">5th</div>
                <div className="text-lg font-bold text-green-900">$45</div>
                <div className="text-xs text-green-700">+$5</div>
              </div>
            </div>
            
            <p className="text-xs font-semibold text-gray-700 mb-2">📈 Steady Growth (6th - 25th):</p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-xs mb-2">
              {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((num) => {
                const amount = 45 + (num - 5) * 2;
                const isLast = num === 24;
                return (
                  <div key={num} className={`p-1.5 rounded border text-center ${isLast ? 'bg-green-100 border-green-300' : 'bg-white border-green-200'}`}>
                    <div className="text-green-700 mb-0.5">{num}{num === 6 ? 'th' : num === 7 ? 'th' : num === 8 ? 'th' : num === 9 ? 'th' : num === 10 ? 'th' : num === 11 ? 'th' : num === 12 ? 'th' : num === 13 ? 'th' : num === 14 ? 'th' : num === 15 ? 'th' : num === 16 ? 'th' : num === 17 ? 'th' : num === 18 ? 'th' : num === 19 ? 'th' : num === 20 ? 'th' : num === 21 ? 'st' : num === 22 ? 'nd' : num === 23 ? 'rd' : 'th'}</div>
                    <div className="text-sm font-bold text-green-600">${amount}</div>
                    <div className="text-green-500">+$2</div>
                  </div>
                );
              })}
              <div className="bg-gradient-to-br from-green-200 to-green-300 p-1.5 rounded-lg border-2 border-green-400 text-center shadow-sm">
                <div className="text-xs font-semibold text-green-800 mb-0.5">25th+</div>
                <div className="text-base font-bold text-green-900">$100</div>
                <div className="text-xs text-green-700">Max</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">6th-24th: +$2 each • 25th: Maximum $100</p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
            <p className="text-xs text-blue-800 mb-2">
              <strong>💡 Rewards increase with each referral!</strong> Your reward amount is based on your total completed referrals.
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✓ Credits automatically applied to your next service</li>
              <li>✓ Credits expire 90 days after being awarded</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          By participating in the referral program, you agree to our{' '}
          <Link href="/referral-terms" className="text-green-600 hover:text-green-700 underline">
            Referral Program Terms & Conditions
          </Link>
          . Please review the terms before sharing your referral code.
        </p>
      </div>
    </div>
  );
}

