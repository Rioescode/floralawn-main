"use client";

import Link from "next/link";
import { cities } from "@/data/city-details";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Image from 'next/image';
import { lawnServices } from '@/data/lawn-services';
import { reviews } from '@/data/reviews-data';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';
import { sendNotification } from '@/lib/notifications';
import { 
  PhoneIcon, 
  MapPinIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  PlayCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BoltIcon
} from "@heroicons/react/24/outline";
import { 
  StarIcon as StarIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid 
} from "@heroicons/react/24/solid";

const stats = [
  { value: "4.9★", label: "Google Rating", sub: "102 Reviews" },
  { value: "500+", label: "Happy Clients", sub: "Across RI & MA" },
  { value: "10+", label: "Years Serving", sub: "Since 2014" },
  { value: "100%", label: "Satisfaction", sub: "Guaranteed" },
];

const features = [
  { icon: BoltIcon, title: "Same-Day Quotes", desc: "Get your free estimate within hours, not days." },
  { icon: ShieldCheckIcon, title: "Flora Guarantee", desc: "Not happy? We come back free within 3 days." },
  { icon: CalendarDaysIcon, title: "Flexible Scheduling", desc: "Weekly, bi-weekly, or one-time — you choose." },
  { icon: UserGroupIcon, title: "Local & Trusted", desc: "RI-based team serving your neighborhood since 2014." },
];

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [quickFormData, setQuickFormData] = useState({ name: '', phone: '', message: '' });
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickStatus, setQuickStatus] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  
  const addressRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setHeroLoaded(true);
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    let heroAutocomplete;
    const initAutocompletes = async () => {
      if (!window.google || !window.google.maps) return;
      const { Autocomplete } = await window.google.maps.importLibrary("places");
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(41.1444, -71.8906),
        new window.google.maps.LatLng(42.0188, -71.1205)
      );
      if (addressRef.current) {
        heroAutocomplete = new Autocomplete(addressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["formatted_address", "geometry", "name"],
          types: ["address"]
        });
        heroAutocomplete.setBounds(bounds);
        heroAutocomplete.addListener("place_changed", () => {
          const place = heroAutocomplete.getPlace();
          if (place.formatted_address) router.push(`/auto-lawn?address=${encodeURIComponent(place.formatted_address)}`);
        });
      }
    };
    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        initAutocompletes();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setIsQuickSubmitting(true);
    try {
      const templateParams = {
        user_name: quickFormData.name,
        user_phone: quickFormData.phone,
        message: quickFormData.message,
        service_type: 'Home Hero Inquiry',
        to_name: 'FloraLawn Admin'
      };
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID, 
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, 
        templateParams
      );
      await sendNotification(`⚡ QUICK HERO LEAD: ${quickFormData.name} (${quickFormData.phone}) wants a quote!`);
      setQuickStatus({ type: 'success', message: '🎉 Sent! We\'ll call you within 1–6 hours.' });
      setQuickFormData({ name: '', phone: '', message: '' });
      e.target.reset();
    } catch (err) {
      setQuickStatus({ type: 'error', message: 'Failed. Please call (401) 389-0913 directly.' });
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navigation />

      {/* ═══════════════════════════════════════════
          HERO — CINEMATIC SPLIT
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#060f05]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/lawn-mowing.jpg"
            alt="Premium Lawn Care Rhode Island"
            fill
            priority
            className={`object-cover transition-all duration-1500 ${heroLoaded ? 'opacity-35 scale-100' : 'opacity-0 scale-110'}`}
            style={{ transitionDuration: '1.8s' }}
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060f05]/95 via-[#060f05]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060f05] via-transparent to-[#060f05]/30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 w-full pt-24 pb-20">
          <div className="grid lg:grid-cols-[1fr_480px] gap-16 xl:gap-24 items-center">

            {/* LEFT — COPY */}
            <div className={`transition-all duration-1000 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Now Booking Spring 2025
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full">
                  <StarIconSolid className="w-3 h-3 text-yellow-400" />
                  4.9 · 102 Reviews
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-white leading-[0.95] tracking-tight mb-8">
                Rhode Island's
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 mt-1">
                  Premier Lawn
                </span>
                <span className="block">Care Experts</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-lg leading-relaxed font-medium">
                Professional mowing, mulching, cleanups & landscaping across Rhode Island and Southern Massachusetts. Results you can see, service you can trust.
              </p>

              {/* Address Search */}
              <div className="relative mb-8 max-w-lg">
                <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
                  <MapPinIcon className="w-5 h-5 text-emerald-600 ml-5 shrink-0" />
                  <input
                    ref={addressRef}
                    type="text"
                    placeholder="Enter your property address..."
                    className="flex-1 px-4 py-5 text-slate-900 font-semibold text-sm bg-transparent outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => { if (addressRef.current?.value) router.push(`/auto-lawn?address=${encodeURIComponent(addressRef.current.value)}`); }}
                    className="m-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all active:scale-95 whitespace-nowrap"
                  >
                    Get Quote
                  </button>
                </div>
              </div>

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/contact" className="group bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-900/40 uppercase tracking-wide text-sm">
                  Free Custom Quote
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="tel:4013890913" className="group flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-600/20 group-hover:border-emerald-500/30 transition-all">
                    <PhoneIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold leading-none">Call Direct</p>
                    <p className="font-black text-base tracking-tight">(401) 389-0913</p>
                  </div>
                </a>
              </div>
            </div>

            {/* RIGHT — FLOATING CARD */}
            <div className={`hidden lg:block relative transition-all duration-1000 delay-500 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="absolute -inset-6 bg-emerald-500/10 rounded-[3rem] blur-2xl" />
              <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Fast Free Estimates</p>
                    <p className="text-white font-black text-xl">Request Your Quote</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                <form onSubmit={handleQuickSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your name"
                    required
                    value={quickFormData.name}
                    onChange={e => setQuickFormData(p => ({...p, name: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    required
                    value={quickFormData.phone}
                    onChange={e => setQuickFormData(p => ({...p, phone: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                  />
                  <select
                    value={quickFormData.message}
                    onChange={e => setQuickFormData(p => ({...p, message: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-slate-400 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select a service...</option>
                    <option value="Lawn Mowing" className="bg-slate-900">Lawn Mowing</option>
                    <option value="Spring Cleanup" className="bg-slate-900">Spring Cleanup</option>
                    <option value="Mulch Installation" className="bg-slate-900">Mulch Installation</option>
                    <option value="Landscaping" className="bg-slate-900">Landscaping</option>
                    <option value="Leaf Removal" className="bg-slate-900">Leaf / Fall Cleanup</option>
                    <option value="Other" className="bg-slate-900">Other / Not Sure</option>
                  </select>
                  
                  {quickStatus && (
                    <div className={`p-3 rounded-xl text-xs font-bold text-center ${quickStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {quickStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isQuickSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider text-sm shadow-lg shadow-emerald-900/40"
                  >
                    {isQuickSubmitting ? 'Sending...' : '⚡ Get Free Estimate'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          NEIGHBORHOOD DENSITY CTA (Restored)
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white overflow-hidden relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
          <div className="bg-slate-950 rounded-[3.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Neighborhood Density Program</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 italic leading-none">
                  Is Flora on your <span className="text-emerald-500">Street?</span>
                </h2>
                <p className="text-slate-400 text-lg mb-10 font-medium max-w-xl">
                  We offer special <strong className="text-white">Density Discounts</strong> for neighborhoods where our trucks already operate. Join the cluster and save up to 10% per visit!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/density-check" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase text-sm tracking-widest">
                    Check My Neighborhood <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] transform -rotate-3 hover:rotate-0 transition-transform">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                      <UserGroupIcon className="h-6 w-6 text-black" />
                    </div>
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Neighborhood Hero</p>
                    <p className="text-xl font-black text-white">10% OFF</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold italic">"We're already here!"</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] transform rotate-6 hover:rotate-0 transition-transform mt-8">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
                      <MapPinIcon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Standard City</p>
                    <p className="text-xl font-black text-white">5% OFF</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold italic">"Route Optimization"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS RIBBON
      ═══════════════════════════════════════════ */}
      <section className="bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.07)_0%,transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-emerald-500/40">
            {stats.map((s, i) => (
              <div key={i} className="py-8 px-6 text-center group hover:bg-emerald-500/20 transition-all">
                <p className="text-3xl md:text-4xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-emerald-100 font-bold text-sm mt-1">{s.label}</p>
                <p className="text-emerald-200/60 text-[11px] uppercase tracking-widest font-bold mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FLORA GUARANTEE (Restored/Premium)
      ═══════════════════════════════════════════ */}
      <section className="bg-slate-950 py-16 relative border-t-[8px] border-emerald-600">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
        <div className="max-w-5xl mx-auto px-6 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-white/[0.03] border border-white/5 rounded-3xl px-8 md:px-12 py-10">
            <div className="shrink-0">
              <ShieldCheckIcon className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 mb-3 justify-center md:justify-start">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">The Flora Guarantee</h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">100% Satisfaction</span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
                Not 100% happy? Let us know within <strong className="text-white">3 days</strong> and we'll come back to make it right — completely <strong className="text-emerald-400">free of charge.</strong> 99% of our work delights on the first visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SERVICES — BENTO GRID
      ═══════════════════════════════════════════ */}
      <section className="py-28 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <p className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Our Services</p>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                Everything<br />Your Yard Needs
              </h2>
            </div>
            <Link href="/contact" className="shrink-0 group flex items-center gap-2 text-sm font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-600 pb-1 hover:text-emerald-500 hover:border-emerald-500 transition-colors">
              Get a Custom Quote <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lawnServices.map((svc, i) => (
              <Link 
                key={i} 
                href="/contact"
                className={`group relative rounded-[2rem] overflow-hidden border border-slate-100 hover:border-emerald-300 hover:shadow-2xl transition-all duration-500 bg-white ${i === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
              >
                <div className={`relative overflow-hidden ${i === 0 ? 'h-80' : 'h-56'}`}>
                  <img src={`/images/${svc.slug}.jpg`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={svc.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <div className="absolute top-4 left-4 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] border border-white/20">
                    RI & MA
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors tracking-tight">{svc.title}</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2">{svc.description}</p>
                    </div>
                    <div className="shrink-0 w-10 h-10 bg-slate-100 group-hover:bg-emerald-600 rounded-xl flex items-center justify-center transition-colors duration-300 mt-0.5">
                      <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          REVIEWS — PREMIUM CARDS
      ═══════════════════════════════════════════ */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Customer Reviews</p>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
              Heard It From<br />Our Neighbors
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />)}
              </div>
              <span className="font-black text-slate-900 text-sm uppercase tracking-widest">4.9 Average — 102 Reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            {reviews.slice(0, 3).map((review, index) => (
              <div key={index} className="group bg-slate-50 hover:bg-white hover:shadow-xl border border-slate-100 hover:border-emerald-200 p-8 rounded-3xl transition-all duration-300 flex flex-col">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />)}
                </div>
                <blockquote className="text-slate-700 font-semibold italic leading-relaxed flex-grow text-base mb-8">
                  "{review.text}"
                </blockquote>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                  <div className={`w-12 h-12 rounded-2xl ${review.color || 'bg-slate-900'} flex items-center justify-center text-sm font-black shadow-lg`}>
                    {review.initials || review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm leading-none mb-1">{review.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{review.source} · {review.date}</p>
                  </div>
                  <CheckBadgeIconSolid className="w-5 h-5 text-emerald-500/30 group-hover:text-emerald-500 transition-colors ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SERVICE AREAS
      ═══════════════════════════════════════════ */}
      <section className="py-28 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div>
              <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-4">Coverage Area</p>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
                Serving Your<br />Neighborhood
              </h2>
              <p className="text-slate-500 font-medium mt-6 max-w-md">Full coverage across Rhode Island and Southern Massachusetts. Fast response, local team.</p>
            </div>
            <Link href="/locations" className="shrink-0 group flex items-center gap-2 text-sm font-black text-emerald-500 uppercase tracking-widest border-b-2 border-emerald-500 pb-1 hover:text-emerald-400 hover:border-emerald-400 transition-colors">
              All Service Areas <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cities.slice(0, 20).map((city, i) => (
              <Link 
                key={i} 
                href="/locations"
                className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-emerald-500/30 p-5 rounded-2xl text-center transition-all duration-300"
              >
                <MapPinIcon className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 mx-auto mb-3 transition-colors" />
                <p className="font-black text-white text-sm uppercase tracking-tight leading-none mb-1">{city.city}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest group-hover:text-emerald-500/60 transition-colors">{city.state || 'RI'}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FINAL CTA — CINEMATIC
      ═══════════════════════════════════════════ */}
      <section className="relative py-36 overflow-hidden bg-[#060f05]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/mulch-installation.jpg"
            alt="Premium Landscaping RI"
            fill
            className="object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f05] via-transparent to-[#060f05]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 md:px-8 relative z-10 text-center">
          <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.3em] mb-6">Get Started Today</p>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-8">
            Ready for a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Perfect Yard?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/contact" className="group bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-5 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-2xl shadow-emerald-900/50 uppercase tracking-wide text-base">
              Get Free Quote <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
