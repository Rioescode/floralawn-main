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
  ChevronLeftIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

// SERVICES DEFINED ACCORDING TO PAPERCUT LIGHTBOX LOGIC
// Value ladders: Back layers bright & translucent -> Front layers dark & opaque
const SCENES = [
  {
    id: "fall-cleanup",
    title: "Fall Leaf Clearing & Vacuum",
    serviceParam: "Fall Cleanup",
    seasonBadge: "Autumn Edition",
    tagline: "High-Volume Commercial Leaf Removal & Deep Turf Extraction",
    ladder: {
      sky: "#fde68a",
      backlight: "#fbbf24",
      layer1: "#fef08a",
      layer2: "#f59e0b",
      layer3: "#d97706",
      layer4: "#b45309",
      layer5: "#78350f",
      layer6: "#451a03",
      layer7: "#1a0808",
      accent: "#ef4444",
      accentSecondary: "#f97316",
      windowGlow: "#fffbeb",
      rimLight: "#fef3c7"
    },
    duration: 8,
    storyStep: "Before freezing rains lock wet oak leaves into suffocating mold, our backpack air streams and curbside vacuum haulers clear fences, beds, and lawns clean to the dirt.",
    keyPoints: [
      "Perimeter fence & perennial bed blowout",
      "Curbside high-volume vacuum suction & offsite haul",
      "Stops snow mold, crown rot, and pest nesting"
    ]
  },
  {
    id: "mowing",
    title: "Precision Mowing & Diamond Striping",
    serviceParam: "Lawn Mowing",
    seasonBadge: "Spring & Summer",
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
      layer7: "#052012",
      accent: "#facc15",
      accentSecondary: "#4ade80",
      windowGlow: "#fef3c7",
      rimLight: "#dcfce7"
    },
    duration: 8,
    storyStep: "Razor-sharp 60” commercial mulching decks cut at precise 3.5” heights with alternating 45° diamond patterns that stimulate dense lateral root shoots.",
    keyPoints: [
      "Weekly or bi-weekly scheduling with dependable days",
      "Clean edge trimming & driveway/walkway blowoff",
      "Alternating diamond stripes prevent soil wheel ruts"
    ]
  },
  {
    id: "aeration",
    title: "Core Aeration & Deep Overseeding",
    serviceParam: "Lawn Aeration",
    seasonBadge: "Late Summer / Early Fall",
    tagline: "Soil De-Compaction & Certified Bluegrass Germination",
    ladder: {
      sky: "#fed7aa",
      backlight: "#f97316",
      layer1: "#fdba74",
      layer2: "#fb923c",
      layer3: "#b45309",
      layer4: "#854d0e",
      layer5: "#573a08",
      layer6: "#382307",
      layer7: "#140a02",
      accent: "#22c55e",
      accentSecondary: "#fbbf24",
      windowGlow: "#ffedd5",
      rimLight: "#ffedd5"
    },
    duration: 8,
    storyStep: "Hollow alloy tines extract 2.5” compressed New England clay cores, dropping premium cold-hardy seed directly into open root channels for instant germination.",
    keyPoints: [
      "Relieves tough New England clay soil compaction",
      "Fills high-traffic bare patches with certified seed",
      "Maximizes root nutrient and rain infiltration"
    ]
  },
  {
    id: "mulch",
    title: "Deep Mulch Installation & Trench Edging",
    serviceParam: "Mulch Installation",
    seasonBadge: "Spring Refresh",
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
      layer7: "#0e0603",
      accent: "#10b981",
      accentSecondary: "#d97706",
      windowGlow: "#fff1f2",
      rimLight: "#fce7f3"
    },
    duration: 8,
    storyStep: "A 3” hand-spaded vertical trench creates an architectural drop-edge between lawn and flowerbeds, sealed with dark triple-shredded weed-barrier bark.",
    keyPoints: [
      "Crisp 3-inch clean trench border that blocks grass roots",
      "Natural triple-shredded dark pine/hemlock mulch",
      "Conserves soil moisture and insulates plant roots"
    ]
  },
  {
    id: "snow",
    title: "Winter Hard Freeze & Snow Defense",
    serviceParam: "Snow Removal",
    seasonBadge: "Winter Blizzard Defense",
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
      layer7: "#070b12",
      accent: "#f59e0b",
      accentSecondary: "#38bdf8",
      windowGlow: "#fef08a",
      rimLight: "#f1f5f9"
    },
    duration: 8,
    storyStep: "Before morning driveways freeze over, commercial angled plow trucks with rubber curb guards clear snow while crew hand-shovels walkways and deposits pet-safe brine.",
    keyPoints: [
      "Automatic dispatch when snow triggers 2 inches",
      "Zero-scratch rubber cutting edges on driveways & pavers",
      "Pre-storm liquid brine & eco-friendly ice melt"
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
  const [clock, setClock] = useState(0);
  const boxRef = useRef(null);
  const animFrameRef = useRef(null);

  const scene = SCENES[activeIdx];
  const ladder = scene.ladder;

  // Organic micro-drift clock loop (provides smooth mathematical candle/lamp breathing)
  useEffect(() => {
    let startTime = performance.now();
    const updateLoop = (now) => {
      const elapsed = (now - startTime) / 1000;
      setClock(elapsed);
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };
    animFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Story mode auto-advancing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = 100;
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

  // Compute organic camera micro-drift when unhovered
  // Lemomo spec: Subtle continuous handheld micro-drift (~0.6-1.5px) so the frame never feels statically frozen
  const autoDriftX = !isHovered ? Math.sin(clock * 0.9) * 0.18 + Math.cos(clock * 1.7) * 0.12 : mouseOffset.x;
  const autoDriftY = !isHovered ? Math.cos(clock * 0.8) * 0.15 + Math.sin(clock * 1.4) * 0.1 : mouseOffset.y;

  // Mathematical authentic lamp flicker from spec: (1 + 0.05 * sin(7.3t) * sin(3.1t))
  const organicFlicker = lampOn 
    ? 0.96 + 0.05 * Math.sin(clock * 7.3) * Math.sin(clock * 3.1) + 0.02 * Math.sin(clock * 14.2)
    : 0.15;

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
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#060a12] via-[#0b121f] to-[#05080f] text-white overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* CSS KEYFRAME ANIMATIONS FOR THE PHYSICAL PAPERCUT THEATER */}
      <style jsx>{`
        @keyframes floatLeaf1 {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.95; }
          100% { transform: translate(240px, -55px) rotate(280deg); opacity: 0; }
        }
        @keyframes floatLeaf2 {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.9; }
          80% { opacity: 0.9; }
          100% { transform: translate(260px, -80px) rotate(-340deg); opacity: 0; }
        }
        @keyframes floatLeaf3 {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { transform: translate(190px, -35px) rotate(190deg); opacity: 0; }
        }
        @keyframes snowDrift1 {
          0% { transform: translate(0px, -20px); opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.9; }
          100% { transform: translate(45px, 480px); opacity: 0; }
        }
        @keyframes snowDrift2 {
          0% { transform: translate(0px, -25px); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.75; }
          100% { transform: translate(-35px, 490px); opacity: 0; }
        }
        @keyframes snowSprayArc {
          0% { transform: translate(0px, 0px) scale(0.7); opacity: 0.8; }
          50% { transform: translate(45px, -30px) scale(1.15); opacity: 0.95; }
          100% { transform: translate(90px, 15px) scale(1.4); opacity: 0; }
        }
        @keyframes mowerVibe {
          0%, 100% { transform: translate(420px, 260px) scale(1.05); }
          50% { transform: translate(420.4px, 259.2px) scale(1.05); }
        }
        @keyframes grassSprayParticle {
          0% { transform: translate(0px, 0px) scale(0.6); opacity: 0.95; }
          100% { transform: translate(65px, -30px) scale(1.2); opacity: 0; }
        }
        @keyframes tineSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spadeShimmer {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          90% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes amberBeaconPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.4); filter: drop-shadow(0 0 10px #f59e0b); }
        }
        @keyframes seedFallParticle {
          0% { transform: translate(0px, 0px); opacity: 0.9; }
          100% { transform: translate(15px, 35px); opacity: 0.2; }
        }
        @keyframes gentleSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.2deg); }
        }
      `}</style>

      {/* AMBIENT BACKGROUND GLOW (Simulating lightbox backlight scattering into room) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[750px] rounded-full blur-[170px] pointer-events-none transition-all duration-1000"
        style={{ 
          background: ladder.backlight,
          opacity: lampOn ? 0.28 : 0.05
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md shadow-sm">
              <SparklesIcon className="w-4 h-4 text-amber-400 animate-pulse" />
              Paper-Cut Shadow Box Theater · 3D Service Visualizer
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic leading-[1.08]">
              Experience What We Do <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">In Real Life</span>
            </h2>
            <p className="text-slate-400 font-medium text-base md:text-lg mt-3 leading-relaxed">
              Step inside our illuminated 7-layer shadow box (纸雕灯). Watch how our specialized Rhode Island crews tackle every season with commercial equipment.
            </p>
          </div>

          {/* CONTROLS BAR */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setLampOn(!lampOn)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all duration-300 active:scale-95 ${
                lampOn 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/20' 
                  : 'bg-slate-900/90 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title="Toggle Backlight Lamp"
            >
              <SunIcon className={`w-4 h-4 ${lampOn ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-600'}`} />
              {lampOn ? 'Backlight On' : 'Lamp Off'}
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95"
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
                className={`relative shrink-0 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 border active:scale-95 ${
                  isActive 
                    ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/15 scale-[1.02]"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <span className="text-sm">{sc.id === 'fall-cleanup' ? '🍂' : sc.id === 'mowing' ? '✂️' : sc.id === 'aeration' ? '🌱' : sc.id === 'mulch' ? '🪵' : '❄️'}</span>
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
          
          {/* THE PHYSICAL LIGHTBOX CABINET */}
          <div className="lg:col-span-8">
            <div 
              ref={boxRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-[2.5rem] p-4 md:p-6 bg-gradient-to-br from-[#26160c] via-[#140b06] to-[#0a0503] border-4 border-[#3e2315] shadow-[0_35px_100px_rgba(0,0,0,0.95),inset_0_2px_6px_rgba(255,200,100,0.25)] transition-transform duration-300 group cursor-crosshair overflow-hidden"
              style={{
                perspective: "1200px",
              }}
            >
              {/* WOOD FRAME CORNER BRACKETS & RIVETS */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-600/70" />
              <div className="absolute top-4 left-4 w-1 h-1 rounded-full bg-amber-600/90 shadow-sm" />
              
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-600/70" />
              <div className="absolute top-4 right-4 w-1 h-1 rounded-full bg-amber-600/90 shadow-sm" />
              
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-600/70" />
              <div className="absolute bottom-4 left-4 w-1 h-1 rounded-full bg-amber-600/90 shadow-sm" />
              
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-600/70" />
              <div className="absolute bottom-4 right-4 w-1 h-1 rounded-full bg-amber-600/90 shadow-sm" />

              {/* INNER CAVITY (Shadow Box Recessed Interior) */}
              <div className="relative w-full h-[360px] md:h-[490px] rounded-[1.8rem] overflow-hidden bg-slate-950 border-2 border-black/90 shadow-[inset_0_20px_50px_rgba(0,0,0,0.98),inset_0_-10px_30px_rgba(0,0,0,0.9)]">
                
                {/* SVG DEFINITIONS FOR PULP GRAIN, DEPTH-OF-FIELD BLURS, AND CAST SHADOWS */}
                <svg className="absolute w-0 h-0" aria-hidden="true">
                  <defs>
                    {/* PULP GRAIN TEXTURE FILTER (Lemomo spec: Fibre grain texture across all paper sheets) */}
                    <filter id="pulp-grain" x="0%" y="0%" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" result="noise" />
                      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.09 0" result="mottle" />
                      <feComposite in2="SourceGraphic" in="mottle" operator="in" />
                    </filter>
                    
                    {/* LAYER CAST SHADOWS (Layer n casting soft shadow onto Layer n-1) */}
                    <filter id="layer-shadow-soft" x="-15%" y="-15%" width="135%" height="145%">
                      <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.45" />
                    </filter>
                    <filter id="layer-shadow-deep" x="-20%" y="-20%" width="145%" height="155%">
                      <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.65" />
                    </filter>

                    {/* WINDOW & LANTERN BLOOM FILTER (Holes burning & blooming through paper) */}
                    <filter id="window-bloom" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>

                    {/* DEPTH-OF-FIELD MACRO BLUR (Far background soft focus) */}
                    <filter id="dof-far" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="1.2" />
                    </filter>
                  </defs>
                </svg>

                {/* LAYER 0: WARM BACKLIGHT DIFFUSION THROUGH PAPER STACK */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-all duration-700"
                  style={{
                    opacity: organicFlicker,
                    background: `radial-gradient(ellipse at 52% 34%, ${ladder.sky} 0%, ${ladder.backlight} 28%, ${ladder.layer4} 68%, #03060c 98%)`,
                    filter: "contrast(120%) brightness(108%)",
                  }}
                />

                {/* SCENE SPECIFIC SVG LAYERS WITH DYNAMIC PARALLAX & CONTINUOUS DRIFT */}
                <div 
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate3d(${autoDriftX * 14}px, ${autoDriftY * 10}px, 0px)`,
                  }}
                >
                  {/* ============================================================ */}
                  {/* SCENE 1: FALL LEAF CLEANUP */}
                  {/* ============================================================ */}
                  {scene.id === "fall-cleanup" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: BACK SUN DISK (Depth-of-field soft focus) */}
                      <g 
                        filter="url(#dof-far)"
                        style={{ transform: `translate(${autoDriftX * -2}px, ${autoDriftY * -2}px)` }}
                      >
                        <circle cx="580" cy="140" r="70" fill={ladder.layer1} opacity={lampOn ? 0.95 : 0.3} />
                        <circle cx="580" cy="140" r="95" fill={ladder.layer1} opacity={lampOn ? 0.28 : 0.05} />
                      </g>

                      {/* LAYER 2: DISTANT NEW ENGLAND ROLLING HILLS */}
                      <g style={{ transform: `translate(${autoDriftX * -4}px, ${autoDriftY * -3}px)` }}>
                        <path 
                          d="M0,225 Q220,165 430,215 T800,195 L800,500 L0,500 Z" 
                          fill={ladder.layer2} 
                          opacity="0.88"
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 3: DISTANT COLONIAL FARMHOUSE & WINDBREAK TREES */}
                      <g style={{ transform: `translate(${autoDriftX * -6.5}px, ${autoDriftY * -5}px)` }}>
                        {/* Pines and Oak tree paper cuts */}
                        <path d="M120,260 L140,205 L160,260 Z M135,205 L140,190 L145,205 Z" fill={ladder.layer3} />
                        <path d="M160,270 L185,195 L210,270 Z M180,195 L185,180 L190,195 Z" fill={ladder.layer3} />
                        
                        {/* Colonial Farmhouse Silhouette */}
                        <path 
                          d="M520,238 L570,188 L620,238 L620,288 L520,288 Z M560,178 L575,178 L575,193 L560,193 Z" 
                          fill={ladder.layer3} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.3"
                        />
                        {/* Emissive Burning Windows with Light Bloom */}
                        {lampOn && (
                          <g fill={ladder.windowGlow} filter="url(#window-bloom)">
                            <rect x="540" y="246" width="14" height="20" rx="2" style={{ opacity: 0.85 + 0.15 * Math.sin(clock * 5) }} />
                            <rect x="585" y="246" width="14" height="20" rx="2" style={{ opacity: 0.88 + 0.12 * Math.cos(clock * 4.3) }} />
                            <rect x="562" y="208" width="14" height="14" rx="2" style={{ opacity: 0.9 + 0.1 * Math.sin(clock * 6.2) }} />
                          </g>
                        )}
                        {/* Mid-Hill Line */}
                        <path 
                          d="M0,275 Q300,235 500,265 T800,255 L800,500 L0,500 Z" 
                          fill={ladder.layer3} 
                          stroke={ladder.rimLight}
                          strokeWidth="0.7"
                          strokeOpacity="0.35"
                        />
                      </g>

                      {/* LAYER 4: DECIDUOUS TREES SHEDDING LEAVES */}
                      <g style={{ transform: `translate(${autoDriftX * -9.5}px, ${autoDriftY * -7.5}px)` }}>
                        {/* Tree Canopies with Paper Rim Highlights */}
                        <path 
                          d="M80,330 C70,245 90,195 130,155 C180,115 230,145 250,205 C270,255 250,330 250,330 L80,330 Z" 
                          fill={ladder.layer4} 
                          filter="url(#layer-shadow-soft)" 
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.5"
                        />
                        <path 
                          d="M660,340 C630,255 670,175 720,145 C770,115 810,165 810,340 Z" 
                          fill={ladder.layer4} 
                          filter="url(#layer-shadow-soft)" 
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.5"
                        />
                        {/* Mid Lawn Wave */}
                        <path 
                          d="M0,318 Q240,296 480,326 T800,306 L800,500 L0,500 Z" 
                          fill={ladder.layer4} 
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 5: SERVICE ACTION LAYER - BACKPACK BLOWER CREW & LEAF VACUUM */}
                      <g style={{ transform: `translate(${autoDriftX * -13.5}px, ${autoDriftY * -10.5}px)` }}>
                        {/* Clean Lawn Plateau */}
                        <path 
                          d="M0,368 Q380,338 800,358 L800,500 L0,500 Z" 
                          fill={ladder.layer5} 
                          filter="url(#layer-shadow-soft)" 
                          stroke={ladder.rimLight}
                          strokeWidth="1.0"
                          strokeOpacity="0.4"
                        />

                        {/* Silhouette Landscaper with Commercial Backpack Blower */}
                        <g transform="translate(340, 275) scale(0.95)" fill={ladder.layer6}>
                          {/* Body torso & cap */}
                          <circle cx="45" cy="18" r="11" />
                          <path d="M38,10 L58,14 L55,18 L38,18 Z" /> {/* Cap visor */}
                          <path d="M35,28 L55,28 L50,68 L32,68 Z" /> {/* Torso */}
                          <path d="M30,32 L22,38 L24,58 L32,54 Z" fill={ladder.layer7} /> {/* Backpack unit */}
                          {/* Arms holding blower tube */}
                          <path d="M48,34 L62,48 L82,54 L80,60 L58,54 Z" />
                          <path d="M78,54 L125,78 L123,84 L76,60 Z" /> {/* Long blower tube */}
                          {/* Air velocity shockwave lines from blower muzzle */}
                          <path 
                            d="M128,78 Q140,75 155,80 M130,83 Q145,80 162,85" 
                            stroke={ladder.rimLight} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            opacity="0.6" 
                          />
                          {/* Legs walking forward */}
                          <path d="M35,66 L25,102 L33,103 L43,72 Z" />
                          <path d="M47,66 L58,98 L67,97 L54,68 Z" />
                        </g>

                        {/* CONTINUOUS DRIFTING LEAVES SWIRLING IN AIR (CSS Animation Loop) */}
                        <g fill={ladder.accent}>
                          <path 
                            d="M470,360 C474,354 482,354 485,358 C488,362 484,369 478,368 Z" 
                            style={{ animation: "floatLeaf1 2.8s infinite ease-in-out" }}
                          />
                          <path 
                            d="M495,348 C499,342 507,342 510,346 C513,350 509,357 503,356 Z" 
                            fill={ladder.accentSecondary}
                            style={{ animation: "floatLeaf2 3.4s infinite ease-in-out 0.4s" }}
                          />
                          <path 
                            d="M525,365 C530,358 538,360 541,366 C544,372 537,377 531,374 Z" 
                            style={{ animation: "floatLeaf3 3.1s infinite ease-in-out 0.9s" }}
                          />
                          <path 
                            d="M480,352 C485,345 495,348 497,355 C499,362 491,366 485,363 Z" 
                            fill={ladder.accentSecondary}
                            style={{ animation: "floatLeaf1 2.9s infinite ease-in-out 1.5s" }}
                          />
                          <path 
                            d="M510,362 C514,356 522,356 525,360 C528,364 524,371 518,370 Z" 
                            style={{ animation: "floatLeaf2 3.6s infinite ease-in-out 1.1s" }}
                          />
                        </g>

                        {/* Large Curbside Composting Leaf Pile */}
                        <path 
                          d="M620,400 C640,358 710,348 750,378 C770,393 780,410 780,420 L610,420 Z" 
                          fill={ladder.layer6} 
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 6: FOREGROUND FENCE & CURBSIDE LAWN EDGE */}
                      <g style={{ transform: `translate(${autoDriftX * -18.5}px, ${autoDriftY * -14.5}px)` }}>
                        {/* Front Turf Rolling Shelf */}
                        <path 
                          d="M0,418 Q320,388 800,408 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                          filter="url(#layer-shadow-deep)" 
                          stroke={ladder.rimLight}
                          strokeWidth="1.4"
                          strokeOpacity="0.45"
                        />
                        
                        {/* Crisp Split Rail Fence */}
                        <g fill={ladder.layer7}>
                          <rect x="60" y="378" width="10" height="72" rx="2" stroke={ladder.rimLight} strokeWidth="0.7" strokeOpacity="0.3" />
                          <rect x="180" y="373" width="10" height="77" rx="2" stroke={ladder.rimLight} strokeWidth="0.7" strokeOpacity="0.3" />
                          <rect x="58" y="393" width="134" height="6" rx="2" transform="rotate(-3 60 400)" />
                          <rect x="58" y="413" width="134" height="6" rx="2" transform="rotate(-3 60 420)" />
                        </g>
                      </g>

                      {/* LAYER 7: FRONT BLACK VIGNETTE SILHOUETTES */}
                      <g style={{ transform: `translate(${autoDriftX * -24.5}px, ${autoDriftY * -18.5}px)` }}>
                        {/* Overhanging Oak Silhouette Branch */}
                        <path 
                          d="M-20,-10 C90,40 180,60 260,30 C200,60 160,110 90,130 C40,140 0,110 -20,80 Z" 
                          fill={ladder.layer7} 
                          filter="url(#layer-shadow-deep)"
                        />
                        <path d="M140,55 C160,80 150,110 125,120 C105,115 110,85 140,55 Z" fill={ladder.layer7} />
                        <path d="M210,45 C235,65 230,95 205,100 C190,95 195,70 210,45 Z" fill={ladder.layer7} />

                        {/* Bottom Dark Frame Rim */}
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
                      <g 
                        filter="url(#dof-far)"
                        style={{ transform: `translate(${autoDriftX * -2}px, ${autoDriftY * -2}px)` }}
                      >
                        <circle cx="240" cy="130" r="75" fill={ladder.layer1} opacity={lampOn ? 0.9 : 0.25} />
                        <circle cx="240" cy="130" r="105" fill={ladder.layer1} opacity={lampOn ? 0.22 : 0.05} />
                      </g>

                      {/* LAYER 2: DISTANT HILLS */}
                      <g style={{ transform: `translate(${autoDriftX * -4}px, ${autoDriftY * -3}px)` }}>
                        <path 
                          d="M0,208 Q280,158 550,208 T800,188 L800,500 L0,500 Z" 
                          fill={ladder.layer2} 
                          opacity="0.82" 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 3: LUXURY ESTATE HOUSE SILHOUETTE */}
                      <g style={{ transform: `translate(${autoDriftX * -7}px, ${autoDriftY * -5}px)` }}>
                        <path d="M180,240 L240,180 L300,240 L300,280 L180,280 Z M280,160 L295,160 L295,185 L280,185 Z" fill={ladder.layer3} />
                        <path d="M295,210 L380,210 L380,280 L295,280 Z" fill={ladder.layer3} />
                        <path d="M100,240 L185,240 L185,280 L100,280 Z" fill={ladder.layer3} />

                        {lampOn && (
                          <g fill={ladder.windowGlow} filter="url(#window-bloom)">
                            <rect x="228" y="248" width="16" height="24" rx="2" style={{ opacity: 0.88 + 0.12 * Math.sin(clock * 4.5) }} />
                            <rect x="320" y="230" width="18" height="22" rx="2" style={{ opacity: 0.9 + 0.1 * Math.cos(clock * 3.8) }} />
                            <rect x="130" y="250" width="16" height="20" rx="2" style={{ opacity: 0.85 + 0.15 * Math.sin(clock * 5.1) }} />
                          </g>
                        )}
                        <path 
                          d="M0,268 Q400,228 800,258 L800,500 L0,500 Z" 
                          fill={ladder.layer3} 
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.35"
                        />
                      </g>

                      {/* LAYER 4: ROLLING LAWN WITH DIAMOND STRIPING PATTERN */}
                      <g style={{ transform: `translate(${autoDriftX * -11}px, ${autoDriftY * -8}px)` }}>
                        <path 
                          d="M0,308 Q350,278 800,308 L800,500 L0,500 Z" 
                          fill={ladder.layer4} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.1"
                          strokeOpacity="0.45"
                        />
                        
                        {/* Alternating Diamond Stripes with Subtle Glow */}
                        <g opacity="0.3" fill="#ffffff">
                          <polygon points="120,303 160,303 220,358 170,358" />
                          <polygon points="230,303 270,303 340,358 290,358" />
                          <polygon points="340,303 380,303 460,358 410,358" />
                          <polygon points="450,303 490,303 580,358 530,358" />
                          <polygon points="560,303 600,303 700,358 650,358" />
                        </g>
                      </g>

                      {/* LAYER 5: SERVICE ACTION - ZERO-TURN COMMERCIAL MOWER WITH ACTIVE VIBRATION */}
                      <g style={{ transform: `translate(${autoDriftX * -15}px, ${autoDriftY * -11}px)` }}>
                        <path 
                          d="M0,358 Q450,328 800,358 L800,500 L0,500 Z" 
                          fill={ladder.layer5} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.1"
                          strokeOpacity="0.4"
                        />

                        {/* ZERO-TURN MOWER SILHOUETTE (With Subtle Engine Idle Vibration) */}
                        <g style={{ animation: "mowerVibe 0.22s infinite ease-in-out" }} fill={ladder.layer6}>
                          {/* Driver */}
                          <circle cx="55" cy="22" r="11" />
                          <path d="M48,15 L68,18 L65,22 L48,22 Z" /> {/* Cap */}
                          <path d="M46,33 L64,33 L58,62 L44,62 Z" /> {/* Torso */}
                          <path d="M58,40 L76,46 L74,52 L56,46 Z" /> {/* Arm steering lever */}
                          {/* ROPS roll bar */}
                          <path d="M30,10 L44,10 L38,62 L32,62 Z" />
                          {/* Chassis & Seat */}
                          <path d="M36,48 L56,48 L54,66 L34,66 Z" /> {/* Seat */}
                          <path d="M22,64 L86,64 L96,82 L15,82 Z" /> {/* Engine base */}
                          {/* Cutting Deck with Golden Trim */}
                          <path d="M60,82 L110,82 L108,92 L58,92 Z" fill={ladder.accent} />
                          {/* Big Rear Drive Tire with Rim */}
                          <circle cx="35" cy="84" r="19" fill={ladder.layer7} />
                          <circle cx="35" cy="84" r="9" fill={ladder.layer4} />
                          {/* Front Caster Wheel */}
                          <circle cx="104" cy="90" r="10" fill={ladder.layer7} />
                          <circle cx="104" cy="90" r="4" fill={ladder.layer3} />
                        </g>

                        {/* ACTIVE FLYING GRASS CLIPPING PARTICLES (Continuous Discharge Stream) */}
                        <g fill={ladder.accentSecondary}>
                          <circle cx="535" cy="345" r="2" style={{ animation: "grassSprayParticle 0.8s infinite ease-out" }} />
                          <circle cx="538" cy="342" r="2.5" style={{ animation: "grassSprayParticle 0.7s infinite ease-out 0.15s" }} />
                          <circle cx="542" cy="348" r="1.8" style={{ animation: "grassSprayParticle 0.9s infinite ease-out 0.35s" }} />
                          <circle cx="545" cy="340" r="2.2" style={{ animation: "grassSprayParticle 0.75s infinite ease-out 0.5s" }} />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND SCULPTED BOXWOOD HEDGES */}
                      <g style={{ transform: `translate(${autoDriftX * -20}px, ${autoDriftY * -15}px)` }}>
                        <path 
                          d="M0,408 Q400,388 800,408 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                          filter="url(#layer-shadow-deep)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.3"
                          strokeOpacity="0.45"
                        />
                        
                        {/* Trimmed Boxwood Hedges with Top Highlight */}
                        <path d="M60,420 C60,370 120,370 120,420 Z" fill={ladder.layer7} stroke={ladder.rimLight} strokeWidth="0.8" strokeOpacity="0.3" />
                        <path d="M110,425 C110,380 160,380 160,425 Z" fill={ladder.layer7} stroke={ladder.rimLight} strokeWidth="0.8" strokeOpacity="0.3" />
                        <path d="M150,420 C150,375 200,375 200,420 Z" fill={ladder.layer7} stroke={ladder.rimLight} strokeWidth="0.8" strokeOpacity="0.3" />
                      </g>

                      {/* LAYER 7: NEAR-FRAME SILHOUETTES */}
                      <g style={{ transform: `translate(${autoDriftX * -26}px, ${autoDriftY * -19}px)` }}>
                        <path d="M820,-20 L680,80 L740,160 L820,130 Z" fill={ladder.layer7} filter="url(#layer-shadow-deep)" />
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
                      <g 
                        filter="url(#dof-far)"
                        style={{ transform: `translate(${autoDriftX * -2}px, ${autoDriftY * -2}px)` }}
                      >
                        <circle cx="400" cy="160" r="90" fill={ladder.layer1} opacity={lampOn ? 0.95 : 0.25} />
                        <circle cx="400" cy="160" r="120" fill={ladder.layer1} opacity={lampOn ? 0.2 : 0.04} />
                      </g>

                      {/* LAYER 2: DISTANT RIDGELINES */}
                      <g style={{ transform: `translate(${autoDriftX * -4}px, ${autoDriftY * -3}px)` }}>
                        <path 
                          d="M0,228 Q200,178 400,228 T800,208 L800,500 L0,500 Z" 
                          fill={ladder.layer2} 
                          opacity="0.86" 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.35"
                        />
                      </g>

                      {/* LAYER 3: DISTANT NEIGHBORHOOD ROOFTOPS */}
                      <g style={{ transform: `translate(${autoDriftX * -7}px, ${autoDriftY * -5}px)` }}>
                        <path d="M60,250 L110,210 L160,250 L160,290 L60,290 Z" fill={ladder.layer3} />
                        <path d="M650,250 L700,210 L750,250 L750,290 L650,290 Z" fill={ladder.layer3} />
                        {lampOn && (
                          <g fill={ladder.windowGlow} filter="url(#window-bloom)">
                            <rect x="100" y="255" width="18" height="20" rx="2" style={{ opacity: 0.9 }} />
                            <rect x="690" y="255" width="18" height="20" rx="2" style={{ opacity: 0.88 }} />
                          </g>
                        )}
                        <path 
                          d="M0,278 Q400,248 800,278 L800,500 L0,500 Z" 
                          fill={ladder.layer3} 
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 4: CROSS-SECTION SOIL & COMPACTION RELIEF LAYER */}
                      <g style={{ transform: `translate(${autoDriftX * -11}px, ${autoDriftY * -8}px)` }}>
                        <path 
                          d="M0,328 Q400,308 800,328 L800,500 L0,500 Z" 
                          fill={ladder.layer4} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.0"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 5: SERVICE ACTION - COMMERCIAL CORE AERATOR & CORING DRUM */}
                      <g style={{ transform: `translate(${autoDriftX * -15}px, ${autoDriftY * -11}px)` }}>
                        <path 
                          d="M0,373 Q400,353 800,373 L800,500 L0,500 Z" 
                          fill={ladder.layer5} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.1"
                          strokeOpacity="0.4"
                        />

                        {/* AERATOR MACHINE SILHOUETTE */}
                        <g transform="translate(320, 275)" fill={ladder.layer6}>
                          {/* Operator */}
                          <circle cx="15" cy="22" r="10" />
                          <path d="M8,15 L26,18 L24,22 L8,22 Z" />
                          <path d="M10,32 L26,32 L22,64 L8,64 Z" />
                          <path d="M22,38 L45,42 L42,48 L22,46 Z" /> {/* Hand holding handles */}
                          <path d="M12,64 L2,98 L10,98 L20,68 Z" />
                          {/* Aerator machine frame */}
                          <path d="M42,44 L70,72 L85,72 L85,92 L50,92 L35,46 Z" />
                          {/* Engine block with green accent */}
                          <rect x="52" y="58" width="28" height="22" rx="2" fill={ladder.accent} />
                          {/* Tine Drum with Spikes (Rotating anim) */}
                          <g transform="translate(68, 94)">
                            <g style={{ animation: "tineSpin 3s linear infinite" }}>
                              <circle cx="0" cy="0" r="16" fill={ladder.layer7} />
                              <line x1="0" y1="-20" x2="0" y2="20" stroke={ladder.layer7} strokeWidth="4" />
                              <line x1="-20" y1="0" x2="20" y2="0" stroke={ladder.layer7} strokeWidth="4" />
                            </g>
                          </g>
                        </g>

                        {/* EXTRACTED CORE PLUGS RESTING ON TURF */}
                        <g fill={ladder.layer4} stroke={ladder.rimLight} strokeWidth="0.5">
                          <rect x="180" y="376" width="6" height="14" rx="2" transform="rotate(25 180 376)" />
                          <rect x="220" y="373" width="6" height="14" rx="2" transform="rotate(-15 220 373)" />
                          <rect x="260" y="378" width="6" height="14" rx="2" transform="rotate(35 260 378)" />
                          <rect x="440" y="380" width="6" height="14" rx="2" transform="rotate(-30 440 380)" />
                          <rect x="490" y="377" width="6" height="14" rx="2" transform="rotate(15 490 377)" />
                          <rect x="540" y="379" width="6" height="14" rx="2" transform="rotate(-10 540 379)" />
                        </g>

                        {/* FALLING OVERSEED SEED PARTICLES (Golden Seed Rain) */}
                        <g fill={ladder.ladder1 || "#fde047"}>
                          <circle cx="430" cy="345" r="2.2" style={{ animation: "seedFallParticle 1.4s infinite linear" }} />
                          <circle cx="445" cy="353" r="2" style={{ animation: "seedFallParticle 1.2s infinite linear 0.3s" }} />
                          <circle cx="460" cy="342" r="2.4" style={{ animation: "seedFallParticle 1.5s infinite linear 0.6s" }} />
                          <circle cx="475" cy="357" r="1.9" style={{ animation: "seedFallParticle 1.3s infinite linear 0.9s" }} />
                          <circle cx="490" cy="349" r="2.3" style={{ animation: "seedFallParticle 1.6s infinite linear 0.2s" }} />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND DEEP SOIL CUT & NEW SHOOTS */}
                      <g style={{ transform: `translate(${autoDriftX * -20}px, ${autoDriftY * -15}px)` }}>
                        <path 
                          d="M0,418 Q400,398 800,418 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                          filter="url(#layer-shadow-deep)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.4"
                        />
                        
                        {/* Sprouting Germinated Grass Shoots with Glow */}
                        <g stroke={ladder.accent} strokeWidth="3" strokeLinecap="round" opacity="0.95">
                          <line x1="80" y1="418" x2="85" y2="393" style={{ animation: "gentleSway 3s infinite ease-in-out" }} />
                          <line x1="88" y1="418" x2="96" y2="388" />
                          <line x1="160" y1="418" x2="164" y2="390" />
                          <line x1="680" y1="418" x2="685" y2="388" />
                          <line x1="692" y1="418" x2="702" y2="393" style={{ animation: "gentleSway 3.5s infinite ease-in-out" }} />
                        </g>
                      </g>

                      {/* LAYER 7: FRAME OVERHANG */}
                      <g style={{ transform: `translate(${autoDriftX * -26}px, ${autoDriftY * -19}px)` }}>
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                    </svg>
                  )}

                  {/* ============================================================ */}
                  {/* SCENE 4: MULCH & EDGING */}
                  {/* ============================================================ */}
                  {scene.id === "mulch" && (
                    <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                      
                      {/* LAYER 1: AFTERNOON WARM LIGHT */}
                      <g 
                        filter="url(#dof-far)"
                        style={{ transform: `translate(${autoDriftX * -2}px, ${autoDriftY * -2}px)` }}
                      >
                        <circle cx="620" cy="130" r="75" fill={ladder.layer1} opacity={lampOn ? 0.9 : 0.25} />
                        <circle cx="620" cy="130" r="105" fill={ladder.layer1} opacity={lampOn ? 0.25 : 0.05} />
                      </g>

                      {/* LAYER 2: DISTANT HILLS */}
                      <g style={{ transform: `translate(${autoDriftX * -4}px, ${autoDriftY * -3}px)` }}>
                        <path 
                          d="M0,218 Q300,168 560,218 T800,198 L800,500 L0,500 Z" 
                          fill={ladder.layer2} 
                          opacity="0.86" 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 3: COTTAGE & FLOWER TRELLIS */}
                      <g style={{ transform: `translate(${autoDriftX * -7}px, ${autoDriftY * -5}px)` }}>
                        <path d="M140,240 L190,190 L240,240 L240,285 L140,285 Z" fill={ladder.layer3} />
                        {lampOn && (
                          <rect 
                            x="175" 
                            y="245" 
                            width="16" 
                            height="20" 
                            rx="2" 
                            fill={ladder.windowGlow} 
                            filter="url(#window-bloom)"
                            style={{ opacity: 0.9 + 0.1 * Math.sin(clock * 4.2) }}
                          />
                        )}
                        <path 
                          d="M0,268 Q400,238 800,268 L800,500 L0,500 Z" 
                          fill={ladder.layer3} 
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.35"
                        />
                      </g>

                      {/* LAYER 4: SCULPTED FLOWER BED PROFILE */}
                      <g style={{ transform: `translate(${autoDriftX * -11}px, ${autoDriftY * -8}px)` }}>
                        <path 
                          d="M0,318 Q280,298 540,323 T800,308 L800,500 L0,500 Z" 
                          fill={ladder.layer4} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.1"
                          strokeOpacity="0.45"
                        />
                      </g>

                      {/* LAYER 5: SERVICE ACTION - CLEAN EDGED TRENCH & DARK MULCH BED */}
                      <g style={{ transform: `translate(${autoDriftX * -15}px, ${autoDriftY * -11}px)` }}>
                        {/* Deep Hand-Spaded Trench Boundary */}
                        <path 
                          d="M0,368 C200,338 380,408 520,358 C660,308 750,378 800,368 L800,500 L0,500 Z" 
                          fill={ladder.layer5} 
                          filter="url(#layer-shadow-soft)" 
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.5"
                        />
                        {/* Fresh Bark Texture Band */}
                        <path 
                          d="M0,378 C200,348 380,418 520,368 C660,318 750,388 800,378 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                        />

                        {/* Silhouette Wheelbarrow with Rich Mulch Mound */}
                        <g transform="translate(360, 290)" fill={ladder.layer6}>
                          {/* Wheelbarrow tub */}
                          <path d="M30,55 L85,55 L75,78 L25,78 Z" />
                          <circle cx="85" cy="85" r="12" fill={ladder.layer7} /> {/* Wheel */}
                          <line x1="30" y1="65" x2="5" y2="70" stroke={ladder.layer6} strokeWidth="5" /> {/* Handles */}
                          <line x1="35" y1="78" x2="30" y2="92" stroke={ladder.layer6} strokeWidth="4" /> {/* Leg support */}
                          {/* Mound of Mulch inside tub */}
                          <path d="M28,55 C40,40 75,40 85,55 Z" fill={ladder.layer7} />
                          {/* Steel Spade with Periodic Sunlight Glint */}
                          <line x1="60" y1="45" x2="72" y2="20" stroke={ladder.layer5} strokeWidth="4" />
                          <polygon points="68,15 76,15 74,22 66,22" fill={ladder.accent} />
                          {/* Blade reflection glint */}
                          <circle 
                            cx="71" 
                            cy="17" 
                            r="4" 
                            fill="#ffffff" 
                            style={{ animation: "spadeShimmer 2.5s infinite ease-in-out" }}
                          />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND ORNAMENTAL GRASSES & CRUST BORDER */}
                      <g style={{ transform: `translate(${autoDriftX * -20}px, ${autoDriftY * -15}px)` }}>
                        <path 
                          d="M0,423 Q380,398 800,423 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                          filter="url(#layer-shadow-deep)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.3"
                          strokeOpacity="0.4"
                        />
                        
                        {/* Botanical paper cuts along bed edge */}
                        <path d="M120,430 C110,380 140,360 150,430 Z" fill={ladder.layer7} stroke={ladder.rimLight} strokeWidth="0.8" strokeOpacity="0.3" />
                        <path d="M145,430 C140,370 175,355 180,430 Z" fill={ladder.layer7} stroke={ladder.rimLight} strokeWidth="0.8" strokeOpacity="0.3" />
                        <path d="M620,430 C610,375 645,360 655,430 Z" fill={ladder.layer7} stroke={ladder.rimLight} strokeWidth="0.8" strokeOpacity="0.3" />
                      </g>

                      {/* LAYER 7: FRAME OVERHANG */}
                      <g style={{ transform: `translate(${autoDriftX * -26}px, ${autoDriftY * -19}px)` }}>
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
                      <g 
                        filter="url(#dof-far)"
                        style={{ transform: `translate(${autoDriftX * -2}px, ${autoDriftY * -2}px)` }}
                      >
                        <circle cx="300" cy="140" r="70" fill={ladder.layer1} opacity={lampOn ? 0.92 : 0.25} />
                        <circle cx="300" cy="140" r="100" fill={ladder.layer1} opacity={lampOn ? 0.25 : 0.05} />
                      </g>

                      {/* LAYER 2: DISTANT SNOW-COVERED RIDGES */}
                      <g style={{ transform: `translate(${autoDriftX * -4}px, ${autoDriftY * -3}px)` }}>
                        <path 
                          d="M0,228 Q250,168 500,218 T800,198 L800,500 L0,500 Z" 
                          fill={ladder.layer2} 
                          opacity="0.86" 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="0.9"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 3: SNOWY PINE TREES & WARM HEARTH COTTAGE */}
                      <g style={{ transform: `translate(${autoDriftX * -7}px, ${autoDriftY * -5}px)` }}>
                        {/* Snow pines with white snowy caps */}
                        <path d="M80,260 L105,200 L130,260 Z" fill={ladder.layer3} />
                        <path d="M95,215 L105,200 L115,215 Z" fill="#ffffff" opacity="0.8" />
                        <path d="M125,270 L150,190 L175,270 Z" fill={ladder.layer3} />
                        <path d="M140,210 L150,190 L160,210 Z" fill="#ffffff" opacity="0.8" />
                        
                        {/* Cozy Cottage */}
                        <path d="M480,240 L540,180 L600,240 L600,285 L480,285 Z M525,170 L540,170 L540,190 L525,190 Z" fill={ladder.layer3} />
                        {/* Warm Golden Glowing Hearth Windows */}
                        {lampOn && (
                          <g fill={ladder.windowGlow} filter="url(#window-bloom)">
                            <rect x="505" y="248" width="16" height="22" rx="2" style={{ opacity: 0.9 + 0.1 * Math.sin(clock * 6) }} />
                            <rect x="560" y="248" width="16" height="22" rx="2" style={{ opacity: 0.88 + 0.12 * Math.cos(clock * 5.2) }} />
                            <circle cx="540" cy="210" r="8" style={{ opacity: 0.95 }} />
                          </g>
                        )}
                        <path 
                          d="M0,278 Q400,243 800,273 L800,500 L0,500 Z" 
                          fill={ladder.layer3} 
                          stroke={ladder.rimLight}
                          strokeWidth="0.8"
                          strokeOpacity="0.4"
                        />
                      </g>

                      {/* LAYER 4: SNOW BLANKET LAWN WITH CLEARED PATH */}
                      <g style={{ transform: `translate(${autoDriftX * -11}px, ${autoDriftY * -8}px)` }}>
                        <path 
                          d="M0,323 Q380,298 800,323 L800,500 L0,500 Z" 
                          fill={ladder.layer4} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.5"
                        />
                      </g>

                      {/* LAYER 5: SERVICE ACTION - COMMERCIAL SNOW PLOW WITH PULSING ROOF BEACON */}
                      <g style={{ transform: `translate(${autoDriftX * -15}px, ${autoDriftY * -11}px)` }}>
                        <path 
                          d="M0,368 Q400,343 800,368 L800,500 L0,500 Z" 
                          fill={ladder.layer5} 
                          filter="url(#layer-shadow-soft)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.2"
                          strokeOpacity="0.45"
                        />

                        {/* SNOW PLOW TRUCK SILHOUETTE */}
                        <g transform="translate(330, 275) scale(1.05)" fill={ladder.layer6}>
                          {/* Truck Cab & Bed */}
                          <path d="M20,55 L65,55 L90,68 L115,68 L115,86 L10,86 L10,55 Z" />
                          <rect x="35" y="58" width="22" height="18" rx="2" fill={ladder.windowGlow} opacity="0.85" filter="url(#window-bloom)" />
                          {/* Heavy Duty Wheels */}
                          <circle cx="32" cy="88" r="16" fill={ladder.layer7} />
                          <circle cx="32" cy="88" r="7" fill={ladder.layer4} />
                          <circle cx="98" cy="88" r="16" fill={ladder.layer7} />
                          <circle cx="98" cy="88" r="7" fill={ladder.layer4} />
                          {/* Front Commercial Angled V-Plow Blade */}
                          <path d="M115,74 L142,65 L145,95 L115,92 Z" fill={ladder.accent} />
                          {/* Roof Amber Warning Strobe Beacon (Authentic Safety Flashing) */}
                          {lampOn && (
                            <polygon 
                              points="46,55 54,55 52,49 48,49" 
                              fill="#f59e0b" 
                              style={{ animation: "amberBeaconPulse 0.9s infinite ease-in-out" }}
                            />
                          )}
                        </g>

                        {/* REALISTIC ROARING SNOW PLOW DISCHARGE WAVE (Billowing Snow Arc) */}
                        <g fill="#ffffff">
                          <path 
                            d="M480,368 C515,340 555,335 585,370 Z" 
                            opacity="0.85" 
                            stroke={ladder.rimLight}
                            strokeWidth="1.2"
                          />
                          {/* Discharging Snow Mist Spray */}
                          <circle cx="490" cy="355" r="4" style={{ animation: "snowSprayArc 1.2s infinite ease-out" }} />
                          <circle cx="515" cy="342" r="5" style={{ animation: "snowSprayArc 1.1s infinite ease-out 0.2s" }} />
                          <circle cx="545" cy="338" r="6" style={{ animation: "snowSprayArc 1.3s infinite ease-out 0.4s" }} />
                        </g>
                      </g>

                      {/* LAYER 6: FOREGROUND SNOWDRIFT ACCENTS & CLEARED WALKWAY */}
                      <g style={{ transform: `translate(${autoDriftX * -20}px, ${autoDriftY * -15}px)` }}>
                        <path 
                          d="M0,418 Q320,393 800,413 L800,500 L0,500 Z" 
                          fill={ladder.layer6} 
                          filter="url(#layer-shadow-deep)"
                          stroke={ladder.rimLight}
                          strokeWidth="1.3"
                          strokeOpacity="0.4"
                        />
                        
                        {/* Shoveled Clean Walkway Edge */}
                        <path d="M220,440 L340,415 L360,425 L240,455 Z" fill={ladder.layer7} />
                      </g>

                      {/* LAYER 7: FROSTED FRONT BRANCHES */}
                      <g style={{ transform: `translate(${autoDriftX * -26}px, ${autoDriftY * -19}px)` }}>
                        <path d="M-10,-10 C70,50 140,60 210,30 L200,45 C140,70 70,60 -10,10 Z" fill={ladder.layer7} filter="url(#layer-shadow-deep)" />
                        <rect x="0" y="475" width="800" height="25" fill={ladder.layer7} />
                      </g>

                      {/* MULTI-DEPTH PAPER SNOWFLAKES DRIFTING DOWN */}
                      <g fill="#ffffff">
                        <circle cx="120" cy="50" r="2.5" style={{ animation: "snowDrift1 4.5s infinite linear" }} />
                        <circle cx="280" cy="80" r="3.2" style={{ animation: "snowDrift2 5.2s infinite linear 0.7s" }} />
                        <circle cx="440" cy="30" r="2.2" style={{ animation: "snowDrift1 4.8s infinite linear 1.2s" }} />
                        <circle cx="620" cy="60" r="3.5" style={{ animation: "snowDrift2 4.2s infinite linear 0.4s" }} />
                        <circle cx="710" cy="20" r="2.0" style={{ animation: "snowDrift1 5.5s infinite linear 2.0s" }} />
                        <circle cx="360" cy="40" r="2.8" style={{ animation: "snowDrift2 4.9s infinite linear 1.6s" }} />
                      </g>

                    </svg>
                  )}
                </div>

                {/* PHYSICAL GLASS REFLECTION GLARE (Sells the tactile physical shadowbox lamp front) */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 25%, transparent 55%, rgba(255,255,255,0.01) 100%)",
                  }}
                />

                {/* BOTTOM STORY SUBTITLE BAR (BURNED-IN PAPER CUT CAPTION) */}
                <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
                  <div className="backdrop-blur-md bg-slate-950/85 border border-white/10 rounded-2xl px-5 py-3.5 shadow-2xl flex items-center justify-between gap-4">
                    <p className="text-xs md:text-sm font-medium text-slate-200 leading-snug">
                      <span className="font-black text-amber-300 uppercase tracking-wider mr-2 text-[11px] md:text-xs px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
                        Scene {activeIdx + 1} of {SCENES.length}
                      </span>
                      {scene.storyStep}
                    </p>
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      {SCENES.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'w-2 bg-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* SLIDE PROGRESS TIMELINE BAR */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80 z-20">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* MANUAL NAVIGATION CHEVRONS */}
                <button
                  onClick={prevScene}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 transition-all backdrop-blur-md hover:scale-110 active:scale-95 shadow-xl"
                  aria-label="Previous service scene"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-amber-300" />
                </button>
                <button
                  onClick={nextScene}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 transition-all backdrop-blur-md hover:scale-110 active:scale-95 shadow-xl"
                  aria-label="Next service scene"
                >
                  <ChevronRightIcon className="w-5 h-5 text-amber-300" />
                </button>

              </div>

              {/* LAMP BASE EMBOSSED BRASS PLAQUE */}
              <div className="mt-3.5 flex items-center justify-between px-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-[#b38f65]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  Flora Lawn Shadow Box
                </span>
                <span className="hidden sm:inline-block opacity-75">
                  Multi-Layer 3D Paper Cut Lightbox (纸雕灯)
                </span>
                <span>Rhode Island &amp; MA</span>
              </div>
            </div>
          </div>

          {/* SERVICE DETAIL & ESTIMATE CARD */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
            <div className="bg-slate-900/85 border border-slate-800/90 rounded-[2.2rem] p-7 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                  Program #{activeIdx + 1}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {scene.seasonBadge}
                </span>
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
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                      ✓
                    </div>
                    <span className="text-sm font-semibold text-slate-300 leading-snug">
                      {pt}
                    </span>
                  </div>
                ))}
              </div>

              {/* DIRECT ACTION BUTTONS */}
              <div className="space-y-3">
                <Link
                  href={`/contact?service=${encodeURIComponent(scene.serviceParam)}`}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
            <div className="bg-slate-900/50 border border-slate-800/70 rounded-2xl p-4 flex items-center justify-between text-xs backdrop-blur-md">
              <span className="text-slate-400 font-semibold">Need custom scheduling?</span>
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
