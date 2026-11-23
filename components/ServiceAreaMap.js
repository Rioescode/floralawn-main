'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  SunIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const TOWNS = [
  { name: 'Providence', state: 'RI', lat: 41.824, lng: -71.413, major: true },
  { name: 'Cranston', state: 'RI', lat: 41.78, lng: -71.437, major: true },
  { name: 'Pawtucket', state: 'RI', lat: 41.879, lng: -71.383, major: true },
  { name: 'Central Falls', state: 'RI', lat: 41.89, lng: -71.392 },
  { name: 'East Providence', state: 'RI', lat: 41.814, lng: -71.37 },
  { name: 'North Providence', state: 'RI', lat: 41.85, lng: -71.466 },
  { name: 'Woonsocket', state: 'RI', lat: 42.003, lng: -71.515, major: true },
  { name: 'Cumberland', state: 'RI', lat: 41.967, lng: -71.433 },
  { name: 'Lincoln', state: 'RI', lat: 41.911, lng: -71.435 },
  { name: 'Johnston', state: 'RI', lat: 41.822, lng: -71.507 },
  { name: 'Smithfield', state: 'RI', lat: 41.922, lng: -71.55 },
  { name: 'North Smithfield', state: 'RI', lat: 41.967, lng: -71.55 },
  { name: 'Burrillville', state: 'RI', lat: 41.955, lng: -71.702 },
  { name: 'Glocester', state: 'RI', lat: 41.905, lng: -71.68 },
  { name: 'Foster', state: 'RI', lat: 41.854, lng: -71.758 },
  { name: 'Scituate', state: 'RI', lat: 41.81, lng: -71.6 },
  { name: 'Warwick', state: 'RI', lat: 41.7, lng: -71.416, major: true },
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
  { name: 'Westerly', state: 'RI', lat: 41.378, lng: -71.827, major: true },
  { name: 'Jamestown', state: 'RI', lat: 41.497, lng: -71.367 },
  { name: 'Newport', state: 'RI', lat: 41.49, lng: -71.313, major: true },
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
  { name: 'Attleboro', state: 'MA', lat: 41.945, lng: -71.285, major: true },
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

