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
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import { 
  StarIcon as StarIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid 
} from "@heroicons/react/24/solid";
import InstantQuoteMap from "@/components/InstantQuote";
import ServiceAreaMap from "@/components/ServiceAreaMap";

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
      setQuickStatus({ type: 'error', message: 'Failed to send. Please call (401) 389-0913' });
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navigation />
      
      {/* PROFESSIONAL HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/lawn-mowing.jpg"
            alt="Premium Landscape"
            fill
            priority
            className="object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full pt-20">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Award Badges Row */}
              <div className="grid grid-cols-2 gap-3 mb-10">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl justify-center">
                  <Image src="/nextdoor-badge.png" alt="Nextdoor Fave" width={38} height={38} className="rounded-full shadow-lg" />
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-green-400 font-extrabold uppercase tracking-widest leading-none mb-1">Neighborhood</p>
                    <p className="text-sm text-white font-black italic leading-none">2025 Fave Winner</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl justify-center">
                  <Image src="/businessrate-badge.png" alt="BusinessRate Best of 2025" width={38} height={38} className="rounded-full shadow-lg" />
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest leading-none mb-1">BusinessRate</p>
                    <p className="text-sm text-white font-black italic leading-none">Best of 2025</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl justify-center">
                   <div className="flex flex-col gap-1 items-center sm:items-start">
                      <div className="flex text-yellow-400 gap-0.5">
                         {[...Array(5)].map((_, i) => <StarIconSolid key={`g-${i}`} className="w-4 h-4" />)}
                      </div>
                      <p className="text-[9px] text-white/50 font-black uppercase tracking-widest leading-none mt-1 text-center sm:text-left">31 Verified Reviews</p>
                   </div>
                   <div className="sm:border-l border-white/10 sm:pl-3 text-center sm:text-left">
                      <p className="text-[10px] text-[#4285F4] font-extrabold uppercase tracking-widest leading-none mb-1">Google</p>
                      <p className="text-sm text-white font-black italic leading-none">4.9 Star Rating</p>
                   </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:space-x-3 gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl justify-center">
                   <div className="flex flex-col gap-1 items-center sm:items-start">
                      <div className="flex text-yellow-400 gap-0.5">
                         {[...Array(5)].map((_, i) => <StarIconSolid key={`t-${i}`} className="w-4 h-4" />)}
                      </div>
                      <p className="text-[9px] text-white/50 font-black uppercase tracking-widest leading-none mt-1 text-center sm:text-left">71 Verified Reviews</p>
                   </div>
                   <div className="sm:border-l border-white/10 sm:pl-3 text-center sm:text-left">
                      <p className="text-[10px] text-[#009FD9] font-extrabold uppercase tracking-widest leading-none mb-1">Thumbtack</p>
                      <p className="text-sm text-white font-black italic leading-none">4.8 Star Pro</p>
                   </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight italic text-center sm:text-left">
                The Premier Choice for Reliable & <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent inline-block">Professional Lawn Care</span> in RI
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-xl leading-relaxed font-medium text-center sm:text-left">
                Flora Lawn & Landscaping provides professional lawn care and landscaping services for homes across Rhode Island and Massachusetts.
              </p>

              {/* DUAL CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link 
                  href="/contact"
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl uppercase tracking-tighter text-base group"
                >
                  <EnvelopeIcon className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  Custom Quote
                </Link>
                
                <a 
                  href="tel:4013890913"
                  className="w-full sm:w-auto bg-green-600/10 hover:bg-green-600/20 backdrop-blur-xl border border-green-500/20 text-green-400 font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl uppercase tracking-tighter text-base group"
                >
                  <PhoneIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  (401) 389-0913
                </a>
              </div>

            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="absolute -inset-4 bg-green-500/20 blur-[100px] rounded-full" />
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 relative z-10 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-white/40 uppercase tracking-widest ml-4 font-black">Fast Free Quotes</span>
                </div>
                <div className="space-y-4">
                  {['Weekly Lawn Mowing', 'Mulch Installation', 'Fertilization Services', 'Full Yard Cleanups'].map((s, i) => (
                    <div key={i} className="flex items-center space-x-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                       <CheckBadgeIconSolid className="w-5 h-5 text-green-500 group-hover:scale-125 transition-transform" />
                       <span className="text-base font-bold text-white tracking-tight">{s}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                   <div className="flex items-center justify-between gap-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold text-green-400">Weekly Maintenance</span>
                      <span className="text-[11px] font-black bg-green-500 text-slate-950 px-3 py-1 rounded-md shrink-0">10% OFF</span>
                   </div>
                   <div className="flex items-center justify-between gap-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold text-yellow-400 leading-tight">All Year Bundle<br/><span className="text-[8px] text-white/50">(Spring, Fall, Mulch, Aerate, Dethatch)</span></span>
                      <span className="text-[11px] font-black bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-3 py-1 rounded-md shrink-0">20% OFF</span>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
      {/* SERVICE GRID MATRIX */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-24">
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 italic">Choose Your Service</h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed italic">
                 Explore our suite of grounds maintenance programs designed for RI & MA homeowners.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {lawnServices.map((svc, i) => (
                 <Link 
                    key={i} 
                    href={`/contact`}
                    className="group relative bg-slate-50 rounded-[3rem] p-5 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-green-300 transition-all overflow-hidden"
                 >
                    <div className="relative h-64 rounded-[2.5rem] overflow-hidden mb-8">
                       <img src={`/images/${svc.slug}.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={svc.title} />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                       <div className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10">Active in RI & MA</div>
                    </div>
                    <div className="px-5 pb-8">
                       <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-green-600 transition-colors uppercase tracking-tight">{svc.title}</h3>
                       <p className="text-slate-500 font-semibold mb-8 italic line-clamp-2">"{svc.description}"</p>
                       <div className="flex items-center text-green-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-3 transition-transform">
                          Get An Estimate <ArrowRightIcon className="w-4 h-4 ml-4" />
                       </div>
                    </div>
                 </Link>
              ))}
           </div>
        </div>
      </section>



      {/* SERVICE AREAS GRID */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-xl">
                 <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4 italic">Serving Your Neighborhood</h2>
                 <p className="text-lg text-slate-500 font-semibold">Reliable coverage throughout Rhode Island and Southern Massachusetts.</p>
              </div>
              <Link href="/locations" className="text-green-600 font-black text-sm uppercase tracking-[0.2em] border-b-2 border-green-600 pb-2 hover:text-green-500 transition-colors">
                 View All Service Areas
              </Link>
           </div>
           
           <div className="mb-12">
               <ServiceAreaMap />
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {cities.slice(0, 15).map((city, i) => (
                 <Link 
                   key={i} 
                   href={`/locations`}
                   className="bg-white p-6 rounded-3xl border border-slate-100 text-center hover:border-green-400 hover:shadow-xl transition-all group"
                 >
                    <MapPinIcon className="w-6 h-6 text-slate-300 mx-auto mb-3 group-hover:text-green-500 transition-colors" />
                    <p className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{city.city}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{city.state || 'RI'}</p>
                 </Link>
              ))}
           </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <Image
             src="/images/lawn-mowing.jpg"
             alt="Premium Landscape"
             fill
             className="object-cover opacity-20 scale-110 blur-sm"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
           <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic mb-8 uppercase leading-none">
              Ready for a <span className="text-green-500">Perfect</span> Lawn?
           </h2>
           <p className="text-xl text-slate-400 mb-12 font-semibold italic">
              Get your free, no-obligation quote today and let our local team take care of the rest.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/contact" className="bg-green-600 hover:bg-green-500 text-white font-black px-14 py-6 rounded-2xl flex items-center gap-4 transition-all active:scale-95 shadow-2xl uppercase text-lg">
                Get Free Quote <ArrowRightIcon className="w-6 h-6" />
              </Link>
              <a href="tel:4013890913" className="flex items-center text-white gap-4 group">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-green-600/20 transition-all border border-white/10">
                    <PhoneIcon className="w-8 h-8 text-green-500" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Direct Call Line</p>
                    <p className="text-2xl font-black text-white italic">(401) 389-0913</p>
                 </div>
              </a>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
