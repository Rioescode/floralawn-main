"use client";

import { useEffect, useId, useState } from "react";

const COLORS = [
  ["#ef4444", "#7f1d1d"],
  ["#facc15", "#a16207"],
  ["#b91c1c", "#450a0a"],
  ["#eab308", "#713f12"],
  ["#be123c", "#4c0519"],
  ["#ca8a04", "#422006"],
  ["#dc2626", "#7c2d12"],
  ["#a16207", "#3f1d0b"],
];

const TYPES = [0, 1, 0, 2, 0];

const LEAVES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${(i * 4.7 + 1.5) % 97}%`,
  delay: `${(i * 0.82) % 16}s`,
  duration: `${12 + (i % 8) * 1.35}s`,
  size: 24 + (i % 6) * 6,
  rot: (i * 43) % 360,
  sway: `${10 + (i % 10) * 7}px`,
  color: COLORS[i % COLORS.length],
  type: TYPES[i % TYPES.length],
  opacity: 0.8 + (i % 3) * 0.1,
}));

const FRONT_LEAVES = Array.from({ length: 7 }, (_, i) => ({
  id: `f${i}`,
  left: `${(i * 14.3 + 6) % 94}%`,
  delay: `${(i * 2.3) % 11}s`,
  duration: `${8 + (i % 4) * 1.6}s`,
  size: 60 + (i % 4) * 12,
  rot: (i * 67) % 360,
  sway: `${40 + (i % 3) * 30}px`,
  color: COLORS[(i * 3) % COLORS.length],
  type: TYPES[(i * 2) % TYPES.length],
  opacity: 0.55,
}));

const MAPLE =
  "M50 4 L57 20 L66 14 L64 34 L80 24 L76 38 L95 36 L82 50 L92 56 L70 63 L74 74 L55 68 L53 78 L47 78 L45 68 L26 74 L30 63 L8 56 L18 50 L5 36 L24 38 L20 24 L36 34 L34 14 L43 20 Z";

const OAK =
  "M30 4 C36 6 38 14 34 18 C42 16 46 24 40 30 C50 30 52 40 42 44 C52 46 52 58 42 60 C50 64 46 74 38 72 C40 80 36 86 31 85 L29 85 C24 86 20 80 22 72 C14 74 10 64 18 60 C8 58 8 46 18 44 C8 40 10 30 20 30 C14 24 18 16 26 18 C22 14 24 6 30 4 Z";

const BIRCH =
  "M30 5 C35 9 38 12 40 16 L43 17 L43 21 C47 27 49 33 50 39 L53 41 L51 45 C51 52 49 59 45 65 L46 69 L42 70 C39 75 35 80 31 84 L29 84 C25 80 21 75 18 70 L14 69 L15 65 C11 59 9 52 9 45 L7 41 L10 39 C11 33 13 27 17 21 L17 17 L20 16 C22 12 25 9 30 5 Z";

function LeafShape({ type, size, color }) {
  const gid = useId().replace(/:/g, "");
  const [light, dark] = color;
  const grad = (
    <defs>
      <linearGradient id={gid} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor={light} />
        <stop offset="60%" stopColor={light} stopOpacity="0.92" />
        <stop offset="100%" stopColor={dark} />
      </linearGradient>
    </defs>
  );

  if (type === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        {grad}
        <path d={MAPLE} fill={`url(#${gid})`} stroke={dark} strokeWidth="1.2" strokeLinejoin="round" />
        <g stroke={dark} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6">
          <path d="M50 72 L50 12" />
          <path d="M50 66 L86 38" />
          <path d="M50 66 L14 38" />
          <path d="M50 70 L80 58" />
          <path d="M50 70 L20 58" />
          <path d="M50 46 L62 26" />
          <path d="M50 46 L38 26" />
        </g>
        <path d="M50 76 Q51 88 48 98" stroke={dark} strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  const isOak = type === 1;
  return (
    <svg width={size * 0.62} height={size} viewBox="0 0 60 100" aria-hidden>
      {grad}
      <path d={isOak ? OAK : BIRCH} fill={`url(#${gid})`} stroke={dark} strokeWidth="1" strokeLinejoin="round" />
      <g stroke={dark} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55">
        <path d="M30 84 L30 10" />
        <path d="M30 26 L20 20" />
        <path d="M30 26 L40 20" />
        <path d="M30 40 L16 34" />
        <path d="M30 40 L44 34" />
        <path d="M30 54 L16 50" />
        <path d="M30 54 L44 50" />
        <path d="M30 68 L20 66" />
        <path d="M30 68 L40 66" />
      </g>
      <path d="M30 84 Q31 92 28 99" stroke={dark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function LeafSeason({ density = "full", className = "" }) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const all =
    density === "front"
      ? FRONT_LEAVES
      : density === "sparse"
      ? LEAVES.filter((_, i) => i % 3 === 0)
      : LEAVES;
  const items = reduce ? all.filter((_, i) => i % 2 === 0) : all;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {items.map((leaf, i) => (
        <span
          key={leaf.id}
          className="absolute leaf-season-fall"
          style={{
            left: leaf.left,
            top: "-8%",
            opacity: leaf.opacity,
            filter:
              density === "front"
                ? "blur(1.5px) drop-shadow(0 10px 14px rgba(0,0,0,0.4))"
                : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
            "--leaf-delay": leaf.delay,
            "--leaf-dur": reduce ? `${parseFloat(leaf.duration) * 1.8}s` : leaf.duration,
            "--leaf-rot": `${leaf.rot}deg`,
            "--leaf-sway": leaf.sway,
          }}
        >
          <span
            className={reduce ? "block" : "block leaf-season-flutter"}
            style={{ "--flutter-dur": `${1.6 + (i % 5) * 0.35}s` }}
          >
            <LeafShape type={leaf.type} size={leaf.size} color={leaf.color} />
          </span>
        </span>
      ))}
    </div>
  );
}

export function LeafGround({ className = "" }) {
  const pile = LEAVES.slice(0, 14);
  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-0 right-0 h-24 overflow-hidden ${className}`}
      aria-hidden
    >
      {pile.map((leaf, i) => (
        <span
          key={leaf.id}
          className="absolute leaf-season-rest"
          style={{
            left: `${(i * 7.1 + 2) % 96}%`,
            bottom: `${(i % 4) * 5 - 6}px`,
            opacity: 0.85,
            filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))",
            "--leaf-rot": `${-40 + (i * 37) % 80}deg`,
          }}
        >
          <LeafShape type={leaf.type} size={leaf.size + 8} color={leaf.color} />
        </span>
      ))}
    </div>
  );
}
