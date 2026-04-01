'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import '@/lib/error-handler';
import {
  Squares2X2Icon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboardRedirect() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('Auth error:', authError);
        router.push('/login');
        return;
      }

      // Fetch user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      console.log('Admin dashboard auth check:', { 
        profile, 
        profileError, 
        userId: currentUser.id, 
        email: currentUser.email,
        role: profile?.role 
      });

      const role = profile?.role;

      // Allow access if role is admin OR email matches (fallback for mobile)
      const isAdmin = role === 'admin' || currentUser.email?.toLowerCase() === 'esckoofficial@gmail.com';

      if (!isAdmin) {
        console.log('Access denied - not admin');
        router.push('/customer/dashboard');
        return;
      }

      setUser(currentUser);
      setUserRole(role || 'admin');
      
      // Auto-redirect to main admin dashboard
      router.push('/customers');
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // This page will auto-redirect, but show links as backup
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard Access</h1>
          <p className="text-gray-600 mb-6">Redirecting to admin dashboard...</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link
              href="/customers"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-2 border-green-500"
            >
              <Squares2X2Icon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-sm text-gray-600">Manage customers, appointments, and services</p>
            </Link>
            
            <Link
              href="/admin/work-requests"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Work Requests</h3>
              <p className="text-sm text-gray-600">View and manage work requests</p>
            </Link>
            
            <Link
              href="/admin/completed-jobs"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <CheckCircleIcon className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Jobs</h3>
              <p className="text-sm text-gray-600">Track completed jobs and payments</p>
            </Link>
            
            <Link
              href="/schedule"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <CalendarIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
              <p className="text-sm text-gray-600">Manage weekly schedule</p>
            </Link>
            
            <Link
              href="/admin/completion-history"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <ChartBarIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Completion History</h3>
              <p className="text-sm text-gray-600">View weekly completion reports</p>
            </Link>
            
            <Link
              href="/admin/referrals"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <GiftIcon className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Referrals</h3>
              <p className="text-sm text-gray-600">Manage referral program</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