export default function ServiceAreaMap() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('Providence');
  const [hovered, setHovered] = useState(null);
  const [lampOn, setLampOn] = useState(true);
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
    <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-[#3f2416] bg-gradient-to-br from-[#28170d] via-[#140b06] to-[#0a0503] p-3.5 shadow-[0_35px_100px_rgba(0,0,0,0.65),inset_0_2px_6px_rgba(255,200,100,0.2)] md:p-5">
      {/* BRASS CABINET CORNER HARDWARE */}
      <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-amber-600/70" />
      <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-amber-600/70" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-amber-600/70" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-amber-600/70" />

      <div className="grid overflow-hidden rounded-[1.8rem] border-2 border-black/90 bg-[#070c14] shadow-[inset_0_18px_45px_rgba(0,0,0,0.95)] lg:grid-cols-[350px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR: DARK SHADOWBOX TOWN DIRECTORY */}
        <aside className="order-2 flex flex-col border-t border-white/10 bg-slate-950/90 p-6 text-white backdrop-blur-xl lg:order-1 lg:border-r lg:border-t-0 lg:p-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
            <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
            Paper-Cut Service Map
          </div>

          <h3 className="mt-3 text-2xl font-black uppercase italic leading-tight tracking-tight text-white">
            {counts.all} Towns Across{' '}
            <span className="text-amber-400">RI &amp; Mass.</span>
          </h3>
          <p className="mt-1.5 text-xs font-medium text-slate-400">
            Tap any town to illuminate its route zone on the shadow-box map.
          </p>

          {/* STATE FILTER TABS */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
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
              placeholder="Find your town..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm font-medium text-white placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none"
            />
          </label>

          {/* TOWN LIST */}
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[290px] lg:space-y-1 lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1">
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
                        ? 'border-amber-400/70 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/10'
                        : 'border-transparent bg-white/5 text-slate-300 hover:border-slate-700 hover:bg-white/10 hover:text-white lg:bg-transparent'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                        isSelected
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                          : town.state === 'MA'
                          ? 'bg-orange-400/70'
                          : 'bg-emerald-400/70'
                      }`}
                    />
                    <span className="flex-1">{town.name}</span>
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
                Not on the list? We may still cover your street.{' '}
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

        {/* RIGHT STAGE: ILLUMINATED 3D PAPER-CUT TOPOGRAPHIC SHADOW BOX MAP */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative order-1 min-h-[430px] overflow-hidden bg-[#060b14] sm:min-h-[520px] lg:order-2 lg:min-h-[610px]"
        >
          {/* DYNAMIC WARM BACKLIGHT DIFFUSION TRACKING ACTIVE TOWN */}
          <div
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              opacity: lampOn ? 1 : 0.16,
              background: `radial-gradient(circle at ${spotlightX}% ${spotlightY}%, rgba(254, 240, 138, 0.52) 0%, rgba(245, 158, 11, 0.28) 24%, rgba(16, 185, 129, 0.14) 52%, rgba(6, 11, 20, 0.96) 86%)`,
            }}
          />

          {/* TOP HUD CONTROLS */}
          <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 py-2 backdrop-blur-md shadow-xl">
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
              onClick={() => setLampOn((l) => !l)}
              className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider backdrop-blur-md transition-all ${
                lampOn
                  ? 'border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'border-slate-700 bg-slate-950/80 text-slate-400'
              }`}
            >
              <SunIcon className="h-3.5 w-3.5" />
              {lampOn ? 'Backlight On' : 'Lamp Off'}
            </button>
          </div>

          {/* 7-LAYER PAPER-CUT TOPOGRAPHIC MAP SVG */}
          <svg
            viewBox="0 0 900 720"
            preserveAspectRatio="xMidYMid meet"
            className="relative z-10 h-full w-full select-none"
          >
            <defs>
              {/* PAPER CARDSTOCK PULP GRAIN */}
              <filter id="map-paper-grain" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.045"
                  numOctaves="3"
                  result="noise"
                />
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0"
                  result="grain"
                />
                <feComposite in="grain" in2="SourceGraphic" operator="in" />
              </filter>

              {/* REALISTIC TOP-DOWN PAPER CUT CAST SHADOWS */}
              <filter id="map-shadow-soft" x="-15%" y="-15%" width="135%" height="135%">
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="6"
                  floodColor="#000000"
                  floodOpacity="0.55"
                />
              </filter>
              <filter id="map-shadow-deep" x="-20%" y="-20%" width="145%" height="145%">
                <feDropShadow
                  dx="0"
                  dy="11"
                  stdDeviation="9"
                  floodColor="#000000"
                  floodOpacity="0.72"
                />
              </filter>

              {/* EMISSIVE TOWN LANTERN BLOOM */}
              <filter id="pin-bloom" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* LAYER 1: ATLANTIC OCEAN & NARRAGANSETT BAY BATHYMETRY CONTOUR 1 */}
            <g
              style={{
                transform: `translate(${tilt.x * -3}px, ${tilt.y * -2}px)`,
                transition: 'transform 250ms ease-out',
              }}
            >
              <path
                d="M0,430 Q180,470 360,545 T720,490 T900,455 L900,720 L0,720 Z"
                fill="#0b1829"
                stroke="#38bdf8"
                strokeOpacity={lampOn ? 0.16 : 0.05}
                strokeWidth="1"
              />
              <path
                d="M0,520 Q220,575 430,615 T790,555 T900,535 L900,720 L0,720 Z"
                fill="#081220"
                stroke="#38bdf8"
                strokeOpacity={lampOn ? 0.12 : 0.04}
                strokeWidth="1"
              />
              {/* Subtle Paper-Cut Ocean Wave Ripples */}
              <g stroke="#7dd3fc" strokeOpacity={lampOn ? 0.16 : 0.05} fill="none" strokeWidth="1.2">
                <path d="M620,565 Q650,555 680,565 T740,565" />
                <path d="M655,610 Q685,600 715,610 T775,610" />
                <path d="M120,610 Q150,600 180,610 T240,610" />
              </g>
            </g>

            {/* LAYER 2: SOUTHERN MASSACHUSETTS & WESTERN BORDER LANDMASS SHEET */}
            <g
              style={{
                transform: `translate(${tilt.x * -6}px, ${tilt.y * -4}px)`,
                transition: 'transform 250ms ease-out',
              }}
              filter="url(#map-shadow-soft)"
            >
              <path
                d="M40,0 L860,0 L860,360 Q790,375 735,345 L710,300 L640,260 L545,250 L490,145 L210,130 L130,525 L40,545 Z"
                fill="#11241f"
                stroke="#fde68a"
                strokeOpacity={lampOn ? 0.25 : 0.08}
                strokeWidth="1.2"
              />
              {/* MA Service Zone Highlight Sheet (Attleboro / Seekonk / Rehoboth / Wrentham) */}
              <path
                d="M492,145 L515,68 L630,68 L715,175 L735,285 L650,315 L560,295 L535,235 Z"
                fill="#18382e"
                stroke="#fbbf24"
                strokeOpacity={lampOn ? 0.45 : 0.12}
                strokeWidth="1.4"
              />
            </g>

            {/* LAYER 3: RHODE ISLAND MAINLAND + EAST BAY + ISLANDS PAPER-CUT SILHOUETTE */}
            <g
              style={{
                transform: `translate(${tilt.x * -10}px, ${tilt.y * -7}px)`,
                transition: 'transform 250ms ease-out',
              }}
              filter="url(#map-shadow-deep)"
            >
              {/* RI Mainland Cutout (Westerly -> Burrillville -> Woonsocket -> Providence -> Narragansett) */}
              <path
                d="M210,132 L496,132 L542,195 L532,258 L516,295 L526,338 L495,388 L490,445 L482,498 L420,510 L325,526 L160,528 L152,482 L172,410 L195,255 Z"
                fill="#1e4d3a"
                stroke="#fef08a"
                strokeOpacity={lampOn ? 0.6 : 0.16}
                strokeWidth="1.8"
              />

              {/* East Bay Peninsula (East Providence, Barrington, Warren, Bristol, Tiverton, Little Compton) */}
              <path
                d="M530,222 L575,235 L608,290 L645,322 L688,332 L722,385 L716,455 L678,464 L648,402 L614,376 L582,368 L560,312 L528,266 Z"
                fill="#1b4635"
                stroke="#fef08a"
                strokeOpacity={lampOn ? 0.55 : 0.15}
                strokeWidth="1.6"
              />

              {/* Aquidneck Island (Portsmouth, Middletown, Newport) */}
              <path
                d="M612,356 L646,368 L628,438 L592,472 L560,462 L572,412 Z"
                fill="#225742"
                stroke="#fef08a"
                strokeOpacity={lampOn ? 0.65 : 0.18}
                strokeWidth="1.6"
              />

              {/* Conanicut Island (Jamestown) */}
              <path
                d="M532,402 L552,410 L548,468 L526,464 Z"
                fill="#225742"
                stroke="#fef08a"
                strokeOpacity={lampOn ? 0.6 : 0.15}
                strokeWidth="1.4"
              />

              {/* Block Island (New Shoreham) */}
              <path
                d="M384,606 L406,620 L398,648 L374,642 Z"
                fill="#225742"
                stroke="#fef08a"
                strokeOpacity={lampOn ? 0.65 : 0.18}
                strokeWidth="1.6"
              />
            </g>

            {/* LAYER 4: ELEVATED WESTERN HILLS TOPOGRAPHIC SHEET + SCORED ROUTE ARCS */}
            <g
              style={{
                transform: `translate(${tilt.x * -13}px, ${tilt.y * -9}px)`,
                transition: 'transform 250ms ease-out',
              }}
            >
              {/* Western RI Highland Paper Contour (Burrillville / Scituate / Coventry) */}
              <path
                d="M235,165 Q335,175 375,245 Q395,335 345,425 Q265,445 215,390 Q205,275 235,165 Z"
                fill="#15382a"
                fillOpacity="0.85"
                stroke="#fde68a"
                strokeOpacity={lampOn ? 0.3 : 0.08}
                strokeWidth="1.1"
                filter="url(#map-shadow-soft)"
              />

              {/* Subtle Paper-Scored RI / MA State Line */}
              <path
                d="M210,132 L496,132 L542,195 L532,258 L645,322 L688,332"
                fill="none"
                stroke="#fbbf24"
                strokeOpacity={lampOn ? 0.5 : 0.15}
                strokeWidth="1.5"
                strokeDasharray="6 5"
              />

              {/* Glowing Route Corridors Radiating from Providence Hub (I-95, I-295, I-195, Rt 4) */}
              <g
                fill="none"
                stroke="#fef08a"
                strokeOpacity={lampOn ? 0.24 : 0.06}
                strokeWidth="1.4"
              >
                <path d="M570,101 Q555,165 503,245 Q475,345 360,445 Q260,488 177,508" />
                <path d="M422,139 Q465,192 503,245 Q595,245 685,260" />
                <path d="M503,245 Q490,375 470,477" />
                <path d="M503,245 Q555,345 582,442" />
              </g>

              {/* Water & State Watermark Labels */}
              <text
                x="635"
                y="545"
                fill="#93c5fd"
                fillOpacity={lampOn ? 0.35 : 0.12}
                fontSize="11"
                fontWeight="800"
                letterSpacing="4"
              >
                NARRAGANSETT BAY
              </text>
              <text
                x="620"
                y="116"
                fill="#fde68a"
                fillOpacity={lampOn ? 0.35 : 0.12}
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
                fillOpacity={lampOn ? 0.45 : 0.15}
                fontSize="9"
                fontWeight="700"
                letterSpacing="1.5"
              >
                BLOCK ISLAND
              </text>
            </g>

            {/* LAYER 5: ALL 45 EMISSIVE TOWN LANTERN PINS */}
            <g
              style={{
                transform: `translate(${tilt.x * -16}px, ${tilt.y * -11}px)`,
                transition: 'transform 250ms ease-out',
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
                    style={{ opacity: isFilteredOut ? 0.18 : 1, transition: 'opacity 250ms ease' }}
                  >
                    {/* Invisible generous click hit target */}
                    <circle r="14" fill="transparent" />

                    {/* Pulsing Beacon Ring on Active/Hovered Town */}
                    {isHighlighted && (
                      <>
                        <circle
                          r="20"
                          fill="#fbbf24"
                          fillOpacity={lampOn ? 0.18 : 0.08}
                        />
                        <circle
                          r="12"
                          fill="none"
                          stroke="#fde047"
                          strokeWidth="1.8"
                          strokeOpacity="0.85"
                        />
                      </>
                    )}

                    {/* Emissive Cutout Pinhole Light */}
                    <circle
                      r={isHighlighted ? 6.5 : town.major ? 4.4 : 3.1}
                      fill={
                        isHighlighted
                          ? '#fef08a'
                          : town.state === 'MA'
                          ? '#fb923c'
                          : '#34d399'
                      }
                      stroke="#052e16"
                      strokeWidth={isHighlighted ? 2 : 1.2}
                      filter={isHighlighted && lampOn ? 'url(#pin-bloom)' : undefined}
                    />

                    {/* Crisp Label for Major Hubs or Active/Hovered Town */}
                    {(town.major || isHighlighted) && !isFilteredOut && (
                      <g transform="translate(0, -13)">
                        {isHighlighted && (
                          <rect
                            x={-(town.name.length * 3.8 + 10)}
                            y="-12"
                            width={town.name.length * 7.6 + 20}
                            height="18"
                            rx="6"
                            fill="#090d16"
                            fillOpacity="0.92"
                            stroke="#fbbf24"
                            strokeWidth="1"
                          />
                        )}
                        <text
                          textAnchor="middle"
                          y={isHighlighted ? 0 : 2}
                          fill={isHighlighted ? '#fef08a' : '#e2e8f0'}
                          fontSize={isHighlighted ? '11' : '9.5'}
                          fontWeight={isHighlighted ? '900' : '700'}
                          style={{
                            textShadow: '0 2px 6px rgba(0,0,0,0.95)',
                          }}
                        >
                          {town.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* LAYER 6: BRASS COMPASS ROSE & FOREGROUND SHADOWBOX CORNERS */}
            <g transform="translate(805, 625)" opacity={lampOn ? 0.55 : 0.2}>
              <circle r="26" fill="none" stroke="#d97706" strokeWidth="1" />
              <circle r="21" fill="none" stroke="#d97706" strokeWidth="0.6" strokeDasharray="3 3" />
              <polygon points="0,-24 4,-4 0,-8 -4,-4" fill="#fbbf24" />
              <polygon points="0,24 4,4 0,8 -4,4" fill="#92400e" />
              <polygon points="-24,0 -4,-4 -8,0 -4,4" fill="#92400e" />
              <polygon points="24,0 4,-4 8,0 4,4" fill="#92400e" />
              <text
                y="-30"
                textAnchor="middle"
                fill="#fde68a"
                fontSize="10"
                fontWeight="900"
              >
                N
              </text>
            </g>
          </svg>

          {/* SUBTLE GLASS REFLECTION GLARE */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 28%, transparent 55%)',
            }}
          />

          {/* ACTIVE TOWN SPOTLIGHT CARD (Bottom Left) */}
          {activeTown && (
            <div className="absolute bottom-4 left-4 right-4 z-20 sm:right-auto sm:min-w-[300px]">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/30 bg-slate-950/85 px-4 py-3 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-300">
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
                    <p className="text-[11px] font-medium text-slate-400">
                      {activeTown.state === 'MA'
                        ? 'Southern Massachusetts'
                        : 'Rhode Island'}{' '}
                      · Same-day digital quotes
                    </p>
                  </div>
                </div>

                <Link
                  href={`/contact?town=${encodeURIComponent(activeTown.name)}`}
                  className="shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-300"
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
          Flora Lawn · Topographic Lightbox
        </span>
        <span className="hidden opacity-75 sm:inline">
          39 RI Towns · 6 Southern MA Towns
        </span>
        <span>Zero-Latency Interactive Map</span>
      </div>
    </div>
  );
}
