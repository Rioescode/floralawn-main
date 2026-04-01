'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  CalendarIcon, 
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

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

  const navItems = [
    {
      href: 'tel:4013890913',
      label: 'CALL NOW',
      icon: PhoneIcon,
      color: 'bg-green-600',
      isExternal: true
    },
    {
      href: '/contact',
      label: 'GET QUOTE',
      icon: SparklesIcon,
      color: 'bg-slate-900',
    },
    {
      href: '/schedule',
      label: 'SCHEDULE',
      icon: CalendarIcon,
      color: 'bg-slate-800',
    }
  ];

  return (
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
              {navItems.map((item, idx) => {
                const isCall = item.isExternal;
                const Component = isCall ? 'a' : Link;

                return (
                  <Component
                    key={idx}
                    href={item.href}
                    className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[2rem] transition-all active:scale-95 ${
                      idx === 1 ? 'bg-slate-900 ring-4 ring-slate-900/10' : 'bg-slate-50'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 mb-1 ${idx === 1 ? 'text-green-400' : 'text-slate-900'}`} />
                    <span className={`text-[10px] font-black tracking-[0.15em] italic ${idx === 1 ? 'text-white' : 'text-slate-500'}`}>
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
  );
}