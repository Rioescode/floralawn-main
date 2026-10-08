"use client";

import { useId } from "react";
import { MAPLE } from "./LeafSeason";

export function Leaf({ color, size = 16 }) {
  const [light, dark] = color;
  return (
    <g transform={`scale(${size / 100}) translate(-50 -50)`}>
      <path d={MAPLE} fill={light} stroke={dark} strokeWidth="3" strokeLinejoin="round" />
      <g stroke={dark} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6">
        <path d="M50 72 L50 12" />
        <path d="M50 66 L86 38" />
        <path d="M50 66 L14 38" />
        <path d="M50 70 L80 58" />
        <path d="M50 70 L20 58" />
      </g>
      <path d="M50 76 Q51 88 48 98" stroke={dark} strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Window({ x, y, lit }) {
  return (
    <g>
      <rect x={x - 9} y={y} width="7" height="24" fill="#111827" />
      <rect x={x} y={y} width="20" height="24" fill={lit ? "#fde68a" : "#bfdbfe"} stroke="#e2e8f0" strokeWidth="2" />
      <path d={`M${x + 10} ${y} V${y + 24} M${x} ${y + 12} H${x + 20}`} stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x={x + 22} y={y} width="7" height="24" fill="#111827" />
    </g>
  );
}

function RoofSnow({ left, right, peak, base }) {
  const mid = (left + right) / 2;
  return (
    <path
      d={`M${left} ${base} L${mid} ${peak} L${right} ${base} L${right - 8} ${base - 3} C${mid + 30} ${peak + 22} ${mid - 30} ${peak + 22} ${left + 8} ${base - 3} Z`}
      fill="white"
    />
  );
}

function Chimney({ x, top, snow }) {
  return (
    <g>
      <rect x={x} y={top} width="16" height="34" fill="#7f1d1d" />
      <rect x={x - 3} y={top - 4} width="22" height="6" fill="#450a0a" />
      {snow && <rect x={x - 3} y={top - 8} width="22" height="5" rx="2" fill="white" />}
      <circle className="yard-smoke" cx={x + 8} cy={top - 12} r="6" fill="#e2e8f0" />
    </g>
  );
}

export function CottageHouse({ snow = false, lit = false }) {
  return (
    <g>
      <Chimney x={350} top={102} snow={snow} />
      <polygon points="250,142 320,96 390,142" fill="#7f1d1d" />
      {snow && <RoofSnow left={250} right={390} peak={96} base={142} />}
      <rect x="262" y="138" width="116" height="52" fill="#fefce8" />
      <path d="M262 152 H378 M262 166 H378 M262 180 H378" stroke="#e7e5e4" strokeWidth="1.2" />
      <Window x={280} y={148} lit={lit} />
      <Window x={340} y={148} lit={lit} />
      <rect x="311" y="156" width="18" height="34" rx="8" fill="#14532d" />
      <circle cx="325" cy="174" r="1.5" fill="#facc15" />
      <polygon points="306,154 320,146 334,154" fill="#7f1d1d" />
      <rect x="306" y="190" width="28" height="5" fill="#cbd5e1" />
      <path d="M312 195 L300 260 H340 L328 195 Z" fill="#d6d3d1" />
      <circle cx="270" cy="188" r="7" fill="#15803d" />
      <circle cx="370" cy="188" r="7" fill="#15803d" />
    </g>
  );
}

export function EstateHouse({ snow = false, lit = false }) {
  const dormers = [272, 320, 368];
  return (
    <g>
      <Chimney x={392} top={52} snow={snow} />
      <Chimney x={232} top={60} snow={snow} />

      <polygon points="140,138 178,114 216,138" fill="#1e293b" />
      {snow && <RoofSnow left={140} right={216} peak={114} base={138} />}
      <rect x="148" y="136" width="62" height="54" fill="#f1f5f9" />
      <Window x={170} y={150} lit={lit} />

      <polygon points="428,140 474,112 520,140" fill="#1e293b" />
      {snow && <RoofSnow left={428} right={520} peak={112} base={140} />}
      <rect x="434" y="138" width="80" height="52" fill="#f1f5f9" />
      <rect x="444" y="152" width="60" height="38" fill="#e2e8f0" stroke="#cbd5e1" />
      <path d="M444 161 H504 M444 170 H504 M444 179 H504" stroke="#cbd5e1" />
      <path d="M446 190 L432 260 H520 L502 190 Z" fill="#d6d3d1" />

      <polygon points="196,104 320,50 444,104" fill="#1e293b" />
      {snow && <RoofSnow left={196} right={444} peak={50} base={104} />}
      {dormers.map((x) => (
        <g key={x}>
          <polygon points={`${x - 14},92 ${x},76 ${x + 14},92`} fill="#334155" />
          {snow && <polygon points={`${x - 14},92 ${x},76 ${x + 14},92 ${x + 8},90 ${x},82 ${x - 8},90`} fill="white" />}
          <rect x={x - 10} y="90" width="20" height="14" fill="#f8fafc" />
          <rect x={x - 6} y="92" width="12" height="10" fill={lit ? "#fde68a" : "#bfdbfe"} />
        </g>
      ))}
      <rect x="206" y="102" width="228" height="88" fill="#f8fafc" />
      <path d="M206 124 H434 M206 146 H434 M206 168 H434" stroke="#e2e8f0" strokeWidth="1.5" />
      <Window x={226} y={112} lit={lit} />
      <Window x={306} y={112} lit={lit} />
      <Window x={386} y={112} lit={lit} />
      <Window x={226} y={154} lit={lit} />
      <Window x={386} y={154} lit={lit} />
      <polygon points="290,146 320,128 350,146" fill="#e2e8f0" stroke="#cbd5e1" />
      <rect x="294" y="146" width="5" height="44" fill="#e2e8f0" />
      <rect x="341" y="146" width="5" height="44" fill="#e2e8f0" />
      <rect x="308" y="152" width="24" height="38" rx="2" fill="#111827" />
      <path d="M320 152 V190" stroke="#374151" />
      <circle cx="317" cy="172" r="1.4" fill="#facc15" />
      <circle cx="323" cy="172" r="1.4" fill="#facc15" />
      <rect x="300" y="190" width="40" height="5" fill="#cbd5e1" />
      <path d="M308 195 L294 260 H346 L332 195 Z" fill="#d6d3d1" />
    </g>
  );
}

export function ColonialHouse({ snow = false, lit = false }) {
  const roofId = `roof-${useId().replace(/:/g, "")}`;
  return (
    <g>
      <defs>
        <linearGradient id={roofId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect x="374" y="62" width="16" height="34" fill="#7f1d1d" />
      <rect x="371" y="58" width="22" height="6" fill="#450a0a" />
      <circle className="yard-smoke" cx="382" cy="50" r="6" fill="#e2e8f0" />
      <polygon points="214,112 320,62 426,112" fill={`url(#${roofId})`} />
      {snow && (
        <path d="M214 112 L320 62 L426 112 L420 108 C400 104 380 100 360 96 C330 88 300 86 270 96 C250 102 230 108 214 112 Z" fill="white" />
      )}
      {snow && <rect x="371" y="54" width="22" height="5" rx="2" fill="white" />}
      <rect x="226" y="110" width="188" height="80" fill="#f8fafc" />
      <path d="M226 130 H414 M226 150 H414 M226 170 H414" stroke="#e2e8f0" strokeWidth="1.5" />
      <Window x={250} y={120} lit={lit} />
      <Window x={364} y={120} lit={lit} />
      <Window x={250} y={156} lit={lit} />
      <Window x={364} y={156} lit={lit} />
      <polygon points="296,140 320,124 344,140" fill="#e2e8f0" stroke="#cbd5e1" />
      <rect x="300" y="140" width="5" height="50" fill="#e2e8f0" />
      <rect x="335" y="140" width="5" height="50" fill="#e2e8f0" />
      <rect x="310" y="150" width="20" height="40" rx="2" fill="#111827" />
      <circle cx="326" cy="171" r="1.6" fill="#facc15" />
      <rect x="304" y="190" width="32" height="5" fill="#cbd5e1" />
      <path d="M310 195 L298 260 H342 L330 195 Z" fill="#d6d3d1" />
    </g>
  );
}
