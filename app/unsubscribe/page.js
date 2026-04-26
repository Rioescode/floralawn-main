'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setStatus('error');
      setMessage('No email address provided.');
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/email-subscribers?email=${encodeURIComponent(email)}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(result.message || 'Successfully unsubscribed from email list');
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to unsubscribe. Please try again.');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again later.');
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribing...</h1>
              <p className="text-gray-600">Please wait while we process your request.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Successfully Unsubscribed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                You will no longer receive marketing emails from Flora Lawn & Landscaping.
                You may still receive important service-related communications.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Unsubscribe</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">
                If you continue to receive emails, please contact us directly at{' '}
                <a href="mailto:floralawncareri@gmail.com" className="text-green-600 hover:underline">
                  floralawncareri@gmail.com
                </a>
              </p>
            </>
          )}

          <div className="mt-8">
            <a
              href="/"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

