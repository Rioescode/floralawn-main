'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  SunIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const HQ = { name: 'Pawtucket HQ', lat: 41.879, lng: -71.383 };

const TOWNS = [
  { name: 'Providence', state: 'RI', lat: 41.824, lng: -71.413, major: true, labelDx: -42, labelDy: -10 },
  { name: 'Cranston', state: 'RI', lat: 41.78, lng: -71.437 },
  { name: 'Pawtucket', state: 'RI', lat: 41.879, lng: -71.383 },
  { name: 'Central Falls', state: 'RI', lat: 41.89, lng: -71.392 },
  { name: 'East Providence', state: 'RI', lat: 41.814, lng: -71.37 },
  { name: 'North Providence', state: 'RI', lat: 41.85, lng: -71.466 },
  { name: 'Woonsocket', state: 'RI', lat: 42.003, lng: -71.515, major: true, labelDx: 0, labelDy: -14 },
  { name: 'Cumberland', state: 'RI', lat: 41.967, lng: -71.433 },
  { name: 'Lincoln', state: 'RI', lat: 41.911, lng: -71.435 },
  { name: 'Johnston', state: 'RI', lat: 41.822, lng: -71.507 },
  { name: 'Smithfield', state: 'RI', lat: 41.922, lng: -71.55 },
  { name: 'North Smithfield', state: 'RI', lat: 41.967, lng: -71.55 },
  { name: 'Burrillville', state: 'RI', lat: 41.955, lng: -71.702 },
  { name: 'Glocester', state: 'RI', lat: 41.905, lng: -71.68 },
  { name: 'Foster', state: 'RI', lat: 41.854, lng: -71.758 },
  { name: 'Scituate', state: 'RI', lat: 41.81, lng: -71.6 },
  { name: 'Warwick', state: 'RI', lat: 41.7, lng: -71.416, major: true, labelDx: 38, labelDy: 4 },
  { name: 'West Warwick', state: 'RI', lat: 41.697, lng: -71.522 },
  { name: 'Coventry', state: 'RI', lat: 41.686, lng: -71.6 },
  { name: 'East Greenwich', state: 'RI', lat: 41.66, lng: -71.456 },
  { name: 'West Greenwich', state: 'RI', lat: 41.63, lng: -71.66 },
  { name: 'North Kingstown', state: 'RI', lat: 41.572, lng: -71.447 },
  { name: 'Exeter', state: 'RI', lat: 41.577, lng: -71.54 },
  { name: 'South Kingstown', state: 'RI', lat: 41.437, lng: -71.501 },
  { name: 'Narragansett', state: 'RI', lat: 41.43, lng: -71.455 },
  { name: 'Richmond', state: 'RI', lat: 41.505, lng: -71.669 },
  { name: 'Hopkinton', state: 'RI', lat: 41.461, lng: -71.778 },
  { name: 'Charlestown', state: 'RI', lat: 41.383, lng: -71.642 },
  { name: 'Westerly', state: 'RI', lat: 41.378, lng: -71.827, major: true, labelDx: 0, labelDy: -14 },
  { name: 'Jamestown', state: 'RI', lat: 41.497, lng: -71.367 },
  { name: 'Newport', state: 'RI', lat: 41.49, lng: -71.313, major: true, labelDx: 34, labelDy: 14 },
  { name: 'Middletown', state: 'RI', lat: 41.546, lng: -71.291 },
  { name: 'Portsmouth', state: 'RI', lat: 41.6, lng: -71.251 },
  { name: 'Tiverton', state: 'RI', lat: 41.626, lng: -71.214 },
  { name: 'Little Compton', state: 'RI', lat: 41.51, lng: -71.171 },
  { name: 'Bristol', state: 'RI', lat: 41.677, lng: -71.266 },
  { name: 'Warren', state: 'RI', lat: 41.73, lng: -71.282 },
  { name: 'Barrington', state: 'RI', lat: 41.741, lng: -71.309 },
  { name: 'New Shoreham', state: 'RI', lat: 41.173, lng: -71.558, island: true },
  { name: 'Seekonk', state: 'MA', lat: 41.808, lng: -71.337 },
  { name: 'Rehoboth', state: 'MA', lat: 41.84, lng: -71.249 },
  { name: 'Attleboro', state: 'MA', lat: 41.945, lng: -71.285, major: true, labelDx: 44, labelDy: -4 },
  { name: 'North Attleboro', state: 'MA', lat: 41.984, lng: -71.333 },
  { name: 'Plainville', state: 'MA', lat: 42.004, lng: -71.333 },
  { name: 'Wrentham', state: 'MA', lat: 42.067, lng: -71.328 },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'RI', label: 'Rhode Island' },
  { id: 'MA', label: 'Mass.' },
];

