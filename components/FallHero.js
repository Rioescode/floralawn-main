"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import LeafSeason, { LeafGround } from "@/components/LeafSeason";

const PROMOS = [
  {
    id: "fall-cleanup",
    tag: "Fall Cleanup",
    value: "From $175",
    title: "Leaves gone in one visit",
    text: "Leaf removal, bed cleanout, and haul-away so your lawn is ready for winter.",
    code: null,
    href: "/contact?service=Fall%20Cleanup",
    cta: "Get My Free Quote",
    icon: SparklesIcon,
    tone: "from-red-800 to-red-600 text-white",
  },
  {
    id: "neighbor",
    tag: "Neighbor Deal",
    value: "10% OFF",
    title: "Book with your neighbor",
    text: "Two homes on the same street, same day, and you both save.",
    code: "NEIGHBOR-10",
    href: "/contact?service=Fall%20Cleanup&promo=NEIGHBOR-10",
    cta: "Get 10% Off",
    icon: UserGroupIcon,
    tone: "from-yellow-400 to-yellow-300 text-stone-900",
  },
  {
    id: "bundle",
    tag: "Season Bundle",
    value: "15% OFF",
    title: "Spring + Fall + Mowing",
    text: "Bundle your cleanups and weekly maintenance into one plan.",
    code: "BUNDLE-15",
    href: "/contact?service=Lawn%20Mowing&promo=BUNDLE-15",
    cta: "Get 15% Off Quote",
    icon: TicketIcon,
    tone: "from-emerald-800 to-emerald-600 text-white",
  },
  {
    id: "referral",
    tag: "Referral",
    value: "$25 Credit",
    title: "Refer a friend",
    text: "You both get a service credit after their first paid job.",
    code: "REFER-25",
    href: "/contact?promo=REFER-25",
    cta: "Refer & Save",
    icon: GiftIcon,
    tone: "from-rose-900 to-rose-700 text-white",
  },
  {
    id: "honor",
    tag: "Seniors & Military",
    value: "5% OFF",
    title: "Honor & Service Reward",
    text: "Permanent discount on recurring maintenance for seniors 65+, veterans, and active military.",
    code: "HONOR-5",
    href: "/contact?promo=HONOR-5",
    cta: "Get My Discount",
    icon: ShieldCheckIcon,
    tone: "from-stone-800 to-stone-600 text-white",
  },
];

const TICKER = [
  "🍁 Fall Cleanup from $175",
  "🏡 Neighbor Deal 10% off · NEIGHBOR-10",
  "🌿 Season Bundle 15% off · BUNDLE-15",
  "🎁 $25 Referral Credit · REFER-25",
  "🎖️ Seniors & Military 5% off · HONOR-5",
  "⭐ 4.9 on Google · 4.8 on Thumbtack",
];

function daysLeftInFall() {
  const now = new Date();
  const end = new Date(now.getFullYear(), 11, 21);
  const start = new Date(now.getFullYear(), 8, 22);
  if (now < start || now > end) return null;
  return Math.ceil((end - now) / 86400000);
}

