"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ButtonAccount() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    return <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full"></div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/marketplace"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        {session.user?.user_metadata?.avatar_url ? (
          <img
            src={session.user.user_metadata.avatar_url}
            alt={session.user.user_metadata.full_name || "Account"}
            className="w-6 h-6 rounded-full shrink-0"
            referrerPolicy="no-referrer"
            width={24}
            height={24}
          />
        ) : (
          <span className="w-6 h-6 bg-gray-200 flex justify-center items-center rounded-full shrink-0">
            {session.user?.email?.charAt(0).toUpperCase()}
          </span>
        )}
        {session.user?.user_metadata?.full_name || session.user?.email}
      </Link>

      <button
        onClick={handleSignOut}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Sign out
      </button>
    </div>
  );
}
