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

  const aboutLink = { name: 'About Us', href: '/about' };

  return (
    <>
      <SpringPromoBanner />
      <header
        className={`sticky top-0 left-0 right-0 z-[1000] transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-2xl shadow-md shadow-slate-200/50 border-b border-slate-100 py-3'
            : 'bg-white/90 backdrop-blur-xl border-b border-slate-100/50 py-4'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/flora-logo-final.png"
                alt="Flora Lawn & Landscaping"
                width={180}
                height={54}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {/* DESKTOP NAV LINKS */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all uppercase tracking-wider ${
                    pathname === item.href
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Services Dropdown */}
              <div className="relative group/services">
                <button className="px-4 py-2 rounded-xl text-[12px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-100 hover:text-slate-900 transition-all">
                  Services <ChevronDownIcon className="w-3 h-3 group-hover/services:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover/services:opacity-100 group-hover/services:visible transition-all duration-200 pointer-events-none group-hover/services:pointer-events-auto">
                  <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 p-5 min-w-[480px] grid grid-cols-2 gap-1">
                    <div className="col-span-2 pb-3 mb-2 border-b border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">All Services — RI & MA</p>
                    </div>
                    {services.map((svc) => (
                      <Link
                        key={svc.name}
                        href={svc.href}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 group/item transition-all"
                      >
                        <div className="w-7 h-7 bg-emerald-100 group-hover/item:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                          <svc.icon className="w-4 h-4 text-emerald-600 group-hover/item:text-white transition-colors" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover/item:text-emerald-700">{svc.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href={aboutLink.href}
                className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all uppercase tracking-wider ${
                  pathname === aboutLink.href
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {aboutLink.name}
              </Link>
            </div>

            {/* RIGHT — PHONE & USER */}
            <div className="hidden lg:flex items-center gap-3">
              <a href="tel:4013890913" className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all shadow-md shadow-emerald-200">
                <PhoneIcon className="w-4 h-4" />
                (401) 389-0913
              </a>
              {user ? (
                <Link
                  href={userRole === 'admin' ? '/admin' : '/dashboard'}
                  className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
              ) : (
                <Link href="/login" className="text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-emerald-600 transition-colors px-2">
                  Login
                </Link>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-900 transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 z-[900] bg-white transition-all duration-400 lg:hidden ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="h-full flex flex-col overflow-y-auto pt-28 pb-8 px-6">

          {/* Main Links */}
          <div className="space-y-2 mb-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  pathname === item.href
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-slate-50 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <span className={`text-2xl font-black uppercase tracking-tight ${pathname === item.href ? 'text-white' : 'text-slate-900'}`}>
                  {item.name}
                </span>
                <ArrowRightIcon className={`w-6 h-6 ${pathname === item.href ? 'text-white' : 'text-emerald-600'}`} />
              </Link>
            ))}
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-5 rounded-2xl border bg-slate-50 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
            >
              <span className="text-2xl font-black uppercase tracking-tight text-slate-900">About Us</span>
              <ArrowRightIcon className="w-6 h-6 text-emerald-600" />
            </Link>
          </div>

          {/* Services */}
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">Our Services</p>
            <div className="grid grid-cols-2 gap-2">
              {services.map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth */}
          {user ? (
            <div className="mb-8 space-y-3">
              <Link
                href={userRole === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xl font-black text-emerald-600 uppercase tracking-tight"
              >
                → {userRole === 'admin' ? 'Admin Portal' : 'My Dashboard'}
              </Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                className="text-slate-400 font-bold uppercase tracking-widest text-xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-black text-slate-400 uppercase tracking-tight mb-8">
              Login →
            </Link>
          )}

          {/* CTA */}
          <div className="mt-auto space-y-3">
            <a
              href="tel:4013890913"
              className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-500 p-5 rounded-2xl text-xl font-black text-white transition-all shadow-lg shadow-emerald-200"
            >
              <PhoneIcon className="w-6 h-6" />
              (401) 389-0913
            </a>
          </div>
        </div>
      </div>
    </>
  );
}