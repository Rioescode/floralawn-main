'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
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

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure we're in a secure context (HTTPS) or localhost
      if (typeof window === 'undefined') {
        setError('Please enable JavaScript to sign in.');
        return;
      }

      const origin = window.location.origin;
      
      // More lenient check for mobile browsers - allow if HTTPS or localhost
      // Mobile browsers may have different security contexts
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      origin.includes('localhost');
      
      if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Only show error if definitely not secure (not localhost)
        console.warn('Non-secure context detected, but proceeding with OAuth');
      }
      
      // Store referral code in localStorage (with error handling)
      const referralCode = searchParams.get('ref');
      if (referralCode) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('pending_referral_code', referralCode.toUpperCase());
            console.log('📝 Stored referral code from URL:', referralCode.toUpperCase());
          }
        } catch (e) {
          console.warn('Could not store referral code in localStorage:', e);
          // Continue anyway - referral code can be entered manually later
        }
      }

      const redirectUrl = `${origin}/auth/callback?redirect=${redirect || '/customer/dashboard'}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Customize the OAuth flow
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

    } catch (err) {
      console.error('Error with Google auth:', err);
      const errorMessage = err?.message || 'Failed to authenticate with Google. Please try again.';
      setError(`Authentication error: ${errorMessage}`);
    } finally {
      setLoading(false);
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
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            
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
