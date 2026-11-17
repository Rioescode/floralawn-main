'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneIcon, 
  ArrowRightIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/solid';

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
      } catch (err) {}
    }
    fetchAdvisory();
    return () => { isMounted = false; };
  }, []);

  if (!data?.analysis) return null;

  const { analysis, current, location } = data;

  return (
    <div className="relative bg-[#14080b] text-white border-b border-yellow-500/25 shadow-2xl z-[60] overflow-hidden">
      {/* Subtle golden ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-amber-500/10 to-red-600/5 pointer-events-none" />
      <div className="absolute -top-12 left-1/3 w-96 h-24 bg-yellow-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-8">
          
          {/* 1. WEATHER RADAR STATION PILL */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-black/60 border border-yellow-400/30 px-3.5 py-2 rounded-2xl shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-yellow-300">
                Live Radar
              </span>
              <span className="text-white/20">|</span>
              <span className="text-xs font-black text-white">
                🌡️ {current?.temp}°F
              </span>
            </div>
            
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-300/60 leading-none">
                Turf Advisory
              </p>
              <p className="text-xs font-bold text-stone-300 leading-tight mt-0.5">
                {location}
              </p>
            </div>
          </div>

          {/* 2. ADVISORY HEADLINE & TURF ALERT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#6b1d2a] border border-yellow-400/40 text-yellow-300 text-[10px] font-black uppercase tracking-wider">
                <ExclamationTriangleIcon className="w-3 h-3 text-yellow-300" />
                {analysis.badge}
              </span>
              <span className="text-[11px] font-bold text-yellow-400/80 hidden md:inline">
                • Target: {analysis.targetDate}
              </span>
            </div>

            <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight leading-snug">
              {analysis.headline}
            </h3>
            
            <p className="text-xs text-stone-300 font-medium leading-relaxed mt-0.5 line-clamp-2 lg:line-clamp-1">
              {analysis.turfAlert}
            </p>
          </div>

          {/* 3. CALL TO ACTION CLUSTER */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <a 
              href="tel:4013890913" 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-black/40 hover:bg-black/60 text-stone-200 text-xs font-bold border border-yellow-400/20 transition-all active:scale-95 shadow-md"
            >
              <PhoneIcon className="w-3.5 h-3.5 text-yellow-400" />
              <span>(401) 389-0913</span>
            </a>

            <Link
              href={`/contact?service=${encodeURIComponent(analysis.serviceQuery || 'Fall Cleanup')}&advisory=${encodeURIComponent(analysis.urgencyLevel)}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-stone-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-yellow-400/20 transition-all transform hover:scale-[1.02] active:scale-95 text-center"
            >
              <span>{analysis.ctaText}</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
