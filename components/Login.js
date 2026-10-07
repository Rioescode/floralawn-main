'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // If there's a specific redirect URL, use it
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Otherwise, redirect to customer dashboard
          router.push('/customer/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your appointments and bookings
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <GoogleSignInButton
            redirectTo="/auth/callback?redirect=/customer/dashboard"
            onError={(err) => setError(err?.message || 'Google sign-in failed')}
          />
        </div>
      </div>
    </div>
  );
} 