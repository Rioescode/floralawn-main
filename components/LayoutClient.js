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

  // When Google rejects the Maps key (expired, billing, referrer), its Autocomplete
  // disables every address input. Keep them usable as plain text fields instead.
  useEffect(() => {
    let mapsFailed = false;
    const originalPlaceholders = new WeakMap();

    const isBroken = (el) =>
      el.classList?.contains("gm-err-autocomplete") ||
      (el.classList?.contains("pac-target-input") && (mapsFailed || el.style.backgroundImage.includes("icon_error")));

    const unlock = (el) => {
      if (!isBroken(el)) return;
      mapsFailed = true;
      window.google?.maps?.event?.clearInstanceListeners?.(el);
      if (el.classList.contains("gm-err-autocomplete")) el.classList.remove("gm-err-autocomplete");
      if (el.disabled) el.disabled = false;
      if (el.style.backgroundImage) el.style.backgroundImage = "";
      const placeholder = originalPlaceholders.get(el) || "Enter your address";
      if (el.placeholder !== placeholder) el.placeholder = placeholder;
    };

    const unlockAll = () => {
      document.querySelectorAll(".pac-target-input").forEach(unlock);
      if (mapsFailed) {
        document.querySelectorAll(".pac-container").forEach((c) => (c.style.display = "none"));
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        const el = m.target;
        if (el.tagName !== "INPUT") continue;
        if (m.attributeName === "placeholder" && m.oldValue && !originalPlaceholders.has(el)) {
          originalPlaceholders.set(el, m.oldValue);
        }
        unlock(el);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["disabled", "placeholder", "style", "class"],
    });

    unlockAll();
    const sweep = setInterval(unlockAll, 1000);

    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      mapsFailed = true;
      unlockAll();
      previous?.();
    };

    return () => {
      observer.disconnect();
      clearInterval(sweep);
      window.gm_authFailure = previous;
    };
  }, []);

  return (
    <div className="pt-16 sm:pt-20">
      {children}
    </div>
  );
}
