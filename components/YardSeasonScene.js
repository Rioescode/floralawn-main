"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ColonialHouse, CottageHouse, EstateHouse, Leaf } from "./YardArt";

const SEASONS = ["spring", "summer", "fall", "winter"];

const LOOK = {
  spring: {
    sky: ["#93c5fd", "#e0f2fe"],
    hill: "#86efac",
    lawn: ["#4ade80", "#22c55e"],
    left: ["#f472b6", "#f9a8d4", "#fbcfe8"],
    right: ["#f9a8d4", "#fbcfe8", "#fdf2f8"],
    blade: ["#16a34a", "#22c55e", "#15803d"],
  },
  summer: {
    sky: ["#38bdf8", "#bae6fd"],
    hill: "#4ade80",
    lawn: ["#22c55e", "#16a34a"],
    left: ["#14532d", "#15803d", "#16a34a"],
    right: ["#166534", "#16a34a", "#22c55e"],
    blade: ["#15803d", "#16a34a", "#14532d"],
  },
  fall: {
    sky: ["#7dd3fc", "#e0f2fe"],
    hill: "#a3c48a",
    lawn: ["#65a30d", "#4d7c0f"],
    left: ["#991b1b", "#b91c1c", "#dc2626"],
    right: ["#ca8a04", "#eab308", "#facc15"],
    blade: ["#4d7c0f", "#65a30d", "#3f6212"],
  },
  winter: {
    sky: ["#94a3b8", "#e2e8f0"],
    hill: "#e2e8f0",
    lawn: ["#f8fafc", "#f1f5f9"],
    left: null,
    right: null,
    blade: [],
  },
};

const LEAF_COLORS = [
  ["#ef4444", "#7f1d1d"],
  ["#facc15", "#a16207"],
  ["#b91c1c", "#450a0a"],
  ["#eab308", "#713f12"],
];

const INTERVAL_DAYS = { weekly: 7, bi_weekly: 14, monthly: 30 };

export const YARD_SIZES = [
  { id: "small", label: "Small", bounds: [180, 460] },
  { id: "medium", label: "Medium", bounds: [70, 570] },
  { id: "large", label: "Large", bounds: null },
];

function insideYard(x, y, bounds) {
  if (!bounds) return true;
  const t = (y - 184) / 76;
  return x > bounds[0] - t * 30 + 4 && x < bounds[1] + t * 30 - 4;
}

function Fence({ bounds }) {
  const [left, right] = bounds;
  const back = [];
  for (let x = left; x <= right; x += 10) back.push(x);
  const side = Array.from({ length: 9 }, (_, i) => i / 8);
  return (
    <g fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8">
      <rect x={left} y="174" width={right - left} height="3" />
      {back.map((x) => (
        <path key={x} d={`M${x} 186 V172 L${x + 2.5} 169 L${x + 5} 172 V186 Z`} />
      ))}
      {[left, right].map((edge) =>
        side.map((t) => {
          const x = edge === left ? left - t * 30 : right + t * 30;
          const y = 186 + t * 74;
          const h = 16 + t * 8;
          return <path key={`${edge}-${t}`} d={`M${x - 2.5} ${y} V${y - h} L${x} ${y - h - 3} L${x + 2.5} ${y - h} V${y} Z`} />;
        })
      )}
    </g>
  );
}

const BLADES = Array.from({ length: 240 }, (_, i) => {
  const x = (i * 37 + (i % 7) * 11 + Math.floor(i / 120) * 9) % 640;
  const y = 198 + ((i * 17) % 60);
  return {
    id: i,
    x,
    y,
    lean: ((i % 5) - 2) * 1.4,
    tall: 0.75 + (i % 4) * 0.12,
    shade: i % 3,
    sway: ((i * 0.23) % 2.4).toFixed(2),
    grow: ((i % 10) * 0.06).toFixed(2),
  };
}).filter((b) => {
  const t = (b.y - 195) / 65;
  return b.x < 306 - t * 14 || b.x > 334 + t * 14;
}).sort((a, b) => a.y - b.y);

const DROPS = Array.from({ length: 16 }, (_, i) => {
  const fromLeft = i % 2 === 0;
  return {
    id: i,
    x: fromLeft ? 70 + ((i * 23) % 90) : 470 + ((i * 29) % 110),
    y: fromLeft ? 70 + (i % 4) * 12 : 64 + (i % 4) * 12,
    drop: 140 + (i % 5) * 16,
    sway: (fromLeft ? 1 : -1) * (24 + (i % 4) * 12),
    color: LEAF_COLORS[i % LEAF_COLORS.length],
    delay: ((i * 0.55) % 6).toFixed(2),
    dur: (4.5 + (i % 5) * 0.8).toFixed(2),
  };
});

