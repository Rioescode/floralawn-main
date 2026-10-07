"use client";

import { useState } from 'react';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginForm({ onClose, onShowRegister }) {
  const [error, setError] = useState(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 sm:mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sign In</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">✕</button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            Welcome back! Sign in to access your account and manage your lawn care services.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <GoogleSignInButton
          redirectTo="/auth/callback?redirect=/marketplace"
          onError={(err) => setError(err?.message || 'Google sign-in failed')}
        />

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Quick Lawn Care Facts 🌱
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
              <span className="text-lg">🌅</span>
              <span>Morning dew helps prevent grass burn when mowing</span>
            </div>
            <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
              <span className="text-lg">📏</span>
              <span>Keeping grass at 3" helps develop stronger roots</span>
            </div>
            <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
              <span className="text-lg">🍂</span>
              <span>Mulched leaves are natural fertilizer</span>
            </div>
            <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
              <span className="text-lg">💧</span>
              <span>Deep watering twice a week beats daily sprinkles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 