"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckIcon, ArrowRightIcon, StarIcon } from "@heroicons/react/24/solid";
import LeafSeason from "@/components/LeafSeason";

const SERVICES = {
  cleanup: { name: "Complete Fall Cleanup", form: "Fall Cleanup" },
  dethatch: { name: "Lawn Dethatching", form: "Lawn Dethatching" },
  aeration: { name: "Core Aeration", form: "Lawn Aeration" },
  overseed: { name: "Overseeding", form: "Overseeding" },
  fertilize: { name: "Fertilization", form: "Lawn Fertilization" },
  weeds: { name: "Weed Control", form: "Weed Control" },
  leaves: { name: "Leaf Removal", form: "Leaf Removal" },
  spring: { name: "Spring Cleanup", form: "Spring Cleanup" },
  mulch: { name: "Mulching", form: "Mulching" },
  hedge: { name: "Hedge Trimming", form: "Hedge Trimming" },
  mow: { name: "Lawn Mowing", form: "Lawn Mowing" },
};

const CLEANUP_TIERS = [
  { id: "basic", label: "Basic", items: ["Leaf removal", "Lawn debris cleanup", "Yard waste removal", "Single visit"] },
  { id: "complete", label: "Complete", items: ["Multiple visits", "Full property cleanup", "Gutter cleaning", "Debris hauling"] },
  { id: "premium", label: "Premium", items: ["Season-long service", "Weekly leaf removal", "Complete property care", "Winter prep included"] },
];

const PACKAGES = [
  {
    id: "lawn-revival",
    name: "Lawn Revival",
    tagline: "Thicker grass by spring",
    image: "/images/fall-house-lawn.jpg",
    services: ["aeration", "overseed", "fertilize"],
    form: "Lawn Aeration",
  },
  {
    id: "full-fall-reset",
    name: "Full Fall Reset",
    tagline: "Everything your yard needs before winter",
    image: "/images/fall-house-leaves.jpg",
    services: ["cleanup", "dethatch", "aeration", "overseed"],
    form: "Fall Cleanup",
    popular: true,
  },
  {
    id: "dethatch-seed",
    name: "Dethatch & Seed",
    tagline: "Clear the matted layer, plant new grass",
    image: "/images/overseeding.jpg",
    services: ["dethatch", "overseed"],
    form: "Lawn Dethatching",
  },
];

const BUILDER_KEYS = ["mow", "leaves", "spring", "dethatch", "mulch", "hedge", "aeration", "overseed", "fertilize", "weeds"];

const contactHref = (service, { promo, pkg, services } = {}) => {
  const q = new URLSearchParams({ service });
  if (promo) q.set("promo", promo);
  if (pkg) q.set("package", pkg);
  if (services?.length) q.set("services", services.join(","));
  return `/contact?${q.toString()}`;
};

const formNames = (keys) => keys.map((k) => SERVICES[k].name);

