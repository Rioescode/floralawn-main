"use client";

import Link from "next/link";
import { cities } from "@/data/city-details";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Image from 'next/image';
import { lawnServices } from '@/data/lawn-services';
import { reviews } from '@/data/reviews-data';
import { motion } from 'framer-motion';
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
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { 
  StarIcon as StarIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid 
} from "@heroicons/react/24/solid";
import InstantQuoteMap from "@/components/InstantQuote";
import ServiceAreaMap from "@/components/ServiceAreaMap";
import LeafSeason from "@/components/LeafSeason";
import FallHero from "@/components/FallHero";
import FallPackages from "@/components/FallPackages";
import PapercutLightbox from "@/components/PapercutLightbox";

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [quickFormData, setQuickFormData] = useState({ name: '', phone: '', message: '' });
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickStatus, setQuickStatus] = useState(null);
  
  const addressRef = useRef(null);
  const footerAddressRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    let heroAutocomplete, footerAutocomplete;
    const initAutocompletes = async () => {
      if (!window.google || !window.google.maps) return;
      const { Autocomplete } = await window.google.maps.importLibrary("places");
      
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(41.1444, -71.8906),
        new window.google.maps.LatLng(42.0188, -71.1205)
      );

      // Hero Autocomplete
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

      // Footer Autocomplete
      if (footerAddressRef.current) {
        footerAutocomplete = new Autocomplete(footerAddressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["formatted_address", "geometry", "name"],
          types: ["address"]
        });
        footerAutocomplete.setBounds(bounds);
        footerAutocomplete.addListener("place_changed", () => {
          const place = footerAutocomplete.getPlace();
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
      setQuickStatus({ type: 'success', message: 'Request sent! We will call you within 1-6 hours.' });
      setQuickFormData({ name: '', phone: '', message: '' });
      e.target.reset();
    } catch (err) {
      setQuickStatus({ type: 'error', message: 'Failed to send. Please call (401) 205-3853' });
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navigation />
      

      <FallHero />

      <FallPackages />

      {/* TRUST RIBBON */}
      <section className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 text-slate-500 font-extrabold text-xs uppercase tracking-[0.3em] italic">
              <div className="flex items-center gap-3"><StarIconSolid className="w-5 h-5 text-yellow-400" /> 4.9 GOOGLE RATED</div>
              <div className="flex items-center gap-3"><ClockIcon className="w-5 h-5 text-green-500" /> SAME-DAY DIGITAL QUOTES</div>
              <div className="flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-green-500" /> 2025 NEIGHBORHOOD FAV</div>
           </div>
        </div>
      </section>

      {/* NEIGHBORHOOD DENSITY CTA */}
      <section className="py-24 bg-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="bg-slate-950 rounded-[3.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-red-800/15 blur-[120px] rounded-full pointer-events-none"></div>
            <LeafSeason density="sparse" className="z-[1]" />
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Neighborhood Density Program</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 italic leading-none">
                  Is Flora on your <span className="text-green-500">Street?</span>
                </h2>
                <p className="text-slate-400 text-lg mb-10 font-medium max-w-xl">
                  We offer special <strong className="text-white">Density Discounts</strong> for neighborhoods where our trucks already operate. Join the cluster and save up to 10% per visit!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/density-check" className="bg-green-600 hover:bg-green-500 text-white font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase text-sm tracking-widest">
                    Check My Neighborhood <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                  <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pioneer Reward</p>
                      <p className="text-xl font-black text-white leading-none">15% OFF</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] transform -rotate-3 hover:rotate-0 transition-transform">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mb-4">
                      <UserGroupIcon className="h-6 w-6 text-black" />
                    </div>
                    <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-1">Neighborhood Hero</p>
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

      {/* THE FLORA GUARANTEE */}
      <section className="bg-slate-950 py-8 relative border-t-[8px] border-green-600 shadow-inner">
         <div className="max-w-5xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
               <ShieldCheckIcon className="w-16 h-16 text-yellow-400 shrink-0 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]" />
               <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                     <h2 className="text-2xl font-black text-white italic uppercase tracking-wide">
                        The Flora Guarantee
                     </h2>
                     <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest hidden md:block">Not 100% happy?</span>
                  </div>
                  <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
                    Let us know within 3 days and <strong className="text-white font-bold">we'll come right back to fix it.</strong> <strong className="text-green-400 font-bold tracking-tight">99% of our services delight customers.</strong> For the rare 1%, we make it right.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* REVIEWS SECTION (Moved up) */}
      <section className="py-24 bg-white relative">
         <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight italic mb-4">Hear What Our Customers Have to Say</h2>
               <div className="flex items-center justify-center space-x-3">
                  <div className="flex text-yellow-500">
                     {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-5 h-5" />)}
                  </div>
                  <span className="font-black text-slate-900 uppercase tracking-widest text-sm">4.9 Average Rating</span>
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
               {reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col hover:border-green-400 transition-all shadow-sm group">
                     <div className="flex items-center mb-8">
                        <div className={`w-14 h-14 rounded-2xl ${review.color || 'bg-slate-900 text-white'} flex items-center justify-center text-xl font-black shadow-lg`}>
                           {review.initials || review.name.charAt(0)}
                        </div>
                        <div className="ml-5">
                           <p className="font-black text-slate-900 leading-none mb-1">{review.name}</p>
                           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">{review.source}</p>
                        </div>
                     </div>
                     <p className="text-lg text-slate-600 font-semibold italic flex-grow leading-relaxed">"{review.text}"</p>
                     <div className="mt-10 pt-8 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{review.date}</p>
                        <CheckBadgeIconSolid className="w-6 h-6 text-green-500/30 group-hover:text-green-500 transition-colors" />
                     </div>
                  </div>
               ))}
            </div>
            
            <div className="mt-16 text-center">
               <Link href="/reviews" className="inline-flex items-center gap-2 text-green-600 font-black text-sm uppercase tracking-widest hover:text-green-500 transition-colors border-b-2 border-green-600 pb-1">
                  Read All Reviews <ArrowRightIcon className="w-4 h-4" />
               </Link>
            </div>
         </div>
      </section>
      {/* PAPERCUT LIGHTBOX SERVICE THEATER (INSTEAD OF STATIC PHOTO LISTING) */}
      <PapercutLightbox />



      {/* SERVICE AREAS GRID */}
      <section className="relative py-24 bg-gradient-to-b from-[#05080f] via-[#0a101c] to-[#060a12] text-white border-t border-white/5 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[380px] rounded-full bg-amber-500/10 blur-[150px]" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div className="max-w-2xl">
                 <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
                    <MapPinIcon className="w-4 h-4 text-amber-400" />
                    Rhode Island &amp; Southern Massachusetts
                 </div>
                 <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase italic leading-[1.06]">
                    Serving Your <span className="inline-block pr-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">Neighborhood</span>
                 </h2>
                 <p className="text-base md:text-lg text-slate-400 font-medium mt-3">
                    Reliable local crews running daily routes across 45 towns—tap your town on the live map or below for an instant quote.
                 </p>
              </div>
              <Link href="/locations" className="inline-flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-[0.2em] border-b-2 border-amber-400/70 pb-1.5 hover:text-amber-300 transition-colors shrink-0">
                 View All 45 Towns <ArrowRightIcon className="w-4 h-4" />
              </Link>
           </div>
           
           <div className="mb-12">
               <ServiceAreaMap />
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {cities.slice(0, 15).map((city, i) => (
                 <Link 
                   key={i} 
                   href={`/contact?town=${encodeURIComponent(city.city)}`}
                   className="group relative overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-slate-900 hover:shadow-[0_14px_35px_rgba(0,0,0,0.6)]"
                 >
                    <div className="flex items-center justify-between gap-2 mb-3">
                       <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                          <MapPinIcon className="w-4 h-4" />
                       </span>
                       <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {city.state || 'RI'}
                       </span>
                    </div>

                    <p className="font-black text-sm text-white uppercase tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                       {city.city}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate mt-1">
                       {city.zipCodes?.[0] ? `ZIP ${city.zipCodes[0]}` : city.county || 'Active Route'}
                       {city.neighborhoods?.[0] ? ` · ${city.neighborhoods[0]}` : ''}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-amber-400 transition-colors">
                       <span>Daily Route</span>
                       <span className="group-hover:translate-x-0.5 transition-transform">Quote &rarr;</span>
                    </div>
                 </Link>
              ))}
           </div>
        </div>
      </section>

      {/* FINAL CTA SECTION — EXECUTIVE PROFESSIONAL ESTIMATE BANNER */}
      <section className="relative py-20 md:py-28 bg-[#060a12] border-t border-white/10 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 w-[600px] h-[400px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-24 left-0 w-[500px] h-[350px] rounded-full bg-amber-500/10 blur-[140px]" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0e1624] via-[#0b121e] to-[#080d16] p-8 md:p-14 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* LEFT: AUTHORITATIVE VALUE PROPOSITION */}
              <div className="lg:col-span-7 text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300 mb-5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Direct Digital Estimates · RI &amp; Southern MA
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.08]">
                  Ready for a cleaner, healthier property?
                </h2>

                <p className="mt-4 text-base md:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl">
                  Enter your property address in under a minute. We measure your lawn via satellite and deliver a flat-rate quote in <span className="text-slate-200 font-semibold">1 to 6 hours</span>—confirmed before any crew arrives.
                </p>

                {/* CLEAN 3-PILLAR TRUST BAR */}
                <div className="mt-8 pt-7 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <ClockIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      1–6 Hr Quotes
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Fast satellite-measured pricing
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      Price Confirmed
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Zero surprise fees or contracts
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <StarIconSolid className="w-4 h-4 text-amber-400 shrink-0" />
                      4.9 Google Rated
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Licensed &amp; insured local crews
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: CLEAN CONVERSION PANEL */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-6 md:p-8 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-2 border-b border-white/5">
                    <span>Residential &amp; Commercial</span>
                    <span className="text-emerald-400 font-bold">Accepting New Properties</span>
                  </div>

                  <Link
                    href="/contact"
                    className="w-full py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/15 transition-all active:scale-[0.99]"
                  >
                    Request Free Estimate
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>

                  <a
                    href="tel:4012053853"
                    className="w-full py-3.5 px-6 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all"
                  >
                    <PhoneIcon className="w-4 h-4 text-emerald-400" />
                    <span>Call (401) 205-3853</span>
                  </a>
                  <p className="text-center text-[10px] text-slate-500">Se habla español</p>

                  <p className="text-center text-[11px] text-slate-500 font-medium pt-1">
                    Mon–Sat · 7:00 AM – 7:00 PM · Direct Local Dispatch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
