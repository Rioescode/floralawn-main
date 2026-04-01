'use client';

import { useState, useEffect, useRef } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  MapPinIcon, 
  SparklesIcon, 
  ShieldCheckIcon, 
  BoltIcon, 
  CheckBadgeIcon, 
  MapIcon, 
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import InstantQuote from '@/components/InstantQuote';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutoLawnPage() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Initializing Satellite Link...");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({ type: '', message: '' });
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const addressRef = useRef(null);

  useEffect(() => {
    // Check if place was passed via URL (from home search)
    const params = new URLSearchParams(window.location.search);
    const preAddress = params.get('address');
    if (preAddress && addressRef.current) {
        addressRef.current.value = preAddress;
        // Small delay to let maps load then trigger
        setTimeout(() => {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: preAddress }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    handlePlaceSelect({
                        name: preAddress,
                        formatted_address: results[0].formatted_address,
                        geometry: results[0].geometry
                    });
                }
            });
        }, 1500);
    }

    let autocomplete;
    const initAutocomplete = async () => {
      if (!window.google || !window.google.maps) return;
      
      const { Autocomplete } = await window.google.maps.importLibrary("places");
      autocomplete = new Autocomplete(addressRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["address"]
      });

      // Rhode Island & Southern MA Bias
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(41.1444, -71.8906),
        new window.google.maps.LatLng(42.0188, -71.1205)
      );
      autocomplete.setBounds(bounds);

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          handlePlaceSelect(place);
        }
      });
    };

    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        initAutocomplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePlaceSelect = (place) => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Scan Pipeline Simulation
    const statuses = [
      "Acquiring Satellite Coordinates...",
      "Connecting to RentCast Parcel API...",
      "Retrieving Property Metadata...",
      "AI Scanning Green Space Area...",
      "Isolating Hardscape & Obstructions...",
      "Calculating Mowable Square Footage...",
      "Finalizing Performance Intelligence..."
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + (100 / (statuses.length * 5));
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSelectedPlace(place);
            setIsScanning(false);
          }, 1000);
          return 100;
        }
        
        const statusIdx = Math.floor((next / 100) * statuses.length);
        if (statusIdx !== currentIdx && statusIdx < statuses.length) {
          currentIdx = statusIdx;
          setScanStatus(statuses[statusIdx]);
        }
        
        return next;
      });
    }, 60);
  };

  const [quoteData, setQuoteData] = useState({ area: 0, price: 0, breakdown: [] });

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsBookingSubmitting(true);
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      preferredDate: formData.get('preferredDate'),
      address: selectedPlace.formatted_address || selectedPlace.name,
      area: quoteData.area || 0,
      price: quoteData.price || 0,
      breakdown: quoteData.breakdown || [],
      customJobDetails: formData.get('customJobDetails')
    };

    try {
      const response = await fetch('/api/send-quote-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setBookingStatus({ type: 'success', message: 'QUOTE SENT! Our team is reviewing your property. We will contact you within 1-6 hours to confirm.' });
        e.target.reset();
        setTimeout(() => {
          setShowBooking(false);
          setSelectedPlace(null);
        }, 5000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      setBookingStatus({ type: 'error', message: 'Transmission failed. Direct line: (401) 389-0913' });
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-green-500 selection:text-white">
      <Navigation />

      <main className="relative pt-32 pb-24 overflow-hidden">
        {/* Background Effects - LIGHT MODE VERSION */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-green-50 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          {!selectedPlace && !isScanning && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="py-20"
            >
               <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-green-50 border border-green-100 rounded-full text-green-600 font-black text-[10px] uppercase tracking-widest mb-10 shadow-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Satellite Property Intelligence Active
               </div>

               <h1 className="text-5xl md:text-8xl font-black text-slate-950 tracking-tighter leading-none mb-8">
                  Instant AI <br />
                  <span className="text-green-500 font-black">Quote Generator</span>
               </h1>
               
               <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium mb-12">
                  Precision property measurement via satellite intelligence. Get your 100% transparent quote in under 60 seconds.
               </p>

               <div className="max-w-3xl mx-auto mb-20 relative">
                  <div className="absolute -inset-4 bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="bg-white p-2 md:p-4 rounded-[2.5rem] md:rounded-[4rem] shadow-6xl flex flex-col md:flex-row items-stretch md:items-center gap-2 border-4 border-slate-100 relative z-10">
                     <div className="flex-1 px-8 py-4 md:py-0 border-r-0 md:border-r border-slate-100 flex items-center gap-4 text-slate-900">
                        <MapPinIcon className="w-8 h-8 text-green-600 shrink-0" />
                        <input 
                           ref={addressRef}
                           type="text" 
                           placeholder="Find Your Estate..." 
                           className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xl font-bold placeholder-slate-300"
                        />
                     </div>
                     <button 
                        onClick={() => handlePlaceSelect({ name: addressRef.current?.value })}
                        className="bg-slate-950 text-white font-black px-12 py-6 rounded-[2rem] md:rounded-[3rem] text-xl transition-all hover:bg-green-600 active:scale-95 shadow-2xl flex items-center gap-3"
                     >
                        Get My Price
                        <ArrowRightIcon className="w-6 h-6" />
                     </button>
                  </div>
               </div>

               {/* TRIPLE TRUST STATS */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                 {[
                   { t: '98% Accuarcy Rate', d: 'Satellite Measured Properties', i: ShieldCheckIcon },
                   { t: 'Zero-Contact Quotes', d: 'No Site Visits Required', i: BoltIcon },
                   { t: 'Fixed Rate Pricing', d: 'No Surprise Fees On-Site', i: CheckBadgeIcon }
                 ].map((stat, i) => (
                   <div key={i} className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm"><stat.i className="w-6 h-6 text-green-600" /></div>
                     <p className="text-xs font-black uppercase tracking-widest text-slate-950 mb-1">{stat.t}</p>
                     <p className="text-[10px] uppercase font-bold text-slate-400">{stat.d}</p>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

          {/* SCANNING STATE */}
          <AnimatePresence>
          {isScanning && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="min-h-[60vh] flex flex-col items-center justify-center py-20"
            >
               <div className="relative mb-20">
                  <div className="w-48 h-48 rounded-full border-8 border-slate-100 flex items-center justify-center relative shadow-2xl bg-white">
                    <div className="absolute inset-0 rounded-full border-t-8 border-green-500 animate-spin" />
                    <SparklesIcon className="w-16 h-16 text-green-500 animate-pulse" />
                  </div>
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-white border border-slate-100 p-3 rounded-xl shadow-2xl animate-bounce delay-100">
                    <MapIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-white border border-slate-100 p-3 rounded-xl shadow-2xl animate-bounce delay-300">
                    <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                  </div>
               </div>
               
               <div className="max-w-xl w-full">
                 <div className="flex justify-between items-end mb-4 px-2">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-green-600">{scanStatus}</p>
                    <p className="text-2xl font-black italic text-slate-900">{Math.round(scanProgress)}%</p>
                 </div>
                 <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${scanProgress}%` }}
                       className="h-full bg-gradient-to-r from-green-600 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    />
                 </div>
                 <p className="mt-8 text-slate-400 text-sm font-bold italic">Building your property's digital twin...</p>
               </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* QUOTE ENGINE CORE - Sync with InstantQuote */}
          <AnimatePresence>
          {selectedPlace && (
             <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
             >
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-2xl"><MapPinIcon className="w-8 h-8 text-white" /></div>
                      <div className="text-left">
                         <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Target Identified</p>
                         <h2 className="text-3xl font-black italic tracking-tighter leading-none text-slate-950">{selectedPlace.name}</h2>
                      </div>
                   </div>
                   <button 
                      onClick={() => setSelectedPlace(null)}
                      className="px-8 py-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-950"
                   >
                      Recalibrate Address
                   </button>
                </div>

                <div className="bg-white rounded-[3rem] shadow-4xl border border-slate-100 overflow-hidden">
                   <InstantQuote 
                      selectedPlace={selectedPlace} 
                      setSelectedPlace={setSelectedPlace}
                      onQuoteComplete={(data) => {
                         setQuoteData(data);
                         setShowBooking(true);
                      }}
                   />
                </div>
             </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* Booking Form Overlay - Light Mode Version */}
      <AnimatePresence>
        {showBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBooking(false)}
              className="absolute inset-0 bg-slate-950"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-6xl"
            >
              <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-black italic tracking-tighter mb-1 uppercase text-slate-950">Confirm Your Rate</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Commitment • 1-6 Hour Final Review</p>
                </div>
                <button 
                   onClick={() => setShowBooking(false)}
                   className="w-12 h-12 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center transition-all text-slate-950"
                >
                   <span className="text-2xl leading-none">×</span>
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <SparklesIcon className="w-3 h-3 text-green-600" /> Full Name
                    </label>
                    <input required name="name" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-green-600 focus:bg-white focus:outline-none transition-all font-bold placeholder:text-slate-300 text-slate-950" placeholder="e.g. Michael Rossi" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <ClockIcon className="w-3 h-3 text-green-600" /> Phone Number
                    </label>
                    <input required name="phone" type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-green-600 focus:bg-white focus:outline-none transition-all font-bold placeholder:text-slate-300 text-slate-950" placeholder="(401) 000-0000" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <ClockIcon className="w-3 h-3 text-green-600" /> Email Address
                  </label>
                  <input required name="email" type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-green-600 focus:bg-white focus:outline-none transition-all font-bold placeholder:text-slate-300 text-slate-950" placeholder="your@email.com" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <ClockIcon className="w-3 h-3 text-green-600" /> Preferred Service Date
                  </label>
                  <input required name="preferredDate" type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-green-600 focus:bg-white focus:outline-none transition-all font-bold text-slate-950 [color-scheme:light]" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <ClockIcon className="w-3 h-3 text-green-600" /> Custom Instructions (Optional)
                  </label>
                  <textarea name="customJobDetails" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-green-600 focus:bg-white focus:outline-none transition-all font-bold h-32 resize-none placeholder:text-slate-300 text-slate-950" placeholder="Describe any specific areas of concern..." />
                </div>

                {bookingStatus.message && (
                  <div className={`p-6 rounded-2xl font-black text-xs uppercase tracking-widest text-center ${bookingStatus.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600'}`}>
                    {bookingStatus.message}
                  </div>
                )}

                <button 
                  disabled={isBookingSubmitting}
                  className="w-full bg-slate-950 hover:bg-green-600 text-white font-black py-6 rounded-[2rem] text-xl shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4 italic group"
                >
                  {isBookingSubmitting ? 'PROCESSING REQUEST...' : (
                    <>Lock In My Estimate <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-all" /></>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
