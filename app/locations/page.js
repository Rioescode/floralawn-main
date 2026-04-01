'use client';

import Link from "next/link";
import { cities } from "@/data/city-details";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  MapPinIcon, 
  SparklesIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Group cities by state and then county for a better layout
const citiesByState = cities.reduce((acc, city) => {
  const state = city.city.includes('Attleboro') || city.city.includes('Seekonk') ? 'Massachusetts' : 'Rhode Island';
  if (!acc[state]) acc[state] = {};
  if (!acc[state][city.county]) acc[state][city.county] = [];
  acc[state][city.county].push(city);
  return acc;
}, {});

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navigation />

      {/* ELITE HERO */}
      <section className="relative pt-44 pb-32 overflow-hidden bg-slate-950">
         <div className="absolute inset-0 bg-[url('/images/landscaping-service-image.jpg')] bg-cover opacity-20 scale-105" />
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/60 to-slate-950" />
         
         <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full mb-8">
               <MapPinIcon className="w-5 h-5 text-green-400" />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Official Service Network 2025</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter italic mb-8 uppercase">
               Service <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent inline-block pr-10">Locations</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium italic">
               Providing professional lawn care and landscaping services throughout Rhode Island and Massachusetts.
            </p>
         </div>
      </section>

      {/* DIRECTORY SECTION */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-7xl mx-auto px-4">
            {Object.entries(citiesByState).map(([state, counties]) => (
               <div key={state} className="mb-32">
                  <div className="flex items-center gap-6 mb-16">
                     <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase underline decoration-green-500 underline-offset-[12px] decoration-8">{state}</h2>
                     <div className="flex-1 h-[1px] bg-slate-200" />
                  </div>

                  {Object.entries(counties).map(([county, countyCities]) => (
                     <div key={county} className="mb-20 last:mb-0">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-10 h-1 h-3 bg-green-500 rounded-full" />
                           <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400 italic">{county} County</h3>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {countyCities.map((city) => (
                              <Link 
                                href={`/${city.city.toLowerCase().replace(/\s+/g, '-')}-${state === 'Rhode Island' ? 'ri' : 'ma'}`}
                                key={city.city}
                                className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden"
                              >
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
                                 
                                 <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                       <div>
                                          <h4 className="text-3xl font-black italic text-slate-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">{city.city}</h4>
                                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{state}</p>
                                       </div>
                                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-green-600 group-hover:text-white transition-all">
                                          <ArrowRightIcon className="w-6 h-6" />
                                       </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                       <div className="flex text-yellow-500 gap-0.5">
                                          {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-3 h-3" />)}
                                       </div>
                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Priority Service Area</span>
                                    </div>
                                 </div>
                              </Link>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            ))}
         </div>
      </section>

      {/* TRUST PORTAL */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4">
            <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden text-center md:text-left">
               <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full" />
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
                  <div className="flex-1">
                     <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-8 uppercase">Ready for <span className="text-green-500">Excellence?</span></h2>
                     <p className="text-xl text-slate-400 font-medium italic mb-12 max-w-xl">
                        Join your neighbors in requesting a same-day digital quote. Priority scheduling now active for your region.
                     </p>
                     <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                        <Link 
                          href="/contact"
                          className="px-10 py-6 bg-green-600 hover:bg-green-500 text-white rounded-[2rem] font-black italic uppercase tracking-widest transition-all shadow-2xl flex items-center gap-4 group"
                        >
                           Request Priority Quote <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <a 
                          href="tel:4013890913"
                          className="px-10 py-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-[2rem] font-black italic uppercase tracking-widest transition-all flex items-center gap-4"
                        >
                           Direct Call <PhoneIcon className="w-6 h-6" />
                        </a>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-6 w-full md:w-80">
                      {[
                        { t: 'Local Choice 2025', i: ShieldCheckIcon },
                        { t: '4-Hour Response Time', i: SparklesIcon }
                      ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl flex items-center gap-6">
                           <item.i className="w-10 h-10 text-green-500" />
                           <span className="font-black italic uppercase tracking-tighter">{item.t}</span>
                        </div>
                      ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
}

import { PhoneIcon } from '@heroicons/react/24/outline';