'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  SparklesIcon, 
  ArrowRightIcon, 
  ClockIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

export default function WeatherAdvisoryBanner({ className = '', variant = 'full' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAdvisory() {
      try {
        const res = await fetch('/api/weather-advisory');
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Could not load live weather advisory:', err);
        if (isMounted) setLoading(false);
      }
    }
    fetchAdvisory();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={`w-full max-w-7xl mx-auto px-4 py-2 ${className}`}>
        <div className="animate-pulse bg-[#1c0a0e]/40 h-16 rounded-3xl w-full border border-yellow-400/10" />
      </div>
    );
  }

  if (!data?.analysis) return null;

  const { analysis, current, forecast, location } = data;

  return (
    <aside aria-label="Live Weather & Lawn Advisory" className={`w-full max-w-7xl mx-auto px-4 ${className}`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1c0a0e] via-[#260e15] to-[#140609] text-white p-5 md:p-7 border border-yellow-400/25 shadow-2xl transition-all duration-300">
        {/* Warm ambient seasonal glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* TOP BAR: LIVE BADGE + TEMPERATURE & LOCATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-yellow-400/15">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[#6b1d2a] text-yellow-300 border border-yellow-400/30 flex items-center gap-1.5 shadow-sm">
                <SparklesIcon className="w-3 h-3 text-yellow-300" /> {analysis.badge}
              </span>
              <span className="text-[11px] font-bold text-stone-300 hidden sm:inline">
                • {location}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-black bg-black/40 px-3.5 py-1.5 rounded-xl text-yellow-300 border border-yellow-400/20 shadow-inner">
                🌡️ Current: {current?.temp}°F
              </span>
              <button 
                type="button" 
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Collapse Weather Advisory" : "Expand Weather Advisory"}
                className="text-[10px] font-bold text-stone-300 hover:text-white uppercase tracking-wider flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 transition-colors"
              >
                {expanded ? (
                  <>Hide details <ChevronUpIcon className="w-3.5 h-3.5 text-yellow-400" /></>
                ) : (
                  <>Show details <ChevronDownIcon className="w-3.5 h-3.5 text-yellow-400" /></>
                )}
              </button>
            </div>
          </div>

          {/* MAIN HEADLINE + ACTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2 text-yellow-400">
                <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-yellow-400" />
                <h3 className="text-lg md:text-2xl font-black italic tracking-tight text-white leading-tight">
                  {analysis.headline}
                </h3>
              </div>
              <p className="text-xs md:text-sm text-stone-200 font-medium leading-relaxed">
                {analysis.incentive}
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch justify-center gap-2.5">
              <Link
                href={`/contact?service=${encodeURIComponent(analysis.serviceQuery || 'Fall Cleanup')}&advisory=${encodeURIComponent(analysis.urgencyLevel)}`}
                className="w-full text-center px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-stone-900 shadow-xl shadow-yellow-400/20 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {analysis.ctaText} <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-stone-300 text-center">
                <ClockIcon className="w-3.5 h-3.5 text-yellow-400" /> Crew Dispatching Daily in RI &amp; MA
              </div>
            </div>
          </div>

          {/* EXPANDABLE SECTION: TURF IMPACT + 5-DAY WEATHER STRIP */}
          {expanded && (
            <div className="mt-5 pt-4 border-t border-yellow-400/15 space-y-4 transition-all">
              {/* TURF IMPACT CALLOUT */}
              <div className="bg-black/40 border border-yellow-400/20 rounded-2xl p-4 text-xs text-stone-200 flex items-start gap-3 shadow-inner">
                <span className="text-base shrink-0">🔬</span>
                <div>
                  <strong className="text-yellow-300 font-bold block mb-0.5">Agronomic Turf Alert:</strong>
                  {analysis.turfAlert}
                </div>
              </div>

              {/* 5-DAY STRIP */}
              {forecast?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-300/80 mb-2">
                    5-Day Weather &amp; Ground Temperature Window:
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {forecast.map((day, i) => {
                      const isFrostDay = day.minTemp <= 32;
                      const hasRain = day.rainProb >= 40;
                      return (
                        <div 
                          key={i} 
                          className={`rounded-xl p-2.5 text-center border transition-all ${
                            isFrostDay 
                              ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-200' 
                              : hasRain 
                                ? 'bg-blue-500/15 border-blue-400/30 text-blue-200' 
                                : 'bg-black/30 border-white/10 text-stone-300'
                          }`}
                        >
                          <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">{day.dayLabel}</p>
                          <p className="text-sm font-black my-1 text-white">{day.maxTemp}° / <span className={isFrostDay ? 'text-yellow-400 font-extrabold' : 'text-stone-400'}>{day.minTemp}°</span></p>
                          <span className="text-[9px] font-bold block">
                            {day.snowAmount > 0 
                              ? `❄️ ${day.snowAmount}"` 
                              : isFrostDay 
                                ? '🧊 Frost' 
                                : hasRain 
                                  ? `🌧️ ${day.rainProb}%` 
                                  : '☀️ Clear'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
