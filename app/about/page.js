'use client';

import { motion } from 'framer-motion';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Image from 'next/image';
import { 
  SparklesIcon, 
  UserGroupIcon, 
  MapPinIcon, 
  HeartIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';

export default function AboutPage() {
  const stats = [
    { label: 'Founded', value: 'Local RI', icon: MapPinIcon },
    { label: 'Rating', value: '4.9 Stars', icon: SparklesIcon },
    { label: 'Response', value: '1-6 Hours', icon: ClockIcon },
    { label: 'Service', value: 'Elite Level', icon: ShieldCheckIcon },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* CINEMATIC HERO */}
      <section className="pt-32 pb-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500/10 blur-[120px] rounded-full translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-green-400 mb-8"
          >
            <UserGroupIcon className="w-3 h-3" />
            Our Professional Story
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-7xl font-black text-white italic tracking-tighter mb-10 leading-none px-4 md:px-10 overflow-visible"
              >
                RHODE ISLAND <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent pr-20 inline-block">TRADITION</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-400 max-w-xl font-medium italic mb-12 leading-relaxed px-4 md:px-10"
              >
                Flora Lawn & Landscaping is built on a commitment to our Rhode Island neighbors. We combine local family-owned values with professional property standards.
              </motion.p>
              
              <div className="grid grid-cols-2 gap-6 px-4 md:px-10">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl"
                  >
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                       <stat.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                       <p className="font-black text-white italic text-sm">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative aspect-square lg:aspect-auto lg:h-[600px] rounded-[4rem] overflow-hidden border-8 border-white/5 shadow-3xl"
            >
              <Image
                src="/images/2023-09-19 (8).jpg"
                alt="Professional Portfolio Results"
                fill
                className="object-cover transition-transform duration-[10s] hover:scale-110"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CORE STORY */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tighter mb-10 uppercase">Driven By <span className="text-green-600">Our Mission</span></h2>
              <div className="space-y-8">
                 <p className="text-xl text-slate-600 font-semibold italic leading-relaxed">
                    Based in Pawtucket, Flora Lawn & Landscaping was built on a simple premise: provide homeowner transparency through high-speed communication and meticulous outdoor work.
                 </p>
                 <p className="text-lg text-slate-500 font-medium">
                    We saw a gap in the local market for landscaping teams that actually show up, respond quickly, and treat every yard like their own. Today, we're proud to be the neighborhood's preferred choice for reliable, recurring lawn care and cleanup.
                 </p>
              </div>
           </div>

           <div className="grid md:grid-cols-3 gap-8 mt-24">
              {[
                { 
                  title: 'Property First', 
                  text: 'We respect your space. Every gate is closed, every edge is crisp, and no debris is left behind.',
                  icon: HeartIcon 
                },
                { 
                  title: 'Fast Response', 
                  text: 'Our 1-6 hour digital quote guarantee ensures you never wait days for an estimate.',
                  icon: ClockIcon 
                },
                { 
                  title: 'Local Experts', 
                  text: 'From Providence to Pawtucket, we know Rhode Island turf and native plantings.',
                  icon: MapPinIcon 
                }
              ].map((v, i) => (
                <div key={i} className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 hover:border-green-400 transition-all group">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-xl mb-8 group-hover:bg-green-600 group-hover:text-white transition-all">
                      <v.icon className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">{v.title}</h3>
                   <p className="text-slate-500 font-semibold italic leading-relaxed">{v.text}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 bg-slate-50 lg:mx-8 lg:rounded-[5rem] mb-24">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic mb-10">READY FOR A <span className="text-green-600">TRANSFORMATION?</span></h2>
            <p className="text-xl text-slate-500 font-medium italic mb-12">
               Experience the difference of a landscaping team that prioritizes both your yard and your time.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
               <a 
                 href="/contact" 
                 className="bg-slate-900 text-white font-black px-12 py-6 rounded-2xl text-xl hover:bg-green-600 transition-all shadow-2xl flex items-center justify-center gap-4 group"
               >
                  Get Your Free Estimate <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
               </a>
               <a 
                 href="tel:4013890913" 
                 className="bg-white text-slate-900 border-2 border-slate-100 font-black px-12 py-6 rounded-2xl text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-4"
               >
                  (401) 389-0913
               </a>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
}