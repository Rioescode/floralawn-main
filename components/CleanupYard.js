"use client";

import { ColonialHouse, CottageHouse, EstateHouse, Leaf } from "./YardArt";

const LEAF_COLORS = [
  ["#ef4444", "#7f1d1d"],
  ["#facc15", "#a16207"],
  ["#b91c1c", "#450a0a"],
  ["#eab308", "#713f12"],
  ["#dc2626", "#7f1d1d"],
  ["#ca8a04", "#422006"],
];

const FALLING = Array.from({ length: 16 }, (_, i) => {
  const fromLeft = i % 2 === 0;
  return {
    id: i,
    x: fromLeft ? 70 + ((i * 23) % 90) : 470 + ((i * 29) % 110),
    y: fromLeft ? 70 + (i % 4) * 12 : 64 + (i % 4) * 12,
    drop: 150 + (i % 5) * 14,
    sway: (fromLeft ? 1 : -1) * (24 + (i % 4) * 12),
    color: LEAF_COLORS[i % LEAF_COLORS.length],
    scale: 0.9 + (i % 3) * 0.25,
    delay: (i * 0.55) % 6,
    duration: 4.5 + (i % 5) * 0.8,
  };
});

const GROUND = Array.from({ length: 40 }, (_, i) => {
  const front = i % 3 !== 0;
  return {
    id: i,
    front,
    x: 20 + ((i * 47) % 600),
    y: front ? 214 + ((i * 13) % 38) : 184 + ((i * 7) % 14),
    rot: (i * 53) % 360,
    color: LEAF_COLORS[i % LEAF_COLORS.length],
    scale: 0.8 + (i % 3) * 0.2,
  };
});

const DRIFT = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  x: 120 + i * 58,
  y: 222 + (i % 3) * 12,
  color: LEAF_COLORS[i % LEAF_COLORS.length],
  delay: i * 0.6,
}));

