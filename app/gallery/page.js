'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  MapPinIcon, 
  ChevronRightIcon,
  CameraIcon
} from '@heroicons/react/24/solid';

const images = [
  { src: '/images/2024-09-18.jpg', category: 'Maintenance' },
  { src: '/images/2024-05-23.jpg', category: 'Lawn Care' },
  { src: '/images/2024-05-14.jpg', category: 'Landscaping' },
  { src: '/images/2023-10-28.jpg', category: 'Cleanup' },
  { src: '/images/2023-10-26.jpg', category: 'Maintenance' },
  { src: '/images/2023-09-21.jpg', category: 'Lawn Care' },
  { src: '/images/2023-09-19 (9).jpg', category: 'Landscaping' },
  { src: '/images/2023-09-19 (8).jpg', category: 'Maintenance' },
  { src: '/images/2023-09-19 (7).jpg', category: 'Cleanup' },
  { src: '/images/Lawn care services.jpg', category: 'Lawn Care' },
  { src: '/images/Lawn care.jpeg', category: 'Lawn Care' },
  { src: '/images/unnamed (2) (1).jpg', category: 'Maintenance' },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* CINEMATIC HERO */}
      <section className="pt-32 pb-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500/10 blur-[120px] rounded-full translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-green-400 mb-8"
          >
            <CameraIcon className="w-3 h-3" />
            Our Work Gallery
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter mb-8 leading-none px-4 md:px-10"
          >
            BEAUTIFUL <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent pr-4">RESULTS</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto font-medium italic"
          >
            Browse our project highlights across Rhode Island. From meticulous mowing to total landscape transformations.
          </motion.p>
        </div>
      </section>

      {/* GALLERY GRID */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {images.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative h-[450px] rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl border border-slate-50"
              >
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10 group-hover:opacity-80 transition-opacity" />
                
                <Image
                  src={item.src}
                  alt={item.category}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Content Overlay */}
                <div className="absolute inset-x-8 bottom-8 z-20">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-green-500 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-lg">
                         Our Service
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                         {item.category}
                      </span>
                   </div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:translate-x-2 transition-transform">
                      Professional Finish
                   </h3>
                   <div className="flex items-center gap-2 text-slate-400">
                      <MapPinIcon className="w-4 h-4 text-green-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Rhode Island, USA</span>
                   </div>
                </div>

                {/* Inspect Button */}
                <div className="absolute top-8 right-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl">
                      <SparklesIcon className="w-6 h-6 text-green-500" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA BAR */}
          <div className="mt-24 p-12 md:p-20 bg-slate-950 rounded-[4rem] text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full" />
             <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 italic tracking-tighter uppercase leading-none">
                   Ready for <span className="text-green-500">Excellence?</span>
                </h2>
                <p className="text-xl text-slate-400 mb-12 font-medium italic">
                   Join the neighborhood's elite. Get your 1-6 hour response guarantee.
                </p>
                <a 
                  href="/contact" 
                  className="inline-flex items-center gap-6 bg-white text-slate-900 font-black px-12 py-6 rounded-2xl text-xl hover:bg-green-600 hover:text-white transition-all shadow-2xl active:scale-95 group"
                >
                   Start Your Free Quote <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                </a>
             </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}