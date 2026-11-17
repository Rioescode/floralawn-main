'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneIcon, 
  CheckBadgeIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/solid';
import LeafSeason from './LeafSeason';

export default function WeatherTopBar() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAdvisory() {
      try {
        const res = await fetch('/api/weather-advisory');
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (err) {
        // Silently handle
      }
    }
    fetchAdvisory();
    return () => { isMounted = false; };
  }, []);

  if (!data?.analysis) return null;

  const { analysis, current } = data;

  return (
    <div className="relative bg-[#1c0a0e] text-white overflow-hidden shadow-2xl z-[60] border-b-4 border-yellow-500 transition-colors duration-1000 group/banner pb-10 lg:pb-0">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-red-700/40 via-yellow-600/20 to-transparent" />
      </div>

      <LeafSeason density="sparse" className="z-0 opacity-80" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center py-5 px-6 gap-6 lg:gap-10 relative">
          
          {/* LEFT: LIVE BADGE + BRAND/TEMP */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-[#6b1d2a] border border-yellow-400/30 text-yellow-300 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest italic">{analysis.badge}</span>
            </div>
            
            <div className="h-8 w-px bg-white/10 hidden lg:block" />
            
            <div className="text-center lg:text-left">
              <h4 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">
                Turf <span className="text-yellow-300">Weather AI</span>
              </h4>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">
                Live: {current?.temp}°F • RI &amp; MA
              </p>
            </div>
          </div>

          {/* MIDDLE: WEATHER ADVISORY MESSAGE */}
          <div className="flex-grow text-center lg:text-left bg-black/35 backdrop-blur-md border border-white/10 p-4 rounded-3xl min-h-[80px] flex items-center">
            <p className="text-sm lg:text-base font-bold text-white/85 leading-tight">
              ⚠️ <span className="text-white font-black italic uppercase tracking-tight underline decoration-yellow-400/40 underline-offset-4 decoration-2">
                {analysis.headline}
              </span>
              <span className="inline-flex items-center gap-1.5 mx-2 bg-yellow-400 text-stone-900 px-2.5 py-0.5 rounded-lg font-black italic text-xs uppercase shadow-xl">
                {analysis.targetDate}
              </span>
              <span className="text-stone-200 font-medium">
                {analysis.incentive}
              </span>
              <span className="hidden xl:inline text-xs text-yellow-300/60 block mt-1 font-semibold italic">
                {analysis.turfAlert}
              </span>
            </p>
          </div>

          {/* RIGHT: BEFORE THE SNOW + BUTTONS */}
          <div className="flex items-center gap-6 shrink-0 relative pr-0">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Before the Snow</p>
              <div className="flex items-center gap-1 justify-end text-yellow-300">
                <CheckBadgeIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black italic uppercase tracking-tight">Booking Now</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a 
                href="tel:4013890913" 
                className="w-full sm:w-auto bg-[#6b1d2a] hover:bg-[#802232] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl border border-yellow-400/20"
              >
                <PhoneIcon className="w-3.5 h-3.5 text-yellow-400" /> 
                <span>Call Now</span>
              </a>

              <Link 
                href={`/contact?service=${encodeURIComponent(analysis.serviceQuery || 'Fall Cleanup')}&advisory=${encodeURIComponent(analysis.urgencyLevel)}`}
                className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-stone-900 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-yellow-400/20"
              >
                <EnvelopeIcon className="w-3.5 h-3.5 text-stone-900" />
                <span>{analysis.ctaText}</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
