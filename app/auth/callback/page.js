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
  const [accountInfo, setAccountInfo] = useState({
    name: '',
    phone: '',
    address: '',
    service: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const finishSetup = async (user, isNewUser, profile, signup) => {
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
            const pendingQuoteFlag = (() => {
              if (signup?.quoteAlreadySent) return true;
              try {
                const raw = localStorage.getItem('pending_quote_account');
                return raw ? !!JSON.parse(raw).quoteAlreadySent : false;
              } catch (e) {
                return false;
              }
            })();

            const customerResponse = await fetch('/api/create-customer-from-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                name: signup?.name || profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Customer',
                phone: signup?.phone || profile?.phone || user.user_metadata?.phone || 'Not provided',
                address: signup?.address || profile?.location || user.user_metadata?.address || null,
                service: signup?.service || null,
                referralCode: pendingReferralCode,
                quoteAlreadySent: pendingQuoteFlag
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
      try { localStorage.removeItem('pending_quote_account'); } catch (e) { /* keep going */ }
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
          
          const pendingQuote = (() => {
            try {
              const raw = localStorage.getItem('pending_quote_account');
              return raw ? JSON.parse(raw) : null;
            } catch (e) {
              return null;
            }
          })();

          if (isNewUser) {
            setPendingUser(user);
            setAccountInfo({
              name: pendingQuote?.name || user.user_metadata?.full_name || '',
              phone: pendingQuote?.phone || '',
              address: pendingQuote?.address || '',
              service: pendingQuote?.service || '',
            });
            setShowTermsModal(true);
            return;
          }

          await finishSetup(user, false, profile, pendingQuote);
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
            full_name: accountInfo.name || pendingUser.user_metadata?.full_name || '',
            avatar_url: pendingUser.user_metadata?.avatar_url || '',
          }
        ]);

      if (insertError) throw insertError;

      setShowTermsModal(false);
      await finishSetup(pendingUser, true, null, accountInfo);
    } catch (err) {
      console.error('Error creating profile after terms:', err);
      setIsProcessing(false);
      router.replace('/login?error=account-creation-failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {showTermsModal ? (
        <div className="bg-white max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
          <div className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              👋
            </div>
            <h3 className="text-2xl font-semibold text-[#1B2838] mb-2">
              Create your yard account
            </h3>
            <p className="text-[#5C6B62] mb-5 text-sm">
              Google gives us the email. We still need the yard, the phone, and the service.
            </p>

            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); handleAcceptTerms(); }}>
              <label className="block text-sm text-[#1B2838]">
                Name
                <input
                  required
                  value={accountInfo.name}
                  onChange={(event) => setAccountInfo((current) => ({ ...current, name: event.target.value }))}
                  className="mt-1 w-full min-h-11 border border-[#C9D4CC] px-3"
                />
              </label>
              <label className="block text-sm text-[#1B2838]">
                Phone
                <input
                  required
                  inputMode="tel"
                  value={accountInfo.phone}
                  onChange={(event) => setAccountInfo((current) => ({ ...current, phone: event.target.value }))}
                  className="mt-1 w-full min-h-11 border border-[#C9D4CC] px-3"
                />
              </label>
              <label className="block text-sm text-[#1B2838]">
                Address
                <input
                  required
                  value={accountInfo.address}
                  onChange={(event) => setAccountInfo((current) => ({ ...current, address: event.target.value }))}
                  className="mt-1 w-full min-h-11 border border-[#C9D4CC] px-3"
                />
              </label>
              <label className="block text-sm text-[#1B2838]">
                Service needed
                <select
                  required
                  value={accountInfo.service}
                  onChange={(event) => setAccountInfo((current) => ({ ...current, service: event.target.value }))}
                  className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3"
                >
                  <option value="">Select a service</option>
                  <option>Lawn Mowing</option>
                  <option>Lawn Fertilization</option>
                  <option>Weed Control</option>
                  <option>Lawn Aeration</option>
                  <option>Overseeding</option>
                  <option>Lawn Dethatching</option>
                  <option>Mulching</option>
                  <option>Hedge Trimming</option>
                  <option>Spring Cleanup</option>
                  <option>Fall Cleanup</option>
                  <option>Leaf Removal</option>
                  <option>Snow Removal</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-[#5C6B62]">
                  I agree to the <a href="/terms-of-service" target="_blank" className="underline">Terms of Service</a> and <a href="/privacy-policy" target="_blank" className="underline">Privacy Policy</a>.
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    supabase.auth.signOut();
                    router.replace('/login');
                  }}
                  disabled={isProcessing}
                  className="flex-1 min-h-11 border border-[#1B2838] font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!termsAccepted || !accountInfo.name.trim() || !accountInfo.phone.trim() || !accountInfo.address.trim() || !accountInfo.service || isProcessing}
                  className="flex-[2] min-h-11 bg-[#2F6B4F] text-white font-semibold disabled:opacity-50"
                >
                  {isProcessing ? 'Creating' : 'Create account'}
                </button>
              </div>
            </form>
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