export default function FallPackages() {
  const [tier, setTier] = useState("complete");
  const [picked, setPicked] = useState(["leaves", "aeration"]);
  const activeTier = CLEANUP_TIERS.find((t) => t.id === tier);

  const toggle = (key) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  return (
    <section id="packages" className="relative overflow-hidden bg-[#fbf7ef] py-24">
      <LeafSeason density="sparse" className="z-0 opacity-70" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-800 text-[11px] font-black uppercase tracking-[0.22em] mb-5">
            Lawn, cleanup, mulch, and more
          </p>
          <h2 className="text-4xl md:text-6xl font-black text-stone-900 tracking-tighter leading-none">
            Plans for every
            <span className="text-red-800"> yard job.</span>
          </h2>
          <p className="mt-5 text-lg text-stone-600 font-medium">
            Mowing, dethatch, spring and fall cleanup, mulch, hedge trimming, aeration, and seed. Pick a plan and we quote your yard.
          </p>
        </div>

        {/* Leaf cleanup tiers */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="rounded-[2.5rem] overflow-hidden bg-[#1c0a0e] text-white grid lg:grid-cols-[1fr_1.1fr] shadow-2xl shadow-red-950/20 mb-10"
        >
          <div className="relative min-h-[320px]">
            <img src="/images/fall-house-hero.jpg" alt="Home with fall maple trees and a clean lawn" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c0a0e] via-[#1c0a0e]/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#1c0a0e]/20 lg:to-[#1c0a0e]" />
            <div className="absolute bottom-6 left-6 right-6 lg:hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300">Leaf Cleanup</p>
              <h3 className="text-3xl font-black tracking-tight mt-1">Get every leaf off the lawn</h3>
            </div>
          </div>
          <div className="p-6 md:p-10">
            <div className="hidden lg:block">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300">Leaf Cleanup</p>
              <h3 className="text-4xl font-black tracking-tight mt-2">Get every leaf off the lawn</h3>
            </div>
            <p className="mt-3 text-stone-300 font-medium">
              Choose how much help you need this fall. Heavily wooded properties may need more than one visit.
            </p>
            <div className="mt-6 inline-flex bg-white/5 border border-white/10 rounded-2xl p-1">
              {CLEANUP_TIERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                    tier === t.id ? "bg-yellow-400 text-stone-900 shadow-lg" : "text-stone-300 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-gradient-to-br from-red-800 to-[#6b1d2a] p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-100/80">{activeTier.label} Cleanup</p>
                  <p className="text-4xl font-black tracking-tighter leading-none mt-1 text-yellow-300">Free Quote</p>
                </div>
                <span className="text-xs font-black uppercase text-red-100/70 pb-1">sized to your yard</span>
              </div>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2.5">
                {activeTier.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 font-bold">
                    <CheckIcon className="w-5 h-5 shrink-0 text-yellow-300" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={contactHref("Fall Cleanup", {
                pkg: `${activeTier.label} Leaf Cleanup`,
                services: activeTier.items,
              })}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black uppercase tracking-wide transition-colors"
            >
              Get My Free Quote <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Combo packages */}
        <div className="grid md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg, i) => {
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-[2rem] overflow-hidden bg-white border-2 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                  pkg.popular ? "border-red-800 shadow-xl shadow-red-900/15 md:-mt-4" : "border-stone-200"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 text-stone-900 text-[10px] font-black uppercase tracking-widest shadow">
                    <StarIcon className="w-3.5 h-3.5" /> Most Popular
                  </span>
                )}
                <div className="relative h-48">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c0a0e]/85 via-[#1c0a0e]/20 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-2xl font-black text-white tracking-tight">{pkg.name}</h3>
                    <p className="text-sm text-yellow-100 font-semibold">{pkg.tagline}</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col p-6">
                  <ul className="space-y-3 flex-1">
                    {pkg.services.map((k) => (
                      <li key={k} className="flex items-center gap-2 font-bold text-stone-900">
                        <CheckIcon className="w-5 h-5 text-emerald-700 shrink-0" />
                        {SERVICES[k].name}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-stone-500">{pkg.services.length} services · one plan</span>
                    <span className="text-lg font-black text-red-800 tracking-tight">Free quote</span>
                  </div>
                  <Link
                    href={contactHref(pkg.form, { pkg: pkg.name, services: formNames(pkg.services) })}
                    className={`mt-5 inline-flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-wide transition-colors ${
                      pkg.popular
                        ? "bg-red-800 hover:bg-red-700 text-white"
                        : "bg-stone-900 hover:bg-black text-yellow-300"
                    }`}
                  >
                    Get My Free Quote <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Year-round bundle + builder */}
        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="rounded-[2rem] overflow-hidden relative text-white min-h-[340px] flex">
            <img src="/images/fall-house-leaves.jpg" alt="Cape Cod home in autumn" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/80 to-emerald-900/40" />
            <div className="relative p-8 flex flex-col justify-end">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-300">Year-Round Care</p>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight mt-2">Spring + Fall + Weekly Mowing</h3>
              <p className="mt-3 text-emerald-50/90 font-medium max-w-md">
                Bundle your spring cleanup, fall cleanup, and weekly maintenance into one agreement.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="text-5xl font-black tracking-tighter text-yellow-300">15% OFF</span>
                <span className="px-3 py-1.5 rounded-xl border-2 border-dashed border-yellow-300/70 text-yellow-200 font-black tracking-widest text-sm">BUNDLE-15</span>
              </div>
              <Link
                href={contactHref("Lawn Mowing", {
                  promo: "BUNDLE-15",
                  pkg: "Year-Round Care Bundle",
                  services: ["Spring Cleanup", "Fall Cleanup", "Weekly Lawn Mowing"],
                })}
                className="mt-7 self-start inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black uppercase tracking-wide transition-colors"
              >
                Get 15% Off Quote <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] p-8 bg-white border-2 border-stone-200">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-red-800">Build Your Own</p>
            <h3 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight mt-2">Mix &amp; match services</h3>
            <div className="mt-5 grid sm:grid-cols-2 gap-2.5">
              {BUILDER_KEYS.map((k) => {
                const on = picked.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggle(k)}
                    className={`flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                      on ? "border-red-800 bg-red-50" : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold text-stone-900">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${on ? "bg-red-800 text-white" : "border-2 border-stone-300"}`}>
                        {on && <CheckIcon className="w-3.5 h-3.5" />}
                      </span>
                      {SERVICES[k].name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-stone-500">Your plan</p>
                <p className="text-2xl font-black text-red-800 tracking-tight">
                  {picked.length} {picked.length === 1 ? "service" : "services"} selected
                </p>
              </div>
              <Link
                href={contactHref(picked.length ? SERVICES[picked[0]].form : "Other", {
                  pkg: "Custom Fall Plan",
                  services: formNames(picked),
                })}
                className={`inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-wide transition-colors ${
                  picked.length ? "bg-red-800 hover:bg-red-700 text-white" : "bg-stone-100 text-stone-400 pointer-events-none"
                }`}
              >
                Get My Free Quote <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-stone-500 font-medium">
          Every yard is different. Free quote, no obligation. We confirm the price before any work starts.
        </p>
      </div>
    </section>
  );
}