function Maple({ cx, cy, colors, delay }) {
  return (
    <g className="yard-tree" style={{ transformOrigin: `${cx}px ${cy + 70}px`, animationDelay: `${delay}s` }}>
      <rect x={cx - 6} y={cy + 10} width="12" height="78" rx="4" fill="#5b2c0f" />
      <path d={`M${cx} ${cy + 40} L${cx - 26} ${cy + 8}`} stroke="#5b2c0f" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${cx} ${cy + 34} L${cx + 24} ${cy + 4}`} stroke="#5b2c0f" strokeWidth="5" strokeLinecap="round" />
      <circle cx={cx - 30} cy={cy + 6} r="32" fill={colors[0]} />
      <circle cx={cx + 28} cy={cy + 2} r="34" fill={colors[1]} />
      <circle cx={cx} cy={cy - 22} r="38" fill={colors[2]} />
      <circle cx={cx - 8} cy={cy + 14} r="26" fill={colors[1]} opacity="0.9" />
    </g>
  );
}

function Shrub({ cx, cy }) {
  return (
    <g>
      <circle cx={cx - 9} cy={cy} r="10" fill="#166534" />
      <circle cx={cx + 7} cy={cy - 2} r="12" fill="#15803d" />
      <circle cx={cx} cy={cy - 8} r="9" fill="#14532d" />
    </g>
  );
}

export default function CleanupYard({ tasks, scope, cover, size = "medium" }) {
  const showLawn = tasks.includes("lawn");
  const showBeds = tasks.includes("beds");
  const showBranches = tasks.includes("branches");
  const showHaul = tasks.includes("haul");
  const frontOn = scope !== "back";
  const backOn = scope !== "front";

  const groundCount = showLawn || showBeds ? Math.round(6 + cover * 6.8) : 0;
  const ground = GROUND.slice(0, groundCount).filter((leaf) => (leaf.front ? frontOn : backOn));

  return (
    <div className="relative overflow-hidden rounded-2xl" aria-hidden>
      <style>{`
        @keyframes yard-sway {
          0%, 100% { transform: rotate(-1.4deg); }
          50% { transform: rotate(1.6deg); }
        }
        .yard-tree { animation: yard-sway 5s ease-in-out infinite; transform-box: view-box; }
        @keyframes yard-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          35% { transform: translate(var(--sway), calc(var(--drop) * 0.35)) rotate(140deg); }
          65% { transform: translate(calc(var(--sway) * -0.6), calc(var(--drop) * 0.7)) rotate(260deg); }
          92% { opacity: 1; }
          100% { transform: translate(calc(var(--sway) * 0.4), var(--drop)) rotate(380deg); opacity: 0; }
        }
        .yard-falling { animation: yard-fall var(--dur) ease-in var(--delay) infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes yard-drift {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(var(--to), -8px) rotate(540deg); opacity: 0; }
        }
        .yard-drift { animation: yard-drift 3.4s ease-in var(--delay) infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes yard-smoke {
          0% { transform: translateY(0); opacity: 0.55; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
        .yard-smoke { animation: yard-smoke 3s ease-out infinite; }
      `}</style>

      <svg className="block h-auto w-full" viewBox="0 0 640 260" role="presentation">
        <defs>
          <linearGradient id="yard-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
        </defs>

        <rect width="640" height="260" fill="url(#yard-sky)" />
        <circle cx="560" cy="38" r="16" fill="#fde68a" />
        <g opacity="0.85">
          <ellipse cx="210" cy="36" rx="26" ry="9" fill="white" />
          <ellipse cx="234" cy="32" rx="18" ry="8" fill="white" />
        </g>

        <path d="M0 150 C120 132 220 146 320 138 C430 130 520 144 640 134 V180 H0 Z" fill="#a3c48a" opacity="0.7" />

        <rect x="0" y="176" width="640" height="30" fill={backOn ? "#4ade80" : "#86efac"} />
        <rect x="0" y="204" width="640" height="56" fill={frontOn ? "#22c55e" : "#86efac"} />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={i * 72} y="204" width="36" height="56" fill="#16a34a" opacity={frontOn ? 0.22 : 0.08} />
        ))}

        {backOn && scope !== "whole" && (
          <rect x="6" y="178" width="628" height="24" rx="6" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 5" opacity="0.9" />
        )}
        {frontOn && scope !== "whole" && (
          <rect x="6" y="208" width="628" height="48" rx="6" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 5" opacity="0.9" />
        )}

        <Maple cx={110} cy={86} colors={["#991b1b", "#b91c1c", "#dc2626"]} delay={0} />
        <Maple cx={530} cy={80} colors={["#ca8a04", "#eab308", "#facc15"]} delay={1.3} />

        {size === "small" && <CottageHouse />}
        {size === "medium" && <ColonialHouse />}
        {size === "large" && <EstateHouse />}

        {showBeds && (
          <g>
            <ellipse cx="262" cy="196" rx="38" ry="9" fill="#5b2c0f" />
            <ellipse cx="380" cy="196" rx="38" ry="9" fill="#5b2c0f" />
            <Shrub cx={248} cy={190} />
            <Shrub cx={276} cy={191} />
            <Shrub cx={366} cy={191} />
            <Shrub cx={394} cy={190} />
          </g>
        )}

        {showBranches && (
          <g stroke="#5b2c0f" strokeLinecap="round" fill="none">
            <path d="M150 236 C175 228 196 240 222 230" strokeWidth="5" />
            <path d="M188 232 L198 220" strokeWidth="3" />
            <path d="M440 244 C462 236 486 246 506 238" strokeWidth="4" />
          </g>
        )}

        {ground.map((leaf) => (
          <g
            key={leaf.id}
            transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rot}) scale(${leaf.scale})`}
            opacity={showHaul ? 0.45 : 0.95}
          >
            <Leaf color={leaf.color} size={24} />
          </g>
        ))}

        {FALLING.map((leaf) => (
          <g key={leaf.id} transform={`translate(${leaf.x} ${leaf.y}) scale(${leaf.scale})`}>
            <g
              className="yard-falling"
              style={{
                "--drop": `${leaf.drop}px`,
                "--sway": `${leaf.sway}px`,
                "--dur": `${leaf.duration}s`,
                "--delay": `${leaf.delay}s`,
              }}
            >
              <Leaf color={leaf.color} size={26} />
            </g>
          </g>
        ))}

        {showHaul && (
          <g>
            {DRIFT.map((leaf) => (
              <g key={leaf.id} transform={`translate(${leaf.x} ${leaf.y})`}>
                <g className="yard-drift" style={{ "--to": `${590 - leaf.x}px`, "--delay": `${leaf.delay}s` }}>
                  <Leaf color={leaf.color} size={24} />
                </g>
              </g>
            ))}
            <path d="M560 252 C566 226 610 226 626 252 Z" fill="#7f1d1d" />
            <path d="M572 248 C578 234 604 232 616 248 Z" fill="#b91c1c" />
            <ellipse cx="594" cy="238" rx="10" ry="6" fill="#eab308" />
            <rect x="552" y="250" width="82" height="6" rx="2" fill="#475569" />
          </g>
        )}
      </svg>
    </div>
  );
}
