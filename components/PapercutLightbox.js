"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  SunIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const FILM_DURATION = 15.0; // Exact 15-second continuous cinematic film

// 4-SEASON CHAPTERS INSIDE THE 15-SECOND CONTINUOUS FILM
const CHAPTERS = [
  {
    id: "mowing",
    start: 0.0,
    end: 3.75,
    timeLabel: "0:00 – 0:04",
    label: "Spring Mowing",
    shortSub: "60” Decks & Diamond Stripes",
    accentHex: "#22c55e",
    accentRing: "border-emerald-400/60 bg-emerald-500/10 shadow-emerald-500/15",
    accentBar: "from-emerald-400 to-green-300",
    accentText: "text-emerald-300",
    emoji: "✂️",
    serviceParam: "Lawn Mowing",
    seasonBadge: "0:00 – 0:04 · Spring Dawn",
    title: "Precision Mowing & Diamond Striping",
    tagline: "Commercial 60” Rotary Decks & Crisp Border Trimming",
    storyStep:
      "Warm dawn light breaks over Rhode Island as commercial zero-turn mowers lay razor-sharp 3.5” diamond stripes across the turf.",
    keyPoints: [
      "Dependable weekly or bi-weekly mowing days",
      "Alternating diamond patterns prevent wheel ruts",
      "Clean string trimming & full hardscape blowoff",
    ],
  },
  {
    id: "mulch",
    start: 3.75,
    end: 7.5,
    timeLabel: "0:04 – 0:07",
    label: "Mulch & Aeration",
    shortSub: "3” Trench Edge & Overseed",
    accentHex: "#f97316",
    accentRing: "border-orange-400/60 bg-orange-500/10 shadow-orange-500/15",
    accentBar: "from-orange-400 to-amber-300",
    accentText: "text-orange-300",
    emoji: "🌱",
    serviceParam: "Mulch Installation",
    seasonBadge: "0:04 – 0:07 · Garden Refresh",
    title: "Deep Mulch, Edging & Core Aeration",
    tagline: "Hand-Spaded 3” Trenches & Certified Bluegrass Overseeding",
    storyStep:
      "Hollow tines relieve New England clay compaction while rich triple-shredded bark and crisp hand-spaded edges frame every bed.",
    keyPoints: [
      "Deep 3-inch vertical trench edge blocks weeds",
      "Natural dark pine & hemlock triple-shredded mulch",
      "Core aeration & cold-hardy overseeding for thick roots",
    ],
  },
  {
    id: "fall",
    start: 7.5,
    end: 11.25,
    timeLabel: "0:07 – 0:11",
    label: "Fall Cleanup",
    shortSub: "Blower Crews & Vacuum Haul",
    accentHex: "#f59e0b",
    accentRing: "border-amber-400/60 bg-amber-500/10 shadow-amber-500/15",
    accentBar: "from-amber-400 to-yellow-300",
    accentText: "text-amber-300",
    emoji: "🍂",
    serviceParam: "Fall Cleanup",
    seasonBadge: "0:07 – 0:11 · Autumn Gust",
    title: "Fall Leaf Clearing & Vacuum Haul",
    tagline: "High-Volume Leaf Extraction Before Winter Freeze",
    storyStep:
      "Autumn gusts sweep oak and maple leaves across the yard—our commercial blowers and vacuum haulers clear fence to curb.",
    keyPoints: [
      "Full perimeter fence & perennial bed blowout",
      "Curbside high-volume vacuum suction & haul-away",
      "Prevents winter snow mold and turf crown decay",
    ],
  },
  {
    id: "snow",
    start: 11.25,
    end: 15.0,
    timeLabel: "0:11 – 0:15",
    label: "Snow Defense",
    shortSub: "24/7 V-Plow & Pet-Safe Salt",
    accentHex: "#38bdf8",
    accentRing: "border-sky-400/60 bg-sky-500/10 shadow-sky-500/15",
    accentBar: "from-sky-400 to-cyan-200",
    accentText: "text-sky-300",
    emoji: "❄️",
    serviceParam: "Snow Removal",
    seasonBadge: "0:11 – 0:15 · Winter Night",
    title: "24/7 Blizzard Plowing & De-Icing",
    tagline: "Automatic 2” Dispatch, Walkway Shoveling & Brine",
    storyStep:
      "Under winter moonlight, amber-beacon plow trucks clear driveways with rubber curb guards while walkways get pet-safe ice melt.",
    keyPoints: [
      "Automatic storm dispatch at 2-inch accumulation",
      "Zero-damage rubber cutting edges for pavers & asphalt",
      "Pre-storm liquid brine & eco-friendly salt treatment",
    ],
  },
];

// PAPER-CUT VALUE LADDERS (Back layers bright & translucent -> Front almost black)
const LADDERS = {
  mowing: {
    skyTop: [219, 240, 255],
    skyMid: [110, 195, 245],
    backlight: [255, 224, 140],
    sun: [255, 248, 210],
    l2: [134, 218, 162],
    l3: [52, 168, 98],
    l4: [26, 128, 68],
    l5: [19, 92, 48],
    l6: [11, 56, 30],
    l7: [4, 22, 12],
    accent: [250, 204, 21],
    rim: [235, 255, 220],
    window: [255, 244, 196],
  },
  mulch: {
    skyTop: [255, 232, 205],
    skyMid: [244, 152, 102],
    backlight: [255, 192, 110],
    sun: [255, 236, 185],
    l2: [218, 136, 72],
    l3: [158, 86, 36],
    l4: [112, 58, 22],
    l5: [76, 39, 14],
    l6: [42, 22, 10],
    l7: [16, 8, 4],
    accent: [52, 211, 153],
    rim: [255, 228, 190],
    window: [255, 238, 185],
  },
  fall: {
    skyTop: [255, 224, 138],
    skyMid: [242, 140, 42],
    backlight: [255, 184, 56],
    sun: [255, 240, 168],
    l2: [232, 126, 34],
    l3: [184, 78, 20],
    l4: [136, 48, 14],
    l5: [88, 28, 10],
    l6: [48, 14, 7],
    l7: [18, 5, 4],
    accent: [239, 68, 68],
    rim: [255, 218, 145],
    window: [255, 242, 175],
  },
  snow: {
    skyTop: [208, 226, 244],
    skyMid: [96, 128, 166],
    backlight: [185, 215, 248],
    sun: [244, 250, 255],
    l2: [128, 154, 186],
    l3: [82, 104, 136],
    l4: [54, 72, 98],
    l5: [34, 48, 68],
    l6: [18, 28, 44],
    l7: [6, 10, 18],
    accent: [245, 158, 11],
    rim: [226, 242, 255],
    window: [255, 226, 130],
  },
};

// Utility helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerpRGB = (c1, c2, t) => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
];
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function getPaletteAtTime(t) {
  const keys = ["mowing", "mulch", "fall", "snow"];
  // Transition bands: [3.25..4.15], [7.0..7.9], [10.75..11.65], [14.25..15.0]
  let fromKey = "mowing";
  let toKey = "mowing";
  let blend = 0;

  if (t < 3.25) {
    fromKey = toKey = keys[0];
  } else if (t < 4.15) {
    fromKey = keys[0];
    toKey = keys[1];
    blend = smoothstep(3.25, 4.15, t);
  } else if (t < 7.0) {
    fromKey = toKey = keys[1];
  } else if (t < 7.9) {
    fromKey = keys[1];
    toKey = keys[2];
    blend = smoothstep(7.0, 7.9, t);
  } else if (t < 10.75) {
    fromKey = toKey = keys[2];
  } else if (t < 11.65) {
    fromKey = keys[2];
    toKey = keys[3];
    blend = smoothstep(10.75, 11.65, t);
  } else if (t < 14.25) {
    fromKey = toKey = keys[3];
  } else {
    fromKey = keys[3];
    toKey = keys[0];
    blend = smoothstep(14.25, 15.0, t);
  }

  const A = LADDERS[fromKey];
  const B = LADDERS[toKey];
  const out = {};
  for (const k of Object.keys(A)) {
    out[k] = lerpRGB(A[k], B[k], blend);
  }
  return out;
}

// Deterministic seeded PRNG for consistent particles across loops
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pre-generate particle tables once
const rand = mulberry32(4013890913);
const FALL_LEAVES = Array.from({ length: 42 }, () => ({
  x0: rand() * 1100 - 100,
  y0: 140 + rand() * 440,
  speedX: 160 + rand() * 220,
  speedY: -30 + rand() * 65,
  amp: 14 + rand() * 26,
  freq: 2.0 + rand() * 3.0,
  phase: rand() * Math.PI * 2,
  size: 7 + rand() * 11,
  rotSpeed: (rand() - 0.5) * 6,
  depth: rand(), // 0 back, 1 front
  tone: rand(),
}));

const SNOW_FLAKES = Array.from({ length: 70 }, () => ({
  x0: rand() * 1400 - 60,
  y0: rand() * 720,
  speedY: 55 + rand() * 120,
  driftX: -25 - rand() * 55,
  swayAmp: 8 + rand() * 20,
  phase: rand() * Math.PI * 2,
  size: 2.2 + rand() * 4.5,
  depth: rand(),
}));

const SEEDS = Array.from({ length: 48 }, () => ({
  x: 420 + rand() * 580,
  y0: 365 + rand() * 115,
  speed: 75 + rand() * 65,
  phase: rand(),
  size: 2.2 + rand() * 2.6,
}));

