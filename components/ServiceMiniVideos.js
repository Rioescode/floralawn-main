"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { lawnServices } from "@/data/lawn-services";
import {
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

// Visual themes & category tags for all 18 services
const SERVICE_META = {
  "bed-edging": {
    category: "Gardens",
    sky: "#fed7aa",
    glow: "#f97316",
    back: "#9a3412",
    mid: "#572108",
    front: "#1c0a03",
    accent: "#fbbf24",
  },
  "custom-service": {
    category: "Gardens",
    sky: "#e9d5ff",
    glow: "#a855f7",
    back: "#4c1d95",
    mid: "#2e1065",
    front: "#120629",
    accent: "#fde047",
  },
  "fall-cleanup": {
    category: "Seasonal",
    sky: "#fde68a",
    glow: "#f59e0b",
    back: "#b45309",
    mid: "#78350f",
    front: "#260e04",
    accent: "#ef4444",
  },
  "garden-maintenance": {
    category: "Gardens",
    sky: "#fbcfe8",
    glow: "#ec4899",
    back: "#831843",
    mid: "#4a1230",
    front: "#1b0613",
    accent: "#34d399",
  },
  "hedge-trimming": {
    category: "Turf",
    sky: "#bbf7d0",
    glow: "#22c55e",
    back: "#15803d",
    mid: "#14532d",
    front: "#052212",
    accent: "#fde047",
  },
  landscaping: {
    category: "Gardens",
    sky: "#fde68a",
    glow: "#eab308",
    back: "#3f6212",
    mid: "#1a2e05",
    front: "#0b1403",
    accent: "#fbbf24",
  },
  "lawn-aeration": {
    category: "Soil & Turf",
    sky: "#fed7aa",
    glow: "#ea580c",
    back: "#854d0e",
    mid: "#422006",
    front: "#170b02",
    accent: "#4ade80",
  },
  "lawn-care": {
    category: "Soil & Turf",
    sky: "#bfdbfe",
    glow: "#38bdf8",
    back: "#15803d",
    mid: "#14532d",
    front: "#052012",
    accent: "#fde047",
  },
  dethatching: {
    category: "Soil & Turf",
    sky: "#fef08a",
    glow: "#ca8a04",
    back: "#713f12",
    mid: "#422006",
    front: "#1a0c02",
    accent: "#4ade80",
  },
  fertilization: {
    category: "Soil & Turf",
    sky: "#a7f3d0",
    glow: "#10b981",
    back: "#047857",
    mid: "#064e3b",
    front: "#02241b",
    accent: "#fde047",
  },
  "lawn-mowing": {
    category: "Turf",
    sky: "#dbeafe",
    glow: "#38bdf8",
    back: "#16a34a",
    mid: "#14532d",
    front: "#052112",
    accent: "#facc15",
  },
  "leaf-removal": {
    category: "Seasonal",
    sky: "#fde68a",
    glow: "#ea580c",
    back: "#9a3412",
    mid: "#5c1d0c",
    front: "#210904",
    accent: "#f97316",
  },
  "mulch-installation": {
    category: "Gardens",
    sky: "#fecdd3",
    glow: "#f43f5e",
    back: "#78350f",
    mid: "#451a03",
    front: "#180802",
    accent: "#fbbf24",
  },
  overseeding: {
    category: "Soil & Turf",
    sky: "#fef3c7",
    glow: "#f59e0b",
    back: "#15803d",
    mid: "#14532d",
    front: "#062011",
    accent: "#fde047",
  },
  "tree-trimming": {
    category: "Gardens",
    sky: "#bae6fd",
    glow: "#0ea5e9",
    back: "#166534",
    mid: "#0f3d23",
    front: "#05190e",
    accent: "#fef08a",
  },
  "snow-removal": {
    category: "Seasonal",
    sky: "#e2e8f0",
    glow: "#94a3b8",
    back: "#475569",
    mid: "#1e293b",
    front: "#080d18",
    accent: "#f59e0b",
  },
  "spring-cleanup": {
    category: "Seasonal",
    sky: "#d9f99d",
    glow: "#84cc16",
    back: "#15803d",
    mid: "#14532d",
    front: "#072011",
    accent: "#fde047",
  },
  "weed-control": {
    category: "Soil & Turf",
    sky: "#bbf7d0",
    glow: "#22c55e",
    back: "#166534",
    mid: "#113d24",
    front: "#041a0d",
    accent: "#38bdf8",
  },
};

const CATEGORIES = ["All", "Turf", "Soil & Turf", "Gardens", "Seasonal"];

// Custom Looping Paper-Cut Mini-Video Scene per Service Slug
function MiniPapercutScene({ slug, meta }) {
  const { sky, glow, back, mid, front, accent } = meta;

  return (
    <svg
      viewBox="0 0 320 200"
      className="h-full w-full block"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* LAYER 0: WARM BACKLIGHT GLOW */}
      <defs>
        <radialGradient id={`bg-${slug}`} cx="50%" cy="32%" r="72%">
          <stop offset="0%" stopColor={sky} stopOpacity="0.95" />
          <stop offset="42%" stopColor={glow} stopOpacity="0.65" />
          <stop offset="100%" stopColor="#070c14" stopOpacity="1" />
        </radialGradient>
        <filter id={`sh-${slug}`} x="-15%" y="-15%" width="135%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <rect width="320" height="200" fill={`url(#bg-${slug})`} />

      {/* LAYER 1: LUMINOUS SUN / MOON DISK */}
      <circle cx="242" cy="54" r="24" fill={sky} opacity="0.88" />
      <circle cx="242" cy="54" r="35" fill={sky} opacity="0.22" />

      {/* LAYER 2: DISTANT PAPER HILL */}
      <path
        d="M0,118 Q95,88 185,112 T320,104 L320,200 L0,200 Z"
        fill={back}
        opacity="0.85"
        stroke={sky}
        strokeOpacity="0.35"
        strokeWidth="0.9"
        filter={`url(#sh-${slug})`}
      />

      {/* LAYER 3: MIDGROUND PAPER SLOPE */}
      <path
        d="M0,144 Q120,126 225,142 T320,136 L320,200 L0,200 Z"
        fill={mid}
        stroke={sky}
        strokeOpacity="0.4"
        strokeWidth="1"
        filter={`url(#sh-${slug})`}
      />

      {/* LAYER 4: UNIQUE SERVICE MINI-VIDEO ANIMATION */}
      {slug === "lawn-mowing" && (
        <g>
          {/* Revealed Diamond Stripes */}
          <g opacity="0.28" fill="#ffffff">
            <polygon points="35,140 58,140 80,178 52,178" />
            <polygon points="85,140 108,140 130,178 102,178" />
            <polygon points="135,140 158,140 180,178 152,178" />
          </g>
          {/* Gliding Zero-Turn Mower */}
          <g className="anim-slide-right">
            <rect x="0" y="122" width="38" height="14" rx="3" fill={front} />
            <circle cx="14" cy="112" r="6" fill={front} />
            <rect x="20" y="133" width="26" height="6" rx="2" fill={accent} />
            <circle cx="8" cy="137" r="8" fill="#020617" />
            <circle cx="44" cy="140" r="4.5" fill="#020617" />
          </g>
        </g>
      )}

      {slug === "lawn-care" && (
        <g>
          {/* Glowing Health Wave & Rising Nutrient Sparkles */}
          <path
            d="M0,145 Q160,122 320,145"
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeDasharray="18 14"
            className="anim-dash-flow"
          />
          {[70, 120, 170, 220, 265].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={138 - (i % 2) * 8}
              r="3"
              fill={accent}
              className="anim-rise-sparkle"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </g>
      )}

      {slug === "landscaping" && (
        <g>
          {/* Estate Tree + Stone Patio + Blinking Warm Pathway Lanterns */}
          <path d="M55,142 Q58,108 48,88 Q68,106 66,142 Z" fill={front} />
          <ellipse cx="56" cy="84" rx="28" ry="15" fill={front} stroke={sky} strokeOpacity="0.4" />
          <path d="M125,148 L245,148 L260,162 L110,162 Z" fill={front} opacity="0.7" />
          {[132, 185, 238].map((lx, i) => (
            <g key={i} transform={`translate(${lx}, 130)`}>
              <rect x="-1.5" y="0" width="3" height="16" fill={front} />
              <circle
                cx="0"
                cy="-2"
                r="4.5"
                fill={accent}
                className="anim-lantern-glow"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            </g>
          ))}
        </g>
      )}

      {slug === "mulch-installation" && (
        <g>
          {/* Sculpted Mulch Mound + Cascading Dark Bark Chips */}
          <path
            d="M55,152 Q160,122 265,152 L265,176 L55,176 Z"
            fill={front}
            stroke={sky}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={115 + i * 22}
              y="102"
              width="7"
              height="3.5"
              rx="1"
              fill={accent}
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
          <circle cx="88" cy="126" r="5" fill={accent} className="anim-lantern-glow" />
        </g>
      )}

      {slug === "leaf-removal" && (
        <g>
          {/* Swirling Autumn Leaves Pulled Toward Vacuum Chute */}
          <path d="M235,112 L275,95 L285,115 L240,125 Z" fill={front} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse
              key={i}
              cx={55 + i * 28}
              cy={128 - (i % 3) * 14}
              rx="6"
              ry="3.2"
              fill={i % 2 === 0 ? accent : "#fbbf24"}
              className="anim-leaf-suck"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </g>
      )}

      {slug === "hedge-trimming" && (
        <g>
          {/* Sculpted Boxwood Hedges + Animated Gliding Trimmer Blade */}
          <rect x="65" y="106" width="190" height="44" rx="14" fill={front} stroke={sky} strokeOpacity="0.4" />
          <g className="anim-trimmer-sweep">
            <rect x="70" y="96" width="44" height="5" rx="2" fill={accent} />
            <rect x="64" y="92" width="12" height="12" rx="2" fill={front} />
          </g>
          {[95, 145, 195, 230].map((tx, i) => (
            <circle
              key={i}
              cx={tx}
              cy="104"
              r="2.4"
              fill={accent}
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>
      )}

      {slug === "spring-cleanup" && (
        <g>
          {/* Rising Spring Sunbeams & Fresh Sprouting Green Shoots */}
          {[75, 115, 155, 195, 235].map((x, i) => (
            <path
              key={i}
              d={`M${x},148 Q${x + 4},128 ${x + 8},116`}
              fill="none"
              stroke={accent}
              strokeWidth="2.8"
              strokeLinecap="round"
              className="anim-sway-blade"
              style={{ transformOrigin: `${x}px 148px`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx={70 + i * 40}
              cy={118 + i * 6}
              rx="5"
              ry="2.2"
              fill="#d97706"
              className="anim-leaf-sweep"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </g>
      )}

      {slug === "fall-cleanup" && (
        <g>
          {/* Growing Leaf Mound + Sweeping Autumn Gust Leaves */}
          <path
            d="M210,152 Q255,112 302,152 Z"
            fill={front}
            stroke={sky}
            strokeOpacity="0.45"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d="M0,-5 Q5,-1 0,5 Q-5,-1 0,-5 Z"
              fill={i % 2 === 0 ? accent : "#fbbf24"}
              transform={`translate(${40 + i * 32}, ${112 + (i % 3) * 14})`}
              className="anim-leaf-sweep"
              style={{ animationDelay: `${i * 0.32}s` }}
            />
          ))}
        </g>
      )}

      {slug === "lawn-aeration" && (
        <g>
          {/* Rolling Hollow-Tine Drum + Popping Core Plugs */}
          <g className="anim-slide-right">
            <rect x="6" y="114" width="26" height="16" rx="3" fill={accent} />
            <g transform="translate(19, 136)">
              <g className="anim-spin-slow">
                <circle r="11" fill={front} />
                <line x1="-15" y1="0" x2="15" y2="0" stroke={front} strokeWidth="3" />
                <line x1="0" y1="-15" x2="0" y2="15" stroke={front} strokeWidth="3" />
              </g>
            </g>
          </g>
          {[80, 125, 175, 225].map((px, i) => (
            <rect
              key={i}
              x={px}
              y="142"
              width="4"
              height="9"
              rx="1.5"
              fill={back}
              transform={`rotate(22 ${px} 142)`}
            />
          ))}
        </g>
      )}

      {slug === "overseeding" && (
        <g>
          {/* Golden Seed Rain + Sprouting Emerald Blades */}
          {[75, 105, 135, 165, 195, 225, 255].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy="88"
              r="2.4"
              fill={accent}
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
          {[85, 125, 165, 205, 245].map((x, i) => (
            <path
              key={i}
              d={`M${x},148 L${x - 4},130 M${x},148 L${x + 5},126`}
              stroke="#4ade80"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="anim-sway-blade"
              style={{ transformOrigin: `${x}px 148px` }}
            />
          ))}
        </g>
      )}

      {slug === "garden-maintenance" && (
        <g>
          {/* Blooming Hydrangeas & Shimmering Watering Droplets */}
          {[95, 160, 225].map((fx, i) => (
            <g key={i} transform={`translate(${fx}, 136)`}>
              <line x1="0" y1="14" x2="0" y2="-10" stroke="#4ade80" strokeWidth="2.5" />
              <circle
                cx="0"
                cy="-14"
                r="10"
                fill={accent}
                opacity="0.88"
                className="anim-lantern-glow"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
            </g>
          ))}
          {[100, 145, 180, 220].map((dx, i) => (
            <circle
              key={i}
              cx={dx}
              cy="86"
              r="2.2"
              fill="#bae6fd"
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </g>
      )}

      {slug === "snow-removal" && (
        <g>
          {/* Deep White Road Snowdrift + Plow Truck with Amber Beacon */}
          <path d="M170,148 Q225,126 320,136 L320,162 L170,162 Z" fill="#f1f5f9" opacity="0.92" />
          <g className="anim-slide-right">
            <rect x="0" y="114" width="44" height="22" rx="3" fill={front} />
            <rect x="24" y="118" width="14" height="9" rx="1.5" fill="#fef08a" />
            <polygon points="44,118 58,112 60,138 44,136" fill={accent} />
            <circle cx="10" cy="138" r="8" fill="#020617" />
            <circle cx="38" cy="138" r="8" fill="#020617" />
            <circle cx="24" cy="111" r="3.5" fill="#f59e0b" className="anim-lantern-glow" />
          </g>
          {[55, 110, 165, 220, 275].map((sx, i) => (
            <circle
              key={i}
              cx={sx}
              cy="40"
              r="2.3"
              fill="#ffffff"
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.42}s` }}
            />
          ))}
        </g>
      )}

      {slug === "tree-trimming" && (
        <g>
          {/* Sculpted Ornamental Tree Canopy + Falling Pruned Twigs */}
          <path d="M150,148 Q154,112 146,84 Q166,112 170,148 Z" fill={front} />
          <circle cx="136" cy="84" r="24" fill={front} stroke={sky} strokeOpacity="0.4" />
          <circle cx="176" cy="80" r="26" fill={front} stroke={sky} strokeOpacity="0.4" />
          <circle cx="156" cy="64" r="22" fill={front} stroke={sky} strokeOpacity="0.5" />
          {[120, 168, 200].map((tx, i) => (
            <rect
              key={i}
              x={tx}
              y="96"
              width="7"
              height="2.5"
              rx="1"
              fill={accent}
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.55}s` }}
            />
          ))}
        </g>
      )}

      {slug === "bed-edging" && (
        <g>
          {/* Crisp Curved 3" Trench Line Being Carved Left-to-Right */}
          <path
            d="M20,148 Q160,118 300,148"
            fill="none"
            stroke={accent}
            strokeWidth="3.5"
            strokeDasharray="280"
            className="anim-trench-carve"
          />
          <g className="anim-slide-right">
            <line x1="20" y1="98" x2="26" y2="136" stroke={sky} strokeWidth="3" />
            <path d="M16,134 L36,134 Q26,150 16,134 Z" fill={accent} />
          </g>
        </g>
      )}

      {slug === "custom-service" && (
        <g>
          {/* Illuminated Backyard Sanctuary + Floating Golden Fireflies */}
          <path d="M70,142 L105,112 L140,142 Z" fill={front} />
          <rect x="85" y="128" width="12" height="12" rx="2" fill={accent} className="anim-lantern-glow" />
          {[165, 195, 225, 255].map((fx, i) => (
            <circle
              key={i}
              cx={fx}
              cy={124 - (i % 2) * 18}
              r="3"
              fill={accent}
              className="anim-rise-sparkle"
              style={{ animationDelay: `${i * 0.45}s` }}
            />
          ))}
        </g>
      )}

      {slug === "dethatching" && (
        <g>
          {/* Power-Rake Comb Lifting Dead Thatch Ribbons */}
          <g className="anim-slide-right">
            <rect x="8" y="118" width="28" height="15" rx="3" fill={front} />
            <line x1="12" y1="133" x2="8" y2="146" stroke={accent} strokeWidth="2.5" />
            <line x1="22" y1="133" x2="18" y2="146" stroke={accent} strokeWidth="2.5" />
            <line x1="32" y1="133" x2="28" y2="146" stroke={accent} strokeWidth="2.5" />
          </g>
          {[90, 145, 200].map((tx, i) => (
            <path
              key={i}
              d={`M${tx},142 Q${tx + 8},134 ${tx + 16},140`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              className="anim-rise-sparkle"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>
      )}

      {slug === "fertilization" && (
        <g>
          {/* Broadcast Spreader Fanning Golden Nutrient Granules */}
          <g className="anim-slide-right">
            <polygon points="8,116 32,116 26,134 14,134" fill={front} />
            <circle cx="20" cy="139" r="7" fill="#020617" />
          </g>
          {[80, 115, 150, 185, 220, 255].map((gx, i) => (
            <circle
              key={i}
              cx={gx}
              cy="120"
              r="2.4"
              fill={accent}
              className="anim-fall-drop"
              style={{ animationDelay: `${i * 0.28}s` }}
            />
          ))}
        </g>
      )}

      {slug === "weed-control" && (
        <g>
          {/* Precision Targeted Mist Spray & Clean Uniform Turf */}
          <path
            d="M0,144 Q160,132 320,144"
            fill="none"
            stroke="#4ade80"
            strokeWidth="3"
          />
          <g className="anim-slide-right">
            <line x1="18" y1="106" x2="36" y2="128" stroke={front} strokeWidth="3" />
            <polygon points="36,128 54,144 26,144" fill={accent} opacity="0.55" />
          </g>
        </g>
      )}

      {/* LAYER 5: FOREGROUND DARK SHADOWBOX LIP */}
      <path
        d="M0,174 Q160,162 320,174 L320,200 L0,200 Z"
        fill={front}
      />
    </svg>
  );
}

export default function ServiceMiniVideos() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Sort all 18 services strictly A -> Z
  const sortedServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...lawnServices]
      .sort((a, b) => a.title.localeCompare(b.title))
      .filter((svc) => {
        const meta = SERVICE_META[svc.slug] || { category: "Turf" };
        if (category !== "All" && meta.category !== category) return false;
        if (q && !svc.title.toLowerCase().includes(q) && !svc.description.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      });
  }, [category, search]);

  return (
    <section className="relative bg-gradient-to-b from-[#05080f] via-[#0a101c] to-[#060a12] py-20 text-white border-t border-white/5">
      {/* GPU-ACCELERATED MINI-VIDEO LOOP KEYFRAMES */}
      <style jsx global>{`
        @keyframes miniSlideRight {
          0% { transform: translateX(18px); opacity: 0; }
          12% { opacity: 1; }
          86% { opacity: 1; }
          100% { transform: translateX(235px); opacity: 0; }
        }
        @keyframes miniRiseSparkle {
          0% { transform: translateY(8px) scale(0.6); opacity: 0; }
          45% { opacity: 1; }
          100% { transform: translateY(-28px) scale(1.1); opacity: 0; }
        }
        @keyframes miniFallDrop {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 0.95; }
          85% { opacity: 0.9; }
          100% { transform: translateY(58px); opacity: 0; }
        }
        @keyframes miniLeafSweep {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.95; }
          85% { opacity: 0.9; }
          100% { transform: translate(95px, -16px) rotate(180deg); opacity: 0; }
        }
        @keyframes miniLeafSuck {
          0% { transform: translate(0px, 0px) scale(1); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translate(85px, -22px) scale(0.45); opacity: 0; }
        }
        @keyframes miniTrimmerSweep {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(125px); }
        }
        @keyframes miniSwayBlade {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes miniLanternGlow {
          0%, 100% { opacity: 0.55; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes miniDashFlow {
          from { stroke-dashoffset: 64; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes miniTrenchCarve {
          0% { stroke-dashoffset: 280; }
          75%, 100% { stroke-dashoffset: 0; }
        }
        @keyframes miniSpinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .anim-slide-right { animation: miniSlideRight 4.6s linear infinite; }
        .anim-rise-sparkle { animation: miniRiseSparkle 2.4s ease-out infinite; }
        .anim-fall-drop { animation: miniFallDrop 2.2s linear infinite; }
        .anim-leaf-sweep { animation: miniLeafSweep 2.8s ease-in-out infinite; }
        .anim-leaf-suck { animation: miniLeafSuck 2.4s ease-in infinite; }
        .anim-trimmer-sweep { animation: miniTrimmerSweep 3.4s ease-in-out infinite; }
        .anim-sway-blade { animation: miniSwayBlade 2.6s ease-in-out infinite; }
        .anim-lantern-glow { animation: miniLanternGlow 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .anim-dash-flow { animation: miniDashFlow 2s linear infinite; }
        .anim-trench-carve { animation: miniTrenchCarve 4.6s linear infinite; }
        .anim-spin-slow { animation: miniSpinSlow 2.4s linear infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">
        {/* SECTION HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
              <PlayCircleIcon className="w-4 h-4 text-amber-400" />
              Complete A–Z Animated Service Gallery ({lawnServices.length} Programs)
            </div>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic text-white leading-tight">
              Every Lawn Service{" "}
              <span className="inline-block whitespace-nowrap pr-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                From A to Z
              </span>
            </h3>
            <p className="text-slate-400 font-medium text-sm md:text-base mt-2.5">
              Watch live mini paper-cut animations for every service we offer across Rhode Island &amp; Southern Massachusetts. Tap any card for an instant satellite quote.
            </p>
          </div>

          {/* SEARCH & CATEGORY FILTER */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search A–Z services..."
                className="w-full sm:w-56 rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-3 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-amber-400/60 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  active
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
                    : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* A–Z MINI VIDEO GRID (ALL 18 SERVICES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedServices.map((svc, idx) => {
            const meta = SERVICE_META[svc.slug] || SERVICE_META["lawn-mowing"];
            const letter = svc.title.charAt(0).toUpperCase();

            return (
              <Link
                key={svc.slug}
                href={`/contact?service=${encodeURIComponent(svc.title)}`}
                className="group flex flex-col rounded-[1.8rem] border border-slate-800/90 bg-slate-900/75 p-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
              >
                {/* MINI WALNUT SHADOWBOX VIDEO FRAME */}
                <div className="relative overflow-hidden rounded-[1.25rem] border-2 border-[#3f2416] bg-[#140b06] p-1.5 shadow-inner">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[0.95rem] border border-black/80 bg-slate-950">
                    <MiniPapercutScene slug={svc.slug} meta={meta} />

                    {/* A-Z Letter Badge */}
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/75 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-sm">
                      <span>{letter}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Live Mini-Loop Indicator */}
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-300 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      LOOP
                    </div>
                  </div>
                </div>

                {/* CARD CONTENT */}
                <div className="flex flex-1 flex-col justify-between px-2 pt-4 pb-1">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-black uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors">
                        {svc.title}
                      </h4>
                      <span className="shrink-0 rounded-md border border-slate-800 bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        {meta.category}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <span className="text-[11px] font-bold text-slate-500">
                      {svc.includes?.[0] || "Licensed RI & MA Crew"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-400 group-hover:translate-x-1 transition-transform">
                      Quote
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {sortedServices.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center">
            <p className="text-slate-300 font-semibold">
              No matching service found. Need something custom?
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950"
            >
              Request Custom Quote <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
