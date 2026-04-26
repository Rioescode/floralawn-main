"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ButtonAccount() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    
    if (session) {
       const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
       // Also check explicit admin emails if needed, but profiles is safer
       const emailMatch = session.user.email === 'esckoofficial@gmail.com';
       setUserRole(profile?.role === 'admin' || emailMatch ? 'admin' : 'customer');
    } else {
       setUserRole(null);
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  if (isLoading) {
    return <div className="h-10 w-24 animate-pulse bg-slate-200 rounded-xl"></div>;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
      >
        Login
      </Link>
    );
  }

  const dashboardPath = userRole === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="flex items-center gap-3">
      <Link
        href={dashboardPath}
        className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all"
      >
        {userRole === 'admin' ? 'Admin Dash' : 'My Dashboard'}
      </Link>

      <button
        onClick={handleSignOut}
        className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
