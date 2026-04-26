'use client';

import { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  SparklesIcon, 
  PhoneIcon, 
  ArrowRightIcon, 
  CheckBadgeIcon, 
  TicketIcon,
  TagIcon,
  ClockIcon,
  CalendarDaysIcon,
  GiftIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

const offers = [
  {
    id: 'spring-dethatch',
    title: 'Precision Dethatching',
    subtitle: 'FREE with Maintenance Plan',
    description: 'Allow your lawn to breathe again. Receive a professional dethatching service at no cost when you sign up for our 2025 Seasonal Maintenance Route.',
    value: '$150 Value',
    code: 'BREATHE-FREE',
    expiry: 'Expires May 15th',
    color: 'bg-green-600',
    icon: SparklesIcon,
    status: 'High Demand',
    finePrint: 'Limited to properties under 15,000 sqft. Requires a 2025 Seasonal Maintenance agreement commitment.'
  },
  {
    id: 'first-cut-special',
    title: 'The $29 Introductory Mow',
    subtitle: 'ELITE QUALITY. ONLY $29.',
    description: 'Try the Flora difference for less. Experience our precision mowing, professional edging, and clean-up for just $29 when you sign up for our 2025 seasonal maintenance route.',
    value: 'ONLY $29',
    code: 'FIRST-29',
    expiry: 'Ongoing',
    color: 'bg-blue-600',
    icon: TicketIcon,
    status: 'New Offer',
    finePrint: 'Valid for properties up to 10,000 sqft. Requires a seasonal maintenance agreement commitment.'
  },
  {
    id: 'prepay-unlock',
    title: 'The Prepay Advantage',
    subtitle: 'CASH-BACK REWARD',
    description: 'Lock in your budget and your schedule. Pre-pay for your 2025 seasonal maintenance (mowing + ferts) and receive your Fall Cleanup 100% FREE.',
    value: 'FREE CLEANUP',
    code: 'PREPAY-FREE',
    expiry: 'Window Closing',
    color: 'bg-green-700',
    icon: TicketIcon,
    status: 'Best ROI',
    finePrint: 'Applicable when full seasonal balance is paid upfront by April 30th.'
  },
  {
    id: 'honor-service',
    title: 'Honor & Service Reward',
    subtitle: 'Seniors & Military',
    description: 'We value your contribution. All active military, veterans, and seniors (65+) receive a permanent 5% discount on all recurring lawn maintenance services.',
    value: 'Permanent 5%',
    code: 'HONOR-5',
    expiry: 'Permanent',
    color: 'bg-slate-700',
    icon: ShieldCheckIcon,
    status: 'Active',
    finePrint: 'Proof of eligibility required at time of contract signing.'
  },
  {
    id: 'referral-credit',
    title: '$25 Referral Reward',
    subtitle: 'Share the Love',
    description: 'Your reputation is our best advertisement. Refer a neighbor and both of you will receive service credits once they book their first cleanup or mow.',
    value: '$25 Credit',
    code: 'REFER-25',
    expiry: 'Always Available',
    color: 'bg-amber-500',
    icon: GiftIcon,
    status: 'Active',
    finePrint: 'Credit applied after the referred customer completes their first paid service.'
  },
  {
    id: 'neighbor-discount',
    title: 'Neighborhood Discount',
    subtitle: 'Better Together. Shared Savings.',
    description: 'Strength in numbers! Save 10% on your service when you and a neighbor on the same street book your services for the same day. It\'s efficient for us, and cheaper for you.',
    value: '10% OFF',
    code: 'NEIGHBOR-10',
    expiry: 'Ongoing',
    color: 'bg-amber-600',
    icon: UserGroupIcon,
    status: 'Community Reward',
    finePrint: 'Valid when two or more adjacent or near-adjacent properties book service on the same calendar day.'
  },
  {
    id: 'bundle-discount',
    title: 'Elite Bundle Reward',
    subtitle: 'Full Season. Zero Stress.',
    description: 'The ultimate property management solution. Bundle your Spring Cleanup, Fall Cleanup, and Weekly Maintenance into a single agreement and receive a 15% discount on the total seasonal cost.',
    value: '15% OFF',
    code: 'BUNDLE-15',
    expiry: 'Seasonal',
    color: 'bg-emerald-600',
    icon: SparklesIcon,
    status: 'Best Value',
    finePrint: 'Requires a full seasonal agreement covering spring, summer, and fall services.'
  }
];

export default function OffersPage() {
  const [activeOffer, setActiveOffer] = useState(offers[0]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <Navigation />
      
      {/* ELITE OFFERS HERO */}
      <section className="relative pt-44 pb-32 overflow-hidden bg-slate-950">
         <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-slate-950 to-slate-950" />
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
         
         <div className="max-w-7xl mx-auto px-4 relative z-10">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-center md:text-left"
            >
               <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-8">
                  <TagIcon className="w-4 h-4 text-green-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Seasonal Rewards Central</span>
               </div>
               <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-none italic mb-8 uppercase">
                  Claim Your <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent block md:inline-block">Exclusive Savings</span>
               </h1>
               <p className="text-xl text-slate-400 max-w-2xl font-medium italic mb-10">
                  Flora Lawn & Landscaping offers high-impact seasonal promotions to ensure your Rhode Island or Massachusetts property stays ahead of the curve.
               </p>
            </motion.div>
         </div>
      </section>

      {/* FEATURED OFFER PANEL */}
      <section className="relative -mt-20 z-20 pb-24">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-8">
               
               {/* MAIN OFFER CARD */}
               <div className="lg:col-span-8 flex flex-col">
                  <motion.div 
                     layoutId={activeOffer.id}
                     className="bg-white rounded-[3rem] shadow-4xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-full"
                  >
                     <div className={`md:w-1/3 ${activeOffer.color} p-12 flex flex-col items-center justify-center text-white text-center relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-10">
                           <activeOffer.icon className="w-64 h-64 -translate-y-10 translate-x-10 rotate-12" />
                        </div>
                        <div className="relative z-10">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Benefit Value</p>
                           <h3 className="text-4xl font-black italic uppercase leading-none mb-6">{activeOffer.value}</h3>
                           <div className="bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest">
                              Promo Code: {activeOffer.code}
                           </div>
                        </div>
                     </div>
                     <div className="md:w-2/3 p-8 md:p-16 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-inner">
                              <activeOffer.icon className="w-5 h-5 text-slate-900" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-green-600 italic">{activeOffer.status} Promotion</span>
                        </div>
                        <h2 className="text-4xl font-black text-slate-950 italic uppercase tracking-tighter leading-none mb-2">{activeOffer.title}</h2>
                        <p className="text-xl font-bold text-slate-400 uppercase tracking-tight mb-8">{activeOffer.subtitle}</p>
                        <p className="text-slate-600 font-semibold italic text-lg leading-relaxed mb-10">"{activeOffer.description}"</p>
                        
                        <div className="grid sm:grid-cols-2 gap-6 items-center">
                           <Link 
                              href={`/contact?service=${activeOffer.id}&promo=${activeOffer.code}`}
                              className="w-full bg-slate-900 hover:bg-green-600 text-white font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl uppercase tracking-tighter text-sm group"
                           >
                              Claim This Offer <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                           </Link>
                           <div className="flex items-center gap-3 text-slate-400">
                              <ClockIcon className="w-5 h-5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{activeOffer.expiry}</span>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               </div>

               {/* SIDEBAR SELECTOR */}
               <div className="lg:col-span-4 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-4 italic">Available Rewards</h3>
                  {offers.map((offer) => (
                     <button
                        key={offer.id}
                        onClick={() => setActiveOffer(offer)}
                        className={`w-full p-6 lg:p-8 rounded-[2rem] text-left transition-all border-2 flex items-center gap-6 group ${
                           activeOffer.id === offer.id 
                           ? 'bg-white border-green-500 shadow-2xl scale-105' 
                           : 'bg-white/50 border-transparent hover:border-slate-200 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                        }`}
                     >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${offer.color} text-white`}>
                           <offer.icon className="w-7 h-7" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{offer.value}</p>
                           <h4 className="font-black text-slate-900 leading-none">{offer.title}</h4>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20 px-10">
               <h2 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter italic mb-4 uppercase">How To Claim</h2>
               <div className="w-24 h-2 bg-green-500 mx-auto rounded-full" />
            </div>

            <div className="grid md:grid-cols-3 gap-12">
               {[
                  { 
                     t: 'Select Your Offer', 
                     d: 'Browse our seasonal rewards and find the one that fits your property needs.', 
                     i: TicketIcon 
                  },
                  { 
                     t: 'Request A Quote', 
                     d: 'Submit our priority contact form and the code will be automatically attached.', 
                     i: CalendarDaysIcon 
                  },
                  { 
                     t: 'Redeem & Enjoy', 
                     d: 'Our team will apply the credit to your final invoice once the service is complete.', 
                     i: CheckBadgeIcon 
                  }
               ].map((step, i) => (
                  <div key={i} className="text-center group">
                     <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:bg-green-600 transition-all duration-500">
                        <step.i className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                     </div>
                     <h4 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-4">{i + 1}. {step.t}</h4>
                     <p className="text-slate-500 font-semibold italic leading-relaxed px-4">"{step.d}"</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* TERMS SECTION (Minimalist) */}
      <section className="py-20 bg-slate-50">
         <div className="max-w-4xl mx-auto px-10 border-l-4 border-slate-200">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Terms & Conditions</h3>
            <div className="space-y-4">
               {offers.map(o => (
                  <p key={o.id} className="text-[11px] text-slate-500 font-bold leading-relaxed">
                     <strong className="text-slate-900">{o.title}:</strong> {o.finePrint}
                  </p>
               ))}
               <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  Offers cannot be retroactively applied to invoices already sent. Flora Lawn & Landscaping reserves the right to cancel or modify any offer at any time due to scheduling availability.
               </p>
            </div>
         </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-green-600 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/flora-pattern.svg')] bg-repeat" />
         </div>
         <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic mb-8 uppercase leading-none">
               Don't Leave Money <br /> on the <span className="text-slate-950">Table</span>
            </h2>
            <p className="text-xl text-green-50 mb-12 font-semibold italic">
               Our seasonal spots fill up within weeks. Lock in your specialized offer today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/contact" className="bg-slate-950 hover:bg-slate-900 text-white font-black px-14 py-6 rounded-2xl flex items-center gap-4 transition-all active:scale-95 shadow-4xl uppercase text-lg">
                 Start Priority Quote <ArrowRightIcon className="w-6 h-6" />
               </Link>
               <a href="tel:4013890913" className="flex flex-col items-center sm:items-start text-white group">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Call Direct</p>
                  <p className="text-2xl font-black italic underline decoration-white/30">(401) 389-0913</p>
               </a>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
}
