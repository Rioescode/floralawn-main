'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setIsAdmin(user?.email === 'esckoofficial@gmail.com');
  };

  return (
    <>
      {/* Spring Cleanup Banner - Appears on all pages - Fixed at top */}
      <div className="hidden sm:block fixed top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 z-[60] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center">
            {/* Animated Spring Icons */}
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-20">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>🌱</span>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 py-1">
              <span className="text-white font-semibold">🌱 SPRING CLEANUP SPECIAL:</span>
              <span className="font-medium text-center sm:text-left">Book early and save up to 20% on spring cleanup services</span>
              <Link 
                href="/spring-cleanup"
                className="ml-0 sm:ml-4 px-6 py-1.5 text-sm bg-white text-green-600 rounded-full font-semibold hover:bg-green-50 transition-colors"
              >
                Get Free Estimate
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for banner */}
      <div className="hidden sm:block h-14" aria-hidden="true" />
      
      <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-green-600 hover:text-green-700">
              Flora Landscaping
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              !isAdmin && (
                <Link
                  href="/customer/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              )
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
} 