const GRASS_MIST = Array.from({ length: 40 }, () => ({
  angle: -1.15 + rand() * 0.85,
  speed: 90 + rand() * 130,
  phase: rand(),
  len: 6 + rand() * 9,
  rot: (rand() - 0.5) * 6,
}));

const SPRING_POLLEN = Array.from({ length: 32 }, () => ({
  x0: rand() * 1280,
  y0: 140 + rand() * 420,
  driftX: 18 + rand() * 35,
  driftY: -12 - rand() * 22,
  phase: rand() * Math.PI * 2,
  size: 1.8 + rand() * 3.0,
}));

const MULCH_CHIPS = Array.from({ length: 28 }, () => ({
  vx: 55 + rand() * 115,
  vy: -85 - rand() * 65,
  phase: rand(),
  w: 6 + rand() * 7,
  h: 2.5 + rand() * 3,
  rot: (rand() - 0.5) * 8,
}));

const CORE_PLUGS = Array.from({ length: 18 }, () => ({
  vx: -35 - rand() * 75,
  vy: -65 - rand() * 55,
  phase: rand(),
  rot: (rand() - 0.5) * 10,
}));

// Build procedural paper pulp grain pattern tile
function createPaperGrainCanvas() {
  const c = document.createElement("canvas");
  c.width = 180;
  c.height = 180;
  const g = c.getContext("2d");
  const img = g.createImageData(180, 180);
  const d = img.data;
  const r = mulberry32(99173);
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + (r() - 0.5) * 60;
    d[i] = v;
    d[i + 1] = v - 4;
    d[i + 2] = v - 10;
    d[i + 3] = 24; // subtle cardstock pulp texture
  }
  g.putImageData(img, 0, 0);

  // Add subtle paper fibres
  g.strokeStyle = "rgba(255,248,230,0.06)";
  g.lineWidth = 0.8;
  for (let i = 0; i < 60; i++) {
    const x = r() * 180;
    const y = r() * 180;
    const len = 4 + r() * 10;
    const ang = r() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }
  return c;
}

