"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  PlayIcon, 
  PauseIcon, 
  SparklesIcon, 
  ArrowRightIcon, 
  CheckBadgeIcon,
  SunIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from "@heroicons/react/24/outline";

// SERVICES DEFINED ACCORDING TO PAPERCUT LIGHTBOX LOGIC
// Value ladders: Back layers bright & translucent -> Front layers dark & opaque
const SCENES = [
  {
    id: "fall-cleanup",
    title: "Fall Leaf Clearing & Vacuum",
    serviceParam: "Fall Cleanup",
    tagline: "High-Volume Leaf Removal & Deep Turf Debris Extraction",
    ladder: {
      sky: "#fde68a",
      backlight: "#fbbf24",
      layer1: "#fef08a",
      layer2: "#f59e0b",
      layer3: "#d97706",
      layer4: "#b45309",
      layer5: "#78350f",
      layer6: "#451a03",
      layer7: "#1c0a0e",
      accent: "#ef4444",
      windowGlow: "#fffbeb"
    },
    duration: 8,
    storyStep: "Before snow freezes wet leaves into turf crown decay, our dual-stage blowers and vacuum haulers clear property perimeter to curb line.",
    keyPoints: [
      "Perimeter fence & bed blowout",
      "Curbside suction & composting",
      "Prevents winter mold & root rot"
    ]
  },
  {
    id: "mowing",
    title: "Precision Mowing & Diamond Striping",
    serviceParam: "Lawn Mowing",
    tagline: "Commercial Rotary Blades & Crisp Border Edge Trimming",
    ladder: {
      sky: "#dbeafe",
      backlight: "#60a5fa",
      layer1: "#bfdbfe",
      layer2: "#86efac",
      layer3: "#22c55e",
      layer4: "#16a34a",
      layer5: "#15803d",
      layer6: "#14532d",
      layer7: "#052e16",
      accent: "#facc15",
      windowGlow: "#fef3c7"
    },
    duration: 8,
    storyStep: "Razor-sharp commercial mulching decks cut at precise 3.5” heights with alternating diamond stripes that promote dense root expansion.",
    keyPoints: [
      "Weekly or bi-weekly scheduling",
      "Clean edge trimming & sidewalk blowoff",
      "Alternating stripe patterns every visit"
    ]
  },
  {
    id: "aeration",
    title: "Core Aeration & Deep Overseeding",
    serviceParam: "Lawn Aeration",
    tagline: "Soil De-Compaction & Certified Bluegrass Germination",
    ladder: {
      sky: "#fed7aa",
      backlight: "#f97316",
      layer1: "#fdba74",
      layer2: "#fb923c",
      layer3: "#a16207",
      layer4: "#854d0e",
      layer5: "#573a08",
      layer6: "#382307",
      layer7: "#1a0f02",
      accent: "#22c55e",
      windowGlow: "#ffedd5"
    },
    duration: 8,
    storyStep: "Commercial hollow tines pull 2.5” soil cores to relieve summer compaction, dropping premium cold-hardy seed directly into root pockets.",
    keyPoints: [
      "Relieves tough New England clay soil",
      "Fills bare patches with disease-resistant seed",
      "Maximizes spring root nutrient uptake"
    ]
  },
  {
    id: "mulch",
    title: "Deep Mulch Installation & Trench Edging",
    serviceParam: "Mulch Installation",
    tagline: "Hand-Spaded Deep Trench Edges & Triple-Shredded Bark",
    ladder: {
      sky: "#fce7f3",
      backlight: "#f472b6",
      layer1: "#fbcfe8",
      layer2: "#d97706",
      layer3: "#92400e",
      layer4: "#78350f",
      layer5: "#573a08",
      layer6: "#271c14",
      layer7: "#100905",
      accent: "#10b981",
      windowGlow: "#fff1f2"
    },
    duration: 8,
    storyStep: "Clean 3” hand-spaded vertical trench edging creates an impenetrable barrier against weed encroachment, sealed with rich premium bark.",
    keyPoints: [
      "Deep 3-inch clean trench border",
      "Natural triple-shredded dark pine/hemlock",
      "Retains soil moisture & stops weed growth"
    ]
  },
  {
    id: "snow",
    title: "Winter Hard Freeze & Snow Defense",
    serviceParam: "Snow Removal",
    tagline: "24/7 Driveway Plowing, Walkway Shoveling & De-Icing",
    ladder: {
      sky: "#e2e8f0",
      backlight: "#94a3b8",
      layer1: "#cbd5e1",
      layer2: "#94a3b8",
      layer3: "#64748b",
      layer4: "#475569",
      layer5: "#334155",
      layer6: "#1e293b",
      layer7: "#090d16",
      accent: "#f59e0b",
      windowGlow: "#fef08a"
    },
    duration: 8,
    storyStep: "Before morning commutes and freezing rain, our automatic triggers dispatch plows and pet-safe ice melt so your property is always clear.",
    keyPoints: [
      "Automated dispatch at 2” snow trigger",
      "Zero-damage rubber cutting edges",
      "Pre-storm liquid brine & salt treatment"
    ]
  }
];