export default function FallHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    setDaysLeft(daysLeftInFall());
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % PROMOS.length), 5500);
    return () => clearInterval(t);
  }, [paused]);

  const promo = PROMOS[index];
  const Icon = promo.icon;

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };

  return (
    <section className="relative overflow-hidden bg-[#1c0a0e]">
      {/* Promo ticker */}
      <div className="relative z-30 bg-[#6b1d2a] text-yellow-200 border-b border-yellow-400/20">
        <div className="overflow-hidden py-2.5">
          <div className="leaf-promo-marquee flex w-max gap-10 whitespace-nowrap text-xs sm:text-sm font-black uppercase tracking-wider">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative min-h-[92vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/fall-house-hero.jpg"
            alt="New England home with red and gold fall maple trees"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1c0a0e]/95 via-[#1c0a0e]/70 to-[#1c0a0e]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c0a0e] via-transparent to-[#1c0a0e]/40" />
        </div>

        <LeafSeason className="z-[1]" />
        <LeafGround className="z-[2]" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 py-16 lg:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          {/* Left: message */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-300/30 text-yellow-200 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                <span className="leaf-season-wiggle inline-block text-base" aria-hidden>🍁</span>
                Leaf Season Is Here
              </span>
              {daysLeft !== null && (
                <span className="px-3 py-2 rounded-full bg-red-800/40 border border-red-400/30 text-red-100 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur-md">
                  {daysLeft} days of fall left
                </span>
              )}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tighter leading-[0.92] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              Lawn care for
              <br />
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                every season
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-stone-200 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Weekly mowing, dethatch, spring and fall cleanup, mulch, hedge trimming, aeration, and snow. Rhode Island and Massachusetts homes. Free quote in 1 to 6 hours.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-3 px-9 py-5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black uppercase tracking-wide shadow-2xl shadow-black/40 hover:scale-[1.03] active:scale-95 transition-all"
              >
                Get My Free Quote
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:4013890913"
                className="inline-flex items-center justify-center gap-3 px-9 py-5 rounded-2xl bg-white/10 border border-white/20 text-white font-black uppercase tracking-wide backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
              >
                <PhoneIcon className="w-5 h-5" />
                (401) 389-0913
              </a>
            </div>
            <p className="mt-3 text-sm font-semibold text-stone-300">
              Takes about 1 minute · Reply in 1–6 hours · No obligation
            </p>

            <a
              href="#packages"
              className="mt-5 inline-flex items-center gap-2 text-yellow-300 font-black uppercase tracking-widest text-xs hover:text-yellow-200"
            >
              See all services ↓
            </a>

            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-stone-200">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4" />)}
                </div>
                <span className="text-sm font-bold">4.9 Google</span>
              </div>
              <span className="text-sm font-bold">4.8 Thumbtack</span>
              <div className="flex items-center gap-2">
                <Image src="/nextdoor-badge.png" alt="2026 Nextdoor Fave, number 1 in Pawtucket" width={24} height={24} className="rounded-full" />
                <span className="text-sm font-bold">2026 Nextdoor Fave · #1 in Pawtucket</span>
              </div>
            </div>
          </motion.div>

          {/* Right: rotating promo card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative"
          >
            <div className="relative rounded-[2.5rem] border border-white/15 bg-[#1c0a0e]/75 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300/90">
                  Fall Promotions
                </span>
                <span className="text-[11px] font-bold text-stone-300/70">
                  {index + 1} / {PROMOS.length}
                </span>
              </div>

              <div className="relative min-h-[300px] px-6 pt-5 pb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, x: 40, rotate: 2 }}
                    animate={{ opacity: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, x: -40, rotate: -2 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className={`rounded-3xl p-6 bg-gradient-to-br ${promo.tone} shadow-xl relative overflow-hidden`}>
                      <Icon className="absolute -right-6 -bottom-6 w-36 h-36 opacity-15" aria-hidden />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">{promo.tag}</p>
                      <p className="text-5xl font-black tracking-tighter mt-1">{promo.value}</p>
                      <p className="text-lg font-black mt-2">{promo.title}</p>
                    </div>
                    <p className="mt-5 text-stone-200 font-medium leading-relaxed">{promo.text}</p>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <Link
                        href={promo.href}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black uppercase text-sm tracking-wide transition-colors"
                      >
                        {promo.cta} <ArrowRightIcon className="w-4 h-4" />
                      </Link>
                      {promo.code && (
                        <button
                          type="button"
                          onClick={() => copyCode(promo.code)}
                          className="px-5 py-4 rounded-2xl border-2 border-dashed border-yellow-300/50 text-yellow-200 font-black text-sm tracking-widest hover:bg-yellow-300/10 transition-colors"
                        >
                          {copied === promo.code ? "Copied!" : promo.code}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + PROMOS.length) % PROMOS.length)}
                  className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 text-stone-100 flex items-center justify-center"
                  aria-label="Previous promotion"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {PROMOS.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-yellow-400" : "w-2.5 bg-white/25 hover:bg-white/50"}`}
                      aria-label={`Show ${p.tag}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % PROMOS.length)}
                  className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 text-stone-100 flex items-center justify-center"
                  aria-label="Next promotion"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <LeafSeason density="front" className="z-20" />
      </div>
    </section>
  );
}
