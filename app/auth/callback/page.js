"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

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
            // Create profile if it doesn't exist
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  avatar_url: user.user_metadata?.avatar_url || '',
                }
              ]);

            if (insertError) throw insertError;
          }

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
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        router.replace('/login?error=auth-callback-failed');
      }
    };

    handleAuthCallback();
  }, [router, redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
} 