export default function PapercutLightbox() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [lampOn, setLampOn] = useState(true);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const boxRef = useRef(null);

  const scene = SCENES[activeIdx];
  const ladder = scene.ladder;

  // Auto-play story mode
  useEffect(() => {
    if (!isPlaying) return;
    const interval = 100; // updates every 100ms
    const step = 100 / ((scene.duration * 1000) / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIdx((current) => (current + 1) % SCENES.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, scene.duration, activeIdx]);

  // Handle 3D Parallax on Mouse Movement
  const handleMouseMove = (e) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const selectScene = (idx) => {
    setActiveIdx(idx);
    setProgress(0);
  };

  const nextScene = () => {
    setActiveIdx((prev) => (prev + 1) % SCENES.length);
    setProgress(0);
  };

  const prevScene = () => {
    setActiveIdx((prev) => (prev - 1 + SCENES.length) % SCENES.length);
    setProgress(0);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-950 via-[#0d141e] to-slate-950 text-white overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* AMBIENT BACKGROUND GLOW */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[160px] opacity-25 pointer-events-none transition-all duration-1000"
        style={{ background: ladder.backlight }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
              <SparklesIcon className="w-4 h-4 text-amber-400 animate-pulse" />
              Paper-Cut Shadow Box Theater · How Flora Lawn Works
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
              See What We Do <span className="text-amber-400">In Real Life</span>
            </h2>
            <p className="text-slate-400 font-medium text-base md:text-lg mt-3 leading-relaxed">
              Step inside our illuminated 3D shadow box. Watch how our crews transform Rhode Island &amp; Massachusetts yards across all four seasons.
            </p>
          </div>

          {/* CONTROLS BAR */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLampOn(!lampOn)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${lampOn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title="Toggle Backlight Lamp"
            >
              <SunIcon className={`w-4 h-4 ${lampOn ? 'text-amber-400' : 'text-slate-600'}`} />
              {lampOn ? 'Backlight Lit' : 'Lamp Off'}
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider transition-all"
            >
              {isPlaying ? <PauseIcon className="w-4 h-4 text-amber-400" /> : <PlayIcon className="w-4 h-4 text-green-400" />}
              {isPlaying ? 'Pause Story' : 'Play Story'}
            </button>
          </div>
        </div>

        {/* SERVICE SELECTOR TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {SCENES.map((sc, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={sc.id}
                onClick={() => selectScene(i)}
                className={`relative shrink-0 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 border ${
                  isActive 
                    ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <span>{sc.id === 'fall-cleanup' ? '🍂' : sc.id === 'mowing' ? '✂️' : sc.id === 'aeration' ? '🌱' : sc.id === 'mulch' ? '🪵' : '❄️'}</span>
                <span>{sc.title.split(' ')[0]} {sc.title.split(' ')[1]}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* MAIN SHADOW BOX STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* THE PHYSICAL LIGHTBOX FRAME */}
          <div className="lg:col-span-8">
            <div 
              ref={boxRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-[2.5rem] p-4 md:p-6 bg-gradient-to-br from-[#23150d] via-[#150c07] to-[#0c0704] border-4 border-[#3d2417] shadow-[0_30px_90px_rgba(0,0,0,0.9),inset_0_2px_8px_rgba(255,200,100,0.15)] transition-transform duration-300 group cursor-crosshair overflow-hidden"
              style={{
                perspective: "1200px",
              }}
            >
              {/* WOOD FRAME CORNER ACCENTS */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-600/60" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-600/60" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-600/60" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-600/60" />

              {/* INNER CAVITY (Shadow Box Interior) */}
              <div className="relative w-full h-[360px] md:h-[480px] rounded-[1.8rem] overflow-hidden bg-slate-950 border border-black/80 shadow-[inset_0_15px_40px_rgba(0,0,0,0.95)]">
                
                {/* SVG DEFINITIONS FOR PULP GRAIN & CAST SHADOWS */}
                <svg className="absolute w-0 h-0" aria-hidden="true">
                  <defs>
                    {/* PAPER GRAIN TEXTURE */}
                    <filter id="paper-grain" x="0%" y="0%" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.07 0" />
                      <feComposite in2="SourceGraphic" in="color" operator="in" />
                    </filter>
                    
                    {/* SOFT REALISTIC CAST SHADOW */}
                    <filter id="cast-shadow" x="-10%" y="-10%" width="130%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
                    </filter>
                    <filter id="deep-shadow" x="-15%" y="-15%" width="140%" height="150%">
                      <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
                    </filter>
                  </defs>
                </svg>

                {/* LAYER 0: WARM BACKLIGHT DIFFUSION THROUGH PAPER */}
                <div 
                  className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${lampOn ? 'opacity-100' : 'opacity-15'}`}
                  style={{
                    background: `radial-gradient(ellipse at 50% 32%, ${ladder.sky} 0%, ${ladder.backlight} 30%, ${ladder.layer4} 65%, #05080f 95%)`,
                    filter: "contrast(115%) brightness(105%)",
                  }}
                />

                {/* SCENE SPECIFIC SVG LAYERS */}
                <div 
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate3d(${mouseOffset.x * 12}px, ${mouseOffset.y * 8}px, 0px)`,
                  }}
                >
                  {/* ============================================================ */}
                  {/* SCENE 1: FALL LEAF CLEANUP */}
                  {/* ============================================================ */}
                  {scene.id === "fall-cleanup" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: BACK SUN / MOON DISK */}
                      <g style={{ transform: `translate(${mouseOffset.x * -2}px, ${mouseOffset.y * -2}px)` }}>
                        <circle cx="580" cy="140" r="65" fill={ladder.layer1} opacity={lampOn ? 0.95 : 0.3} filter="url(#cast-shadow)" />
                        <circle cx="580" cy="140" r="85" fill={ladder.layer1} opacity={lampOn ? 0.25 : 0.05} />
                      </g>

                      {/* LAYER 2: DISTANT NEW ENGLAND ROLLING HILLS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -4}px, ${mouseOffset.y * -3}px)` }}>
                        <path 
                          d="M0,230 Q220,170 420,220 T800,200 L800,500 L0,500 Z" 
                          fill={ladder.layer2} 
                          opacity="0.85"
                          filter="url(#cast-shadow)"
                        />
                      </g>

                      {/* LAYER 3: DISTANT COLONIAL FARMHOUSE & WINDBREAK TREES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -6}px, ${mouseOffset.y * -5}px)` }}>
                        {/* Pines and Oak tree paper cuts */}
                        <path d="M120,260 L140,210 L160,260 Z M135,210 L140,195 L145,210 Z" fill={ladder.layer3} />
                        <path d="M160,270 L185,200 L210,270 Z M180,200 L185,185 L190,200 Z" fill={ladder.layer3} />
                        
                        {/* Colonial Farmhouse */}
                        <path 
                          d="M520,240 L570,190 L620,240 L620,290 L520,290 Z M560,180 L575,180 L575,195 L560,195 Z" 
                          fill={ladder.layer3} 
                          filter="url(#cast-shadow)"
                        />
                        {/* Glowing Emissive Windows */}
                        {lampOn && (
                          <g fill={ladder.windowGlow} className="animate-pulse">
                            <rect x="540" y="248" width="14" height="20" rx="2" />
                            <rect x="585" y="248" width="14" height="20" rx="2" />
                            <rect x="562" y="210" width="14" height="14" rx="2" />
                          </g>
                        )}
                        {/* Mid-Hill Line */}
                        <path d="M0,280 Q300,240 500,270 T800,260 L800,500 L0,500 Z" fill={ladder.layer3} />
                      </g>

                      {/* LAYER 4: DECIDUOUS TREES SHEDDING LEAVES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -9}px, ${mouseOffset.y * -7}px)` }}>
                        <path 
                          d="M80,330 C70,250 90,200 130,160 C180,120 230,150 250,210 C270,260 250,330 250,330 L80,330 Z" 
                          fill={ladder.layer4} 
                          filter="url(#cast-shadow)" 
                        />
                        <path 
                          d="M660,340 C630,260 670,180 720,150 C770,120 810,170 810,340 Z" 
                          fill={ladder.layer4} 
                          filter="url(#cast-shadow)" 
                        />
                        {/* Mid Lawn Wave */}
                        <path d="M0,320 Q240,300 480,330 T800,310 L800,500 L0,500 Z" fill={ladder.layer4} />
                      </g>

                      {/* LAYER 5: SERVICE ACTION LAYER - BACKPACK BLOWER CREW & LEAF VACUUM */}
                      <g style={{ transform: `translate(${mouseOffset.x * -13}px, ${mouseOffset.y * -10}px)` }}>
                        {/* Clean Lawn Plateau */}
                        <path d="M0,370 Q380,340 800,360 L800,500 L0,500 Z" fill={ladder.layer5} filter="url(#cast-shadow)" />

                        {/* Silhouette Landscaper with Blower */}
                        <g transform="translate(340, 275) scale(0.95)" fill={ladder.layer6}>
                          {/* Body torso & cap */}
                          <circle cx="45" cy="18" r="11" />
                          <path d="M38,10 L58,14 L55,18 L38,18 Z" /> {/* Cap visor */}
                          <path d="M35,28 L55,28 L50,68 L32,68 Z" /> {/* Torso */}
                          <path d="M30,32 L22,38 L24,58 L32,54 Z" fill={ladder.layer7} /> {/* Backpack unit */}
                          {/* Arms holding blower tube */}
                          <path d="M48,34 L62,48 L82,54 L80,60 L58,54 Z" />
                          <path d="M78,54 L125,78 L123,84 L76,60 Z" /> {/* Long blower tube */}
                          {/* Legs walking forward */}
                          <path d="M35,66 L25,102 L33,103 L43,72 Z" />
                          <path d="M47,66 L58,98 L67,97 L54,68 Z" />
                        </g>

                        {/* SWIRLING CUT PAPER LEAVES BLOWN IN AIR */}
                        <g fill={ladder.accent} opacity="0.95">
                          <path d="M470,360 C474,354 482,354 485,358 C488,362 484,369 478,368 Z" />
                          <path d="M495,348 C499,342 507,342 510,346 C513,350 509,357 503,356 Z" transform="rotate(-20 500 350)" />
                          <path d="M525,365 C530,358 538,360 541,366 C544,372 537,377 531,374 Z" transform="rotate(35 530 365)" />
                          <path d="M555,352 C560,345 570,348 572,355 C574,362 566,366 560,363 Z" />
                          <path d="M590,370 C594,364 602,364 605,368 C608,372 604,379 598,378 Z" />
                          <path d="M625,358 C630,350 640,352 642,360 C644,368 635,372 628,368 Z" />
                        </g>
                        {/* Big Clean Leaf Pile on Curb */}
                        <path d="M620,400 C640,360 710,350 750,380 C770,395 780,410 780,420 L610,420 Z" fill={ladder.layer6} />
                      </g>

                      {/* LAYER 6: FOREGROUND FENCE & CURBSIDE LAWN EDGE */}
                      <g style={{ transform: `translate(${mouseOffset.x * -18}px, ${mouseOffset.y * -14}px)` }}>
                        {/* Front Turf Rolling Shelf */}
                        <path d="M0,420 Q320,390 800,410 L800,500 L0,500 Z" fill={ladder.layer6} filter="url(#deep-shadow)" />
                        
                        {/* Crisp Split Rail Fence */}
                        <g fill={ladder.layer7}>
                          <rect x="60" y="380" width="10" height="70" rx="2" />
                          <rect x="180" y="375" width="10" height="75" rx="2" />
                          <rect x="58" y="395" width="134" height="6" rx="2" transform="rotate(-3 60 400)" />
                          <rect x="58" y="415" width="134" height="6" rx="2" transform="rotate(-3 60 420)" />
                        </g>
                      </g>

                      {/* LAYER 7: FRONT BLACK VIGNETTE SILHOUETTES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -24}px, ${mouseOffset.y * -18}px)` }}>
                        {/* Overhanging Oak Silhouette Branch with crisp leaf cutouts */}
                        <path 
                          d="M-20,-10 C90,40 180,60 260,30 C200,60 160,110 90,130 C40,140 0,110 -20,80 Z" 
                          fill={ladder.layer7} 
                          filter="url(#deep-shadow)"
                        />
                        <path d="M140,55 C160,80 150,110 125,120 C105,115 110,85 140,55 Z" fill={ladder.layer7} />
                        <path d="M210,45 C235,65 230,95 205,100 C190,95 195,70 210,45 Z" fill={ladder.layer7} />

                        {/* Bottom Dark Frame Trim */}
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                    </svg>
                  )}

                  {/* ============================================================ */}
                  {/* SCENE 2: PRECISION MOWING & STRIPING */}
                  {/* ============================================================ */}
                  {scene.id === "mowing" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: DAWN SUN */}
                      <g style={{ transform: `translate(${mouseOffset.x * -2}px, ${mouseOffset.y * -2}px)` }}>
                        <circle cx="240" cy="130" r="75" fill={ladder.layer1} opacity={lampOn ? 0.9 : 0.25} filter="url(#cast-shadow)" />
                        <circle cx="240" cy="130" r="100" fill={ladder.layer1} opacity={lampOn ? 0.2 : 0.05} />
                      </g>

                      {/* LAYER 2: DISTANT HILLS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -4}px, ${mouseOffset.y * -3}px)` }}>
                        <path d="M0,210 Q280,160 550,210 T800,190 L800,500 L0,500 Z" fill={ladder.layer2} opacity="0.8" filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 3: LUXURY ESTATE HOUSE SILHOUETTE */}
                      <g style={{ transform: `translate(${mouseOffset.x * -7}px, ${mouseOffset.y * -5}px)` }}>
                        {/* Grand Estate Silhouette */}
                        <path d="M180,240 L240,180 L300,240 L300,280 L180,280 Z M280,160 L295,160 L295,185 L280,185 Z" fill={ladder.layer3} />
                        <path d="M295,210 L380,210 L380,280 L295,280 Z" fill={ladder.layer3} />
                        <path d="M100,240 L185,240 L185,280 L100,280 Z" fill={ladder.layer3} />

                        {lampOn && (
                          <g fill={ladder.windowGlow}>
                            <rect x="228" y="248" width="16" height="24" rx="2" />
                            <rect x="320" y="230" width="18" height="22" rx="2" />
                            <rect x="130" y="250" width="16" height="20" rx="2" />
                          </g>
                        )}
                        <path d="M0,270 Q400,230 800,260 L800,500 L0,500 Z" fill={ladder.layer3} />
                      </g>

                      {/* LAYER 4: ROLLING LAWN WITH STRIPES PATTERN */}
                      <g style={{ transform: `translate(${mouseOffset.x * -11}px, ${mouseOffset.y * -8}px)` }}>
                        <path d="M0,310 Q350,280 800,310 L800,500 L0,500 Z" fill={ladder.layer4} filter="url(#cast-shadow)" />
                        
                        {/* Alternating Lawn Stripes */}
                        <g opacity="0.25" fill="#ffffff">
                          <polygon points="120,305 160,305 220,360 170,360" />
                          <polygon points="230,305 270,305 340,360 290,360" />
                          <polygon points="340,305 380,305 460,360 410,360" />
                          <polygon points="450,305 490,305 580,360 530,360" />
                          <polygon points="560,305 600,305 700,360 650,360" />
                        </g>
                      </g>

                      {/* LAYER 5: SERVICE ACTION - ZERO-TURN COMMERCIAL MOWER */}
                      <g style={{ transform: `translate(${mouseOffset.x * -15}px, ${mouseOffset.y * -11}px)` }}>
                        <path d="M0,360 Q450,330 800,360 L800,500 L0,500 Z" fill={ladder.layer5} filter="url(#cast-shadow)" />

                        {/* MOWER SILHOUETTE */}
                        <g transform="translate(420, 260) scale(1.05)" fill={ladder.layer6}>
                          {/* Driver */}
                          <circle cx="55" cy="22" r="11" />
                          <path d="M48,15 L68,18 L65,22 L48,22 Z" /> {/* Cap */}
                          <path d="M46,33 L64,33 L58,62 L44,62 Z" /> {/* Body */}
                          <path d="M58,40 L76,46 L74,52 L56,46 Z" /> {/* Arm steering lever */}
                          {/* ROPS roll bar */}
                          <path d="M30,10 L44,10 L38,62 L32,62 Z" />
                          {/* Chassis & Seat */}
                          <path d="M36,48 L56,48 L54,66 L34,66 Z" /> {/* Seat */}
                          <path d="M22,64 L86,64 L96,82 L15,82 Z" /> {/* Engine base */}
                          {/* Cutting Deck */}
                          <path d="M60,82 L110,82 L108,92 L58,92 Z" fill={ladder.accent} />
                          {/* Big Rear Tire */}
                          <circle cx="35" cy="84" r="19" fill={ladder.layer7} />
                          <circle cx="35" cy="84" r="9" fill={ladder.layer4} />
                          {/* Front Caster Wheel */}
                          <circle cx="104" cy="90" r="10" fill={ladder.layer7} />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND DEEP CUT TURF & GARDEN BED */}
                      <g style={{ transform: `translate(${mouseOffset.x * -20}px, ${mouseOffset.y * -15}px)` }}>
                        <path d="M0,410 Q400,390 800,410 L800,500 L0,500 Z" fill={ladder.layer6} filter="url(#deep-shadow)" />
                        
                        {/* Trimmed Boxwood Hedges */}
                        <path d="M60,420 C60,370 120,370 120,420 Z" fill={ladder.layer7} />
                        <path d="M110,425 C110,380 160,380 160,425 Z" fill={ladder.layer7} />
                        <path d="M150,420 C150,375 200,375 200,420 Z" fill={ladder.layer7} />
                      </g>

                      {/* LAYER 7: NEAR-FRAME SILHOUETTES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -26}px, ${mouseOffset.y * -19}px)` }}>
                        <path d="M820,-20 L680,80 L740,160 L820,130 Z" fill={ladder.layer7} filter="url(#deep-shadow)" />
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                    </svg>
                  )}

                  {/* ============================================================ */}
                  {/* SCENE 3: AERATION & OVERSEEDING */}
                  {/* ============================================================ */}
                  {scene.id === "aeration" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: WARM GOLDEN DAWN */}
                      <g style={{ transform: `translate(${mouseOffset.x * -2}px, ${mouseOffset.y * -2}px)` }}>
                        <circle cx="400" cy="160" r="90" fill={ladder.layer1} opacity={lampOn ? 0.95 : 0.25} filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 2: DISTANT RIDGELINES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -4}px, ${mouseOffset.y * -3}px)` }}>
                        <path d="M0,230 Q200,180 400,230 T800,210 L800,500 L0,500 Z" fill={ladder.layer2} opacity="0.85" filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 3: DISTANT NEIGHBORHOOD ROOFTOPS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -7}px, ${mouseOffset.y * -5}px)` }}>
                        <path d="M60,250 L110,210 L160,250 L160,290 L60,290 Z" fill={ladder.layer3} />
                        <path d="M650,250 L700,210 L750,250 L750,290 L650,290 Z" fill={ladder.layer3} />
                        {lampOn && (
                          <g fill={ladder.windowGlow}>
                            <rect x="100" y="255" width="18" height="20" rx="2" />
                            <rect x="690" y="255" width="18" height="20" rx="2" />
                          </g>
                        )}
                        <path d="M0,280 Q400,250 800,280 L800,500 L0,500 Z" fill={ladder.layer3} />
                      </g>

                      {/* LAYER 4: CROSS-SECTION SOIL & TURF LAYER */}
                      <g style={{ transform: `translate(${mouseOffset.x * -11}px, ${mouseOffset.y * -8}px)` }}>
                        <path d="M0,330 Q400,310 800,330 L800,500 L0,500 Z" fill={ladder.layer4} filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 5: SERVICE ACTION - CORE AERATOR & CORE PLUGS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -15}px, ${mouseOffset.y * -11}px)` }}>
                        <path d="M0,375 Q400,355 800,375 L800,500 L0,500 Z" fill={ladder.layer5} filter="url(#cast-shadow)" />

                        {/* AERATOR MACHINE SILHOUETTE */}
                        <g transform="translate(320, 275) scale(1.0)" fill={ladder.layer6}>
                          {/* Operator */}
                          <circle cx="15" cy="22" r="10" />
                          <path d="M8,15 L26,18 L24,22 L8,22 Z" />
                          <path d="M10,32 L26,32 L22,64 L8,64 Z" />
                          <path d="M22,38 L45,42 L42,48 L22,46 Z" /> {/* Hand holding handles */}
                          <path d="M12,64 L2,98 L10,98 L20,68 Z" />
                          {/* Aerator machine frame */}
                          <path d="M42,44 L70,72 L85,72 L85,92 L50,92 L35,46 Z" />
                          {/* Engine block */}
                          <rect x="52" y="58" width="28" height="22" rx="2" fill={ladder.accent} />
                          {/* Tine Drum with Spikes */}
                          <circle cx="68" cy="94" r="16" fill={ladder.layer7} />
                          {/* Hollow tines */}
                          <line x1="68" y1="74" x2="68" y2="112" stroke={ladder.layer7} strokeWidth="4" />
                          <line x1="50" y1="94" x2="86" y2="94" stroke={ladder.layer7} strokeWidth="4" />
                        </g>

                        {/* EXTRACTED CORE PLUGS ON LAWN */}
                        <g fill={ladder.layer4}>
                          <rect x="180" y="378" width="6" height="14" rx="2" transform="rotate(25 180 378)" />
                          <rect x="220" y="375" width="6" height="14" rx="2" transform="rotate(-15 220 375)" />
                          <rect x="260" y="380" width="6" height="14" rx="2" transform="rotate(35 260 380)" />
                          <rect x="440" y="382" width="6" height="14" rx="2" transform="rotate(-30 440 382)" />
                          <rect x="490" y="379" width="6" height="14" rx="2" transform="rotate(15 490 379)" />
                          <rect x="540" y="381" width="6" height="14" rx="2" transform="rotate(-10 540 381)" />
                        </g>

                        {/* FALLING OVERSEED GRASS SEED PARTICLES */}
                        <g fill={ladder.layer1} opacity="0.9">
                          <circle cx="430" cy="350" r="2.5" />
                          <circle cx="445" cy="358" r="2.5" />
                          <circle cx="460" cy="348" r="2.5" />
                          <circle cx="475" cy="362" r="2.5" />
                          <circle cx="490" cy="354" r="2.5" />
                          <circle cx="510" cy="366" r="2.5" />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND DEEP SOIL CUT & NEW SHOOTS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -20}px, ${mouseOffset.y * -15}px)` }}>
                        <path d="M0,420 Q400,400 800,420 L800,500 L0,500 Z" fill={ladder.layer6} filter="url(#deep-shadow)" />
                        
                        {/* Sprouting grass blades */}
                        <g stroke={ladder.accent} strokeWidth="3" strokeLinecap="round" opacity="0.9">
                          <line x1="80" y1="420" x2="85" y2="395" />
                          <line x1="88" y1="420" x2="96" y2="390" />
                          <line x1="160" y1="420" x2="164" y2="392" />
                          <line x1="680" y1="420" x2="685" y2="390" />
                          <line x1="692" y1="420" x2="702" y2="395" />
                        </g>
                      </g>

                      {/* LAYER 7: FRAME OVERHANG */}
                      <g style={{ transform: `translate(${mouseOffset.x * -26}px, ${mouseOffset.y * -19}px)` }}>
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                    </svg>
                  )}

                  {/* ============================================================ */}
                  {/* SCENE 4: MULCH & EDGING */}
                  {/* ============================================================ */}
                  {scene.id === "mulch" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: AFTERNOON GOLDEN LIGHT */}
                      <g style={{ transform: `translate(${mouseOffset.x * -2}px, ${mouseOffset.y * -2}px)` }}>
                        <circle cx="620" cy="130" r="75" fill={ladder.layer1} opacity={lampOn ? 0.9 : 0.25} filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 2: DISTANT HILLS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -4}px, ${mouseOffset.y * -3}px)` }}>
                        <path d="M0,220 Q300,170 560,220 T800,200 L800,500 L0,500 Z" fill={ladder.layer2} opacity="0.85" filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 3: COTTAGE & FLOWER TRELLIS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -7}px, ${mouseOffset.y * -5}px)` }}>
                        <path d="M140,240 L190,190 L240,240 L240,285 L140,285 Z" fill={ladder.layer3} />
                        {lampOn && (
                          <rect x="175" y="245" width="16" height="20" rx="2" fill={ladder.windowGlow} />
                        )}
                        <path d="M0,270 Q400,240 800,270 L800,500 L0,500 Z" fill={ladder.layer3} />
                      </g>

                      {/* LAYER 4: SCULPTED FLOWER BED PROFILE */}
                      <g style={{ transform: `translate(${mouseOffset.x * -11}px, ${mouseOffset.y * -8}px)` }}>
                        <path d="M0,320 Q280,300 540,325 T800,310 L800,500 L0,500 Z" fill={ladder.layer4} filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 5: SERVICE ACTION - CLEAN EDGED TRENCH & DARK MULCH BED */}
                      <g style={{ transform: `translate(${mouseOffset.x * -15}px, ${mouseOffset.y * -11}px)` }}>
                        {/* Deep Hand-Spaded Trench Boundary */}
                        <path 
                          d="M0,370 C200,340 380,410 520,360 C660,310 750,380 800,370 L800,500 L0,500 Z" 
                          fill={ladder.layer5} 
                          filter="url(#cast-shadow)" 
                        />
                        {/* Fresh Bark Texture Band */}
                        <path 
                          d="M0,380 C200,350 380,420 520,370 C660,320 750,390 800,380 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                        />

                        {/* Silhouette Wheelbarrow with Rich Mulch Mound */}
                        <g transform="translate(360, 290) scale(1.0)" fill={ladder.layer6}>
                          {/* Wheelbarrow tub */}
                          <path d="M30,55 L85,55 L75,78 L25,78 Z" />
                          <circle cx="85" cy="85" r="12" fill={ladder.layer7} /> {/* Wheel */}
                          <line x1="30" y1="65" x2="5" y2="70" stroke={ladder.layer6} strokeWidth="5" /> {/* Handles */}
                          <line x1="35" y1="78" x2="30" y2="92" stroke={ladder.layer6} strokeWidth="4" /> {/* Leg support */}
                          {/* Mound of Mulch inside tub */}
                          <path d="M28,55 C40,40 75,40 85,55 Z" fill={ladder.layer7} />
                          {/* Spade stuck in mulch */}
                          <line x1="60" y1="45" x2="72" y2="20" stroke={ladder.layer5} strokeWidth="4" />
                          <polygon points="68,15 76,15 74,22 66,22" fill={ladder.accent} />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND ORNAMENTAL GRASSES & CRUST BORDER */}
                      <g style={{ transform: `translate(${mouseOffset.x * -20}px, ${mouseOffset.y * -15}px)` }}>
                        <path d="M0,425 Q380,400 800,425 L800,500 L0,500 Z" fill={ladder.layer6} filter="url(#deep-shadow)" />
                        
                        {/* Botanical paper cuts along bed edge */}
                        <path d="M120,430 C110,380 140,360 150,430 Z" fill={ladder.layer7} />
                        <path d="M145,430 C140,370 175,355 180,430 Z" fill={ladder.layer7} />
                        <path d="M620,430 C610,375 645,360 655,430 Z" fill={ladder.layer7} />
                      </g>

                      {/* LAYER 7: FRAME OVERHANG */}
                      <g style={{ transform: `translate(${mouseOffset.x * -26}px, ${mouseOffset.y * -19}px)` }}>
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                    </svg>
                  )}

                  {/* ============================================================ */}
                  {/* SCENE 5: WINTER FREEZE & SNOW DEFENSE */}
                  {/* ============================================================ */}
                  {scene.id === "snow" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: COLD MOON THROUGH WINTER SKY */}
                      <g style={{ transform: `translate(${mouseOffset.x * -2}px, ${mouseOffset.y * -2}px)` }}>
                        <circle cx="300" cy="140" r="70" fill={ladder.layer1} opacity={lampOn ? 0.9 : 0.25} filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 2: DISTANT SNOW-COVERED RIDGES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -4}px, ${mouseOffset.y * -3}px)` }}>
                        <path d="M0,230 Q250,170 500,220 T800,200 L800,500 L0,500 Z" fill={ladder.layer2} opacity="0.85" filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 3: SNOWY PINE TREES & WARM HEARTH COTTAGE */}
                      <g style={{ transform: `translate(${mouseOffset.x * -7}px, ${mouseOffset.y * -5}px)` }}>
                        {/* Snow pines */}
                        <path d="M80,260 L105,200 L130,260 Z" fill={ladder.layer3} />
                        <path d="M125,270 L150,190 L175,270 Z" fill={ladder.layer3} />
                        
                        {/* Cozy Cottage */}
                        <path d="M480,240 L540,180 L600,240 L600,285 L480,285 Z M525,170 L540,170 L540,190 L525,190 Z" fill={ladder.layer3} />
                        {/* Warm Golden Glowing Hearth Windows */}
                        {lampOn && (
                          <g fill={ladder.windowGlow} className="animate-pulse">
                            <rect x="505" y="248" width="16" height="22" rx="2" />
                            <rect x="560" y="248" width="16" height="22" rx="2" />
                            <circle cx="540" cy="210" r="8" />
                          </g>
                        )}
                        <path d="M0,280 Q400,245 800,275 L800,500 L0,500 Z" fill={ladder.layer3} />
                      </g>

                      {/* LAYER 4: SNOW BLANKET LAWN WITH CLEARED PATH */}
                      <g style={{ transform: `translate(${mouseOffset.x * -11}px, ${mouseOffset.y * -8}px)` }}>
                        <path d="M0,325 Q380,300 800,325 L800,500 L0,500 Z" fill={ladder.layer4} filter="url(#cast-shadow)" />
                      </g>

                      {/* LAYER 5: SERVICE ACTION - SNOW PLOW CLEARING DRIVEWAY */}
                      <g style={{ transform: `translate(${mouseOffset.x * -15}px, ${mouseOffset.y * -11}px)` }}>
                        <path d="M0,370 Q400,345 800,370 L800,500 L0,500 Z" fill={ladder.layer5} filter="url(#cast-shadow)" />

                        {/* SNOW PLOW TRUCK SILHOUETTE */}
                        <g transform="translate(330, 275) scale(1.05)" fill={ladder.layer6}>
                          {/* Truck Cab & Bed */}
                          <path d="M20,55 L65,55 L90,68 L115,68 L115,86 L10,86 L10,55 Z" />
                          <rect x="35" y="58" width="22" height="18" rx="2" fill={ladder.windowGlow} opacity="0.85" />
                          {/* Heavy Duty Wheels */}
                          <circle cx="32" cy="88" r="16" fill={ladder.layer7} />
                          <circle cx="98" cy="88" r="16" fill={ladder.layer7} />
                          {/* Front Commercial Angled V-Plow Blade */}
                          <path d="M115,74 L142,65 L145,95 L115,92 Z" fill={ladder.accent} />
                          {/* Roof amber beacon light */}
                          {lampOn && (
                            <polygon points="46,55 54,55 52,50 48,50" fill="#f59e0b" className="animate-ping" />
                          )}
                        </g>

                        {/* CURLED SNOW PLOW DISCHARGE WAVE */}
                        <path d="M475,370 C510,345 550,340 580,375 Z" fill={ladder.layer1} opacity="0.8" />
                      </g>

                      {/* LAYER 6: FOREGROUND SNOWDRIFT ACCENTS */}
                      <g style={{ transform: `translate(${mouseOffset.x * -20}px, ${mouseOffset.y * -15}px)` }}>
                        <path d="M0,420 Q320,395 800,415 L800,500 L0,500 Z" fill={ladder.layer6} filter="url(#deep-shadow)" />
                        
                        {/* Shoveled Clean Walkway Edge */}
                        <path d="M220,440 L340,415 L360,425 L240,455 Z" fill={ladder.layer7} />
                      </g>

                      {/* LAYER 7: FROSTED FRONT BRANCHES */}
                      <g style={{ transform: `translate(${mouseOffset.x * -26}px, ${mouseOffset.y * -19}px)` }}>
                        <path d="M-10,-10 C70,50 140,60 210,30 L200,45 C140,70 70,60 -10,10 Z" fill={ladder.layer7} filter="url(#deep-shadow)" />
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                    </svg>
                  )}
                </div>

                {/* BOTTOM STORY SUBTITLE BAR (BURNED-IN PAPER CUT CAPTION) */}
                <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
                  <div className="backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 shadow-2xl flex items-center justify-between gap-4">
                    <p className="text-xs md:text-sm font-semibold text-slate-200 leading-snug">
                      <span className="font-black text-amber-300 uppercase tracking-wider mr-2">Scene {activeIdx + 1}/{SCENES.length}:</span>
                      {scene.storyStep}
                    </p>
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      {SCENES.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* SLIDE PROGRESS TIMELINE BAR */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80 z-20">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* MANUAL NAVIGATION CHEVRONS */}
                <button
                  onClick={prevScene}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-all backdrop-blur-sm hover:scale-110 active:scale-95"
                  aria-label="Previous service scene"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={nextScene}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-all backdrop-blur-sm hover:scale-110 active:scale-95"
                  aria-label="Next service scene"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>

              </div>

              {/* LAMP BASE EMBOSSED BRASS PLAQUE */}
              <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a88258]">
                <span>Flora Lawn &amp; Landscaping Inc</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  3D Paper-Cut Lightbox Spec (纸雕灯)
                </span>
                <span>RI &amp; Southern MA</span>
              </div>
            </div>
          </div>

          {/* SERVICE DETAIL & ESTIMATE CARD */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-[2.2rem] p-7 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <CheckBadgeIcon className="w-3.5 h-3.5" />
                Featured Program #{activeIdx + 1}
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">
                {scene.title}
              </h3>

              <p className="text-amber-300/90 text-xs font-bold uppercase tracking-wide mb-6">
                {scene.tagline}
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-8">
                {scene.keyPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </div>
                    <span className="text-sm font-semibold text-slate-300 leading-snug">
                      {pt}
                    </span>
                  </div>
                ))}
              </div>

              {/* DIRECT CTAS */}
              <div className="space-y-3">
                <Link
                  href={`/contact?service=${encodeURIComponent(scene.serviceParam)}`}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  Get Instant Free Quote
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500">
                  <span>Satellite Measuring Included</span>
                  <span className="text-amber-400/90">Quotes in 1–6 Hours</span>
                </div>
              </div>
            </div>

            {/* CALL DIRECT QUICK BAR */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Have questions about this job?</span>
              <a 
                href="tel:4013890913" 
                className="text-amber-400 hover:text-amber-300 font-black flex items-center gap-1.5 transition-colors"
              >
                (401) 389-0913 &rarr;
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
