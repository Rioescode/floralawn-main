'use client';

import Link from "next/image"; // Error here? Wait.
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  UserIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Footer = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.is_admin) {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-400 pt-32 pb-12 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* TOP BRAND SECTION */}
        <div className="grid lg:grid-cols-2 gap-20 pb-20 border-b border-white/5 items-center">
           <div>
              <div className="bg-white px-5 py-3 rounded-2xl shadow-2xl inline-block mb-10">
                 <Image
                   src="/flora-logo-final.png"
                   alt="Flora Lawn"
                   width={400}
                   height={133}
                   className="h-24 w-auto brightness-100"
                 />
              </div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-6 uppercase">
                Rhode Island's <span className="text-green-500 underline decoration-white/20 underline-offset-8">Property Standard</span>
              </h3>
              <p className="text-lg font-medium italic max-w-xl leading-relaxed">
                Professional lawn care and landscaping services across Rhode Island and Massachusetts. We provide reliable mowing, seasonal cleanups, and property maintenance for every home.
              </p>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
              {[
                  { img: '/nextdoor-badge.png', label: '2025 Neighborhood Fave' },
                  { img: '/businessrate-badge.png', label: 'BusinessRate Top Choice' }
              ].map((badge, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center gap-4 group hover:bg-white/10 transition-all cursor-default">
                     <Image src={badge.img} alt="Badge" width={48} height={48} className="rounded-lg shadow-2xl group-hover:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">{badge.label}</span>
                  </div>
              ))}
           </div>
        </div>

        {/* LINKS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 py-20 border-b border-white/5">
           
           {/* SERVICES */}
           <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                 <SparklesIcon className="w-4 h-4 text-green-500" /> Services
              </h4>
              <ul className="space-y-4">
                 {[
                    { n: 'Precision Mowing', h: '/services/lawn-maintenance' },
                    { n: 'Premium Mulch', h: '/services/landscaping' },
                    { n: 'Spring/Fall Cleanup', h: '/services/seasonal-cleanup' },
                    { n: 'Lawn Fertilization', h: '/services/lawn-care' },
                    { n: 'Aeration & Seeding', h: '/services/lawn-aeration' }
                 ].map((link, i) => (
                    <li key={i}>
                       <a href={link.h} className="text-sm font-bold hover:text-white hover:translate-x-2 transition-all inline-block italic">
                          {link.n}
                       </a>
                    </li>
                 ))}
              </ul>
           </div>

           {/* REGIONS */}
           <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                 <MapPinIcon className="w-4 h-4 text-green-500" /> Locations
              </h4>
              <ul className="space-y-4">
                 {[
                    { n: 'Providence, RI', h: '/providence-ri' },
                    { n: 'Pawtucket, RI', h: '/pawtucket-ri' },
                    { n: 'Cranston, RI', h: '/cranston-ri' },
                    { n: 'Warwick, RI', h: '/warwick-ri' },
                    { n: 'Attleboro, MA', h: '/attleboro-ma' }
                 ].map((link, i) => (
                    <li key={i}>
                       <a href={link.h} className="text-sm font-bold hover:text-white hover:translate-x-2 transition-all inline-block italic">
                          {link.n}
                       </a>
                    </li>
                 ))}
                 <li>
                    <a href="/locations" className="text-green-500 text-xs font-black uppercase tracking-widest hover:underline mt-4 inline-block">
                       All Service Areas →
                    </a>
                 </li>
              </ul>
           </div>

           {/* COMPANY */}
           <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                 <UserIcon className="w-4 h-4 text-green-500" /> Company
              </h4>
              <ul className="space-y-4">
                 {[
                    { n: 'Our Story', h: '/about' },
                    { n: 'Project Gallery', h: '/gallery' },
                    { n: 'Customer Reviews', h: '/reviews' },
                    { n: 'Quote Portal', h: '/contact' },
                    { n: 'Careers', h: '/careers' }
                 ].map((link, i) => (
                    <li key={i}>
                       <a href={link.h} className="text-sm font-bold hover:text-white hover:translate-x-2 transition-all inline-block italic">
                          {link.n}
                       </a>
                    </li>
                 ))}
              </ul>
           </div>

           {/* CONTACT DIRECT */}
           <div className="col-span-2 lg:col-span-1 border-l border-white/5 pl-0 lg:pl-12 pt-12 lg:pt-0">
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Priority Contact</h4>
              <div className="space-y-8">
                 <a href="tel:4013890913" className="block group">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1">Direct Line</p>
                    <p className="text-2xl font-black text-white group-hover:text-green-500 transition-colors tracking-tighter">(401) 389-0913</p>
                 </a>
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl text-green-500">
                       <ClockIcon className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Typical Reply</p>
                       <p className="text-xs font-bold italic mt-1 text-slate-500 underline decoration-green-900 underground-offset-2">Under 4 Hours</p>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    {[
                       { i: EnvelopeIcon, h: 'mailto:floralawncareri@gmail.com' },
                       { i: ChatBubbleLeftRightIcon, h: '/contact' }
                    ].map((soc, i) => (
                       <a key={i} href={soc.h} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-green-600 hover:border-green-600 transition-all shadow-xl">
                          <soc.i className="w-5 h-5" />
                       </a>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* BOTTOM LEGAL & COPYRIGHT */}
        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex gap-8 order-2 md:order-1">
              <p className="text-xs font-black uppercase tracking-widest text-slate-600">© 2025 Flora Lawn & Landscaping Inc.</p>
              <div className="flex gap-6">
                 <a href="/privacy-policy" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Privacy</a>
                 <a href="/terms-of-service" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Terms</a>
                 <a href="/sitemap.xml" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Sitemap</a>
              </div>
           </div>
           
           <div className="flex items-center gap-3 order-1 md:order-2">
              <div className="flex text-yellow-500 gap-0.5">
                 {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-4 h-4" />)}
              </div>
              <span className="text-xs font-black text-white italic tracking-tighter">4.9/5 RATING</span>
           </div>

           {/* ADMIN ACCESS - DISCREET */}
           <a href="/login" className="text-[10px] text-slate-800 hover:text-slate-600 transition-colors absolute bottom-4 right-4">•</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
