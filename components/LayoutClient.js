"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LayoutClient({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="pt-16 sm:pt-20">
      {children}
    </div>
  );
}
