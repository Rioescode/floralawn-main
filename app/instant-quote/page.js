'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import InstantQuoteMap from '@/components/InstantQuote';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckBadgeIcon, 
  ArrowRightIcon, 
  SparklesIcon,
  PhoneIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/solid';

export default function InstantQuotePage() {
  const [complete, setComplete] = useState(false);
  const [quoteData, setQuoteData] = useState(null);

  const handleQuoteComplete = (data) => {
    setQuoteData(data);
    setComplete(true);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {!complete ? (
              <motion.div 
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-16">
                  <h1 className="text-5xl md:text-7xl font-black text-slate-900 italic tracking-tighter mb-6 uppercase">
                    Instant <span className="text-green-600">Digital Quote</span>
                  </h1>
                  <p className="text-xl text-slate-500 font-medium italic">
                    The elite property scanning tool for meticulous Rhode Island homeowners.
                  </p>
                </div>

                <InstantQuoteMap onQuoteComplete={handleQuoteComplete} />
              </motion.div>
            ) : (
              <motion.div 
                key="step-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto bg-white p-12 md:p-20 rounded-[4rem] shadow-4xl text-center border border-slate-100"
              >
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
                   <CheckBadgeIcon className="w-12 h-12" />
                </div>
                
                <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter mb-4 uppercase leading-none">
                   Rate <span className="text-green-600 underline underline-offset-8 decoration-green-100">Confirmed.</span>
                </h2>
                <p className="text-lg text-slate-400 font-semibold italic mb-12">
                   We've locked in your weekly service rate at ${quoteData.price} based on your scanned {quoteData.area} SQFT property.
                </p>

                <div className="bg-slate-50 p-10 rounded-[3rem] mb-12 text-left space-y-6">
                   <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Address</span>
                      <span className="font-black text-slate-900 italic uppercase tracking-tighter">{quoteData.address}</span>
                   </div>
                   <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Measured Lawn</span>
                      <span className="font-black text-slate-900 italic uppercase tracking-tighter">{quoteData.area.toLocaleString()} SQFT</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Weekly Estimate</span>
                      <span className="text-4xl font-black text-green-600 italic tracking-tighter">${quoteData.price}*</span>
                   </div>
                </div>

                <div className="space-y-6">
                   <a 
                     href={`https://wa.me/14013890913?text=Hi! I just got a quote for $${quoteData.price} for my property at ${quoteData.address}. I measured ${quoteData.area} sqft. I want to schedule now.`}
                     target="_blank"
                     className="w-full bg-slate-900 hover:bg-green-600 text-white p-8 rounded-[2rem] text-2xl font-black italic flex items-center justify-center gap-6 shadow-2xl transition-all group active:scale-95"
                   >
                     Confirm With Expert <ChatBubbleBottomCenterTextIcon className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                   </a>
                   
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                      *Estimates are confirmed by satellite imagery. Final pricing may vary based on terrain height.
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
