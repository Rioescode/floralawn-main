"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const finishSetup = async (user, isNewUser, profile) => {
    try {
      // Check for pending referral code from localStorage (with error handling)
          let pendingReferralCode = null;
          if (typeof window !== 'undefined') {
            try {
              if (window.localStorage) {
                pendingReferralCode = localStorage.getItem('pending_referral_code');
                if (pendingReferralCode) {
                  console.log('🎁 Found pending referral code:', pendingReferralCode);
                  // Remove it from localStorage so it's only used once
                  localStorage.removeItem('pending_referral_code');
                }
              }
            } catch (e) {
              console.warn('Could not access localStorage for referral code:', e);
              // Continue anyway - referral code can be entered manually later
            }
          }

          // ALWAYS ensure customer record exists (for both new and existing users)
          // This ensures every user who signs in/signs up has a customer record
          try {
            console.log('👤 Ensuring customer record exists for user:', user.email);
            
            // Use API route to create customer (bypasses RLS)
            const customerResponse = await fetch('/api/create-customer-from-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Customer',
                phone: profile?.phone || user.user_metadata?.phone || 'Not provided',
                address: profile?.location || user.user_metadata?.address || null,
                referralCode: pendingReferralCode // Pass referral code if available
              })
            });

            if (!customerResponse.ok) {
              const errorText = await customerResponse.text();
              console.error('❌ Failed to create/check customer record:', errorText);
            } else {
              const result = await customerResponse.json();
              console.log('✅ Customer record ensured:', result);
              
              // Track referral if code was provided and customer was created
              if (pendingReferralCode && result.customer) {
                try {
                  console.log('🎁 Tracking referral for new customer:', pendingReferralCode);
                  const referralResponse = await fetch('/api/referrals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'track',
                      referralCode: pendingReferralCode,
                      userId: user.id,
                      customerId: result.customer.id || result.customerId,
                      refereeEmail: user.email,
                      refereeName: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Customer',
                      refereePhone: profile?.phone || user.user_metadata?.phone || 'Not provided'
                    })
                  });

                  if (!referralResponse.ok) {
                    const errorText = await referralResponse.text();
                    console.error('❌ Failed to track referral:', errorText);
                  } else {
                    const referralResult = await referralResponse.json();
                    console.log('✅ Referral tracked successfully:', referralResult);
                  }
                } catch (referralError) {
                  console.error('❌ Error tracking referral:', referralError);
                  // Don't fail account creation if referral tracking fails
                }
              }
            }
          } catch (customerError) {
            console.error('❌ Error ensuring customer record:', customerError);
            // Don't fail account creation if customer creation fails
          }

          if (isNewUser) {

            // Automatically enroll in loyalty program
            try {
              console.log('🎁 Enrolling new user in loyalty program:', user.email);
              const loyaltyUrl = `/api/loyalty?userId=${user.id}`;
              const loyaltyResponse = await fetch(loyaltyUrl);
              
              if (!loyaltyResponse.ok) {
                console.error('❌ Failed to enroll in loyalty program');
              } else {
                const loyaltyData = await loyaltyResponse.json();
                console.log('✅ Successfully enrolled in loyalty program:', loyaltyData);
              }
            } catch (loyaltyError) {
              console.error('❌ Error enrolling in loyalty program:', loyaltyError);
              // Don't fail account creation if loyalty enrollment fails
            }

            // Send welcome email for new account
            try {
              console.log('📧 Sending welcome email to new user:', user.email);
              const emailResponse = await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email,
                  name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
                })
              });
              
              if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                console.error('❌ Failed to send welcome email:', errorText);
              } else {
                const result = await emailResponse.json();
                console.log('✅ Welcome email sent successfully:', result);
              }
            } catch (emailError) {
              console.error('❌ Error sending welcome email:', emailError);
              // Don't fail account creation if email fails
            }
          }

      // Redirect to the specified page or dashboard
      router.replace(redirect || '/customer/dashboard');
    } catch (err) {
      console.error('Error in finishSetup:', err);
      router.replace('/login?error=setup-failed');
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user) {
          // Check if user profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          // Check if this is a new user (profile doesn't exist)
          const isNewUser = !profile && (profileError?.code === 'PGRST116' || !profileError);
          
          if (isNewUser) {
            setPendingUser(user);
            setShowTermsModal(true);
            return; // Pause setup until terms are accepted
          }

          // Existing user: finish setup immediately
          await finishSetup(user, false, profile);
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        router.replace('/login?error=auth-callback-failed');
      }
    };

    handleAuthCallback();
  }, [router, redirect]);

  const handleAcceptTerms = async () => {
    if (!pendingUser) return;
    setIsProcessing(true);
    
    try {
      // Create profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: pendingUser.id,
            email: pendingUser.email,
            full_name: pendingUser.user_metadata?.full_name || '',
            avatar_url: pendingUser.user_metadata?.avatar_url || '',
          }
        ]);

      if (insertError) throw insertError;

      setShowTermsModal(false);
      await finishSetup(pendingUser, true, null);
    } catch (err) {
      console.error('Error creating profile after terms:', err);
      setIsProcessing(false);
      router.replace('/login?error=account-creation-failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {showTermsModal ? (
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              👋
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              It looks like you're new here! You are about to create an account with <strong>Flora Lawn & Landscaping Inc</strong>. This allows us to easily schedule your services, communicate with you, and manage your billing.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-800 font-medium group-hover:text-gray-900">
                    I agree to create an account
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    By checking this box, you agree to our{' '}
                    <a href="/terms-of-service" target="_blank" className="text-green-600 hover:underline">Terms of Service</a> and{' '}
                    <a href="/privacy-policy" target="_blank" className="text-green-600 hover:underline">Privacy Policy</a>.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  router.replace('/login');
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptTerms}
                disabled={!termsAccepted || isProcessing}
                className="flex-[2] flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing sign in...</p>
        </div>
      )}
    </div>
  );
} 