const FLAKES = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  x: (i * 53) % 640,
  r: 1.6 + (i % 3) * 0.9,
  delay: ((i * 0.37) % 7).toFixed(2),
  dur: (5 + (i % 5) * 1.1).toFixed(2),
  sway: ((i % 2 ? 1 : -1) * (10 + (i % 4) * 6)),
}));

export function seasonFor(date) {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

function atNoon(day) {
  return new Date(`${day}T12:00:00`);
}

function grassGrowth({ lastService, nextService, frequency }, today) {
  const days = INTERVAL_DAYS[frequency];
  if (!days) return null;
  const dayMs = 86400000;
  let value = null;
  if (lastService) value = (today - atNoon(lastService)) / dayMs / days;
  else if (nextService) value = 1 - (atNoon(nextService) - today) / dayMs / days;
  if (value === null || Number.isNaN(value)) return null;
  return Math.min(1.8, Math.max(0, value));
}

function statusFor(season, growth, nextService) {
  const nextLine = nextService ? `Next mow ${format(atNoon(nextService), "EEEE, MMMM d")}.` : "";
  if (season === "winter") {
    return {
      title: "Your lawn is resting",
      body: "The grass sleeps under the snow until spring. Call us when the driveway needs clearing.",
    };
  }
  if (growth === null) {
    return {
      title: "The grass keeps growing",
      body: "Add weekly mowing and we keep it this short all season.",
    };
  }
  if (growth < 0.35) return { title: "Fresh cut", body: `Looking sharp. ${nextLine}`.trim() };
  if (growth < 0.75) return { title: "Growing in", body: `Coming back nicely. ${nextLine}`.trim() };
  if (growth > 1.25) return { title: "Overgrown", body: "It needs a cut now. The first visit may take a little longer." };
  return { title: "Almost time to cut", body: `The grass is getting tall. ${nextLine}`.trim() };
}

function Tree({ cx, cy, colors, delay, winter }) {
  return (
    <g className="scene-tree" style={{ transformOrigin: `${cx}px ${cy + 70}px`, animationDelay: `${delay}s` }}>
      <rect x={cx - 6} y={cy + 10} width="12" height="80" rx="4" fill="#5b2c0f" />
      <path d={`M${cx} ${cy + 40} L${cx - 30} ${cy + 2}`} stroke="#5b2c0f" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${cx} ${cy + 34} L${cx + 28} ${cy - 2}`} stroke="#5b2c0f" strokeWidth="5" strokeLinecap="round" />
      {winter ? (
        <g stroke="#5b2c0f" strokeLinecap="round" fill="none">
          <path d={`M${cx} ${cy + 14} L${cx} ${cy - 34}`} strokeWidth="4" />
          <path d={`M${cx - 18} ${cy + 14} L${cx - 34} ${cy - 10}`} strokeWidth="3" />
          <path d={`M${cx + 16} ${cy + 12} L${cx + 36} ${cy - 12}`} strokeWidth="3" />
          <path d={`M${cx} ${cy - 10} L${cx - 14} ${cy - 26}`} strokeWidth="2.5" />
          <path d={`M${cx} ${cy - 16} L${cx + 14} ${cy - 30}`} strokeWidth="2.5" />
          <path d={`M${cx - 33} ${cy - 11} l6 -1 M${cx + 35} ${cy - 13} l-6 -1 M${cx - 2} ${cy - 35} l4 0`} stroke="white" strokeWidth="3" />
        </g>
      ) : (
        <>
          <circle cx={cx - 30} cy={cy + 6} r="32" fill={colors[0]} />
          <circle cx={cx + 28} cy={cy + 2} r="34" fill={colors[1]} />
          <circle cx={cx} cy={cy - 22} r="38" fill={colors[2]} />
          <circle cx={cx - 8} cy={cy + 14} r="26" fill={colors[1]} opacity="0.9" />
        </>
      )}
    </g>
  );
}

function Mower({ x }) {
  return (
    <g transform={`translate(${x} 222)`}>
      <path d="M30 6 L48 -22" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 -24 H54" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
      <rect x="0" y="2" width="38" height="16" rx="5" fill="#991b1b" />
      <rect x="6" y="-4" width="20" height="8" rx="3" fill="#1f2937" />
      <circle cx="7" cy="20" r="6" fill="#111827" />
      <circle cx="32" cy="20" r="6" fill="#111827" />
      <circle cx="7" cy="20" r="2" fill="#9ca3af" />
      <circle cx="32" cy="20" r="2" fill="#9ca3af" />
    </g>
  );
}

export default function YardSeasonScene({ lastService, nextService, frequency, size = "medium", onSizeChange }) {
  const today = useMemo(() => new Date(), []);
  const current = seasonFor(today);
  const [season, setSeason] = useState(current);
  const look = LOOK[season];
  const winter = season === "winter";
  const yard = YARD_SIZES.find((row) => row.id === size) || YARD_SIZES[1];
  const blades = BLADES.filter(
    (b) => insideYard(b.x, b.y, yard.bounds) && !(yard.id === "large" && b.x > 428 && b.x < 524)
  );
  const mowerX = yard.bounds ? Math.min(470, yard.bounds[1] - 70) : 120;

  const growth = grassGrowth({ lastService, nextService, frequency }, today);
  const shownGrowth = season === current ? growth : 0.85;
  const height = 0.25 + (shownGrowth ?? 0.8) * 0.85;
  const status = statusFor(season, season === current ? growth : null, season === current ? nextService : null);
  const percent = season !== current || growth === null ? null : Math.min(100, Math.round(growth * 100));

  return (
    <div className="w-full">
      <div className="relative overflow-hidden" aria-hidden>
        <style>{`
          .scene-tree { animation: scene-sway 5s ease-in-out infinite; transform-box: view-box; }
          @keyframes scene-sway { 0%, 100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.6deg); } }
          .scene-grow { transform-box: fill-box; transform-origin: 50% 100%; animation: scene-grow 2.6s cubic-bezier(.2,.7,.3,1) var(--gdelay) both; }
          @keyframes scene-grow { from { transform: scaleY(0.08); } to { transform: scaleY(var(--grow)); } }
          .scene-blade { transform-box: fill-box; transform-origin: 50% 100%; animation: scene-blade 3.2s ease-in-out var(--sdelay) infinite; }
          @keyframes scene-blade { 0%, 100% { transform: skewX(-7deg); } 50% { transform: skewX(7deg); } }
          .scene-drop { animation: scene-drop var(--dur) ease-in var(--delay) infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes scene-drop {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            35% { transform: translate(var(--sway), calc(var(--drop) * 0.35)) rotate(140deg); }
            65% { transform: translate(calc(var(--sway) * -0.6), calc(var(--drop) * 0.7)) rotate(260deg); }
            92% { opacity: 1; }
            100% { transform: translate(calc(var(--sway) * 0.4), var(--drop)) rotate(380deg); opacity: 0; }
          }
          .scene-flake { animation: scene-flake var(--dur) linear var(--delay) infinite; }
          @keyframes scene-flake {
            0% { transform: translate(0, -10px); opacity: 0; }
            10% { opacity: 1; }
            50% { transform: translate(var(--sway), 130px); }
            100% { transform: translate(0, 270px); opacity: 0.9; }
          }
          .scene-rays { animation: scene-spin 24s linear infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes scene-spin { to { transform: rotate(360deg); } }
          .yard-smoke { animation: scene-smoke 3s ease-out infinite; }
          @keyframes scene-smoke { 0% { transform: translateY(0); opacity: 0.55; } 100% { transform: translateY(-18px); opacity: 0; } }
        `}</style>

        <svg className="block h-auto w-full" viewBox="0 0 640 260" role="presentation">
          <defs>
            <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={look.sky[0]} />
              <stop offset="100%" stopColor={look.sky[1]} />
            </linearGradient>
            <radialGradient id="scene-sun-glow">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="640" height="260" fill="url(#scene-sky)" />

          {season === "summer" && (
            <g>
              <circle cx="560" cy="40" r="60" fill="url(#scene-sun-glow)" />
              <g className="scene-rays" stroke="#facc15" strokeWidth="3" strokeLinecap="round">
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i * Math.PI) / 6;
                  return (
                    <path
                      key={i}
                      d={`M${560 + Math.cos(a) * 26} ${40 + Math.sin(a) * 26} L${560 + Math.cos(a) * 36} ${40 + Math.sin(a) * 36}`}
                    />
                  );
                })}
              </g>
              <circle cx="560" cy="40" r="20" fill="#fde047" />
            </g>
          )}
          {(season === "spring" || season === "fall") && <circle cx="560" cy="38" r="16" fill="#fde68a" />}
          <g opacity={winter ? 0.95 : 0.85}>
            <ellipse cx="210" cy="36" rx="26" ry="9" fill="white" />
            <ellipse cx="234" cy="32" rx="18" ry="8" fill="white" />
            {winter && <ellipse cx="460" cy="30" rx="34" ry="10" fill="white" />}
          </g>

          <path d="M0 150 C120 132 220 146 320 138 C430 130 520 144 640 134 V180 H0 Z" fill={look.hill} opacity="0.8" />
          <rect x="0" y="176" width="640" height="84" fill={look.lawn[0]} />
          {!winter &&
            Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={i * 72} y="190" width="36" height="70" fill={look.lawn[1]} opacity="0.35" />
            ))}

          <Tree cx={110} cy={86} colors={look.left} delay={0} winter={winter} />
          <Tree cx={530} cy={80} colors={look.right} delay={1.3} winter={winter} />

          {yard.bounds && <Fence bounds={yard.bounds} />}
          {yard.id === "small" && <CottageHouse snow={winter} lit={winter} />}
          {yard.id === "medium" && <ColonialHouse snow={winter} lit={winter} />}
          {yard.id === "large" && <EstateHouse snow={winter} lit={winter} />}

          {!winter && (
            <g key={`${season}-${size}-${height.toFixed(2)}`}>
              {blades.map((b) => (
                <g key={b.id} transform={`translate(${b.x} ${b.y})`}>
                  <g className="scene-grow" style={{ "--grow": (height * b.tall).toFixed(3), "--gdelay": `${b.grow}s` }}>
                    <path
                      className="scene-blade"
                      d={`M-2.4 0 Q-1.2 -14 ${b.lean} -28 Q1.2 -13 2.4 0 Z`}
                      fill={look.blade[b.shade]}
                      style={{ "--sdelay": `${b.sway}s` }}
                    />
                  </g>
                </g>
              ))}
            </g>
          )}

          {!winter && shownGrowth !== null && shownGrowth >= 0.75 && <Mower x={mowerX} />}

          {season === "spring" &&
            DROPS.map((p) => (
              <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
                <ellipse
                  className="scene-drop"
                  rx="4"
                  ry="2.4"
                  fill={p.id % 2 ? "#fbcfe8" : "#f9a8d4"}
                  style={{ "--drop": `${p.drop}px`, "--sway": `${p.sway}px`, "--dur": `${p.dur}s`, "--delay": `${p.delay}s` }}
                />
              </g>
            ))}

          {season === "fall" &&
            DROPS.map((p) => (
              <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
                <g
                  className="scene-drop"
                  style={{ "--drop": `${p.drop}px`, "--sway": `${p.sway}px`, "--dur": `${p.dur}s`, "--delay": `${p.delay}s` }}
                >
                  <Leaf color={p.color} size={24} />
                </g>
              </g>
            ))}

          {winter && (
            <g>
              <path d="M0 200 C80 192 160 204 240 198 C300 194 360 204 440 198 C520 192 580 202 640 196 V260 H0 Z" fill="white" />
              <path d="M180 214 C200 208 230 210 250 216 L246 222 C228 218 200 218 184 222 Z" fill="#cbd5e1" opacity="0.6" />
              <path d="M420 230 C444 222 476 224 496 232 L490 238 C470 234 444 234 424 238 Z" fill="#cbd5e1" opacity="0.6" />
              {FLAKES.map((f) => (
                <circle
                  key={f.id}
                  className="scene-flake"
                  cx={f.x}
                  cy="0"
                  r={f.r}
                  fill="white"
                  style={{ "--dur": `${f.dur}s`, "--delay": `${f.delay}s`, "--sway": `${f.sway}px` }}
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-sm">
          <p className="text-xl font-semibold tracking-tight">{status.title}</p>
          <p className="mt-1 text-sm text-[#5C6B62]">{status.body}</p>
          {!winter && percent !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[#5C6B62]">
                <span>Grass height</span>
                <span>{percent >= 100 ? "Ready to cut" : `${percent}% to next cut`}</span>
              </div>
              <div className="mt-1 h-2 w-56 bg-[#DDE5DF]">
                <div className="h-2 bg-[#2F6B4F] transition-[width] duration-1000" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
        {onSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#5C6B62]">Yard size</span>
            <div className="flex gap-1" role="group" aria-label="Yard size">
              {YARD_SIZES.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSizeChange(row.id)}
                  aria-pressed={size === row.id}
                  className={`min-h-9 px-3 text-sm font-semibold border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6B4F] ${
                    size === row.id ? "border-[#2F6B4F] bg-[#2F6B4F] text-white" : "border-[#C9D4CC] bg-white text-[#1B2838]"
                  }`}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-1" role="group" aria-label="Preview your yard by season">
          {SEASONS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSeason(id)}
              aria-pressed={season === id}
              className={`min-h-9 px-3 text-sm font-semibold capitalize border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6B4F] ${
                season === id ? "border-[#1B2838] bg-[#1B2838] text-white" : "border-[#C9D4CC] bg-white text-[#1B2838]"
              }`}
            >
              {id}
              {id === current && <span className="sr-only"> (now)</span>}
            </button>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