export default function PapercutLightbox() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [lampOn, setLampOn] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const canvasRef = useRef(null);
  const grainPatternRef = useRef(null);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const lampOnRef = useRef(true);
  const mouseRef = useRef({ x: 0, y: 0, hover: false });
  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const lastFrameRef = useRef(null);
  const uiSyncRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    lampOnRef.current = lampOn;
  }, [lampOn]);

  // Active chapter based on current 15s timecode
  const activeChapterIdx = CHAPTERS.findIndex(
    (ch) => currentTime >= ch.start && currentTime < ch.end
  );
  const safeChapterIdx = activeChapterIdx === -1 ? CHAPTERS.length - 1 : activeChapterIdx;
  const chapter = CHAPTERS[safeChapterIdx];

  // Main Canvas2D Paper-cut Lightbox Render Function at time t in [0, 15]
  const renderFrame = useCallback((ctx, W, H, t, mx, my, isLit) => {
    const pal = getPaletteAtTime(t);

    // Lamp warm-up curve at very start of film (0.0s -> 0.55s)
    const lampWarmup = isLit ? smoothstep(0.0, 0.55, t) : 0.14;
    // Lemomo spec organic candlelight/lamp flicker: (1 + 0.05*sin(7.3t)*sin(3.1t))
    const flicker = isLit
      ? (0.95 + 0.045 * Math.sin(t * 7.3) * Math.sin(t * 3.1) + 0.018 * Math.sin(t * 13.7)) *
        (0.2 + 0.8 * lampWarmup)
      : 0.16;

    // Gentle cinematic camera dolly + handheld micro-drift
    const dolly = 1.0 + 0.055 * Math.sin((t / FILM_DURATION) * Math.PI);
    const driftX = Math.sin(t * 0.85) * 8 + Math.cos(t * 1.45) * 4 + mx * 26;
    const driftY = Math.cos(t * 0.72) * 5 + Math.sin(t * 1.2) * 3 + my * 16;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Subtle camera zoom centered on cavity
    ctx.translate(W / 2, H / 2);
    ctx.scale(dolly, dolly);
    ctx.translate(-W / 2, -H / 2);

    // =========================================================================
    // LAYER 0: BACKLIGHT CAVITY & PULP-MOTTLED SKY
    // =========================================================================
    const sunX = lerp(340, 940, (t % FILM_DURATION) / FILM_DURATION);
    const sunY = 185 - Math.sin((t / FILM_DURATION) * Math.PI) * 55;

    const skyGrad = ctx.createRadialGradient(
      sunX - driftX * 0.12,
      sunY - driftY * 0.12,
      20,
      W * 0.5,
      H * 0.42,
      W * 0.78
    );
    skyGrad.addColorStop(0, rgb(pal.skyTop, clamp(flicker * 1.08, 0.12, 1)));
    skyGrad.addColorStop(0.32, rgb(pal.backlight, clamp(flicker * 0.95, 0.1, 1)));
    skyGrad.addColorStop(0.68, rgb(pal.skyMid, clamp(flicker * 0.85, 0.08, 0.95)));
    skyGrad.addColorStop(1, "rgba(8, 12, 22, 1)");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-60, -60, W + 120, H + 120);

    // Subtle pulp mottling clouds in backlight
    if (grainPatternRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.45 * flicker;
      ctx.fillStyle = grainPatternRef.current;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Helper: Draws a paper-cut sheet with cast shadow, flat color, fibre grain & warm top rim
    const drawPaperSheet = (pathFn, fillColor, depthIdx, rimAlpha = 0.42) => {
      ctx.save();
      // Top spotlight cast shadow onto layers behind
      ctx.shadowColor = `rgba(0, 0, 0, ${0.38 + depthIdx * 0.05})`;
      ctx.shadowBlur = 12 + depthIdx * 2.5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5 + depthIdx * 1.5;

      ctx.beginPath();
      pathFn();
      ctx.fillStyle = rgb(fillColor, 1);
      ctx.fill();

      // Remove shadow for grain & rim pass
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Fibre grain overlay clipped to sheet
      if (grainPatternRef.current) {
        ctx.save();
        ctx.clip();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = grainPatternRef.current;
        ctx.fillRect(-100, -100, W + 200, H + 200);
        ctx.restore();
      }

      // Warm backlit top-edge rim highlight
      if (isLit && rimAlpha > 0) {
        ctx.strokeStyle = rgb(pal.rim, rimAlpha * flicker);
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();
    };

    // =========================================================================
    // LAYER 1: BACK SUN / MOON DISK + DRIFTING PAPER CLOUDS (Depth 0.15)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 0.15, -driftY * 0.15);

    // Outer halo bloom
    const halo = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 170);
    halo.addColorStop(0, rgb(pal.sun, 0.85 * flicker));
    halo.addColorStop(0.45, rgb(pal.backlight, 0.28 * flicker));
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 170, 0, Math.PI * 2);
    ctx.fill();

    // Crisp cut-paper sun/moon circle
    ctx.beginPath();
    ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
    ctx.fillStyle = rgb(pal.sun, clamp(0.95 * flicker, 0.2, 1));
    ctx.fill();

    // Gently scrolling paper-cut cloud silhouettes
    const cloudShift = (t * 14) % (W + 360);
    ctx.fillStyle = rgb(pal.skyTop, 0.26 * flicker);
    for (let i = 0; i < 3; i++) {
      const cx = ((cloudShift + i * 460) % (W + 360)) - 180;
      const cy = 115 + (i % 2) * 45;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 20);
      ctx.quadraticCurveTo(cx + 40, cy - 18, cx + 95, cy - 6);
      ctx.quadraticCurveTo(cx + 145, cy - 28, cx + 195, cy + 2);
      ctx.quadraticCurveTo(cx + 235, cy + 8, cx + 250, cy + 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // =========================================================================
    // LAYER 2: DISTANT NEW ENGLAND ROLLING HILLS (Depth 0.28)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 0.28, -driftY * 0.24);
    drawPaperSheet(
      () => {
        ctx.moveTo(-80, 340);
        ctx.quadraticCurveTo(220, 235, 520, 305);
        ctx.quadraticCurveTo(860, 365, 1140, 260);
        ctx.lineTo(W + 120, 300);
        ctx.lineTo(W + 120, H + 80);
        ctx.lineTo(-80, H + 80);
        ctx.closePath();
      },
      pal.l2,
      2,
      0.48
    );
    ctx.restore();

    // =========================================================================
    // LAYER 3: COLONIAL NEW ENGLAND HOME, CHIMNEY SMOKE & PINE WINDBREAK (Depth 0.45)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 0.45, -driftY * 0.38);

    // Subtle rising chimney smoke puffs (stronger in Fall & Winter)
    const smokeVis = smoothstep(6.5, 8.2, t) * (1 - smoothstep(14.3, 15.0, t));
    if (smokeVis > 0.01) {
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const p = ((t * 0.45 + i * 0.2) % 1);
        const sx = 928 + Math.sin(p * 5 + i) * 14 + p * 35;
        const sy = 258 - p * 95;
        const sr = 7 + p * 18;
        ctx.fillStyle = rgb(pal.skyTop, (1 - p) * 0.35 * smokeVis * flicker);
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawPaperSheet(
      () => {
        // Mid-distant rolling hill + pines + colonial farmhouse
        ctx.moveTo(-80, 405);
        ctx.quadraticCurveTo(280, 340, 620, 385);
        ctx.quadraticCurveTo(960, 415, W + 120, 370);
        ctx.lineTo(W + 120, H + 80);
        ctx.lineTo(-80, H + 80);
        ctx.closePath();

        // Pine trees on left ridge
        const drawPine = (px, py, s) => {
          ctx.moveTo(px, py - 95 * s);
          ctx.lineTo(px + 28 * s, py - 45 * s);
          ctx.lineTo(px + 14 * s, py - 45 * s);
          ctx.lineTo(px + 38 * s, py);
          ctx.lineTo(px - 38 * s, py);
          ctx.lineTo(px - 14 * s, py - 45 * s);
          ctx.lineTo(px - 28 * s, py - 45 * s);
          ctx.closePath();
        };
        drawPine(165, 388, 1.05);
        drawPine(230, 392, 0.85);
        drawPine(290, 382, 0.7);
        drawPine(1120, 385, 0.95);

        // Colonial Farmhouse Silhouette (Right-center)
        // Main house + pitched roof + side wing + chimney
        ctx.rect(820, 315, 155, 85);
        ctx.moveTo(806, 318);
        ctx.lineTo(897, 252);
        ctx.lineTo(989, 318);
        ctx.closePath();
        // Chimney
        ctx.rect(920, 256, 18, 36);
        // Side garage wing
        ctx.rect(970, 338, 72, 62);
        ctx.moveTo(966, 340);
        ctx.lineTo(1006, 308);
        ctx.lineTo(1048, 340);
        ctx.closePath();
      },
      pal.l3,
      3,
      0.4
    );

    // Emissive Glowing Windows (Burn & Bloom through paper cutouts)
    if (isLit) {
      ctx.save();
      const winPulse = 0.88 + 0.12 * Math.sin(t * 5.2) * Math.cos(t * 2.7);
      ctx.shadowColor = rgb(pal.window, 0.95 * flicker);
      ctx.shadowBlur = 18;
      ctx.fillStyle = rgb(pal.window, clamp(winPulse * flicker, 0.25, 1));
      const wins = [
        [846, 332, 20, 28],
        [887, 332, 20, 28],
        [928, 332, 20, 28],
        [887, 286, 20, 20],
        [992, 352, 26, 22],
      ];
      for (const [wx, wy, ww, wh] of wins) {
        ctx.beginPath();
        ctx.roundRect(wx, wy, ww, wh, 3);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    // =========================================================================
    // LAYER 4: FLANKING TREES & SCULPTED MID-LAWN (Depth 0.65)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 0.65, -driftY * 0.55);

    const treeSway = Math.sin(t * 1.9) * (t > 7 && t < 11.5 ? 7 : 2.5);
    drawPaperSheet(
      () => {
        // Left mature oak canopy
        ctx.moveTo(-40, 480);
        ctx.bezierCurveTo(-20, 340, 25 + treeSway, 240, 125 + treeSway, 215);
        ctx.bezierCurveTo(215 + treeSway, 195, 290 + treeSway, 260, 275, 345);
        ctx.bezierCurveTo(265, 405, 220, 445, 210, 480);
        ctx.closePath();

        // Right maple canopy
        ctx.moveTo(1060, 485);
        ctx.bezierCurveTo(1045, 355, 1085 + treeSway, 235, 1185 + treeSway, 205);
        ctx.bezierCurveTo(1275 + treeSway, 185, 1340, 250, 1340, 485);
        ctx.closePath();

        // Rolling mid-lawn plateau
        ctx.moveTo(-80, 468);
        ctx.quadraticCurveTo(360, 430, 740, 462);
        ctx.quadraticCurveTo(1060, 485, W + 120, 448);
        ctx.lineTo(W + 120, H + 80);
        ctx.lineTo(-80, H + 80);
        ctx.closePath();
      },
      pal.l4,
      4,
      0.45
    );

    // SPRING CHAPTER: Soft Estate Diamond Stripes clipped cleanly inside Layer 4 hill
    const stripeVis = 1 - smoothstep(3.3, 4.1, t);
    if (stripeVis > 0.01) {
      const mowerProgress = smoothstep(0.15, 3.45, t);
      const revealX = lerp(90, 1240, mowerProgress);
      ctx.save();
      // Clip strictly to Layer 4's exact curved hill silhouette
      ctx.beginPath();
      ctx.moveTo(-80, 468);
      ctx.quadraticCurveTo(360, 430, 740, 462);
      ctx.quadraticCurveTo(1060, 485, W + 120, 448);
      ctx.lineTo(W + 120, H + 80);
      ctx.lineTo(-80, H + 80);
      ctx.closePath();
      ctx.clip();

      // Secondary clip to progressive reveal behind mower
      ctx.beginPath();
      ctx.rect(-80, 420, revealX + 80, 180);
      ctx.clip();

      for (let i = -1; i < 12; i++) {
        const topX = 160 + i * 96;
        const botX = 60 + i * 124;
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(215, 255, 210, ${0.18 * stripeVis * flicker})`
            : `rgba(8, 45, 22, ${0.12 * stripeVis})`;
        ctx.beginPath();
        ctx.moveTo(topX, 430);
        ctx.lineTo(topX + 48, 430);
        ctx.lineTo(botX + 62, 550);
        ctx.lineTo(botX, 550);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    // =========================================================================
    // LAYER 5: HERO SERVICE ACTION STAGE (Depth 0.92)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 0.92, -driftY * 0.78);

    // Exact analytic contour for Layer 5 working lawn so every wheel, bed & blade sits 100% grounded
    const getHill5Y = (x) =>
      534 - 22 * Math.sin(((x + 80) / 1440) * Math.PI) + 9 * Math.sin(x * 0.0052);

    const traceHill5Path = () => {
      ctx.moveTo(-100, getHill5Y(-100));
      for (let x = -60; x <= W + 120; x += 40) {
        ctx.lineTo(x, getHill5Y(x));
      }
      ctx.lineTo(W + 120, H + 100);
      ctx.lineTo(-100, H + 100);
      ctx.closePath();
    };

    // Main Foreground Working Lawn Shelf
    drawPaperSheet(traceHill5Path, pal.l5, 5, 0.48);

    // --- ACT 1 (0.0s – 4.0s): REFINED PAPER-CUT SPRING MOWING & VELVET STRIPING ---
    const act1Vis = 1 - smoothstep(3.35, 3.95, t);
    if (act1Vis > 0.01) {
      const p = smoothstep(0.08, 3.55, t);
      const mxPos = lerp(125, 1100, p);
      const groundY = getHill5Y(mxPos);
      // Slope tangent angle so the mower tilts naturally over the rolling hill
      const slopeAngle = Math.atan2(
        getHill5Y(mxPos + 20) - getHill5Y(mxPos - 20),
        40
      );

      ctx.save();
      ctx.globalAlpha = act1Vis;

      // 1) Graceful Paper-Cut Morning Swallows & Volumetric Dawn Sunbeams
      if (isLit) {
        ctx.save();
        for (let b = 0; b < 3; b++) {
          const bx = 240 + b * 290 + Math.sin(t * 0.7 + b) * 16;
          const ray = ctx.createLinearGradient(bx, 50, bx + 150, 560);
          ray.addColorStop(0, `rgba(255, 250, 215, ${0.13 * flicker})`);
          ray.addColorStop(0.65, `rgba(255, 245, 200, ${0.04 * flicker})`);
          ray.addColorStop(1, "rgba(255, 245, 200, 0)");
          ctx.fillStyle = ray;
          ctx.beginPath();
          ctx.moveTo(bx - 30, 50);
          ctx.lineTo(bx + 50, 50);
          ctx.lineTo(bx + 220, 560);
          ctx.lineTo(bx + 85, 560);
          ctx.closePath();
          ctx.fill();
        }
        // Gliding paper-cut birds across morning sky
        ctx.strokeStyle = rgb(pal.l4, 0.75);
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          const birdX = 280 + i * 110 + t * (48 + i * 8);
          const birdY = 175 + i * 24 + Math.sin(t * 3 + i) * 12;
          const flap = Math.sin(t * 9 + i * 1.6) * 7;
          ctx.beginPath();
          ctx.moveTo(birdX - 14, birdY - flap);
          ctx.quadraticCurveTo(birdX - 6, birdY - 6, birdX, birdY);
          ctx.quadraticCurveTo(birdX + 6, birdY - 6, birdX + 14, birdY - flap);
          ctx.stroke();
        }
        // Twinkling morning dew pollen
        for (const sp of SPRING_POLLEN) {
          const px = (sp.x0 + t * sp.driftX) % W;
          const py = ((sp.y0 + t * sp.driftY) % 440 + 440) % 440 + 90;
          const twinkle = 0.35 + 0.65 * Math.sin(t * 4.5 + sp.phase);
          ctx.fillStyle = `rgba(255, 252, 220, ${twinkle * 0.65 * flicker})`;
          ctx.beginPath();
          ctx.arc(px, py, sp.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2) Velvet Estate Diamond Stripes — Clipped Strictly Inside Layer 5's Curved Hill!
      ctx.save();
      ctx.beginPath();
      traceHill5Path();
      ctx.clip();

      ctx.beginPath();
      ctx.rect(-80, 480, Math.max(0, mxPos + 100), 260);
      ctx.clip();

      for (let i = -2; i < 14; i++) {
        const topX = 110 + i * 88;
        const botX = 10 + i * 116;
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(210, 255, 198, ${0.24 * flicker})`
            : `rgba(4, 34, 16, ${0.24})`;
        ctx.beginPath();
        ctx.moveTo(topX, 490);
        ctx.lineTo(topX + 44, 490);
        ctx.lineTo(botX + 58, 635);
        ctx.lineTo(botX, 635);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3) Organic Meadow Grass & Wildflowers Ahead -> Crisp Trimmed Velvet Behind
      ctx.save();
      ctx.lineCap = "round";
      for (let gx = 40; gx < 1240; gx += 10) {
        const gy = getHill5Y(gx);
        const cutDist = gx - (mxPos + 46);
        const tall = smoothstep(-14, 24, cutDist);
        const h = lerp(5, 24 + (gx % 5) * 3.8, tall);
        const sway = Math.sin(t * 3.5 + gx * 0.06) * (1 + tall * 5);

        ctx.strokeStyle = tall > 0.45 ? rgb(pal.l4, 0.92) : rgb(pal.rim, 0.52 * flicker);
        ctx.lineWidth = tall > 0.45 ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy + 4);
        ctx.quadraticCurveTo(gx + sway * 0.5, gy - h * 0.5, gx + sway, gy - h);
        ctx.stroke();

        // Delicate backlit dandelion / spring wildflower tips in uncut grass ahead
        if (tall > 0.85 && gx % 70 === 0) {
          ctx.fillStyle = `rgba(255, 246, 175, ${0.85 * flicker})`;
          ctx.beginPath();
          ctx.arc(gx + sway, gy - h - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 4) Sculpted Paper-Cut Commercial Zero-Turn Mower (Grounded to Hill Slope)
      ctx.save();
      ctx.translate(mxPos, groundY + Math.sin(t * 50) * 0.6);
      ctx.rotate(slopeAngle);

      // Soft contact shadow directly under tires & deck so it sits flush on the hill
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.beginPath();
      ctx.ellipse(12, 3, 76, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft warm dawn headlight cone illuminating uncut grass ahead
      if (isLit) {
        const beam = ctx.createLinearGradient(68, -22, 275, 4);
        beam.addColorStop(0, `rgba(255, 250, 210, ${0.36 * flicker})`);
        beam.addColorStop(0.65, `rgba(255, 248, 200, ${0.08 * flicker})`);
        beam.addColorStop(1, "rgba(255, 248, 200, 0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(68, -26);
        ctx.lineTo(275, -48);
        ctx.lineTo(275, 16);
        ctx.lineTo(68, -10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowColor = "rgba(0,0,0,0.48)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      // Angled Tubular ROPS Roll Bar (Sleek double-post silhouette)
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-42, -30);
      ctx.lineTo(-50, -96);
      ctx.lineTo(-34, -96);
      ctx.lineTo(-28, -32);
      ctx.stroke();

      // Sculpted Operator Silhouette (Natural curved back, brimmed cap, lap-bar arms, bent knee)
      ctx.fillStyle = rgb(pal.l6);
      // Head & curved cap brim
      ctx.beginPath();
      ctx.arc(-8, -76, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-14, -85);
      ctx.quadraticCurveTo(6, -88, 16, -79);
      ctx.lineTo(-10, -79);
      ctx.closePath();
      ctx.fill();
      // Contoured torso & shoulders
      ctx.beginPath();
      ctx.moveTo(-22, -62);
      ctx.quadraticCurveTo(-8, -66, 4, -60);
      ctx.quadraticCurveTo(10, -42, 4, -26);
      ctx.lineTo(-22, -26);
      ctx.quadraticCurveTo(-27, -42, -22, -62);
      ctx.closePath();
      ctx.fill();
      // Arm gripping angled steering lap-bar
      ctx.beginPath();
      ctx.moveTo(-2, -55);
      ctx.quadraticCurveTo(14, -48, 28, -42);
      ctx.lineTo(25, -34);
      ctx.quadraticCurveTo(10, -40, -6, -45);
      ctx.closePath();
      ctx.fill();
      // Steering lap bar lever
      ctx.strokeStyle = rgb(pal.l7);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(27, -40);
      ctx.lineTo(18, -18);
      ctx.stroke();
      // Bent leg & boot resting on footplate
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(-6, -32);
      ctx.lineTo(24, -28);
      ctx.lineTo(36, -12);
      ctx.lineTo(24, -10);
      ctx.lineTo(14, -20);
      ctx.lineTo(-8, -22);
      ctx.closePath();
      ctx.fill();

      // Contoured High-Back Seat & Sloped Commercial Rear Engine Hood
      ctx.beginPath();
      ctx.moveTo(-64, -12);
      ctx.quadraticCurveTo(-60, -34, -36, -36);
      ctx.lineTo(48, -28);
      ctx.quadraticCurveTo(66, -24, 74, -10);
      ctx.lineTo(-64, -10);
      ctx.closePath();
      ctx.fill();

      // Subtle Blade Motion Glow under Deck
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(250, 204, 21, 0.65)";
      ctx.fillStyle = `rgba(254, 249, 195, ${0.38 + 0.3 * Math.sin(t * 62)})`;
      ctx.fillRect(6, -3, 62, 3);
      ctx.restore();

      // Floating 60" Commercial Deck (Sleek sloped gold fascia + anti-scalp roller)
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.moveTo(2, -16);
      ctx.lineTo(66, -16);
      ctx.lineTo(74, -4);
      ctx.lineTo(-2, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgb(pal.rim, 0.7 * flicker);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Front Anti-Scalp Deck Roller
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(64, -4, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Chunky Deep-Tread Rear Turf Tire (Grounded at y=0)
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(-36, -20, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(-36, -20);
      ctx.rotate(t * 9.5);
      ctx.strokeStyle = rgb(pal.l4);
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();
      ctx.restore();

      // Front Swivel Caster Fork & Wheel (Grounded at y=0)
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(74, -14);
      ctx.lineTo(78, -9);
      ctx.stroke();
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(78, -9, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgb(pal.l4);
      ctx.beginPath();
      ctx.arc(78, -9, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 5) Crisp Backlit Cut-Grass Rooster-Tail Plume arcing out from side chute
      ctx.shadowBlur = 0;
      for (const gm of GRASS_MIST) {
        const gp = (t * 2.5 + gm.phase) % 1;
        const gx = 12 - gp * gm.speed * 1.05;
        const gy = -8 + Math.sin(gm.angle) * gp * 54 + gp * gp * 34;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(gp * gm.rot + gm.angle);
        ctx.globalAlpha = act1Vis * (1 - gp) * 0.9;
        ctx.strokeStyle = gp < 0.45 ? rgb(pal.rim) : rgb(pal.l3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-gm.len * 0.5, 0);
        ctx.lineTo(gm.len * 0.5, 0);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      ctx.restore();
    }

    // --- ACT 2 (3.5s – 7.6s): ARCHITECTURAL MULCH GARDEN BED & CORE AERATION ---
    const act2Vis = smoothstep(3.45, 4.0, t) * (1 - smoothstep(7.05, 7.65, t));
    if (act2Vis > 0.01) {
      ctx.save();
      ctx.globalAlpha = act2Vis;

      const bedGrow = smoothstep(3.55, 5.4, t);

      // 1) Sculpted S-Curve 3" Trench-Edged Estate Mulch Bed (Grounded cleanly into Layer 5)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(40, getHill5Y(40) + 18);
      ctx.bezierCurveTo(
        210,
        getHill5Y(210) - 24 * bedGrow,
        420,
        getHill5Y(420) - 18 * bedGrow,
        595,
        getHill5Y(595) + 16
      );
      ctx.lineTo(595, H + 60);
      ctx.lineTo(40, H + 60);
      ctx.closePath();
      ctx.fillStyle = rgb(pal.l6);
      ctx.fill();
      // Deep 3" vertical trench bevel shadow + warm backlit lip
      ctx.strokeStyle = rgb(pal.rim, 0.72 * flicker);
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Subtle layered bark texture ripples inside the freshly mulched bed
      ctx.strokeStyle = rgb(pal.l5, 0.42);
      ctx.lineWidth = 1.6;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(110 + r * 35, 545 + r * 14);
        ctx.quadraticCurveTo(310, 526 + r * 14, 515 - r * 20, 548 + r * 14);
        ctx.stroke();
      }
      ctx.restore();

      // 2) Ornamental Japanese Maple & Graceful Swaying Fountain Grasses in the Mulch Bed
      ctx.save();
      const bedBaseY = getHill5Y(255) - 6;
      const breeze = Math.sin(t * 2.4) * 5;

      // Sculpted Ornamental Dwarf Maple Silhouette (Paper-cut layered canopy)
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(248, bedBaseY + 14);
      ctx.quadraticCurveTo(254, bedBaseY - 38, 240, bedBaseY - 72);
      ctx.quadraticCurveTo(260, bedBaseY - 42, 266, bedBaseY + 14);
      ctx.closePath();
      ctx.fill();
      // Graceful tiered foliage clouds
      const drawCanopyCloud = (cx, cy, rx, ry) => {
        ctx.beginPath();
        ctx.ellipse(cx + breeze * 0.6, cy, rx, ry, -0.08, 0, Math.PI * 2);
        ctx.fill();
      };
      ctx.fillStyle = rgb(pal.l6);
      drawCanopyCloud(236, bedBaseY - 78, 46, 20);
      drawCanopyCloud(268, bedBaseY - 94, 38, 17);
      drawCanopyCloud(214, bedBaseY - 66, 30, 14);
      // Warm backlit top highlight on maple leaves
      ctx.strokeStyle = rgb(pal.rim, 0.45 * flicker);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(268 + breeze * 0.6, bedBaseY - 94, 34, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Graceful Weeping Fountain Grasses flanking the bed
      ctx.strokeStyle = rgb(pal.l7, 0.92);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      for (const fx of [152, 342]) {
        const fy = getHill5Y(fx) + 4;
        for (let b = -3; b <= 3; b++) {
          const arcH = (34 - Math.abs(b) * 4) * (0.65 + 0.35 * bedGrow);
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.quadraticCurveTo(
            fx + b * 8 + breeze * 0.4,
            fy - arcH,
            fx + b * 17 + breeze,
            fy - arcH * 0.55
          );
          ctx.stroke();
        }
      }

      // Wrought-Iron Shepherd's Hook Garden Lantern with Warm Amber Bloom
      const lanX = 430;
      const lanY = getHill5Y(lanX) + 4;
      ctx.strokeStyle = rgb(pal.l7);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(lanX, lanY);
      ctx.lineTo(lanX, lanY - 62);
      ctx.bezierCurveTo(lanX, lanY - 78, lanX + 20, lanY - 78, lanX + 20, lanY - 62);
      ctx.stroke();
      // Hanging lantern housing
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.moveTo(lanX + 12, lanY - 58);
      ctx.lineTo(lanX + 20, lanY - 65);
      ctx.lineTo(lanX + 28, lanY - 58);
      ctx.closePath();
      ctx.fill();
      if (isLit) {
        const lanPulse = 0.86 + 0.14 * Math.sin(t * 6.2);
        // Warm spill halo onto mulch bed
        const spill = ctx.createRadialGradient(lanX + 20, lanY - 52, 2, lanX + 20, lanY - 40, 56);
        spill.addColorStop(0, `rgba(255, 236, 165, ${0.75 * lanPulse * flicker})`);
        spill.addColorStop(0.45, `rgba(255, 200, 110, ${0.22 * lanPulse * flicker})`);
        spill.addColorStop(1, "rgba(255, 200, 110, 0)");
        ctx.fillStyle = spill;
        ctx.beginPath();
        ctx.arc(lanX + 20, lanY - 46, 56, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 248, 210, ${lanPulse * flicker})`;
        ctx.beginPath();
        ctx.roundRect(lanX + 15.5, lanY - 57, 9, 12, 2);
        ctx.fill();
      }
      ctx.restore();

      // 3) Refined Paper-Cut Gardener Silhouette Raking Smooth Mulch Waves
      const rakeSwing = Math.sin(t * 4.2);
      const gxPos = 515;
      const gyPos = getHill5Y(gxPos);
      ctx.save();
      ctx.translate(gxPos, gyPos);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 3, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = rgb(pal.l6);
      // Brimmed Sun Hat & Head
      ctx.beginPath();
      ctx.arc(-4 + rakeSwing * 3, -76, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-4 + rakeSwing * 3, -84, 19, 4.5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Natural Curved Leaning Torso
      ctx.beginPath();
      ctx.moveTo(-14 + rakeSwing * 4, -64);
      ctx.quadraticCurveTo(0 + rakeSwing * 4, -66, 8 + rakeSwing * 4, -60);
      ctx.quadraticCurveTo(10, -40, 4, -26);
      ctx.lineTo(-14, -26);
      ctx.quadraticCurveTo(-20, -42, -14 + rakeSwing * 4, -64);
      ctx.closePath();
      ctx.fill();
      // Planted Stance Legs
      ctx.beginPath();
      ctx.moveTo(-12, -28);
      ctx.lineTo(-22, 2);
      ctx.lineTo(-12, 2);
      ctx.lineTo(-2, -26);
      ctx.lineTo(12, 2);
      ctx.lineTo(22, 2);
      ctx.lineTo(6, -28);
      ctx.closePath();
      ctx.fill();

      // Sweeping Landscape Rake smoothing fresh dark mulch
      const rakeTipX = -58 + rakeSwing * 22;
      ctx.strokeStyle = rgb(pal.l5);
      ctx.lineWidth = 3.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(12 + rakeSwing * 5, -52);
      ctx.lineTo(rakeTipX, -2);
      ctx.stroke();
      // Rake Head
      ctx.strokeStyle = rgb(pal.accent);
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(rakeTipX - 10, -4);
      ctx.lineTo(rakeTipX + 10, 2);
      ctx.stroke();

      // Delicate sunlit bark chips & dust rising from the rake sweep
      for (const mc of MULCH_CHIPS) {
        const mp = (t * 1.4 + mc.phase) % 1;
        const cx = rakeTipX - mp * mc.vx * 0.55;
        const cy = -4 + mp * mc.vy * 0.45 + mp * mp * 75;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(mp * mc.rot);
        ctx.globalAlpha = act2Vis * (1 - mp) * 0.85;
        ctx.fillStyle = mp < 0.4 ? rgb(pal.rim) : rgb(pal.l7);
        ctx.fillRect(-mc.w * 0.45, -mc.h * 0.45, mc.w * 0.9, mc.h * 0.9);
        ctx.restore();
      }
      ctx.restore();

      // 4) Sleek Walk-Behind Commercial Core Aerator Gliding Across Right Turf
      const aeroP = smoothstep(3.6, 7.25, t);
      const ax = lerp(665, 1085, aeroP);
      const ay = getHill5Y(ax);
      const aSlope = Math.atan2(getHill5Y(ax + 20) - getHill5Y(ax - 20), 40);

      ctx.save();
      ctx.translate(ax, ay + Math.sin(t * 42) * 0.6);
      ctx.rotate(aSlope);

      // Ground contact shadow
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(-6, 3, 56, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;

      // Refined Operator Silhouette walking smoothly
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.arc(-44, -76, 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-50, -84);
      ctx.quadraticCurveTo(-34, -86, -24, -79);
      ctx.lineTo(-46, -79);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-54, -63);
      ctx.quadraticCurveTo(-40, -66, -32, -60);
      ctx.lineTo(-36, -26);
      ctx.lineTo(-56, -26);
      ctx.closePath();
      ctx.fill();

      const stride = Math.sin(t * 8.5) * 10;
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-48, -28);
      ctx.lineTo(-56 + stride, 0);
      ctx.moveTo(-40, -28);
      ctx.lineTo(-32 - stride, 0);
      ctx.stroke();

      // Curved Ergonomic Handlebar Loop
      ctx.strokeStyle = rgb(pal.l7);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-34, -48);
      ctx.quadraticCurveTo(-8, -44, 14, -18);
      ctx.stroke();

      // Sloped Commercial Aerator Hood & Emerald Engine Shroud
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.roundRect(6, -34, 48, 22, 6);
      ctx.fill();
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.roundRect(14, -44, 30, 14, 4);
      ctx.fill();
      ctx.strokeStyle = rgb(pal.rim, 0.55 * flicker);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Rotating Hollow-Tine Drum (Grounded at y=0)
      ctx.save();
      ctx.translate(34, -14);
      ctx.rotate(t * 6.8);
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgb(pal.l7);
      ctx.lineWidth = 3.8;
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * -20, Math.sin(ang) * -20);
        ctx.lineTo(Math.cos(ang) * 20, Math.sin(ang) * 20);
        ctx.stroke();
      }
      ctx.restore();

      // Rear Transport Wheel
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(4, -10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Popping Cylindrical Soil Core Plugs arcing upward from the tines
      ctx.shadowBlur = 0;
      for (const cp of CORE_PLUGS) {
        const pTime = (t * 2.0 + cp.phase) % 1;
        const px = 22 + pTime * cp.vx;
        const py = -8 + pTime * cp.vy * 0.8 + pTime * pTime * 90;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(pTime * cp.rot);
        ctx.globalAlpha = act2Vis * (1 - pTime * 0.72);
        ctx.fillStyle = rgb(pal.l4);
        ctx.fillRect(-2.5, -5.5, 5, 11);
        ctx.restore();
      }
      ctx.restore();

      // Settled Core Plugs resting cleanly on the hill contour behind the aerator
      ctx.fillStyle = rgb(pal.l4, 0.88);
      for (let rx = 640; rx < ax - 24; rx += 32) {
        const ry = getHill5Y(rx) + 4;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate((rx % 7) * 0.35 - 0.8);
        ctx.fillRect(-2.2, -5, 4.4, 10);
        ctx.restore();
      }

      // 5) Luminous Golden Overseed Veil & Sprouting Multi-Blade Emerald Turf
      for (const sd of SEEDS) {
        const sp = (t * 1.1 + sd.phase) % 1;
        ctx.fillStyle = rgb(pal.sun, (1 - sp) * 0.9 * act2Vis * flicker);
        ctx.beginPath();
        ctx.arc(sd.x + sp * 16, sd.y0 + sp * 120, sd.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const sproutGrow = smoothstep(4.2, 6.4, t);
      ctx.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const bx = 620 + i * 40;
        const by = getHill5Y(bx) + 5;
        const localGrow = clamp(sproutGrow * 1.4 - i * 0.04, 0, 1);
        if (localGrow <= 0.02) continue;
        const baseH = (18 + (i % 3) * 8) * localGrow;
        const sw = Math.sin(t * 3.2 + i) * 4;
        ctx.strokeStyle = i % 2 === 0 ? rgb(pal.accent, 0.92) : rgb(pal.rim, 0.75 * flicker);
        ctx.lineWidth = 2.6;
        for (let b = -1; b <= 1; b++) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(
            bx + b * 5 + sw * 0.5,
            by - baseH * 0.55,
            bx + b * 10 + sw,
            by - baseH * (b === 0 ? 1.15 : 0.82)
          );
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // --- ACT 3 (7.2s – 11.4s): FALL CLEANUP BLOWER CREW & SWIRLING LEAF STREAM ---
    const act3Vis = smoothstep(7.15, 7.75, t) * (1 - smoothstep(10.85, 11.45, t));
    if (act3Vis > 0.01) {
      ctx.save();
      ctx.globalAlpha = act3Vis;

      // Growing Curbside Compost Leaf Mound on Right
      const pileGrow = smoothstep(7.5, 10.6, t);
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(860, 565);
      ctx.bezierCurveTo(
        910,
        525 - pileGrow * 52,
        1060,
        510 - pileGrow * 62,
        1150,
        565
      );
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgb(pal.rim, 0.45 * flicker);
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Landscaper Silhouette with Commercial Backpack Blower
      const walkX = lerp(310, 490, smoothstep(7.4, 10.8, t));
      ctx.save();
      ctx.translate(walkX, 434);
      ctx.fillStyle = rgb(pal.l6);
      // Head & cap
      ctx.beginPath();
      ctx.arc(0, -24, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-8, -34, 28, 6);
      // Backpack blower unit
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.roundRect(-30, -8, 18, 42, 4);
      ctx.fill();
      // Torso
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.lineTo(14, -10);
      ctx.lineTo(8, 42);
      ctx.lineTo(-16, 42);
      ctx.closePath();
      ctx.fill();
      // Legs walking
      const step = Math.sin(t * 7.5) * 11;
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 11;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-8, 40);
      ctx.lineTo(-18 + step, 84);
      ctx.moveTo(4, 40);
      ctx.lineTo(18 - step, 84);
      ctx.stroke();
      // Sweeping Blower Tube
      const sweep = Math.sin(t * 4.2) * 8;
      ctx.strokeStyle = rgb(pal.l7);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(92, 48 + sweep);
      ctx.stroke();

      // Animated Air-Stream Ribbons from Blower Nozzle
      ctx.strokeStyle = rgb(pal.rim, 0.55 * flicker);
      ctx.lineWidth = 2.2;
      for (let w = 0; w < 3; w++) {
        const wp = (t * 2.8 + w * 0.33) % 1;
        const ax0 = 98 + wp * 140;
        const ay0 = 50 + sweep + (w - 1) * 14;
        ctx.globalAlpha = act3Vis * (1 - wp) * 0.7;
        ctx.beginPath();
        ctx.moveTo(ax0, ay0);
        ctx.quadraticCurveTo(ax0 + 35, ay0 - 10, ax0 + 70, ay0 - 4);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }

    // --- ACT 4 (11.0s – 15.0s): WINTER SNOW PLOW CLEARING DEEP ROAD SNOWDRIFTS ---
    const act4Vis = smoothstep(10.95, 11.55, t) * (1 - smoothstep(14.35, 14.95, t));
    if (act4Vis > 0.01) {
      const plowP = smoothstep(11.05, 14.55, t);
      const px = lerp(95, 1020, plowP);
      const plowGroundY = getHill5Y(px);
      const plowSlope = Math.atan2(
        getHill5Y(px + 24) - getHill5Y(px - 24),
        48
      );
      const bladeX = px + 166;

      ctx.save();
      ctx.globalAlpha = act4Vis;

      // 1) Cleared Dark Asphalt Road Swath Behind the Plow (Glistening with Brine/Salt)
      ctx.save();
      ctx.beginPath();
      traceHill5Path();
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(-80, getHill5Y(-80) - 2);
      for (let x = -60; x <= bladeX; x += 24) {
        ctx.lineTo(x, getHill5Y(x) - 2);
      }
      ctx.lineTo(bladeX, getHill5Y(bladeX) + 54);
      for (let x = bladeX; x >= -80; x -= 24) {
        ctx.lineTo(x, getHill5Y(x) + 54);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(10, 16, 28, 0.85)";
      ctx.fill();

      // Subtle Glistening Pet-Safe Brine / Salt Sparkles on Cleared Road
      for (let sx = 40; sx < bladeX - 30; sx += 26) {
        const sy = getHill5Y(sx) + 14 + ((sx * 13) % 24);
        const glint = 0.25 + 0.55 * Math.sin(t * 5 + sx * 0.15);
        ctx.fillStyle = `rgba(220, 240, 255, ${glint * 0.55 * flicker})`;
        ctx.fillRect(sx, sy, 4, 2);
      }

      // 2) DEEP HEAVY SNOWDRIFTS PILED THICK ON THE UNPLOWED ROAD AHEAD OF THE BLADE!
      if (bladeX < W + 100) {
        // Outer deep snowpack layer (soft ice-blue shadow base)
        ctx.beginPath();
        ctx.moveTo(bladeX - 8, getHill5Y(bladeX - 8) + 46);
        ctx.lineTo(bladeX - 4, getHill5Y(bladeX - 4) - 26);
        for (let x = bladeX; x <= W + 120; x += 22) {
          const driftH = 26 + 11 * Math.sin(x * 0.017) + 6 * Math.cos(x * 0.041);
          ctx.lineTo(x, getHill5Y(x) - driftH);
        }
        ctx.lineTo(W + 120, getHill5Y(W + 120) + 62);
        for (let x = W + 120; x >= bladeX - 8; x -= 24) {
          ctx.lineTo(x, getHill5Y(x) + 56);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(226, 240, 255, ${0.95 * flicker})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * flicker})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Sculpted upper snowdrift ridges (bright white backlit snow pillows)
        ctx.beginPath();
        ctx.moveTo(bladeX, getHill5Y(bladeX) + 12);
        for (let x = bladeX; x <= W + 120; x += 20) {
          const crest = 18 + 9 * Math.sin(x * 0.022 + 1.1);
          ctx.lineTo(x, getHill5Y(x) - crest);
        }
        ctx.lineTo(W + 120, getHill5Y(W + 120) + 22);
        ctx.closePath();
        ctx.fillStyle = `rgba(248, 252, 255, ${0.88 * flicker})`;
        ctx.fill();
      }

      // Pushed Snowbank Berm along the Far Edge of the Cleared Road
      ctx.beginPath();
      ctx.moveTo(-80, getHill5Y(-80) + 52);
      for (let x = -60; x <= bladeX; x += 24) {
        const berm = 14 + 5 * Math.sin(x * 0.03);
        ctx.lineTo(x, getHill5Y(x) + 48 - berm);
      }
      ctx.lineTo(bladeX, getHill5Y(bladeX) + 66);
      ctx.lineTo(-80, getHill5Y(-80) + 66);
      ctx.closePath();
      ctx.fillStyle = `rgba(215, 232, 250, ${0.85 * flicker})`;
      ctx.fill();

      ctx.restore(); // End Hill5 clip

      // Unclipped Snowdrifts mounding ABOVE the road horizon ahead of the plow blade
      if (bladeX < W + 100) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.moveTo(bladeX - 6, getHill5Y(bladeX - 6) + 8);
        for (let x = bladeX; x <= W + 120; x += 20) {
          const driftH = 22 + 12 * Math.sin(x * 0.018) + 6 * Math.cos(x * 0.037);
          ctx.lineTo(x, getHill5Y(x) - driftH);
        }
        ctx.lineTo(W + 120, getHill5Y(W + 120) + 12);
        ctx.closePath();
        ctx.fillStyle = `rgba(240, 248, 255, ${0.94 * flicker})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * flicker})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 3) Heavy-Duty Snow Plow Truck Grounded to Hill Slope
      ctx.save();
      ctx.translate(px, plowGroundY + 14 + Math.sin(t * 44) * 0.7);
      ctx.rotate(plowSlope);

      // Glowing Headlight Cone cutting through winter blizzard & lighting the snowdrifts
      if (isLit) {
        const beam = ctx.createLinearGradient(120, -48, 450, 10);
        beam.addColorStop(0, "rgba(255, 244, 195, 0.56)");
        beam.addColorStop(0.55, "rgba(255, 240, 180, 0.18)");
        beam.addColorStop(1, "rgba(255, 240, 180, 0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(118, -52);
        ctx.lineTo(450, -90);
        ctx.lineTo(450, 26);
        ctx.lineTo(118, -28);
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;

      // Plow Truck Bed & Cab
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(-78, -70);
      ctx.lineTo(28, -70);
      ctx.lineTo(54, -54);
      ctx.lineTo(120, -50);
      ctx.lineTo(120, -14);
      ctx.lineTo(-82, -14);
      ctx.closePath();
      ctx.fill();

      // Warm Lit Cab Window
      if (isLit) {
        ctx.save();
        ctx.shadowColor = rgb(pal.window, 0.9);
        ctx.shadowBlur = 14;
        ctx.fillStyle = rgb(pal.window, 0.92 * flicker);
        ctx.beginPath();
        ctx.roundRect(2, -62, 34, 22, 3);
        ctx.fill();
        ctx.restore();
      }

      // Commercial Angled V-Plow Blade (Amber Gold Accent)
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.moveTo(120, -46);
      ctx.lineTo(166, -60);
      ctx.lineTo(172, -6);
      ctx.lineTo(120, -12);
      ctx.closePath();
      ctx.fill();

      // Heavy-Duty Snow Tires (Grounded at y=0, rotating)
      for (const wx of [-44, 86]) {
        ctx.fillStyle = rgb(pal.l7);
        ctx.beginPath();
        ctx.arc(wx, -12, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(wx, -12);
        ctx.rotate(t * 7.5);
        ctx.strokeStyle = rgb(pal.l4);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.moveTo(-9, 0);
        ctx.lineTo(9, 0);
        ctx.moveTo(0, -9);
        ctx.lineTo(0, 9);
        ctx.stroke();
        ctx.restore();
      }

      // Strobing Roof Amber Warning Beacon
      if (isLit) {
        const strobe = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(t * 14)), 2);
        ctx.save();
        ctx.shadowColor = "rgba(245, 158, 11, 1)";
        ctx.shadowBlur = 24 * strobe;
        ctx.fillStyle = `rgba(251, 191, 36, ${strobe})`;
        ctx.beginPath();
        ctx.arc(14, -76, 7 + strobe * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4) Massive Roaring Backlit Snow Plume & Flying Snow Clumps Billowing Off the V-Plow!
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(244, 250, 255, ${0.92 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(166, -6);
      ctx.quadraticCurveTo(212, -82 - Math.sin(t * 13) * 10, 280, -30);
      ctx.quadraticCurveTo(238, -8, 170, -2);
      ctx.closePath();
      ctx.fill();

      // Secondary flying snow powder & chunks arcing over the snowbank
      for (let sc = 0; sc < 14; sc++) {
        const sp = (t * 2.4 + sc * 0.071) % 1;
        const sx = 168 + sp * (95 + (sc % 4) * 28);
        const sy = -18 - Math.sin(sp * Math.PI) * (58 + (sc % 3) * 20) + sp * 24;
        const sr = (3.5 + (sc % 3) * 2.2) * (1 - sp * 0.45);
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - sp) * 0.9 * flicker})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
    }

    ctx.restore(); // End Layer 5

    // =========================================================================
    // ATMOSPHERIC PARTICLES: FALL LEAVES & WINTER SNOW ACROSS DEPTHS
    // =========================================================================
    // Autumn Swirling Cut-Paper Leaves (7.0s -> 11.5s)
    const leafLayerVis = smoothstep(6.9, 7.7, t) * (1 - smoothstep(10.9, 11.5, t));
    if (leafLayerVis > 0.01) {
      ctx.save();
      for (const lf of FALL_LEAVES) {
        const lt = t - 7.0;
        const x = ((lf.x0 + lt * lf.speedX) % (W + 220)) - 110;
        const y =
          lf.y0 +
          Math.sin(t * lf.freq + lf.phase) * lf.amp +
          lt * lf.speedY * 0.25;
        const rot = t * lf.rotSpeed + lf.phase;

        ctx.save();
        ctx.translate(x - driftX * (0.4 + lf.depth * 0.7), y - driftY * 0.5);
        ctx.rotate(rot);
        ctx.globalAlpha = leafLayerVis * (0.55 + lf.depth * 0.45);
        ctx.fillStyle =
          lf.tone > 0.55
            ? rgb(pal.accent)
            : lf.tone > 0.25
            ? "rgb(249, 115, 22)"
            : "rgb(251, 191, 36)";
        // Crisp leaf diamond/maple silhouette
        ctx.beginPath();
        ctx.moveTo(0, -lf.size);
        ctx.quadraticCurveTo(lf.size * 0.85, -lf.size * 0.2, 0, lf.size);
        ctx.quadraticCurveTo(-lf.size * 0.85, -lf.size * 0.2, 0, -lf.size);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // Winter Multi-Depth Cut-Paper Snowfall (10.8s -> 15.0s)
    const snowVis = smoothstep(10.8, 11.6, t) * (1 - smoothstep(14.5, 15.0, t));
    if (snowVis > 0.01) {
      ctx.save();
      for (const sf of SNOW_FLAKES) {
        const y = ((sf.y0 + t * sf.speedY) % (H + 60)) - 30;
        const x =
          ((sf.x0 + t * sf.driftX + Math.sin(t * 1.8 + sf.phase) * sf.swayAmp) %
            (W + 120) +
            (W + 120)) %
            (W + 120) -
          60;
        ctx.fillStyle = `rgba(245, 250, 255, ${(0.38 + sf.depth * 0.58) * snowVis * flicker})`;
        ctx.beginPath();
        ctx.arc(x - driftX * sf.depth * 0.5, y, sf.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // =========================================================================
    // LAYER 6: FOREGROUND SPLIT-RAIL FENCE, HEDGES & CURB (Depth 1.25)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 1.25, -driftY * 1.05);
    drawPaperSheet(
      () => {
        ctx.moveTo(-100, 608);
        ctx.quadraticCurveTo(460, 572, 920, 604);
        ctx.quadraticCurveTo(1160, 616, W + 140, 592);
        ctx.lineTo(W + 140, H + 100);
        ctx.lineTo(-100, H + 100);
        ctx.closePath();

        // Sculpted Boxwood Hedges on Right
        ctx.arc(1070, 608, 44, Math.PI, 0);
        ctx.arc(1135, 612, 36, Math.PI, 0);
        ctx.arc(1190, 606, 40, Math.PI, 0);
      },
      pal.l6,
      6,
      0.38
    );

    // Split-Rail Fence on Left Foreground
    ctx.fillStyle = rgb(pal.l7);
    ctx.fillRect(92, 540, 14, 92);
    ctx.fillRect(256, 534, 14, 96);
    ctx.save();
    ctx.translate(90, 558);
    ctx.rotate(-0.03);
    ctx.fillRect(0, 0, 182, 9);
    ctx.fillRect(0, 26, 182, 9);
    ctx.restore();
    ctx.restore();

    // =========================================================================
    // LAYER 7: NEAR-FRAME BLACK VIGNETTE BRANCHES & SHADOWBOX APERTURE (Depth 1.65)
    // =========================================================================
    ctx.save();
    ctx.translate(-driftX * 1.65, -driftY * 1.35);
    drawPaperSheet(
      () => {
        // Top-left overhanging oak silhouette branch
        ctx.moveTo(-60, -40);
        ctx.bezierCurveTo(110, 45, 250, 75, 360, 28);
        ctx.bezierCurveTo(270, 78, 210, 145, 110, 168);
        ctx.bezierCurveTo(35, 180, -30, 130, -60, 85);
        ctx.closePath();

        // Top-right framing silhouette bough
        ctx.moveTo(W + 60, -40);
        ctx.bezierCurveTo(W - 140, 35, W - 210, 88, W - 290, 58);
        ctx.bezierCurveTo(W - 210, 118, W - 110, 152, W + 60, 118);
        ctx.closePath();

        // Bottom solid shadowbox lip
        ctx.rect(-100, H - 36, W + 200, 90);
      },
      pal.l7,
      7,
      0.0
    );
    ctx.restore();

    // =========================================================================
    // CINEMATIC VIGNETTE & OPENING/CLOSING TITLE EMBLEM
    // =========================================================================
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, W * 0.66);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(-60, -60, W + 120, H + 120);

    // Subtle Glass Reflection Sheen
    const glass = ctx.createLinearGradient(0, 0, W, H);
    glass.addColorStop(0, "rgba(255,255,255,0.06)");
    glass.addColorStop(0.28, "rgba(255,255,255,0.015)");
    glass.addColorStop(0.55, "rgba(255,255,255,0)");
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, W, H);

    // Opening (0.2s–1.7s) & Closing (14.15s–14.95s) Cinematic Title Card
    const introAlpha = smoothstep(0.15, 0.55, t) * (1 - smoothstep(1.35, 1.85, t));
    const outroAlpha = smoothstep(14.1, 14.45, t) * (1 - smoothstep(14.8, 15.0, t));
    const titleAlpha = Math.max(introAlpha, outroAlpha);

    if (titleAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(255, 248, 225, 0.96)";
      ctx.font = "900 44px system-ui, -apple-system, sans-serif";
      ctx.fillText("FLORA LAWN", W / 2, H * 0.25);
      ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
      ctx.font = "800 16px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        outroAlpha > introAlpha
          ? "FOUR SEASONS · RHODE ISLAND & MASSACHUSETTS"
          : "A 15-SECOND PAPER-CUT LIGHTBOX FILM",
        W / 2,
        H * 0.25 + 32
      );
      ctx.restore();
    }

    ctx.restore();
  }, []);

  // Main 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!grainPatternRef.current) {
      const grainCanvas = createPaperGrainCanvas();
      grainPatternRef.current = ctx.createPattern(grainCanvas, "repeat");
    }

    let rafId;
    const loop = (now) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      if (isPlayingRef.current) {
        timeRef.current = (timeRef.current + dt) % FILM_DURATION;
      }

      // Smoothly ease mouse parallax
      const targetX = mouseRef.current.hover ? mouseRef.current.x : 0;
      const targetY = mouseRef.current.hover ? mouseRef.current.y : 0;
      smoothMouseRef.current.x += (targetX - smoothMouseRef.current.x) * 0.08;
      smoothMouseRef.current.y += (targetY - smoothMouseRef.current.y) * 0.08;

      renderFrame(
        ctx,
        canvas.width,
        canvas.height,
        timeRef.current,
        smoothMouseRef.current.x,
        smoothMouseRef.current.y,
        lampOnRef.current
      );

      // Sync React UI state ~15fps to avoid unnecessary React re-renders
      if (now - uiSyncRef.current > 65) {
        uiSyncRef.current = now;
        setCurrentTime(timeRef.current);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [renderFrame]);

  // Mouse Parallax Handlers
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      hover: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.hover = false;
  };

  // Timeline Scrubber & Chapter Jump
  const seekTo = (sec) => {
    const clamped = clamp(sec, 0, FILM_DURATION - 0.01);
    timeRef.current = clamped;
    setCurrentTime(clamped);
  };

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    seekTo(ratio * FILM_DURATION);
  };

  // 1-Click 15-Second Video Export (WebM 60fps via MediaRecorder)
  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording || typeof MediaRecorder === "undefined") return;

    try {
      const stream = canvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6000000,
      });
      const chunks = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "flora-lawn-papercut-15s.webm";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setIsRecording(false);
        setRecordProgress(0);
      };

      // Reset to 0.0s, ensure playing & lamp lit, record exactly 15 seconds
      setLampOn(true);
      lampOnRef.current = true;
      setIsPlaying(true);
      isPlayingRef.current = true;
      timeRef.current = 0;
      setCurrentTime(0);
      setIsRecording(true);

      recorder.start();
      const startMs = performance.now();
      const progTimer = setInterval(() => {
        const elapsed = (performance.now() - startMs) / 1000;
        setRecordProgress(Math.min(100, Math.round((elapsed / FILM_DURATION) * 100)));
        if (elapsed >= FILM_DURATION) {
          clearInterval(progTimer);
          if (recorder.state !== "inactive") recorder.stop();
        }
      }, 150);
    } catch (err) {
      console.error("Video export failed:", err);
      setIsRecording(false);
    }
  };

  const progressPct = (currentTime / FILM_DURATION) * 100;
  const formatTime = (s) => `00:${s.toFixed(1).padStart(4, "0")}`;

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#060a12] via-[#0b121f] to-[#05080f] text-white overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* AMBIENT ROOM SPILL LIGHT */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[720px] rounded-full blur-[170px] pointer-events-none transition-all duration-1000"
        style={{
          background:
            safeChapterIdx === 0
              ? "#38bdf8"
              : safeChapterIdx === 1
              ? "#f97316"
              : safeChapterIdx === 2
              ? "#f59e0b"
              : "#94a3b8",
          opacity: lampOn ? 0.24 : 0.04,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
              <SparklesIcon className="w-4 h-4 text-amber-400 animate-pulse" />
              15-Second Paper-Cut Lightbox Film (纸雕灯)
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic leading-[1.08]">
              Four Seasons In{" "}
              <span className="inline-block whitespace-nowrap pr-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                15 Seconds
              </span>
            </h2>
            <p className="text-slate-400 font-medium text-base md:text-lg mt-3 leading-relaxed">
              Watch one continuous 60fps paper-cut shadow-box animation follow a Rhode Island home from Spring mowing to Winter snow defense.
            </p>
          </div>

          {/* TOP CONTROLS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setLampOn(!lampOn)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all active:scale-95 ${
                lampOn
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/15"
                  : "bg-slate-900/90 text-slate-500 border-slate-800 hover:text-slate-300"
              }`}
            >
              <SunIcon className={`w-4 h-4 ${lampOn ? "text-amber-400" : "text-slate-600"}`} />
              {lampOn ? "Lamp Lit" : "Lamp Off"}
            </button>

            <button
              onClick={handleExportVideo}
              disabled={isRecording}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all active:scale-95 ${
                isRecording
                  ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                  : "bg-slate-900/90 text-slate-200 border-slate-800 hover:border-amber-500/40 hover:text-amber-300"
              }`}
              title="Record and download this 15-second animation as a 60fps video"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {isRecording ? `Recording ${recordProgress}%` : "Save 15s Video"}
            </button>
          </div>
        </div>

        {/* 4-ACT INTERACTIVE STORYBOARD STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          {CHAPTERS.map((ch, idx) => {
            const isActive = idx === safeChapterIdx;
            const isDone = currentTime >= ch.end;
            const chapterPct = isDone
              ? 100
              : isActive
              ? clamp(((currentTime - ch.start) / (ch.end - ch.start)) * 100, 0, 100)
              : 0;

            return (
              <button
                key={ch.id}
                onClick={() => seekTo(ch.start + 0.05)}
                className={`group relative text-left rounded-2xl p-3.5 md:p-4 border transition-all duration-300 overflow-hidden backdrop-blur-md active:scale-[0.98] ${
                  isActive
                    ? `${ch.accentRing} shadow-xl -translate-y-0.5`
                    : "bg-slate-900/65 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                }`}
              >
                {/* Top row: Icon badge + Act label & timestamp */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm border transition-colors ${
                        isActive
                          ? "bg-slate-950/70 border-white/15 shadow-inner"
                          : "bg-slate-950/50 border-slate-800 group-hover:border-slate-700"
                      }`}
                    >
                      {ch.emoji}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        isActive ? ch.accentText : "text-slate-500 group-hover:text-slate-400"
                      }`}
                    >
                      Act 0{idx + 1}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? "bg-slate-950/60 border-white/10 text-slate-200"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-500"
                    }`}
                  >
                    {ch.timeLabel}
                  </span>
                </div>

                {/* Chapter Title & Subtitle */}
                <div className="pr-1">
                  <div
                    className={`font-black text-xs md:text-sm uppercase tracking-tight transition-colors ${
                      isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {ch.label}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                    {ch.shortSub}
                  </div>
                </div>

                {/* Live Per-Chapter Progress Bar along bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80">
                  <div
                    className={`h-full bg-gradient-to-r ${ch.accentBar} transition-all duration-100 ease-linear`}
                    style={{
                      width: `${chapterPct}%`,
                      opacity: isActive || isDone ? 1 : 0,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* MAIN STAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* PHYSICAL SHADOW BOX VIDEO FRAME */}
          <div className="lg:col-span-8">
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-[2.4rem] p-3.5 md:p-5 bg-gradient-to-br from-[#28170d] via-[#150c07] to-[#0a0503] border-4 border-[#3f2416] shadow-[0_35px_100px_rgba(0,0,0,0.95),inset_0_2px_6px_rgba(255,200,100,0.22)] overflow-hidden"
            >
              {/* BRASS CORNER HARDWARE */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-600/70 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-600/70 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-600/70 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-600/70 pointer-events-none" />

              {/* 16:9 HD CANVAS CAVITY */}
              <div className="relative w-full aspect-video rounded-[1.6rem] overflow-hidden bg-slate-950 border-2 border-black/90 shadow-[inset_0_18px_45px_rgba(0,0,0,0.95)]">
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="w-full h-full block cursor-pointer"
                  onClick={() => setIsPlaying((p) => !p)}
                />

                {/* LIVE VIDEO TRANSPORT & SCRUBBER OVERLAY */}
                <div className="absolute bottom-3 left-3 right-3 z-20">
                  <div className="backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl space-y-2.5">
                    {/* Interactive 15s Timeline Scrubber */}
                    <div
                      onClick={handleScrub}
                      className="relative h-2 w-full bg-slate-800/90 rounded-full cursor-pointer group overflow-hidden"
                      title="Click anywhere to scrub the 15-second film"
                    >
                      {/* Chapter tick marks */}
                      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/25 z-10" />
                      <div className="absolute left-2/4 top-0 bottom-0 w-px bg-white/25 z-10" />
                      <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/25 z-10" />

                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Controls + Caption Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setIsPlaying((p) => !p)}
                          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95"
                          aria-label={isPlaying ? "Pause animation" : "Play animation"}
                        >
                          {isPlaying ? (
                            <PauseIcon className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <PlayIcon className="w-4 h-4 stroke-[2.5] ml-0.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            seekTo(0);
                            setIsPlaying(true);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                          aria-label="Replay 15-second film"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-amber-300 ml-1">
                          {formatTime(currentTime)} <span className="text-slate-500">/ 00:15.0</span>
                        </span>
                      </div>

                      <p className="hidden sm:block text-xs text-slate-300 font-medium truncate">
                        <span className="text-amber-400 font-black uppercase mr-1.5">
                          {chapter.label}:
                        </span>
                        {chapter.storyStep}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LAMP BASE BRASS PLAQUE */}
              <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#b38f65]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Flora Lawn · 15s Continuous Film
                </span>
                <span className="hidden sm:inline opacity-75">
                  7-Layer Canvas2D Shadow Box (60fps)
                </span>
                <span>RI &amp; Southern MA</span>
              </div>
            </div>
          </div>

          {/* LIVE SYNCED SERVICE DETAIL CARD */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
            <div className="bg-slate-900/85 border border-slate-800/90 rounded-[2.2rem] p-7 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                  Act {safeChapterIdx + 1} of 4
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {chapter.seasonBadge}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">
                {chapter.title}
              </h3>

              <p className="text-amber-300/90 text-xs font-bold uppercase tracking-wide mb-6">
                {chapter.tagline}
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-8">
                {chapter.keyPoints.map((pt, idx) => (
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

              <div className="space-y-3">
                <Link
                  href={`/contact?service=${encodeURIComponent(chapter.serviceParam)}`}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
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
