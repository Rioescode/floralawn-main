'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PhoneIcon, 
  ArrowRightIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckBadgeIcon
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

  const { analysis, current, forecast } = data;

  return (
    <div className="relative bg-[#1c0a0e] text-white border-b-2 border-yellow-500/30 shadow-2xl z-[60] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-full bg-yellow-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-10 w-96 h-full bg-red-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 relative z-10">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 lg:gap-8">
          
          {/* LEFT SECTION: LIVE BADGE + HEADLINE + SUBTEXT */}
          <div className="flex-1 min-w-0 space-y-2">
            
            {/* Top row: Status indicators */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6b1d2a] text-yellow-300 border border-yellow-400/30 text-[10px] font-black uppercase tracking-wider shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                </span>
                {analysis.badge}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-black text-yellow-300 bg-black/40 px-2.5 py-1 rounded-full border border-yellow-400/20">
                🌡️ Live: {current?.temp}°F • RI &amp; MA
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-stone-300 uppercase tracking-wider">
                <SparklesIcon className="w-3 h-3 text-yellow-400" /> Turf Condition Advisory
              </span>
            </div>

            {/* Headline */}
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base sm:text-lg md:text-xl font-black italic tracking-tight text-white leading-tight">
                  {analysis.headline}
                </h4>
                <p className="text-xs sm:text-sm text-stone-300 font-medium leading-snug mt-1">
                  {analysis.incentive}
                </p>
              </div>
            </div>

          </div>

          {/* CENTER: 5-DAY MINI FORECAST CAPSULES */}
          {forecast?.length > 0 && (
            <div className="hidden xl:flex items-center gap-2 shrink-0 py-1 px-3 bg-black/40 border border-yellow-400/15 rounded-2xl">
              {forecast.slice(0, 4).map((day, i) => {
                const isFrost = day.minTemp <= 32;
                return (
                  <div 
                    key={i} 
                    className={`px-3 py-1.5 rounded-xl text-center transition-all ${
                      isFrost 
                        ? 'bg-yellow-400/15 border border-yellow-400/30 text-yellow-300' 
                        : 'bg-white/5 border border-white/10 text-stone-300'
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase text-stone-400">{day.dayLabel}</p>
                    <p className="text-xs font-black text-white">{day.maxTemp}° / <span className={isFrost ? 'text-yellow-400 font-black' : 'text-stone-400'}>{day.minTemp}°</span></p>
                    <span className="text-[9px] font-bold">{isFrost ? '🧊 Frost' : '☀️ Dry'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* RIGHT SECTION: BOOKING STATUS + ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0">
            <div className="hidden sm:block text-right lg:text-left xl:text-right pr-2">
              <div className="flex items-center gap-1 justify-end lg:justify-start xl:justify-end text-yellow-300">
                <CheckBadgeIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black italic uppercase tracking-tight">Before the Snow</span>
              </div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Slots Available</p>
            </div>

            <div className="flex items-center gap-2.5">
              <a 
                href="tel:4013890913" 
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-[#6b1d2a] hover:bg-[#802232] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-yellow-400/20 transition-all active:scale-95 shadow-lg"
              >
                <PhoneIcon className="w-3.5 h-3.5 text-yellow-400" />
                <span>Call</span>
              </a>

              <Link
                href={`/contact?service=${encodeURIComponent(analysis.serviceQuery || 'Fall Cleanup')}&advisory=${encodeURIComponent(analysis.urgencyLevel)}`}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/20 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <span>{analysis.ctaText}</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
