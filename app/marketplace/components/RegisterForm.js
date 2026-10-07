"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useRouter } from 'next/navigation';

export default function RegisterForm({ onClose, onShowLogin, serviceParam, cityParam, typeParam }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [agreements, setAgreements] = useState({
    privacyPolicy: false,
    termsConditions: false
  });

  // Add effect to handle auth state
  useEffect(() => {
    const handleAuthChange = async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const storedData = localStorage.getItem('signup_data');
        if (storedData) {
          try {
            const userData = JSON.parse(storedData);
            const { user } = session;

            // Create profile with user type
            const { error } = await createProfile(user.id, {
              ...userData,
              full_name: user.user_metadata?.full_name,
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url
            });

            if (error) throw new Error(error);

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

            // Clear stored data
            localStorage.removeItem('signup_data');

            // Redirect to customer dashboard
            router.push('/marketplace/customer');
            
          } catch (err) {
            console.error('Error setting up profile:', err);
            setError(err.message);
          }
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const createProfile = async (userId, userData) => {
    try {
      console.log('Creating profile for:', userId, userData);

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Update the profile as customer
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          is_customer: true,
          is_professional: false,
          full_name: userData.full_name || existingProfile?.full_name,
          email: userData.email || existingProfile?.email,
          avatar_url: userData.avatar_url || existingProfile?.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      return { success: true };
    } catch (err) {
      console.error('Error creating profile:', err);
      return { error: err.message };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allDocumentsAccepted) {
      setError('Please accept all required documents to continue');
    }
  };

  const handleAcceptanceChange = (document) => (e) => {
    setAgreements({
      ...agreements,
      [document]: e.target.checked
    });
  };

  const allDocumentsAccepted = Object.values(agreements).every(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
        </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={agreements.privacyPolicy}
                  onChange={handleAcceptanceChange('privacyPolicy')}
                  className="mt-1 mr-2"
                  required
                />
                <label htmlFor="privacy" className="text-sm text-gray-600">
                  I accept the <a href="/privacy-policy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a>
                </label>
              </div>
              
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreements.termsConditions}
                  onChange={handleAcceptanceChange('termsConditions')}
                  className="mt-1 mr-2"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I accept the <a href="/terms-of-service" className="text-blue-600 hover:underline" target="_blank">Terms and Conditions</a>
                </label>
              </div>
          </div>

          {error && (
              <div className="text-red-500 text-sm">{error}</div>
          )}

          <GoogleSignInButton
            redirectTo="/auth/callback?redirect=/marketplace/customer"
            onBefore={() => {
              if (!allDocumentsAccepted) {
                throw new Error('Please accept all required documents to continue');
              }
            }}
            onError={(err) => setError(err?.message || 'Google sign-in failed')}
          />
        </form>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={() => {
                onClose();
                if (typeof onShowLogin === 'function') {
                  onShowLogin();
                }
              }}
              className="text-green-600 hover:underline font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 