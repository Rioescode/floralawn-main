"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CustomerDashboard from '@/app/marketplace/components/CustomerDashboard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function CustomerPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setUser({
          ...session.user,
          ...profile
        });
      }
      
      setLoading(false);
    }
    
    loadUser();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to access this page.</div>;
  }

  return (
    <>
      <Navigation />
      <CustomerDashboard user={user} />
      <Footer />
    </>
  );
} 