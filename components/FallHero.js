"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneIcon, ArrowRightIcon, StarIcon } from "@heroicons/react/24/solid";
import SeasonParticles, { SeasonFront } from "@/components/SeasonParticles";

export const SEASONS = [
  {
    id: "spring",
    label: "Spring",
    hue: "#022c22",
    photo: "/images/season-spring.jpg",
    alt: "White colonial house with a fresh spring lawn and flowering trees",
    lead: "A clean start",
    accent: "for spring",
    accentClass: "from-emerald-100 via-white to-emerald-200",
    price: "Spring Cleanup from $175",
    service: "Spring Cleanup",
    blurb: "Beds, branches, and winter debris hauled away so the lawn can grow.",
  },
  {
    id: "summer",
    label: "Summer",
    hue: "#052e16",
    photo: "/images/season-summer.jpg",
    alt: "White colonial house with a freshly mowed striped lawn",
    lead: "A striped lawn",
    accent: "all summer",
    accentClass: "from-lime-100 via-yellow-100 to-white",
    price: "Weekly mowing from $35",
    service: "Lawn Mowing",
    blurb: "Weekly cuts for Rhode Island and Massachusetts lawns, same crew each visit.",
  },
  {
    id: "fall",
    label: "Fall",
    hue: "#1c0a0e",
    photo: "/images/fall-house-hero.jpg",
    alt: "New England home with red and gold fall maple trees",
    lead: "Leaves gone",
    accent: "in one visit",
    accentClass: "from-yellow-200 via-yellow-100 to-white",
    price: "Fall Cleanup from $175",
    service: "Fall Cleanup",
    blurb: "Leaf removal, bed cleanout, and haul-away before the first hard frost.",
  },
  {
    id: "winter",
    label: "Winter",
    hue: "#020617",
    photo: "/images/season-winter.jpg",
    alt: "Snow-covered colonial house with a cleared driveway",
    lead: "Driveway clear",
    accent: "after every storm",
    accentClass: "from-slate-100 via-white to-sky-100",
    price: "Snow removal from $75",
    service: "Snow Removal",
    blurb: "Driveway and walk cleared after each storm, piled off the pavement.",
  },
];

const TICKER = [
  "Spring Cleanup from $175",
  "Weekly mowing from $35",
  "Fall Cleanup from $175",
  "Snow removal from $75",
  "Neighbor Deal 10% off · NEIGHBOR-10",
  "Season Bundle 15% off · BUNDLE-15",
  "4.9 on Google · 4.8 on Thumbtack",
];

function seasonForNow() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function quoteHref(service) {
  return `/contact?service=${encodeURIComponent(service)}`;
}

function SeasonClock({ seasonId, onSeasonChange }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    const arm = () => {
      clearInterval(timer);
      timer = null;
      if (mq.matches) return;
      timer = setInterval(() => {
        const index = SEASONS.findIndex((season) => season.id === seasonId);
        const next = SEASONS[(index + 1) % SEASONS.length];
        onSeasonChange(next.id);
      }, 9000);
    };
    arm();
    mq.addEventListener("change", arm);
    return () => {
      clearInterval(timer);
      mq.removeEventListener("change", arm);
    };
  }, [seasonId, onSeasonChange]);

  return null;
}

export default function FallHero() {
  const [seasonId, setSeasonId] = useState(seasonForNow);
  const season = SEASONS.find((item) => item.id === seasonId) || SEASONS[2];

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: season.hue }}>
      <div className="relative z-30 bg-[#6b1d2a] text-yellow-200 border-b border-yellow-400/20">
        <div className="overflow-hidden py-2.5">
          <div className="leaf-promo-marquee flex w-max gap-10 whitespace-nowrap text-xs sm:text-sm font-black uppercase tracking-wider">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative min-h-[92vh] flex items-center">
        <SeasonClock seasonId={seasonId} onSeasonChange={setSeasonId} />

        {SEASONS.map((item) => {
          const on = item.id === seasonId;
          return (
            <div key={item.id} className="absolute inset-0" aria-hidden={!on}>
              <img
                src={item.photo}
                alt={on ? item.alt : ""}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${on ? "opacity-100" : "opacity-0"}`}
              />
              <div
                className={`absolute inset-0 transition-opacity duration-1000 ${on ? "opacity-100" : "opacity-0"}`}
                style={{
                  background: `linear-gradient(to right, ${item.hue}f2, ${item.hue}b3, ${item.hue}40)`,
                }}
              />
              <div
                className={`absolute inset-0 transition-opacity duration-1000 ${on ? "opacity-100" : "opacity-0"}`}
                style={{
                  background: `linear-gradient(to top, ${item.hue} 0%, transparent 52%, rgba(0,0,0,0.3) 100%)`,
                }}
              />
            </div>
          );
        })}

        <SeasonParticles seasonId={seasonId} />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 pt-16 pb-28 lg:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold text-yellow-100/90 mb-4">{season.label}</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tighter leading-[0.92] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              Lawn care for
              <br />
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                every season
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-stone-100 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {season.price}. Mowing, cleanup, mulch, hedges, aeration, and snow across Rhode Island and Massachusetts. Free quote in 1 to 6 hours.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href={quoteHref(season.service)}
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
              className="mt-5 inline-flex items-center gap-2 text-yellow-200 font-bold text-sm hover:text-white"
            >
              See all services
            </a>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-stone-200">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4" />
                  ))}
                </div>
                <span className="text-sm font-bold">4.9 Google</span>
              </div>
              <span className="text-sm font-bold">4.8 Thumbtack</span>
              <div className="flex items-center gap-2">
                <Image src="/nextdoor-badge.png" alt="2026 Nextdoor Fave, number 1 in Pawtucket" width={24} height={24} className="rounded-full" />
                <span className="text-sm font-bold">2026 Nextdoor Fave · #1 in Pawtucket</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-[2.5rem] border border-white/15 bg-black/45 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6">
                <p className="text-sm font-semibold text-yellow-100">{season.label} quote</p>
              </div>
              <div className="px-6 pt-4 pb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={season.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="rounded-3xl p-6 text-white shadow-xl" style={{ backgroundColor: season.hue }}>
                      <p className="text-sm font-semibold text-white/75">{season.service}</p>
                      <p className="text-3xl sm:text-4xl font-black tracking-tight mt-2">{season.price}</p>
                      <p className="text-lg font-black mt-2">
                        {season.lead} {season.accent}
                      </p>
                    </div>
                    <p className="mt-5 text-stone-100 font-medium leading-relaxed">{season.blurb}</p>
                    <Link
                      href={quoteHref(season.service)}
                      className="mt-5 flex items-center justify-center gap-2 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black uppercase text-sm tracking-wide transition-colors"
                    >
                      Get My Free Quote <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <SeasonFront seasonId={seasonId} />

        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full border border-white/20 bg-black/50 p-1.5 backdrop-blur-md">
            {SEASONS.map((item) => {
              const on = item.id === seasonId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSeasonId(item.id)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    on ? "bg-white text-stone-900" : "text-white/85 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
