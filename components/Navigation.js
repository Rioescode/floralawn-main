'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import {
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
  HomeIcon,
  UserGroupIcon,
  PhotoIcon,
  PhoneIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  UserIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import SpringPromoBanner from './SpringPromoBanner';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    checkUser();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
        setUserRole(profile?.role);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const services = [
    { name: 'Lawn Mowing', href: '/providence-ri/lawn-mowing', icon: ClockIcon },
    { name: 'Lawn Care', href: '/providence-ri/lawn-care', icon: SparklesIcon },
    { name: 'Landscaping', href: '/providence-ri/landscaping', icon: MapPinIcon },
    { name: 'Mulch Installation', href: '/providence-ri/mulch-installation', icon: MapPinIcon },
    { name: 'Leaf Removal', href: '/providence-ri/leaf-removal', icon: ChevronDownIcon },
    { name: 'Spring Cleanup', href: '/providence-ri/spring-cleanup', icon: CalendarIcon },
    { name: 'Fall Cleanup', href: '/providence-ri/fall-cleanup', icon: CalendarIcon },
    { name: 'Hedge Trimming', href: '/providence-ri/hedge-trimming', icon: WrenchScrewdriverIcon },
    { name: 'Lawn Aeration', href: '/providence-ri/lawn-aeration', icon: SparklesIcon },
    { name: 'Overseeding', href: '/providence-ri/overseeding', icon: SparklesIcon },
    { name: 'Garden Maintenance', href: '/providence-ri/garden-maintenance', icon: SparklesIcon },
    { name: 'Snow Removal', href: '/providence-ri/snow-removal', icon: SparklesIcon },
  ];

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Gallery', href: '/gallery', icon: PhotoIcon },
    { name: 'Offers', href: '/offers', icon: StarIconSolid },
    { name: 'Reviews', href: '/reviews', icon: StarIconSolid },
    { name: 'Neighborhood Check', href: '/density-check', icon: MapPinIcon },
    { name: 'Contact', href: '/contact', icon: PhoneIcon },
  ];

  const aboutLink = { name: 'About Us', href: '/about', icon: UserGroupIcon };

  return (
    <>
      <SpringPromoBanner />
      <header 
        className={`sticky top-0 left-0 right-0 z-[1000] transition-all duration-500 bg-white/95 backdrop-blur-2xl border-b border-slate-200 ${
          isScrolled ? 'py-3 shadow-lg' : 'py-5'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            
            {/* LOGO AREA */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/flora-logo-final.png"
                alt="Flora Lawn"
                width={200}
                height={60}
                className="h-14 w-auto"
                priority
              />
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl text-[11px] xl:text-xs font-black transition-all uppercase tracking-wider flex items-center ${
                    pathname === item.href
                      ? 'bg-green-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                  {item.name === 'Auto-Lawn AI' && (
                     <span className="bg-amber-100/50 text-amber-500 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-2 hidden xl:block">Beta</span>
                  )}
                </Link>
              ))}

              <div className="relative group/services">
                 <button className="px-3 py-2 rounded-xl text-[11px] xl:text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 hover:bg-slate-100 transition-all">
                    Services <ChevronDownIcon className="w-3 h-3" />
                 </button>
                 <div className="absolute top-full right-0 pt-4 opacity-0 invisible group-hover/services:opacity-100 group-hover/services:visible transition-all">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 min-w-[500px] grid grid-cols-2 gap-2">
                       {services.map((svc) => (
                          <Link key={svc.name} href={svc.href} className="block p-3 rounded-xl hover:bg-slate-50 font-bold text-slate-700">{svc.name}</Link>
                       ))}
                    </div>
                 </div>
              </div>

               <Link
                  href={aboutLink.href}
                  className={`px-3 py-2 rounded-xl text-[11px] xl:text-xs font-black transition-all uppercase tracking-wider ${
                    pathname === aboutLink.href
                      ? 'bg-green-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {aboutLink.name}
                </Link>
            </div>

            {/* AWARDS & CTA */}
            <div className="hidden lg:flex items-center space-x-4">
              <a href="tel:4013890913" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[11px] xl:text-xs uppercase tracking-wider hover:bg-green-600 transition-all flex items-center gap-2">
                 <PhoneIcon className="w-5 h-5" /> (401) 389-0913
              </a>
              {user ? (
                <Link href={userRole === 'admin' ? '/admin' : '/dashboard'} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                   <UserIcon className="w-5 h-5" />
                </Link>
              ) : (
                <Link href="/login" className="text-xs font-black uppercase text-slate-400 hover:text-green-600">Login</Link>
              )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900"
            >
               {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU OVERLAY - FULL VISIBILITY */}
      <div className={`fixed inset-0 z-[900] bg-white transition-all duration-300 transform lg:hidden ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
         <div className="pt-32 px-8 h-full flex flex-col justify-between pb-12 overflow-y-auto bg-white">
            <div className="space-y-6">
               {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-between items-center p-6 bg-slate-50 border-l-8 border-green-600 rounded-3xl group active:bg-green-600 transition-all"
                  >
                     <div className="flex flex-col">
                        <span className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic group-active:text-white transition-colors">{item.name}</span>
                        {item.name === 'Auto-Lawn AI' && (
                           <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1 block group-active:text-white/80">Beta / Testing Currently</span>
                        )}
                     </div>
                     <ArrowRightIcon className="w-8 h-8 text-green-600 group-active:text-white shrink-0" />
                  </Link>
               ))}
               
               <div className="pt-6 px-4 space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-40">Our Fast Quoting Services</p>
                  <div className="grid grid-cols-2 gap-4">
                     {services.map((s) => (
                        <Link key={s.name} href={s.href} onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-slate-700 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> <span className="truncate">{s.name}</span>
                        </Link>
                     ))}
                  </div>
               </div>

               {/* MOBILE AUTH */}
               <div className="pt-10 space-y-4">
                  {user ? (
                    <>
                      <Link 
                        href={userRole === 'admin' ? '/admin' : '/dashboard'} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-2xl font-black text-green-600 italic uppercase"
                      >
                         {userRole === 'admin' ? '→ Admin Portal' : '→ My Dashboard'}
                      </Link>
                      <button 
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.reload();
                        }}
                        className="text-slate-400 font-bold uppercase tracking-widest text-xs"
                      >
                         Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-2xl font-black text-slate-400 italic uppercase">
                       Login
                    </Link>
                  )}
               </div>
            </div>

            <div className="mt-auto pt-10 border-t border-slate-100">
               <a href="tel:4013890913" className="flex items-center justify-center gap-4 w-full bg-green-600 p-6 rounded-2xl text-2xl font-black text-white italic shadow-lg">
                  <PhoneIcon className="w-8 h-8" /> (401) 389-0913
               </a>
               <div className="flex justify-center gap-8 mt-10 opacity-30 grayscale">
                  <Image src="/nextdoor-badge.png" alt="2025" width={40} height={40} className="rounded-full shadow-lg" />
                  <Image src="/businessrate-badge.png" alt="2025" width={40} height={40} className="rounded-full shadow-lg" />
               </div>
            </div>
         </div>
      </div>
    </>
  );
}