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

    // SPRING CHAPTER: Luminous Alternating Diamond Turf Stripes (0.0s -> 4.1s)
    const stripeVis = 1 - smoothstep(3.3, 4.1, t);
    if (stripeVis > 0.01) {
      const mowerProgress = smoothstep(0.2, 3.3, t);
      const revealX = lerp(120, 1180, mowerProgress);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 435, revealX, 120);
      ctx.clip();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.22 * stripeVis * flicker})`;
      for (let i = 0; i < 9; i++) {
        const sx = 120 + i * 118;
        ctx.beginPath();
        ctx.moveTo(sx, 448);
        ctx.lineTo(sx + 54, 448);
        ctx.lineTo(sx + 128, 535);
        ctx.lineTo(sx + 64, 535);
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

    // Main Foreground Working Lawn Shelf
    drawPaperSheet(
      () => {
        ctx.moveTo(-80, 535);
        ctx.quadraticCurveTo(420, 495, 860, 528);
        ctx.quadraticCurveTo(1120, 545, W + 120, 518);
        ctx.lineTo(W + 120, H + 80);
        ctx.lineTo(-80, H + 80);
        ctx.closePath();
      },
      pal.l5,
      5,
      0.48
    );

    // --- ACT 1 (0.0s – 4.0s): COMMERCIAL ZERO-TURN MOWER & LIVE TURF CUTTING ---
    const act1Vis = 1 - smoothstep(3.35, 3.95, t);
    if (act1Vis > 0.01) {
      const p = smoothstep(0.1, 3.5, t);
      const mxPos = lerp(110, 1110, p);
      const myPos = 452 + Math.sin(p * Math.PI) * -12 + Math.sin(t * 52) * 1.1;

      ctx.save();
      ctx.globalAlpha = act1Vis;

      // 1) Volumetric Dawn Sunbeams & Morning Dew Pollen Sparkles
      if (isLit) {
        ctx.save();
        for (let b = 0; b < 3; b++) {
          const bx = 260 + b * 270 + Math.sin(t * 0.8 + b) * 18;
          const ray = ctx.createLinearGradient(bx, 60, bx + 140, 560);
          ray.addColorStop(0, `rgba(255, 250, 215, ${0.14 * flicker})`);
          ray.addColorStop(0.65, `rgba(255, 245, 200, ${0.05 * flicker})`);
          ray.addColorStop(1, "rgba(255, 245, 200, 0)");
          ctx.fillStyle = ray;
          ctx.beginPath();
          ctx.moveTo(bx - 35, 60);
          ctx.lineTo(bx + 45, 60);
          ctx.lineTo(bx + 210, 560);
          ctx.lineTo(bx + 80, 560);
          ctx.closePath();
          ctx.fill();
        }
        for (const sp of SPRING_POLLEN) {
          const px = (sp.x0 + t * sp.driftX) % W;
          const py = ((sp.y0 + t * sp.driftY) % 440 + 440) % 440 + 90;
          const twinkle = 0.4 + 0.6 * Math.sin(t * 4.5 + sp.phase);
          ctx.fillStyle = `rgba(255, 252, 220, ${twinkle * 0.72 * flicker})`;
          ctx.beginPath();
          ctx.arc(px, py, sp.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2) Live Manicured Diamond Stripes Revealed Right Behind the Mower Deck on Layer 5
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 495, Math.max(0, mxPos + 15), 115);
      ctx.clip();
      for (let i = 0; i < 12; i++) {
        const sx = 40 + i * 102;
        ctx.fillStyle =
          i % 2 === 0
            ? `rgba(220, 255, 210, ${0.26 * flicker})`
            : `rgba(6, 40, 20, ${0.22})`;
        ctx.beginPath();
        ctx.moveTo(sx, 502);
        ctx.lineTo(sx + 52, 502);
        ctx.lineTo(sx + 108, 605);
        ctx.lineTo(sx + 52, 605);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3) Before-vs-After Grass Blades: Tall Overgrown Ahead, Crisp Trimmed Behind!
      ctx.save();
      ctx.lineCap = "round";
      for (let gx = 40; gx < 1240; gx += 11) {
        const ridgeY =
          532 -
          Math.sin(((gx + 80) / 1360) * Math.PI) * 26 +
          Math.sin(gx * 0.04) * 3;
        const cutDist = gx - (mxPos + 45);
        // Smoothly shear tall grass down to crisp 5px turf as deck passes
        const tallFactor = smoothstep(-20, 28, cutDist);
        const bladeH = lerp(6, 26 + (gx % 5) * 3.5, tallFactor);
        const sway = Math.sin(t * 3.8 + gx * 0.07) * (1.5 + tallFactor * 4.5);

        ctx.strokeStyle =
          tallFactor > 0.5
            ? rgb(pal.l4, 0.95)
            : rgb(pal.rim, 0.65 * flicker);
        ctx.lineWidth = tallFactor > 0.5 ? 2.6 : 1.8;
        ctx.beginPath();
        ctx.moveTo(gx, ridgeY + 6);
        ctx.quadraticCurveTo(
          gx + sway * 0.6,
          ridgeY - bladeH * 0.5,
          gx + sway,
          ridgeY - bladeH
        );
        ctx.stroke();
      }
      ctx.restore();

      // 4) Commercial Zero-Turn Mower Silhouette + Dawn Headlight + Spinning Deck
      ctx.save();
      ctx.translate(mxPos, myPos);

      // Front warm LED work-light cone illuminating tall grass ahead
      if (isLit) {
        const beam = ctx.createLinearGradient(74, 24, 290, 56);
        beam.addColorStop(0, `rgba(255, 250, 210, ${0.42 * flicker})`);
        beam.addColorStop(0.7, `rgba(255, 248, 200, ${0.1 * flicker})`);
        beam.addColorStop(1, "rgba(255, 248, 200, 0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(72, 22);
        ctx.lineTo(290, 2);
        ctx.lineTo(290, 76);
        ctx.lineTo(72, 42);
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowColor = "rgba(0,0,0,0.58)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;

      ctx.fillStyle = rgb(pal.l6);
      // ROPS Roll Bar
      ctx.beginPath();
      ctx.moveTo(-42, -56);
      ctx.lineTo(-26, -56);
      ctx.lineTo(-32, 18);
      ctx.lineTo(-44, 18);
      ctx.closePath();
      ctx.fill();

      // Operator torso, head, cap & steering lap-bar arms
      ctx.beginPath();
      ctx.arc(-6, -34, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-16, -44, 28, 6);
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(8, -18);
      ctx.lineTo(2, 22);
      ctx.lineTo(-22, 22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.lineTo(32, 2);
      ctx.lineTo(28, 10);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();

      // Mower Chassis & Engine Deck
      ctx.beginPath();
      ctx.moveTo(-54, 16);
      ctx.lineTo(54, 16);
      ctx.lineTo(72, 42);
      ctx.lineTo(-64, 42);
      ctx.closePath();
      ctx.fill();

      // High-speed spinning blade motion blur glowing beneath the 60" deck
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(250, 204, 21, 0.7)";
      ctx.fillStyle = `rgba(254, 249, 195, ${0.45 + 0.35 * Math.sin(t * 60)})`;
      ctx.fillRect(10, 50, 66, 4);
      ctx.restore();

      // Commercial 60" Cutting Deck (Accent Gold with crisp rim)
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.roundRect(4, 37, 78, 15, 3);
      ctx.fill();
      ctx.strokeStyle = rgb(pal.rim, 0.65 * flicker);
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Rear Drive Wheel (Spinning spokes)
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(-34, 44, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(-34, 44);
      ctx.rotate(t * 9.5);
      ctx.strokeStyle = rgb(pal.l4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();
      ctx.restore();

      // Front Caster Wheel (Spinning faster)
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(74, 52, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(74, 52);
      ctx.rotate(t * 18);
      ctx.strokeStyle = rgb(pal.l3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();
      ctx.restore();

      // 5) Kinetic Backlit Cut-Grass Blade Plume shooting from side discharge
      ctx.shadowBlur = 0;
      for (const gm of GRASS_MIST) {
        const gp = (t * 2.6 + gm.phase) % 1;
        const gx = 18 - gp * gm.speed * 1.15;
        const gy = 46 + Math.sin(gm.angle) * gp * 68 + gp * gp * 38;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(gp * gm.rot + gm.angle);
        ctx.globalAlpha = act1Vis * (1 - gp) * 0.92;
        ctx.strokeStyle = gp < 0.45 ? rgb(pal.rim) : rgb(pal.l3);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-gm.len * 0.5, 0);
        ctx.lineTo(gm.len * 0.5, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.restore();
    }

    // --- ACT 2 (3.5s – 7.6s): ACTIVE MULCH SPADING, TRENCH EDGING & CORE AERATION ---
    const act2Vis = smoothstep(3.45, 4.0, t) * (1 - smoothstep(7.05, 7.65, t));
    if (act2Vis > 0.01) {
      ctx.save();
      ctx.globalAlpha = act2Vis;

      // 1) Progressively Carved 3" Hand-Spaded Vertical Trench & Growing Mulch Bed
      const bedGrow = smoothstep(3.6, 5.8, t);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(90, 548);
      ctx.bezierCurveTo(
        260,
        525 - bedGrow * 34,
        460,
        568 - bedGrow * 16,
        660,
        522 - bedGrow * 12
      );
      ctx.bezierCurveTo(860, 488, 1080, 526, 1230, 545);
      ctx.lineTo(1230, 625);
      ctx.lineTo(90, 625);
      ctx.closePath();
      ctx.fillStyle = rgb(pal.l6);
      ctx.fill();
      // Crisp sunlit 3" vertical trench edge highlight
      ctx.strokeStyle = rgb(pal.rim, 0.72 * flicker);
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();

      // Warm Glowing Brass Garden Pathway Lantern beside the mulched bed
      ctx.save();
      ctx.translate(185, 488);
      ctx.fillStyle = rgb(pal.l7);
      ctx.fillRect(-3, 0, 6, 48);
      ctx.beginPath();
      ctx.moveTo(-14, 2);
      ctx.lineTo(0, -10);
      ctx.lineTo(14, 2);
      ctx.closePath();
      ctx.fill();
      if (isLit) {
        const lanGlow = 0.85 + 0.15 * Math.sin(t * 6.5);
        ctx.shadowColor = "rgba(255, 220, 120, 0.95)";
        ctx.shadowBlur = 22 * lanGlow;
        ctx.fillStyle = `rgba(255, 240, 175, ${lanGlow * flicker})`;
        ctx.beginPath();
        ctx.arc(0, 6, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2) Wheelbarrow + Active Landscaper Shoveling Cascading Mulch Bark!
      const scoopCycle = (t * 1.45) % 1;
      const throwSwing = Math.sin(scoopCycle * Math.PI * 2);

      // Wheelbarrow with Mound of Triple-Shredded Bark
      ctx.save();
      ctx.translate(275, 456);
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(88, 22);
      ctx.lineTo(72, 54);
      ctx.lineTo(8, 54);
      ctx.closePath();
      ctx.fill();
      // Rich Bark Mound
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.moveTo(2, 22);
      ctx.quadraticCurveTo(44, -14, 86, 22);
      ctx.closePath();
      ctx.fill();
      // Wheel & handles
      ctx.beginPath();
      ctx.arc(90, 62, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(4, 34);
      ctx.lineTo(-32, 40);
      ctx.moveTo(16, 54);
      ctx.lineTo(8, 74);
      ctx.stroke();
      ctx.restore();

      // Active Landscaper Silhouette pitching dark mulch onto the bed
      ctx.save();
      ctx.translate(396, 444);
      ctx.fillStyle = rgb(pal.l6);
      // Head & Cap
      ctx.beginPath();
      ctx.arc(throwSwing * 4, -22, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-6 + throwSwing * 4, -31, 24, 5);
      // Leaning Torso
      ctx.beginPath();
      ctx.moveTo(-12 + throwSwing * 5, -8);
      ctx.lineTo(12 + throwSwing * 5, -8);
      ctx.lineTo(8, 36);
      ctx.lineTo(-14, 36);
      ctx.closePath();
      ctx.fill();
      // Planted Legs
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-6, 35);
      ctx.lineTo(-18, 76);
      ctx.moveTo(5, 35);
      ctx.lineTo(18, 76);
      ctx.stroke();

      // Animated Pitching Spade pivoting from wheelbarrow toward bed
      ctx.save();
      ctx.translate(4 + throwSwing * 6, 8);
      ctx.rotate(-0.45 + throwSwing * 0.55);
      ctx.strokeStyle = rgb(pal.l4);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(48, 8);
      ctx.stroke();
      // Steel Spade Blade with bright glint
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.roundRect(46, 0, 20, 15, 3);
      ctx.fill();
      const glint = Math.pow(Math.max(0, Math.sin(t * 5.5)), 5);
      if (glint > 0.05) {
        ctx.fillStyle = `rgba(255,255,255,${glint})`;
        ctx.beginPath();
        ctx.arc(58, 6, 3.5 + glint * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Cascading Dark Bark Chips arcing off the shovel into the garden bed
      for (const mc of MULCH_CHIPS) {
        const mp = (t * 1.45 + mc.phase) % 1;
        const cx = 42 + mp * mc.vx;
        const cy = 6 + mp * mc.vy + mp * mp * 175;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(mp * mc.rot);
        ctx.globalAlpha = act2Vis * (1 - mp * 0.85);
        ctx.fillStyle = mp < 0.35 ? rgb(pal.l5) : rgb(pal.l7);
        ctx.fillRect(-mc.w * 0.5, -mc.h * 0.5, mc.w, mc.h);
        ctx.restore();
      }
      ctx.restore();

      // 3) Commercial Walk-Behind Core Aerator + Flying Soil Core Plugs!
      const aeroP = smoothstep(3.65, 7.25, t);
      const ax = lerp(555, 1020, aeroP);
      ctx.save();
      ctx.translate(ax, 444 + Math.sin(t * 42) * 1.0);
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = rgb(pal.l6);
      // Operator
      ctx.beginPath();
      ctx.arc(-44, -22, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-52, -31, 24, 5);
      ctx.beginPath();
      ctx.moveTo(-54, -8);
      ctx.lineTo(-32, -8);
      ctx.lineTo(-38, 36);
      ctx.lineTo(-56, 36);
      ctx.closePath();
      ctx.fill();
      // Walking Legs
      const stride = Math.sin(t * 9.5) * 11;
      ctx.strokeStyle = rgb(pal.l6);
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-46, 34);
      ctx.lineTo(-56 + stride, 74);
      ctx.moveTo(-40, 34);
      ctx.lineTo(-30 - stride, 74);
      ctx.stroke();
      // Handle & machine frame
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-36, 4);
      ctx.lineTo(14, 16);
      ctx.lineTo(38, 56);
      ctx.stroke();
      // Engine block (emerald accent + rim)
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.roundRect(14, 24, 38, 28, 4);
      ctx.fill();
      // Rotating Hollow-Tine Drum
      ctx.save();
      ctx.translate(36, 62);
      ctx.rotate(t * 7.2);
      ctx.fillStyle = rgb(pal.l7);
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgb(pal.l7);
      ctx.lineWidth = 5;
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * -26, Math.sin(ang) * -26);
        ctx.lineTo(Math.cos(ang) * 26, Math.sin(ang) * 26);
        ctx.stroke();
      }
      ctx.restore();

      // Popping Soil Core Plugs ejecting upward behind the rotating tine drum!
      ctx.shadowBlur = 0;
      for (const cp of CORE_PLUGS) {
        const pTime = (t * 2.1 + cp.phase) % 1;
        const px = 22 + pTime * cp.vx;
        const py = 68 + pTime * cp.vy + pTime * pTime * 110;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(pTime * cp.rot);
        ctx.globalAlpha = act2Vis * (1 - pTime * 0.7);
        ctx.fillStyle = rgb(pal.l4);
        ctx.fillRect(-3, -6, 6, 12);
        ctx.restore();
      }
      ctx.restore();

      // Extracted Core Plugs resting visibly on the lawn behind the aerator
      ctx.fillStyle = rgb(pal.l4, 0.9);
      for (let rx = 540; rx < ax - 20; rx += 34) {
        const ry = 524 + Math.sin(rx * 0.05) * 6;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate((rx % 7) * 0.35 - 0.8);
        ctx.fillRect(-2.5, -6, 5, 12);
        ctx.restore();
      }

      // 4) Luminous Golden Overseed Rain + Lush Multi-Blade Emerald Grass Tufts
      for (const sd of SEEDS) {
        const sp = (t * 1.15 + sd.phase) % 1;
        ctx.fillStyle = rgb(pal.sun, (1 - sp) * 0.95 * act2Vis * flicker);
        ctx.beginPath();
        ctx.arc(sd.x + sp * 18, sd.y0 + sp * 115, sd.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lush Multi-Blade Sprouting Tufts springing up across aerated turf
      const sproutGrow = smoothstep(4.2, 6.4, t);
      ctx.lineCap = "round";
      for (let i = 0; i < 16; i++) {
        const bx = 480 + i * 40;
        const by = 546 + Math.sin(i * 1.4) * 6;
        const localGrow = clamp(sproutGrow * 1.4 - i * 0.04, 0, 1);
        if (localGrow <= 0.02) continue;
        const baseH = (20 + (i % 3) * 9) * localGrow;
        const sw = Math.sin(t * 3.4 + i) * 4.5;
        ctx.strokeStyle = i % 2 === 0 ? rgb(pal.accent, 0.95) : rgb(pal.rim, 0.8 * flicker);
        ctx.lineWidth = 3.2;
        for (let b = -1; b <= 1; b++) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(
            bx + b * 6 + sw * 0.6,
            by - baseH * 0.55,
            bx + b * 12 + sw,
            by - baseH * (b === 0 ? 1.15 : 0.85)
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

    // --- ACT 4 (11.0s – 15.0s): WINTER SNOW PLOW TRUCK WITH HEADLIGHTS & BEACON ---
    const act4Vis = smoothstep(10.95, 11.55, t) * (1 - smoothstep(14.35, 14.95, t));
    if (act4Vis > 0.01) {
      const plowP = smoothstep(11.1, 14.55, t);
      const px = lerp(110, 1020, plowP);
      const py = 446 + Math.sin(t * 42) * 0.8;

      ctx.save();
      ctx.globalAlpha = act4Vis;
      ctx.translate(px, py);

      // Glowing Headlight Cone cutting through winter blizzard
      if (isLit) {
        const beam = ctx.createLinearGradient(120, 16, 430, 65);
        beam.addColorStop(0, "rgba(255, 244, 195, 0.52)");
        beam.addColorStop(0.6, "rgba(255, 240, 180, 0.14)");
        beam.addColorStop(1, "rgba(255, 240, 180, 0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(118, 12);
        ctx.lineTo(430, -25);
        ctx.lineTo(430, 88);
        ctx.lineTo(118, 36);
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;

      // Plow Truck Bed & Cab
      ctx.fillStyle = rgb(pal.l6);
      ctx.beginPath();
      ctx.moveTo(-78, -6);
      ctx.lineTo(28, -6);
      ctx.lineTo(54, 10);
      ctx.lineTo(120, 14);
      ctx.lineTo(120, 50);
      ctx.lineTo(-82, 50);
      ctx.closePath();
      ctx.fill();

      // Warm Lit Cab Window
      if (isLit) {
        ctx.save();
        ctx.shadowColor = rgb(pal.window, 0.9);
        ctx.shadowBlur = 14;
        ctx.fillStyle = rgb(pal.window, 0.92 * flicker);
        ctx.beginPath();
        ctx.roundRect(2, 2, 34, 22, 3);
        ctx.fill();
        ctx.restore();
      }

      // Commercial Angled V-Plow Blade (Amber Gold Accent)
      ctx.fillStyle = rgb(pal.accent);
      ctx.beginPath();
      ctx.moveTo(120, 18);
      ctx.lineTo(164, 4);
      ctx.lineTo(170, 56);
      ctx.lineTo(120, 52);
      ctx.closePath();
      ctx.fill();

      // Heavy-Duty Snow Tires
      ctx.fillStyle = rgb(pal.l7);
      for (const wx of [-44, 86]) {
        ctx.beginPath();
        ctx.arc(wx, 52, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgb(pal.l4);
        ctx.beginPath();
        ctx.arc(wx, 52, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgb(pal.l7);
      }

      // Strobing Roof Amber Warning Beacon
      if (isLit) {
        const strobe = 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(t * 14)), 2);
        ctx.save();
        ctx.shadowColor = "rgba(245, 158, 11, 1)";
        ctx.shadowBlur = 22 * strobe;
        ctx.fillStyle = `rgba(251, 191, 36, ${strobe})`;
        ctx.beginPath();
        ctx.arc(14, -12, 7 + strobe * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Roaring Backlit Snow Spray Arc billowing off V-Plow
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(242, 249, 255, ${0.82 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(165, 52);
      ctx.quadraticCurveTo(205, -8 - Math.sin(t * 12) * 8, 255, 34);
      ctx.quadraticCurveTo(222, 48, 168, 56);
      ctx.closePath();
      ctx.fill();
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
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
