'use client';

import { 
  SparklesIcon, 
  PhoneIcon, 
  XMarkIcon, 
  CheckBadgeIcon, 
  EnvelopeIcon, 
  TicketIcon, 
  BoltIcon, 
  PauseIcon, 
  PlayIcon, 
  UserGroupIcon, 
  GiftIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/solid";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';

const promos = [
  {
    id: 1,
    title: 'Precision Dethatching',
    subtitle: 'Breathe life back into your turf today.',
    badge: 'Seasonal Exclusive',
    icon: SparklesIcon,
    accent: 'FREE',
    mainText: 'lawn dethatching when you sign up for full maintenance.',
    link: '/contact?promo=BREATHE-FREE',
    theme: {
      bg: 'bg-slate-950',
      gradient: 'from-green-600/20',
      border: 'border-green-600',
      accentBg: 'bg-yellow-400',
      accentText: 'text-slate-950',
      button: 'bg-green-600 hover:bg-green-500'
    }
  },
  {
    id: 2,
    title: 'Introductory Mow Special',
    subtitle: 'Elite Quality. Local Reliability.',
    badge: 'FLASH OFFER',
    icon: BoltIcon,
    accent: '$29 / FREE',
    mainText: '$29 First Mow (Weekly/Bi-weekly) OR First Mow FREE for Weekly signups!',
    link: '/contact?promo=FIRST-29',
    theme: {
      bg: 'bg-slate-900',
      gradient: 'from-blue-600/30',
      border: 'border-blue-500',
      accentBg: 'bg-blue-500',
      accentText: 'text-white',
      button: 'bg-blue-600 hover:bg-blue-500'
    }
  },
  {
    id: 3,
    title: 'Neighborhood Discount',
    subtitle: 'Better Together. Shared Savings.',
    badge: 'COMMUNITY REWARD',
    icon: UserGroupIcon,
    accent: 'SAVE 10%',
    mainText: 'Get 10% OFF when you and your neighbor book service for the same day!',
    link: '/contact?promo=NEIGHBOR-10',
    theme: {
      bg: 'bg-slate-950',
      gradient: 'from-amber-600/20',
      border: 'border-amber-500',
      accentBg: 'bg-amber-500',
      accentText: 'text-white',
      button: 'bg-amber-600 hover:bg-amber-500'
    }
  },
  {
    id: 4,
    title: 'Elite Bundle Reward',
    subtitle: 'Full Season Care. Maximum Value.',
    badge: 'BULK SAVINGS',
    icon: GiftIcon,
    accent: '15% OFF',
    mainText: 'Save up to 15% when you bundle Spring Cleanup, Fall Cleanup, and Weekly Maintenance!',
    link: '/contact?promo=BUNDLE-15',
    theme: {
      bg: 'bg-slate-900',
      gradient: 'from-emerald-600/30',
      border: 'border-emerald-500',
      accentBg: 'bg-emerald-500',
      accentText: 'text-white',
      button: 'bg-emerald-600 hover:bg-emerald-500'
    }
  }
];

export default function SpringPromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextPromo = useCallback(() => {
    setCurrentPromoIndex((prev) => (prev + 1) % promos.length);
  }, []);

  const prevPromo = useCallback(() => {
    setCurrentPromoIndex((prev) => (prev - 1 + promos.length) % promos.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextPromo();
    }, 7000); 
    
    return () => clearInterval(timer);
  }, [isPaused, nextPromo]);

  if (!isVisible) return null;

  const promo = promos[currentPromoIndex];

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div 
          key={promo.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: "anticipate" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className={`relative ${promo.theme.bg} text-white overflow-hidden shadow-2xl z-[60] border-b-4 ${promo.theme.border} transition-colors duration-1000 group/banner pb-10 lg:pb-0`}
        >
          {/* Visual Pop Effect on Switch */}
          <motion.div 
            key={promo.id + 'flash'}
            initial={{ opacity: 0.5, scale: 1.2 }}
            animate={{ opacity: 0, scale: 1 }}
            className="absolute inset-0 bg-white pointer-events-none z-10"
          />

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <motion.div 
              animate={{ 
                x: [0, 100, 0], 
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute top-0 right-0 w-full h-full bg-gradient-to-l ${promo.theme.gradient} to-transparent`}
            />
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col lg:flex-row items-center py-5 px-6 gap-6 lg:gap-12 relative">
              
              {/* Navigation Left */}
              <button 
                onClick={(e) => { e.stopPropagation(); prevPromo(); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-4 hover:bg-white/10 rounded-full transition-all group/nav"
              >
                <ChevronLeftIcon className="w-8 h-8 text-white/10 group-hover/nav:text-white" />
              </button>

              {/* Badge & Lead */}
              <div className="flex items-center gap-4 shrink-0">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className={`${promo.theme.button} text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg transition-colors duration-500`}
                >
                  <promo.icon className="w-4 h-4 text-white animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">{promo.badge}</span>
                </motion.div>
                <div className="h-8 w-px bg-white/10 hidden lg:block" />
                <div className="text-center lg:text-left">
                  <h4 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">
                    Flora <span className={promo.id === 1 ? "text-green-500" : promo.id === 2 ? "text-blue-400" : promo.id === 3 ? "text-amber-400" : "text-emerald-400"}>Exclusive</span>
                  </h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{promo.title}</p>
                </div>
              </div>

              {/* Main Content */}
              <motion.div 
                key={promo.id + 'content'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex-grow text-center lg:text-left bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-3xl min-h-[80px] flex items-center"
              >
                <p className="text-sm lg:text-base font-bold text-slate-300 leading-tight">
                   Special Update: <span className="text-white font-black italic uppercase tracking-tight underline decoration-white/20 underline-offset-4 decoration-2">Flora Lawn</span> is offering 
                  <span className={`inline-flex items-center gap-2 mx-2 ${promo.theme.accentBg} ${promo.theme.accentText} px-3 py-1 rounded-lg font-black italic text-xs uppercase shadow-xl transform rotate-2 animate-pulse`}>
                    {promo.accent}
                  </span>
                  {promo.mainText}
                  <span className="hidden xl:inline text-xs text-white/40 block mt-1 font-black uppercase tracking-widest italic">{promo.subtitle}</span>
                </p>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex items-center gap-6 shrink-0 relative pr-12 xl:pr-0">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Don't Miss Out</p>
                  <div className={`flex items-center gap-1 justify-end ${promo.id === 1 ? "text-green-500" : promo.id === 2 ? "text-blue-400" : promo.id === 3 ? "text-amber-400" : "text-emerald-400"}`}>
                    <CheckBadgeIcon className="w-3 h-3" />
                    <span className="text-[11px] font-black italic uppercase tracking-tight">Active Offer</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a 
                    href="tel:4013890913" 
                    className={`w-full sm:w-auto ${promo.theme.button} text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl group border border-white/10`}
                  >
                    <PhoneIcon className="w-3.5 h-3.5" /> 
                    <span>Call Now</span>
                  </a>

                  <Link 
                    href={promo.link}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    <EnvelopeIcon className="w-3.5 h-3.5" />
                    <span>Claim Online</span>
                  </Link>
                </div>

                {/* Navigation Right */}
                <button 
                  onClick={(e) => { e.stopPropagation(); nextPromo(); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-4 hover:bg-white/10 rounded-full transition-all group/nav"
                >
                  <ChevronRightIcon className="w-8 h-8 text-white/10 group-hover/nav:text-white" />
                </button>

                <button 
                  onClick={() => setIsVisible(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors group"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-600 group-hover:text-white" />
                </button>
              </div>
            </div>

            {/* Bottom Controls (Dots & Counter) */}
            <div className="flex items-center justify-center gap-4 py-3 relative z-30">
               <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                    className="bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors group/pause"
                  >
                    {isPaused ? (
                      <PlayIcon className="w-3 h-3 text-green-400" />
                    ) : (
                      <PauseIcon className="w-3 h-3 text-white/30 group-hover/banner:text-white" />
                    )}
                  </button>
                  <div className="h-3 w-px bg-white/10 mx-1" />
                  <div className="flex items-center gap-1.5">
                    {promos.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentPromoIndex(i); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPromoIndex ? 'bg-white w-5 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/20 hover:bg-white/40'}`}
                      />
                    ))}
                  </div>
               </div>
               <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{currentPromoIndex + 1} / {promos.length} OFFERS</span>
            </div>
          </div>
          
          {/* Animated Progress Accent */}
          <motion.div 
            key={promo.id + 'progress' + isPaused}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={isPaused ? { duration: 0 } : { duration: 7, ease: "linear" }}
            className={`h-1.5 bg-gradient-to-r ${promo.id === 1 ? "from-green-600 via-yellow-400 to-green-600" : promo.id === 2 ? "from-blue-600 via-white to-blue-600" : promo.id === 3 ? "from-amber-600 via-white to-amber-600" : "from-emerald-600 via-white to-emerald-600"} origin-left opacity-60`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
