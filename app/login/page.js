'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailPreferences, setEmailPreferences] = useState({
    subscribe: false,
    frequency: 'monthly'
  });
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Manage Your Services Online
          </h1>
          <p className="text-gray-600 text-lg">
            Sign in with Google to access your account. If you don't have an account yet, we'll create one for you automatically.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
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

          {/* Email Marketing Opt-in Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start mb-3">
                <div className="bg-green-100 rounded-full p-1.5 mr-2 flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">📧 Stay Connected & Save Money!</h3>
                  <p className="text-xs text-gray-700 mb-3">
                    Get exclusive discounts, seasonal reminders, and landscaping tips. 
                    <span className="font-semibold text-green-700"> Unsubscribe anytime!</span>
                  </p>
                  
                  <label className="flex items-start space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={emailPreferences.subscribe}
                      onChange={(e) => setEmailPreferences(prev => ({...prev, subscribe: e.target.checked}))}
                      className="w-4 h-4 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-1 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-800 block">📧 Yes, send me emails with:</span>
                      <p className="text-xs text-gray-600 mt-0.5">🎫 Exclusive coupons • 🍂 Seasonal reminders • 📢 Service updates • 💡 Lawn care tips</p>
                    </div>
                  </label>

                  {emailPreferences.subscribe && (
                    <div className="mt-2 p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-green-700 font-medium">
                        ✅ You'll receive valuable discounts and tips!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">With an account, you can:</h3>
            <p className="text-sm text-gray-600">Manage everything from one place</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Schedule Appointments</p>
                  <p className="text-xs text-gray-500">Book new services easily</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔄</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Reschedule Anytime</p>
                  <p className="text-xs text-gray-500">Change dates when needed</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⏭️</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Skip Services</p>
                  <p className="text-xs text-gray-500">Skip when you're away</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">View History</p>
                  <p className="text-xs text-gray-500">Track all your services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
