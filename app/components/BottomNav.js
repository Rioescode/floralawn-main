'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import YardPhotoChat from '@/components/YardPhotoChat';
import {
  PhoneIcon,
  CalendarIcon,
  HomeIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

const SIGNED_OUT_SCHEDULE = `/login?redirect=${encodeURIComponent('/customer/dashboard')}`;

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [scheduleHref, setScheduleHref] = useState(SIGNED_OUT_SCHEDULE);
  const [customerSignedIn, setCustomerSignedIn] = useState(false);
  const onCustomerDash = pathname === '/customer/dashboard';
  const customerBar = customerSignedIn || onCustomerDash;

  useEffect(() => {
    let cancelled = false;

    const resolve = async (user) => {
      if (!user) {
        if (!cancelled) {
          setScheduleHref(SIGNED_OUT_SCHEDULE);
          setCustomerSignedIn(false);
        }
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!cancelled) {
        const isAdmin = profile?.role === 'admin';
        setScheduleHref(isAdmin ? '/schedule' : '/customer/dashboard');
        setCustomerSignedIn(!isAdmin);
      }
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => resolve(session?.user));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  function openAskAi(event) {
    if (pathname !== '/customer/dashboard') return;
    event.preventDefault();
    window.dispatchEvent(new Event('flora-open-ask-ai'));
  }

  const navItems = customerBar
    ? [
        { href: 'tel:4013890913', label: 'CALL NOW', icon: PhoneIcon, isExternal: true },
        { href: '/customer/dashboard', label: 'DASH', icon: HomeIcon },
        { href: '/customer/dashboard#ask-ai', label: 'ASK AI', icon: SparklesIcon, onClick: openAskAi, primary: true },
      ]
    : [
        { href: 'tel:4013890913', label: 'CALL NOW', icon: PhoneIcon, isExternal: true },
        { href: '/contact', label: 'GET QUOTE', icon: SparklesIcon, primary: true },
        { href: scheduleHref, label: 'SCHEDULE', icon: CalendarIcon },
      ];

  // Hide on schedule page — it has its own nav
  if (pathname === '/schedule') return <YardPhotoChat sheetOnly />;

  return (
    <>
    <YardPhotoChat sheetOnly />
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-0 right-0 z-[100] px-4 lg:hidden"
        >
          <div className="max-w-md mx-auto relative">
            {/* Close Button */}
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white z-10"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] shadow-2xl p-3 flex justify-between gap-3">
              {navItems.map((item) => {
                const Component = item.isExternal ? 'a' : Link;

                return (
                  <Component
                    key={item.label}
                    href={item.href}
                    onClick={item.onClick}
                    className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[2rem] transition-all active:scale-95 ${
                      item.primary ? 'bg-slate-900 ring-4 ring-slate-900/10' : 'bg-slate-50'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 mb-1 ${item.primary ? 'text-green-400' : 'text-slate-900'}`} />
                    <span className={`text-[10px] font-black tracking-[0.15em] italic ${item.primary ? 'text-white' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </Component>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {!isVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsVisible(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl z-[100] border-4 border-white lg:hidden"
        >
           <SparklesIcon className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
    </>
  );
}