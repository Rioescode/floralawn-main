'use client';

import { 
  PhoneIcon, 
  XMarkIcon, 
  CheckBadgeIcon, 
  EnvelopeIcon, 
  PauseIcon, 
  PlayIcon, 
  UserGroupIcon, 
  GiftIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/solid";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import LeafSeason from './LeafSeason';

function LeafIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden>
      <path d="M50 4 L57 20 L66 14 L64 34 L80 24 L76 38 L95 36 L82 50 L92 56 L70 63 L74 74 L55 68 L53 78 L47 78 L45 68 L26 74 L30 63 L8 56 L18 50 L5 36 L24 38 L20 24 L36 34 L34 14 L43 20 Z" />
      <path d="M50 76 Q51 88 48 98" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const promos = [
  {
    id: 1,
    title: 'Fall Cleanup Season',
    subtitle: 'Leaves, beds & lawn — done in one visit.',
    badge: 'LEAF SEASON',
    icon: LeafIcon,
    accent: 'FROM $175',
    mainText: 'full fall cleanup — leaves cleared, beds cleaned up and lawn ready for winter.',
    link: '/contact?service=Fall%20Cleanup',
    theme: {
      bg: 'bg-[#1c0a0e]',
      gradient: 'from-red-700/40',
      border: 'border-red-700',
      accentBg: 'bg-yellow-400',
      accentText: 'text-[#1c0a0e]',
      button: 'bg-red-700 hover:bg-red-600',
      text: 'text-yellow-300',
      progress: 'from-red-700 via-yellow-400 to-red-700',
    }
  },
  {
    id: 2,
    title: 'Aeration + Overseeding',
    subtitle: 'Fall is the #1 time to seed New England lawns.',
    badge: 'BEST TIME TO SEED',
    icon: SparklesIcon,
    accent: 'FROM $125',
    mainText: 'core aeration + overseeding — thicker, greener lawn next spring.',
    link: '/contact?service=Lawn%20Aeration',
    theme: {
      bg: 'bg-[#22100c]',
      gradient: 'from-yellow-600/30',
      border: 'border-yellow-500',
      accentBg: 'bg-yellow-400',
      accentText: 'text-[#22100c]',
      button: 'bg-yellow-600 hover:bg-yellow-500',
      text: 'text-yellow-300',
      progress: 'from-yellow-600 via-white to-yellow-600',
    }
  },
  {
    id: 3,
    title: 'Neighborhood Leaf Day',
    subtitle: 'Better Together. Shared Savings.',
    badge: 'COMMUNITY REWARD',
    icon: UserGroupIcon,
    accent: 'SAVE 10%',
    mainText: 'when you and your neighbor book leaf cleanup on the same day!',
    link: '/contact?service=Leaf%20Removal&promo=NEIGHBOR-10',
    theme: {
      bg: 'bg-[#2a0f14]',
      gradient: 'from-rose-800/40',
      border: 'border-rose-700',
      accentBg: 'bg-rose-700',
      accentText: 'text-white',
      button: 'bg-rose-800 hover:bg-rose-700',
      text: 'text-rose-300',
      progress: 'from-rose-800 via-yellow-300 to-rose-800',
    }
  },
  {
    id: 4,
    title: 'Fall-to-Spring Bundle',
    subtitle: 'Full Season Care. Maximum Value.',
    badge: 'BULK SAVINGS',
    icon: GiftIcon,
    accent: '15% OFF',
    mainText: 'Save up to 15% when you bundle Fall Cleanup, Spring Cleanup and Weekly Maintenance!',
    link: '/contact?service=Fall%20Cleanup&promo=BUNDLE-15',
    theme: {
      bg: 'bg-[#1a120b]',
      gradient: 'from-yellow-800/40',
      border: 'border-yellow-700',
      accentBg: 'bg-yellow-700',
      accentText: 'text-white',
      button: 'bg-yellow-800 hover:bg-yellow-700',
      text: 'text-yellow-400',
      progress: 'from-yellow-800 via-red-500 to-yellow-800',
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
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative ${promo.theme.bg} text-white overflow-hidden shadow-2xl z-[60] border-b-4 ${promo.theme.border} transition-colors duration-1000 group/banner pb-10 lg:pb-0`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-0 right-0 w-full h-full bg-gradient-to-l ${promo.theme.gradient} to-transparent`}
        />
      </div>

      <LeafSeason density="sparse" className="z-0 opacity-80" />

      <AnimatePresence mode="wait">
        <motion.div 
          key={promo.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <div className="flex flex-col lg:flex-row items-center py-5 px-6 gap-6 lg:gap-12 relative">
            
            <button 
              onClick={(e) => { e.stopPropagation(); prevPromo(); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-4 hover:bg-white/10 rounded-full transition-all group/nav"
            >
              <ChevronLeftIcon className="w-8 h-8 text-white/20 group-hover/nav:text-white" />
            </button>

            <div className="flex items-center gap-4 shrink-0">
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className={`${promo.theme.button} text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg transition-colors duration-500`}
              >
                <promo.icon className="w-4 h-4 text-white leaf-season-wiggle" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{promo.badge}</span>
              </motion.div>
              <div className="h-8 w-px bg-white/10 hidden lg:block" />
              <div className="text-center lg:text-left">
                <h4 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">
                  Flora <span className={promo.theme.text}>Fall</span>
                </h4>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">{promo.title}</p>
              </div>
            </div>

            <div className="flex-grow text-center lg:text-left bg-black/25 backdrop-blur-md border border-white/10 p-4 rounded-3xl min-h-[80px] flex items-center">
              <p className="text-sm lg:text-base font-bold text-white/75 leading-tight">
                🍁 Leaf Season: <span className="text-white font-black italic uppercase tracking-tight underline decoration-yellow-400/40 underline-offset-4 decoration-2">Flora Lawn</span> is offering 
                <span className={`inline-flex items-center gap-2 mx-2 ${promo.theme.accentBg} ${promo.theme.accentText} px-3 py-1 rounded-lg font-black italic text-xs uppercase shadow-xl transform rotate-2`}>
                  {promo.accent}
                </span>
                {promo.mainText}
                <span className="hidden xl:inline text-xs text-white/40 block mt-1 font-black uppercase tracking-widest italic">{promo.subtitle}</span>
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0 relative pr-12 xl:pr-0">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Before the Snow</p>
                <div className={`flex items-center gap-1 justify-end ${promo.theme.text}`}>
                  <CheckBadgeIcon className="w-3 h-3" />
                  <span className="text-[11px] font-black italic uppercase tracking-tight">Booking Now</span>
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

              <button 
                onClick={(e) => { e.stopPropagation(); nextPromo(); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-4 hover:bg-white/10 rounded-full transition-all group/nav"
              >
                <ChevronRightIcon className="w-8 h-8 text-white/20 group-hover/nav:text-white" />
              </button>

              <button 
                onClick={() => setIsVisible(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors group"
              >
                <XMarkIcon className="w-5 h-5 text-white/40 group-hover:text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-4 py-3 relative z-30">
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
            className="bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors group/pause"
          >
            {isPaused ? (
              <PlayIcon className="w-3 h-3 text-yellow-400" />
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
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPromoIndex ? 'bg-yellow-400 w-5 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{currentPromoIndex + 1} / {promos.length} FALL OFFERS</span>
      </div>
      
      <motion.div 
        key={promo.id + 'progress' + isPaused}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={isPaused ? { duration: 0 } : { duration: 7, ease: "linear" }}
        className={`h-1.5 bg-gradient-to-r ${promo.theme.progress} origin-left opacity-70 relative z-10`}
      />
    </div>
  );
}
