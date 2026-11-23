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
  MapIcon,
} from '@heroicons/react/24/outline';

const HQ = { name: 'Pawtucket HQ', lat: 41.879, lng: -71.383 };

const TOWNS = [
  { name: 'Providence', state: 'RI', lat: 41.824, lng: -71.413, major: true },
  { name: 'Cranston', state: 'RI', lat: 41.78, lng: -71.437 },
  { name: 'Pawtucket', state: 'RI', lat: 41.879, lng: -71.383 },
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

// Exact Web Mercator projection at zoom 10 matching real CartoDB @2x map tiles
const ZOOM = 10;
const TILE_N = 1 << ZOOM; // 1024
const TILE_SIZE = 256;
const TILE_X_MIN = 306;
const TILE_X_MAX = 310;
const TILE_Y_MIN = 379;
const TILE_Y_MAX = 383;

// SVG viewBox framing Rhode Island & Southern Massachusetts
const VIEW_X = 210;
const VIEW_Y = 145;
const VIEW_W = 920;
const VIEW_H = 985;
const VIEW_CX = VIEW_X + VIEW_W / 2;
const VIEW_CY = VIEW_Y + VIEW_H / 2;

function projectMercator(lat, lng) {
  const tx = ((lng + 180) / 360) * TILE_N;
  const latRad = (lat * Math.PI) / 180;
  const ty =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    TILE_N;
  return {
    x: Math.round((tx - TILE_X_MIN) * TILE_SIZE * 10) / 10,
    y: Math.round((ty - TILE_Y_MIN) * TILE_SIZE * 10) / 10,
  };
}

// Haversine miles from Pawtucket HQ
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

const HQ_PT = projectMercator(HQ.lat, HQ.lng);

// Precompute 5x5 grid of real Esri ArcGIS map tiles (100% free, zero API key, no watermarks)
// Note: ArcGIS tile URLs use /{z}/{y}/{x} order
const MAP_TILES = [];
for (let ty = TILE_Y_MIN; ty <= TILE_Y_MAX; ty++) {
  for (let tx = TILE_X_MIN; tx <= TILE_X_MAX; tx++) {
    MAP_TILES.push({
      key: `${tx}-${ty}`,
      x: (tx - TILE_X_MIN) * TILE_SIZE,
      y: (ty - TILE_Y_MIN) * TILE_SIZE,
      darkUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${ZOOM}/${ty}/${tx}`,
      darkLabelsUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/${ZOOM}/${ty}/${tx}`,
      satelliteUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${ZOOM}/${ty}/${tx}`,
    });
  }
}

export default function ServiceAreaMap() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('Newport');
  const [hovered, setHovered] = useState(null);
  const [lampOn, setLampOn] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'satellite'

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
        ...projectMercator(t.lat, t.lng),
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

  // Backlight spotlight coordinates aligned to active town
  const spotlightX = activeTown ? ((activeTown.x - VIEW_X) / VIEW_W) * 100 : 54;
  const spotlightY = activeTown ? ((activeTown.y - VIEW_Y) / VIEW_H) * 100 : 38;

  // Curved quadratic dispatch arc from Pawtucket HQ -> Active Town
  const dispatchArc = useMemo(() => {
    if (!activeTown) return '';
    const mx = (HQ_PT.x + activeTown.x) / 2;
    const my = (HQ_PT.y + activeTown.y) / 2 - 42;
    return `M ${HQ_PT.x} ${HQ_PT.y} Q ${mx} ${my} ${activeTown.x} ${activeTown.y}`;
  }, [activeTown]);

  // Smooth Focus Zoom transform centered on active town
  const cameraTransform = useMemo(() => {
    if (!zoomed || !activeTown) return 'scale(1) translate(0px, 0px)';
    const scale = 1.72;
    const tx = (VIEW_CX - activeTown.x) * 0.68;
    const ty = (VIEW_CY - activeTown.y) * 0.68;
    return `scale(${scale}) translate(${tx}px, ${ty}px)`;
  }, [zoomed, activeTown]);

  const changeFilter = (id) => {
    setFilter(id);
    if (id === 'MA') setActive('Attleboro');
    else if (id === 'RI') setActive('Providence');
  };

  return (
    <div className="relative overflow-hidden rounded-[2.6rem] border-4 border-[#3f2416] bg-gradient-to-br from-[#2a180e] via-[#150c07] to-[#0a0503] p-3.5 shadow-[0_40px_110px_rgba(0,0,0,0.65),inset_0_2px_8px_rgba(255,210,120,0.22)] md:p-5">
      {/* ANIMATED DISPATCH ARC & RADAR KEYFRAMES */}
      <style jsx>{`
        @keyframes mapRadarPulse {
          0% { transform: scale(0.5); opacity: 0.95; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes routeFlow {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        .map-radar {
          animation: mapRadarPulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .map-route-flow {
          animation: routeFlow 1.2s linear infinite;
        }
      `}</style>

      {/* BRASS CORNER BRACKETS */}
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
              Live Dispatch Map
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
            Tap any town to illuminate its live route from our Pawtucket headquarters on the real map.
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

        {/* RIGHT STAGE: REAL CARTOGRAPHIC MAP + ILLUMINATED ANIMATED OVERLAY */}
        <div className="relative order-1 h-[430px] w-full overflow-hidden bg-[#090d14] sm:h-[540px] lg:order-2 lg:h-[640px]">
          {/* RESPONSIVE TOP HUD BAR (NEVER OVERLAPS ON MOBILE) */}
          <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 sm:inset-x-4 sm:top-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/85 px-3 py-1.5 backdrop-blur-md shadow-xl sm:rounded-2xl sm:px-3.5 sm:py-2">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 sm:h-2.5 sm:w-2.5" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-200 sm:text-[11px]">
                {counts.all} Towns
              </p>
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setMapTheme((m) => (m === 'dark' ? 'satellite' : 'dark'))}
                className="flex items-center gap-1 rounded-xl border border-white/15 bg-slate-950/85 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-200 backdrop-blur-md transition-all hover:border-amber-400/50 hover:text-amber-300 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px]"
                title="Switch between Dark Map and Real Satellite Imagery"
              >
                <MapIcon className="h-3.5 w-3.5 text-amber-400" />
                {mapTheme === 'dark' ? 'Dark' : 'Satellite'}
              </button>

              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px] ${
                  zoomed
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/15 bg-slate-950/85 text-slate-200 hover:border-white/30'
                }`}
                title={zoomed ? 'Zoom out to full map' : 'Zoom in on selected town'}
              >
                {zoomed ? (
                  <ArrowsPointingInIcon className="h-3.5 w-3.5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
                )}
                {zoomed ? 'Full' : 'Focus'}
              </button>

              <button
                type="button"
                onClick={() => setLampOn((l) => !l)}
                className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px] ${
                  lampOn
                    ? 'border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'border-slate-700 bg-slate-950/85 text-slate-400'
                }`}
              >
                <SunIcon className="h-3.5 w-3.5" />
                {lampOn ? 'Glow' : 'Off'}
              </button>
            </div>
          </div>

          {/* REAL WEB MERCATOR MAP + ANIMATED DISPATCH OVERLAY SVG */}
          <svg
            viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 z-10 h-full w-full select-none"
          >
            <defs>
              <filter id="realmap-bloom" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient
                id="active-spotlight"
                cx={`${spotlightX}%`}
                cy={`${spotlightY}%`}
                r="42%"
              >
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.28" />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#050a12" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* CAMERA ZOOM GROUP (Real Map Tiles + Exact Aligned Pins & Arcs) */}
            <g
              style={{
                transform: cameraTransform,
                transformOrigin: `${VIEW_CX}px ${VIEW_CY}px`,
                transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* REAL CARTOGRAPHIC / SATELLITE MAP TILES (Esri ArcGIS — Mobile-Safe, Zero CSS Filter) */}
              <g>
                {MAP_TILES.map((tile) => (
                  <image
                    key={tile.key}
                    href={mapTheme === 'dark' ? tile.darkUrl : tile.satelliteUrl}
                    x={tile.x}
                    y={tile.y}
                    width={TILE_SIZE + 0.6}
                    height={TILE_SIZE + 0.6}
                    preserveAspectRatio="none"
                  />
                ))}
                {mapTheme === 'satellite' && (
                  <rect x={0} y={0} width={1280} height={1280} fill="#060c14" fillOpacity="0.28" pointerEvents="none" />
                )}
                {/* Crisp Real Road & Town Reference Labels Overlay */}
                {MAP_TILES.map((tile) => (
                  <image
                    key={`lbl-${tile.key}`}
                    href={tile.darkLabelsUrl}
                    x={tile.x}
                    y={tile.y}
                    width={TILE_SIZE + 0.6}
                    height={TILE_SIZE + 0.6}
                    opacity={mapTheme === 'dark' ? 0.85 : 0.72}
                    preserveAspectRatio="none"
                  />
                ))}
              </g>

              {/* WARM BACKLIGHT SPOTLIGHT OVERLAY TRACKING SELECTED TOWN */}
              {lampOn && (
                <rect
                  x={0}
                  y={0}
                  width={1280}
                  height={1280}
                  fill="url(#active-spotlight)"
                  pointerEvents="none"
                />
              )}

              {/* LIVE ANIMATED DISPATCH ARC: PAWTUCKET HQ -> SELECTED TOWN (NATIVE SVG SMIL FOR 100% MOBILE SUPPORT) */}
              {activeTown && activeTown.name !== 'Pawtucket' && (
                <g pointerEvents="none">
                  {/* Soft amber outer glow track */}
                  <path
                    d={dispatchArc}
                    fill="none"
                    stroke="#f59e0b"
                    strokeOpacity={lampOn ? 0.42 : 0.22}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  {/* Flowing animated dashed beam */}
                  <path
                    d={dispatchArc}
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="3"
                    strokeDasharray="10 10"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="40"
                      to="0"
                      dur="1.1s"
                      repeatCount="indefinite"
                    />
                  </path>
                  {/* Glowing crew dispatch beacon traveling along the route */}
                  <circle r="5.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="2">
                    <animateMotion
                      dur="2.2s"
                      repeatCount="indefinite"
                      path={dispatchArc}
                    />
                  </circle>
                </g>
              )}

              {/* HQ PULSE MARKER (PAWTUCKET) */}
              <g transform={`translate(${HQ_PT.x}, ${HQ_PT.y})`} pointerEvents="none">
                <circle r="8" fill="none" stroke="#34d399" strokeWidth="2">
                  <animate attributeName="r" values="6;22" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.85;0" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle r="10" fill="#10b981" fillOpacity="0.25" />
                <circle r="5" fill="#34d399" stroke="#052e16" strokeWidth="1.5" />
              </g>

              {/* ALL 45 EXACT-COORDINATE INTERACTIVE TOWN PINS */}
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
                    style={{ opacity: isFilteredOut ? 0.16 : 1, transition: 'opacity 250ms ease' }}
                  >
                    <circle r="18" fill="transparent" />

                    {/* Expanding Native SVG Radar Ring on Selected/Hovered Town (Works on iOS & Android) */}
                    {isHighlighted && (
                      <>
                        <circle r="10" fill="none" stroke="#fde047" strokeWidth="2.6">
                          <animate
                            attributeName="r"
                            values="9;34"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="stroke-opacity"
                            values="0.95;0"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle
                          r="20"
                          fill="#fbbf24"
                          fillOpacity={lampOn ? 0.28 : 0.14}
                        />
                      </>
                    )}

                    {/* Glowing Town Pin */}
                    <circle
                      r={isHighlighted ? 8 : town.major ? 5.5 : 4.2}
                      fill={
                        isHighlighted
                          ? '#fef08a'
                          : town.state === 'MA'
                          ? '#fb923c'
                          : '#34d399'
                      }
                      stroke="#05131f"
                      strokeWidth={isHighlighted ? 2.5 : 1.6}
                    />

                    {/* Elevated Glass Label Pill for Active / Hovered Town */}
                    {isHighlighted && !isFilteredOut && (
                      <g transform="translate(0, -22)">
                        <rect
                          x={-(town.name.length * 4.8 + 18)}
                          y="-16"
                          width={town.name.length * 9.6 + 36}
                          height="24"
                          rx="8"
                          fill="#070c16"
                          fillOpacity="0.95"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                        />
                        <text
                          textAnchor="middle"
                          y="0"
                          fill="#fef08a"
                          fontSize="13"
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
          </svg>

          {/* SHADOWBOX INNER VIGNETTE & PROTECTIVE GLASS SHEEN */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              boxShadow: 'inset 0 0 65px rgba(0,0,0,0.65)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 28%, transparent 55%)',
            }}
          />

          {/* ACTIVE TOWN ROUTE SPOTLIGHT CARD */}
          {activeTown && (
            <div className="absolute bottom-4 left-4 right-4 z-20 sm:right-auto sm:min-w-[335px]">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/35 bg-slate-950/90 px-4 py-3.5 backdrop-blur-md shadow-2xl">
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
          Flora Lawn · Real Cartographic Lightbox
        </span>
        <span className="hidden opacity-75 sm:inline">
          39 RI Towns · 6 Southern MA Towns · Live Dispatch Routes
        </span>
        <span>Esri · Live Map &amp; Satellite</span>
      </div>
    </div>
  );
}
