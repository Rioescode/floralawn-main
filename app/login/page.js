'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginPage() {
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Store referral code in localStorage if present in URL
  useEffect(() => {
    const referralCode = searchParams.get('ref');
    if (referralCode && typeof window !== 'undefined') {
      localStorage.setItem('pending_referral_code', referralCode.toUpperCase());
      console.log('📝 Stored referral code from URL:', referralCode.toUpperCase());
    }
  }, [searchParams]);

  const rememberReferral = () => {
    const referralCode = searchParams.get('ref');
    if (!referralCode) return;
    try {
      localStorage.setItem('pending_referral_code', referralCode.toUpperCase());
    } catch (e) {
      console.warn('Could not store referral code:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F4] text-[#1B2838]">
      <Navigation />
      
      <div className="max-w-lg mx-auto px-4 py-16 sm:py-20">
        <p className="text-sm text-[#5C6B62]">Flora Lawn</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          Open your yard account
        </h1>
        <p className="mt-4 max-w-md text-base text-[#5C6B62]">
          The first time, we ask for your name, phone, address, and the service you need. After that, this is how you sign in.
        </p>

        <div className="mt-8 bg-white border border-[#C9D4CC] p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Google Login Button */}
          <div className="space-y-4">
            <GoogleSignInButton
              redirectTo={`/auth/callback?redirect=${encodeURIComponent(redirect || '/customer/dashboard')}`}
              onBefore={rememberReferral}
              onError={(err) => setError(err?.message || 'Google sign-in failed')}
            />
            
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <a href="/terms-of-service" className="text-green-600 hover:text-green-700 hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy-policy" className="text-green-600 hover:text-green-700 hover:underline font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
