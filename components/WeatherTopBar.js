'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SparklesIcon, ArrowRightIcon, PhoneIcon } from '@heroicons/react/24/solid';

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
        // Silently handle fallback
      }
    }
    fetchAdvisory();
    return () => { isMounted = false; };
  }, []);

  if (!data?.analysis) return null;

  const { analysis, current } = data;
  const isCritical = analysis.urgencyLevel === 'critical';

  return (
    <div className="bg-[#1c0a0e] text-white border-b border-yellow-400/20 text-xs py-2 px-3 sm:px-6 relative z-[1001] shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* LEFT: LIVE INDICATOR + ADVISORY MESSAGE */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
          </span>

          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6b1d2a] text-yellow-300 border border-yellow-400/30">
            {analysis.badge}
          </span>

          <p className="truncate text-[11px] sm:text-xs text-stone-200 font-medium">
            <strong className="text-white font-bold">{analysis.headline}</strong>
            <span className="hidden md:inline text-stone-300"> — {analysis.incentive}</span>
          </p>
        </div>

        {/* RIGHT: CURRENT TEMP + ACTION BUTTON */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-yellow-300 bg-black/40 px-2 py-1 rounded-lg border border-yellow-400/20">
            🌡️ {current?.temp}°F RI
          </span>

          <Link
            href={`/contact?service=${encodeURIComponent(analysis.serviceQuery || 'Fall Cleanup')}&advisory=${encodeURIComponent(analysis.urgencyLevel)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black text-[10px] sm:text-[11px] uppercase tracking-wide transition-all active:scale-95 shadow-md shadow-yellow-400/20"
          >
            {analysis.ctaText} <ArrowRightIcon className="w-3 h-3" />
          </Link>

          <a 
            href="tel:4013890913" 
            className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-stone-300 hover:text-white transition-colors"
          >
            <PhoneIcon className="w-3 h-3 text-yellow-400" /> (401) 389-0913
          </a>
        </div>

      </div>
    </div>
  );
}
