"use client";

import LeafSeason, { LeafGround } from "@/components/LeafSeason";

const BLOSSOM_COLORS = ["#f9a8d4", "#fb7185", "#fff7ed", "#fda4af", "#fecdd3"];

function scatter(count, prefix, sizeBase, sizeStep) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    left: `${(i * 4.7 + prefix.length * 3.1 + 2) % 96}%`,
    delay: `${(i * 0.78) % 15}s`,
    duration: `${11 + (i % 8) * 1.4}s`,
    size: sizeBase + (i % 6) * sizeStep,
    rot: (i * 47) % 360,
    sway: `${12 + (i % 9) * 8}px`,
    color: BLOSSOM_COLORS[i % BLOSSOM_COLORS.length],
  }));
}

function Particle({ item, front }) {
  return (
    <span
      className="absolute leaf-season-fall pointer-events-none"
      style={{
        left: item.left,
        top: "-8%",
        "--leaf-delay": item.delay,
        "--leaf-dur": item.duration,
        "--leaf-rot": `${item.rot}deg`,
        "--leaf-sway": item.sway,
        filter: front ? "blur(0.6px) drop-shadow(0 10px 14px rgba(0,0,0,0.35))" : "drop-shadow(0 3px 5px rgba(0,0,0,0.25))",
      }}
    >
      {item.shape}
    </span>
  );
}

function Blossom({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="50" cy="26" rx="13" ry="22" fill={color} transform={`rotate(${angle} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="7" fill="#fde68a" />
    </svg>
  );
}

function Seed({ size }) {
  const hairs = [-70, -45, -20, 0, 20, 45, 70];
  return (
    <svg width={size * 0.7} height={size} viewBox="0 0 40 90" aria-hidden>
      <line x1="20" y1="28" x2="20" y2="88" stroke="#e7e5e4" strokeWidth="1.2" />
      {hairs.map((angle) => (
        <line
          key={angle}
          x1="20"
          y1="24"
          x2="20"
          y2="6"
          stroke="#fef9c3"
          strokeWidth="1.1"
          transform={`rotate(${angle} 20 24)`}
        />
      ))}
      <circle cx="20" cy="24" r="3.2" fill="#fef08a" />
    </svg>
  );
}

function Flake({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <g stroke="white" strokeWidth="3" strokeLinecap="round" fill="none">
        {[0, 60, 120].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="8" x2="50" y2="92" />
            <line x1="50" y1="22" x2="38" y2="14" />
            <line x1="50" y1="22" x2="62" y2="14" />
            <line x1="50" y1="78" x2="38" y2="86" />
            <line x1="50" y1="78" x2="62" y2="86" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function Field({ items, front, className }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {items.map((item) => (
        <Particle key={item.id} item={item} front={front} />
      ))}
    </div>
  );
}

function Pile({ items, className }) {
  return (
    <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-28 overflow-hidden ${className}`} aria-hidden>
      {items.map((item, i) => (
        <span
          key={item.id}
          className="absolute leaf-season-rest"
          style={{
            left: `${(i * 8.2 + 1) % 96}%`,
            bottom: `${(i % 4) * 6 - 8}px`,
            "--leaf-rot": `${-30 + (i * 29) % 70}deg`,
          }}
        >
          {item.shape}
        </span>
      ))}
    </div>
  );
}

function withShape(items, Shape, colorKey) {
  return items.map((item) => ({
    ...item,
    shape: <Shape size={item.size} color={colorKey ? item.color : undefined} />,
  }));
}

const SPRING = withShape(scatter(20, "blossom", 18, 4), Blossom, true);
const SPRING_FRONT = withShape(scatter(6, "blossom-front", 46, 10), Blossom, true);
const SUMMER = scatter(18, "seed", 22, 4).map((item) => ({ ...item, shape: <Seed size={item.size} /> }));
const SUMMER_FRONT = scatter(6, "seed-front", 48, 8).map((item) => ({ ...item, shape: <Seed size={item.size} /> }));
const WINTER = scatter(22, "flake", 14, 4).map((item) => ({ ...item, shape: <Flake size={item.size} /> }));
const WINTER_FRONT = scatter(7, "flake-front", 36, 8).map((item) => ({ ...item, shape: <Flake size={item.size} /> }));

export default function SeasonParticles({ seasonId }) {
  if (seasonId === "fall") {
    return (
      <>
        <LeafSeason respectMotion={false} className="z-[4]" />
        <LeafGround className="z-[5]" />
      </>
    );
  }

  if (seasonId === "spring") {
    return (
      <>
        <Field items={SPRING} className="z-[4]" />
        <Pile items={SPRING.slice(0, 12)} className="z-[5]" />
      </>
    );
  }

  if (seasonId === "summer") {
    return (
      <>
        <div
          className="pointer-events-none absolute -top-10 -right-10 z-[3] h-80 w-80 sm:h-[28rem] sm:w-[28rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(250,204,21,0.5) 0%, rgba(253,224,71,0.18) 42%, transparent 70%)" }}
          aria-hidden
        />
        <Field items={SUMMER} className="z-[4]" />
        <Pile items={SUMMER.slice(0, 12)} className="z-[5]" />
      </>
    );
  }

  return (
    <>
      <Field items={WINTER} className="z-[4]" />
      <Pile items={WINTER.slice(0, 12)} className="z-[5]" />
    </>
  );
}

export function SeasonFront({ seasonId }) {
  if (seasonId === "fall") {
    return <LeafSeason respectMotion={false} density="front" className="z-20" />;
  }
  const items = seasonId === "spring" ? SPRING_FRONT : seasonId === "summer" ? SUMMER_FRONT : WINTER_FRONT;
  return <Field items={items} front className="z-20" />;
}