// Geographic projection: (lat, lng) -> 900x720 Shadow Box SVG space
function project(lat, lng) {
  const x = 135 + ((lng - -71.88) / 0.8) * 630;
  const y = 660 - ((lat - 41.12) / 1.0) * 590;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// Haversine miles from Pawtucket HQ for realistic route badge
function milesFromHQ(lat, lng) {
  const R = 3958.8;
  const dLat = ((lat - HQ.lat) * Math.PI) / 180;
  const dLng = ((lng - HQ.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((HQ.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const HQ_PT = project(HQ.lat, HQ.lng);

export default function ServiceAreaMap() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('Providence');
  const [hovered, setHovered] = useState(null);
  const [lampOn, setLampOn] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const counts = useMemo(
    () => ({
      all: TOWNS.length,
      RI: TOWNS.filter((t) => t.state === 'RI').length,
      MA: TOWNS.filter((t) => t.state === 'MA').length,
    }),
    []
  );

  const projectedTowns = useMemo(
    () =>
      TOWNS.map((t) => ({
        ...t,
        ...project(t.lat, t.lng),
        miles: milesFromHQ(t.lat, t.lng),
      })),
    []
  );

  const visibleTowns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projectedTowns
      .filter((t) => filter === 'all' || t.state === filter)
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, query, projectedTowns]);

  const activeTown = useMemo(
    () => projectedTowns.find((t) => t.name === (hovered || active)) || projectedTowns[0],
    [projectedTowns, active, hovered]
  );

  const spotlightX = activeTown ? (activeTown.x / 900) * 100 : 54;
  const spotlightY = activeTown ? (activeTown.y / 720) * 100 : 38;

  // Curved quadratic dispatch arc from Pawtucket HQ -> Active Town
  const dispatchArc = useMemo(() => {
    if (!activeTown) return '';
    const mx = (HQ_PT.x + activeTown.x) / 2;
    const my = (HQ_PT.y + activeTown.y) / 2 - 28;
    return `M ${HQ_PT.x} ${HQ_PT.y} Q ${mx} ${my} ${activeTown.x} ${activeTown.y}`;
  }, [activeTown]);

  // Smooth zoom camera transform centered on selected town
  const cameraTransform = useMemo(() => {
    if (!zoomed || !activeTown) return 'scale(1) translate(0px, 0px)';
    const scale = 1.48;
    const tx = (450 - activeTown.x) * 0.55;
    const ty = (360 - activeTown.y) * 0.55;
    return `scale(${scale}) translate(${tx}px, ${ty}px)`;
  }, [zoomed, activeTown]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const changeFilter = (id) => {
    setFilter(id);
    if (id === 'MA') setActive('Attleboro');
    else if (id === 'RI') setActive('Providence');
  };

  return (
    <div className="relative overflow-hidden rounded-[2.6rem] border-4 border-[#3f2416] bg-gradient-to-br from-[#2a180e] via-[#150c07] to-[#0a0503] p-3.5 shadow-[0_40px_110px_rgba(0,0,0,0.65),inset_0_2px_8px_rgba(255,210,120,0.22)] md:p-5">
      {/* ANIMATED MAP KEYFRAMES */}
      <style jsx>{`
        @keyframes mapRadarPulse {
          0% { transform: scale(0.5); opacity: 0.9; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes routeFlow {
          from { stroke-dashoffset: 36; }
          to { stroke-dashoffset: 0; }
        }
        .map-radar {
          animation: mapRadarPulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .map-route-flow {
          animation: routeFlow 1.3s linear infinite;
        }
      `}</style>

      {/* BRASS CORNER BRACKETS + RIVETS */}
      <div className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-amber-600/75" />
      <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-amber-600/75" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-amber-600/75" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-amber-600/75" />

      <div className="grid overflow-hidden rounded-[1.85rem] border-2 border-black/90 bg-[#060b13] shadow-[inset_0_20px_50px_rgba(0,0,0,0.95)] lg:grid-cols-[355px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR: REFINED TOWN DIRECTORY */}
        <aside className="order-2 flex flex-col border-t border-white/10 bg-gradient-to-b from-[#0b1220] to-[#070b14] p-6 text-white lg:order-1 lg:border-r lg:border-t-0 lg:p-7">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
              Nautical Lightbox Map
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              41.8°N · 71.4°W
            </span>
          </div>

          <h3 className="mt-3 text-2xl font-black uppercase italic leading-tight tracking-tight text-white">
            {counts.all} Towns Across{' '}
            <span className="inline-block pr-1 text-amber-400">RI &amp; Mass.</span>
          </h3>
          <p className="mt-1.5 text-xs font-medium text-slate-400 leading-relaxed">
            Select any town to trace our live crew dispatch route from headquarters.
          </p>

          {/* STATE FILTER TABS */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-slate-800/90 bg-slate-950/70 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => changeFilter(f.id)}
                className={`rounded-lg px-2 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                  filter === f.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {f.label} <span className="opacity-70">{counts[f.id]}</span>
              </button>
            ))}
          </div>

          {/* SEARCH INPUT */}
          <label className="relative mt-3 block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 45 towns..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm font-medium text-white placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none"
            />
          </label>

          {/* TOWN LIST */}
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[300px] lg:space-y-1 lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1">
            {visibleTowns.map((town) => {
              const isSelected = active === town.name;
              return (
                <li key={town.name} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(town.name)}
                    onMouseEnter={() => setHovered(town.name)}
                    onMouseLeave={() => setHovered(null)}
                    className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl border px-3 py-2 text-left text-sm font-bold transition-all ${
                      isSelected
                        ? 'border-amber-400/70 bg-amber-500/15 text-amber-200 shadow-lg shadow-amber-500/10'
                        : 'border-transparent bg-white/5 text-slate-300 hover:border-slate-700/80 hover:bg-white/10 hover:text-white lg:bg-transparent'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                        isSelected
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.95)]'
                          : town.state === 'MA'
                          ? 'bg-orange-400/70'
                          : 'bg-emerald-400/75'
                      }`}
                    />
                    <span className="flex-1">{town.name}</span>
                    <span className="hidden text-[10px] font-mono text-slate-500 sm:inline">
                      {town.miles === 0 ? 'HQ' : `${town.miles}mi`}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-slate-800/90 text-slate-500'
                      }`}
                    >
                      {town.state}
                    </span>
                  </button>
                </li>
              );
            })}
            {visibleTowns.length === 0 && (
              <li className="px-3 py-4 text-sm text-slate-400">
                Not listed? We may still cover your street.{' '}
                <Link href="/contact" className="font-bold text-amber-400 underline">
                  Ask us
                </Link>
              </li>
            )}
          </ul>

          {/* BOTTOM CTA */}
          <div className="mt-auto pt-5">
            <Link
              href={`/contact${active ? `?town=${encodeURIComponent(active)}` : ''}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-300"
            >
              Get Free Quote{active ? ` in ${active}` : ''}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        {/* RIGHT STAGE: LASER-CUT ILLUMINATED BATHYMETRIC PAPER-CUT MAP */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative order-1 min-h-[450px] overflow-hidden bg-[#050a12] sm:min-h-[540px] lg:order-2 lg:min-h-[630px]"
        >
          {/* MULTI-LAYER AMBIENT BACKLIGHT TRACKING SELECTED TOWN */}
          <div
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              opacity: lampOn ? 1 : 0.14,
              background: `radial-gradient(circle at ${spotlightX}% ${spotlightY}%, rgba(254, 240, 138, 0.45) 0%, rgba(245, 158, 11, 0.24) 22%, rgba(16, 185, 129, 0.14) 48%, rgba(8, 25, 44, 0.85) 75%, rgba(4, 9, 18, 0.98) 100%)`,
            }}
          />

          {/* TOP HUD CONTROLS */}
          <div className="absolute left-4 top-4 z-20 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 py-2 backdrop-blur-md shadow-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              Live Coverage · {counts.all} Towns
            </p>
          </div>

          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider backdrop-blur-md transition-all ${
                zoomed
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-white/10 bg-slate-950/80 text-slate-300 hover:border-white/25'
              }`}
              title={zoomed ? 'Zoom out to full map' : 'Zoom in on selected town'}
            >
              {zoomed ? (
                <ArrowsPointingInIcon className="h-3.5 w-3.5" />
              ) : (
                <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
              )}
              {zoomed ? 'Overview' : 'Focus'}
            </button>

            <button
              type="button"
              onClick={() => setLampOn((l) => !l)}
              className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider backdrop-blur-md transition-all ${
                lampOn
                  ? 'border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'border-slate-700 bg-slate-950/80 text-slate-400'
              }`}
            >
              <SunIcon className="h-3.5 w-3.5" />
              {lampOn ? 'Lamp On' : 'Off'}
            </button>
          </div>

          {/* 7-LAYER ILLUMINATED BATHYMETRIC PAPER-CUT SVG */}
          <svg
            viewBox="0 0 900 720"
            preserveAspectRatio="xMidYMid meet"
            className="relative z-10 h-full w-full select-none"
          >
            <defs>
              {/* SOFT & DEEP PAPER-CUT LAYER SHADOWS */}
              <filter id="bath-shadow-1" x="-15%" y="-15%" width="135%" height="135%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.55" />
              </filter>
              <filter id="bath-shadow-2" x="-20%" y="-20%" width="145%" height="145%">
                <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000" floodOpacity="0.72" />
              </filter>
              <filter id="lantern-bloom" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* SUBTLE LAND CARDSTOCK GRADIENTS (Warm Backlit Depth) */}
              <linearGradient id="ri-land-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#265f47" />
                <stop offset="55%" stopColor="#1a4635" />
                <stop offset="100%" stopColor="#123125" />
              </linearGradient>
              <linearGradient id="ma-land-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#24473a" />
                <stop offset="100%" stopColor="#132a22" />
              </linearGradient>
              <linearGradient id="bay-shallow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#13334c" />
                <stop offset="100%" stopColor="#0a1e30" />
              </linearGradient>
            </defs>

            {/* CAMERA ZOOM GROUP */}
            <g
              style={{
                transform: cameraTransform,
                transformOrigin: '450px 360px',
                transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* ENGRAVED NAUTICAL GRATICULE GRID */}
              <g stroke="#93c5fd" strokeOpacity={lampOn ? 0.08 : 0.03} strokeWidth="0.8">
                {[180, 360, 540, 720].map((x) => (
                  <line key={`vx-${x}`} x1={x} y1="0" x2={x} y2="720" />
                ))}
                {[144, 288, 432, 576].map((y) => (
                  <line key={`hy-${y}`} x1="0" y1={y} x2="900" y2={y} />
                ))}
              </g>

              {/* LAYER 1: STEPPED BATHYMETRIC OCEAN DEPTH CONTOURS (3 LASER-CUT SHEETS) */}
              <g
                style={{
                  transform: `translate(${tilt.x * -3}px, ${tilt.y * -2}px)`,
                  transition: 'transform 260ms ease-out',
                }}
              >
                {/* Coastal Shoal Shelf */}
                <path
                  d="M0,455 C140,490 250,535 375,560 C495,582 610,515 745,485 C815,470 865,455 900,448 L900,720 L0,720 Z"
                  fill="url(#bay-shallow)"
                  stroke="#7dd3fc"
                  strokeOpacity={lampOn ? 0.24 : 0.06}
                  strokeWidth="1.1"
                  filter="url(#bath-shadow-1)"
                />
                {/* Mid Continental Shelf */}
                <path
                  d="M0,538 C165,568 295,602 435,620 C560,636 690,562 815,532 L900,520 L900,720 L0,720 Z"
                  fill="#091929"
                  stroke="#38bdf8"
                  strokeOpacity={lampOn ? 0.18 : 0.05}
                  strokeWidth="1"
                  filter="url(#bath-shadow-1)"
                />
                {/* Deep Atlantic Trench */}
                <path
                  d="M0,628 C210,645 360,685 520,682 C675,678 785,620 900,602 L900,720 L0,720 Z"
                  fill="#050e1a"
                  stroke="#38bdf8"
                  strokeOpacity={lampOn ? 0.12 : 0.03}
                  strokeWidth="0.9"
                />
              </g>

              {/* LAYER 2: SURROUNDING NEW ENGLAND & SOUTHERN MASSACHUSETTS SHEET */}
              <g
                style={{
                  transform: `translate(${tilt.x * -6}px, ${tilt.y * -4}px)`,
                  transition: 'transform 260ms ease-out',
                }}
                filter="url(#bath-shadow-1)"
              >
                {/* Surrounding CT / MA landmass silhouette */}
                <path
                  d="M-20,-20 L920,-20 L920,385 C855,392 795,382 745,355 C715,338 698,308 665,288 C620,262 565,252 535,212 L495,134 L212,132 L152,512 C110,524 45,535 -20,540 Z"
                  fill="#0f211c"
                  stroke="#fde68a"
                  strokeOpacity={lampOn ? 0.2 : 0.06}
                  strokeWidth="1.1"
                />

                {/* Highlighted Southern Massachusetts Service Zone (6 Towns) */}
                <path
                  d="M494,134 C505,102 522,74 558,68 C602,60 648,84 684,128 C716,166 742,226 732,278 C722,308 686,322 645,314 C600,305 562,282 538,242 L530,196 Z"
                  fill="url(#ma-land-grad)"
                  stroke="#fbbf24"
                  strokeOpacity={lampOn ? 0.52 : 0.14}
                  strokeWidth="1.6"
                  filter="url(#bath-shadow-1)"
                />
              </g>

              {/* LAYER 3: SCULPTED RHODE ISLAND COASTLINE, EAST BAY & ISLANDS */}
              <g
                style={{
                  transform: `translate(${tilt.x * -10}px, ${tilt.y * -7}px)`,
                  transition: 'transform 260ms ease-out',
                }}
                filter="url(#bath-shadow-2)"
              >
                {/* Rhode Island Mainland (Smooth Organic Narragansett Bay Coves) */}
                <path
                  d="M212,132 L496,132 C516,158 532,178 540,198 C544,218 534,242 526,262 C518,282 512,294 522,312 C532,328 534,344 516,360 C498,376 490,396 492,422 C494,450 494,478 480,498 C462,512 430,508 392,514 C342,522 276,528 214,528 C184,528 164,524 156,510 C148,488 158,452 168,408 C180,348 194,252 212,132 Z"
                  fill="url(#ri-land-grad)"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.68 : 0.18}
                  strokeWidth="2"
                />

                {/* East Bay Peninsula (East Providence, Barrington, Warren, Bristol, Tiverton, Little Compton) */}
                <path
                  d="M532,226 C552,228 572,240 588,262 C606,288 624,310 650,320 C676,328 696,336 708,358 C722,386 728,424 716,454 C704,468 684,468 672,452 C658,430 656,396 638,378 C622,364 602,374 584,368 C568,360 568,334 558,312 C548,290 532,276 528,256 Z"
                  fill="url(#ri-land-grad)"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.6 : 0.16}
                  strokeWidth="1.7"
                />

                {/* Aquidneck Island (Portsmouth, Middletown, Newport) */}
                <path
                  d="M614,354 C632,352 648,364 644,386 C640,412 628,440 606,464 C590,478 564,474 560,454 C556,434 570,406 584,382 C594,364 602,356 614,354 Z"
                  fill="#255e47"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.72 : 0.2}
                  strokeWidth="1.7"
                />

                {/* Conanicut Island (Jamestown) */}
                <path
                  d="M538,400 C548,400 554,414 552,434 C550,454 544,470 532,468 C522,464 524,442 528,422 C530,408 532,400 538,400 Z"
                  fill="#255e47"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.65 : 0.16}
                  strokeWidth="1.5"
                />

                {/* Prudence Island (Scenic detail in Narragansett Bay) */}
                <path
                  d="M548,354 C556,356 558,372 552,386 C546,390 540,382 542,368 Z"
                  fill="#235742"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.5 : 0.12}
                  strokeWidth="1.1"
                />

                {/* Block Island (New Shoreham) */}
                <path
                  d="M388,604 C402,606 410,620 404,638 C398,652 380,652 374,638 C368,624 376,604 388,604 Z"
                  fill="#255e47"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.72 : 0.2}
                  strokeWidth="1.7"
                />
              </g>

              {/* LAYER 4: ELEVATED WESTERN HILLS + SCORED BORDER + LIVE DISPATCH ARC */}
              <g
                style={{
                  transform: `translate(${tilt.x * -13}px, ${tilt.y * -9}px)`,
                  transition: 'transform 260ms ease-out',
                }}
              >
                {/* Western RI Topographic Elevation Sheet */}
                <path
                  d="M236,166 C288,162 346,184 372,238 C398,294 388,378 348,424 C306,456 242,442 214,394 C194,354 202,248 236,166 Z"
                  fill="#173d2e"
                  fillOpacity="0.82"
                  stroke="#fde68a"
                  strokeOpacity={lampOn ? 0.34 : 0.08}
                  strokeWidth="1.2"
                  filter="url(#bath-shadow-1)"
                />

                {/* Subtle Dashed RI / MA State Line */}
                <path
                  d="M212,132 L496,132 C516,158 532,178 540,198 C544,218 534,242 526,262 L650,320 L688,332"
                  fill="none"
                  stroke="#fbbf24"
                  strokeOpacity={lampOn ? 0.5 : 0.14}
                  strokeWidth="1.4"
                  strokeDasharray="6 5"
                />

                {/* Ambient Highway Corridors (I-95, I-295, I-195, Rt 4) */}
                <g
                  fill="none"
                  stroke="#fef08a"
                  strokeOpacity={lampOn ? 0.2 : 0.05}
                  strokeWidth="1.4"
                >
                  <path d="M570,101 Q555,165 503,245 Q475,345 360,445 Q260,488 177,508" />
                  <path d="M422,139 Q465,192 503,245 Q595,245 685,260" />
                  <path d="M503,245 Q490,375 470,477" />
                  <path d="M503,245 Q555,345 582,442" />
                </g>

                {/* LIVE ANIMATED DISPATCH ARC: HQ -> SELECTED TOWN */}
                {activeTown && activeTown.name !== 'Pawtucket' && (
                  <g>
                    <path
                      d={dispatchArc}
                      fill="none"
                      stroke="#fbbf24"
                      strokeOpacity={lampOn ? 0.25 : 0.1}
                      strokeWidth="4"
                    />
                    <path
                      d={dispatchArc}
                      fill="none"
                      stroke="#fef08a"
                      strokeWidth="2"
                      strokeDasharray="8 10"
                      className="map-route-flow"
                      filter={lampOn ? 'url(#lantern-bloom)' : undefined}
                    />
                  </g>
                )}

                {/* Engraved Map Watermarks */}
                <text
                  x="632"
                  y="548"
                  fill="#93c5fd"
                  fillOpacity={lampOn ? 0.38 : 0.12}
                  fontSize="11"
                  fontWeight="800"
                  letterSpacing="4.5"
                >
                  NARRAGANSETT BAY
                </text>
                <text
                  x="638"
                  y="566"
                  fill="#7dd3fc"
                  fillOpacity={lampOn ? 0.22 : 0.08}
                  fontSize="9"
                  fontWeight="700"
                  letterSpacing="3"
                >
                  ATLANTIC OCEAN
                </text>
                <text
                  x="612"
                  y="112"
                  fill="#fde68a"
                  fillOpacity={lampOn ? 0.36 : 0.12}
                  fontSize="10"
                  fontWeight="800"
                  letterSpacing="3"
                >
                  SOUTHERN MASS.
                </text>
                <text
                  x="418"
                  y="634"
                  fill="#a7f3d0"
                  fillOpacity={lampOn ? 0.48 : 0.16}
                  fontSize="9"
                  fontWeight="800"
                  letterSpacing="1.8"
                >
                  BLOCK ISLAND
                </text>
              </g>

              {/* LAYER 5: ALL 45 EMISSIVE TOWN LANTERN PINS */}
              <g
                style={{
                  transform: `translate(${tilt.x * -15}px, ${tilt.y * -10}px)`,
                  transition: 'transform 260ms ease-out',
                }}
              >
                {projectedTowns.map((town) => {
                  const isFilteredOut = filter !== 'all' && town.state !== filter;
                  const isSelected = active === town.name;
                  const isHover = hovered === town.name;
                  const isHighlighted = isSelected || isHover;

                  return (
                    <g
                      key={town.name}
                      transform={`translate(${town.x}, ${town.y})`}
                      onClick={() => setActive(town.name)}
                      onMouseEnter={() => setHovered(town.name)}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer"
                      style={{ opacity: isFilteredOut ? 0.15 : 1, transition: 'opacity 250ms ease' }}
                    >
                      <circle r="14" fill="transparent" />

                      {/* Expanding Radar Pulse on Active Town */}
                      {isHighlighted && (
                        <>
                          <circle
                            r="14"
                            fill="none"
                            stroke="#fde047"
                            strokeWidth="2"
                            className="map-radar"
                          />
                          <circle
                            r="16"
                            fill="#fbbf24"
                            fillOpacity={lampOn ? 0.22 : 0.08}
                          />
                        </>
                      )}

                      {/* Glowing Cardstock Pinhole Beacon */}
                      <circle
                        r={isHighlighted ? 6.5 : town.major ? 4.4 : 3.0}
                        fill={
                          isHighlighted
                            ? '#fef08a'
                            : town.state === 'MA'
                            ? '#fb923c'
                            : '#34d399'
                        }
                        stroke="#052e16"
                        strokeWidth={isHighlighted ? 2 : 1.1}
                        filter={isHighlighted && lampOn ? 'url(#lantern-bloom)' : undefined}
                      />

                      {/* Clean Non-Overlapping Major Hub Labels */}
                      {town.major && !isHighlighted && !isFilteredOut && (
                        <text
                          x={town.labelDx || 0}
                          y={town.labelDy || -12}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fillOpacity="0.88"
                          fontSize="9.5"
                          fontWeight="800"
                          letterSpacing="0.4"
                          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
                        >
                          {town.name}
                        </text>
                      )}

                      {/* Elevated Glass Pill Label for Active / Hovered Town */}
                      {isHighlighted && !isFilteredOut && (
                        <g transform="translate(0, -18)">
                          <rect
                            x={-(town.name.length * 4 + 14)}
                            y="-13"
                            width={town.name.length * 8 + 28}
                            height="20"
                            rx="7"
                            fill="#070c16"
                            fillOpacity="0.94"
                            stroke="#fbbf24"
                            strokeWidth="1.2"
                          />
                          <text
                            textAnchor="middle"
                            y="0"
                            fill="#fef08a"
                            fontSize="11"
                            fontWeight="900"
                          >
                            {town.name}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>

            {/* VINTAGE BRASS COMPASS ROSE (Fixed HUD in Ocean Corner) */}
            <g transform="translate(812, 622)" opacity={lampOn ? 0.62 : 0.22}>
              <circle r="28" fill="#060c16" fillOpacity="0.55" stroke="#d97706" strokeWidth="1" />
              <circle r="22" fill="none" stroke="#d97706" strokeWidth="0.6" strokeDasharray="3 3" />
              <polygon points="0,-25 4,-4 0,-8 -4,-4" fill="#fbbf24" />
              <polygon points="0,25 4,4 0,8 -4,4" fill="#92400e" />
              <polygon points="-25,0 -4,-4 -8,0 -4,4" fill="#92400e" />
              <polygon points="25,0 4,-4 8,0 4,4" fill="#92400e" />
              <text y="-32" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="900">
                N
              </text>
            </g>
          </svg>

          {/* SUBTLE PROTECTIVE GLASS SHEEN */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 28%, transparent 55%)',
            }}
          />

          {/* ACTIVE TOWN ROUTE SPOTLIGHT CARD */}
          {activeTown && (
            <div className="absolute bottom-4 left-4 right-4 z-20 sm:right-auto sm:min-w-[330px]">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/35 bg-slate-950/88 px-4 py-3.5 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-amber-300">
                    <MapPinIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-tight text-white">
                        {activeTown.name}, {activeTown.state}
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                        Active Route
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <ClockIcon className="h-3.5 w-3.5 text-amber-400/80" />
                      {activeTown.miles === 0
                        ? 'Flora Lawn HQ · Immediate Dispatch'
                        : `${activeTown.miles} mi from HQ · Same-day digital quotes`}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/contact?town=${encodeURIComponent(activeTown.name)}`}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-300"
                >
                  Quote &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EMBOSSED BRASS SHADOWBOX PLAQUE */}
      <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#b38f65]">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Flora Lawn · Nautical Paper-Cut Map
        </span>
        <span className="hidden opacity-75 sm:inline">
          39 RI Towns · 6 Southern MA Towns · Live Dispatch Routes
        </span>
        <span>Zero-Latency Interactive</span>
      </div>
    </div>
  );
}
