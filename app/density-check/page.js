'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPinIcon, CheckCircleIcon, RocketLaunchIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DensityCheckPage() {
  const [address, setAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null); // 'high' | 'low' | 'none'
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [activeData, setActiveData] = useState([]); // Array of { city, zip }
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchActiveCities();
    loadGoogleMaps();
  }, []);

  const fetchActiveCities = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('city, zipcode');
      if (error) throw error;
      
      // Get unique city+zip pairs for privacy-safe neighborhood matching
      const uniquePairs = [];
      const seen = new Set();
      
      data.forEach(c => {
        const key = `${c.city?.trim().toLowerCase()}-${c.zipcode?.trim()}`;
        if (c.city && c.zipcode && !seen.has(key)) {
          seen.add(key);
          uniquePairs.push({ 
            city: c.city.trim().toLowerCase(), 
            zip: c.zipcode.trim() 
          });
        }
      });
      
      setActiveData(uniquePairs);
    } catch (err) {
      console.error('Error fetching service area data:', err);
    }
  };

  const loadGoogleMaps = () => {
    if (window.google) {
      initAutocomplete();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = initAutocomplete;
    document.head.appendChild(script);
  };

  const initAutocomplete = () => {
    if (!inputRef.current) return;
    autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      fields: ["address_components", "geometry", "formatted_address"],
    });

    autoCompleteRef.current.addListener("place_changed", () => {
      const place = autoCompleteRef.current.getPlace();
      if (!place.geometry) return;
      
      setAddress(place.formatted_address);
      
      // Extract city and zip
      const cityComp = place.address_components.find(c => c.types.includes('locality'));
      const zipComp = place.address_components.find(c => c.types.includes('postal_code'));
      
      if (cityComp) setCity(cityComp.long_name);
      if (zipComp) setZipcode(zipComp.long_name);
    });
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!address) return;

    setIsChecking(true);
    setResult(null);

    // Simulate analysis
    setTimeout(() => {
      const normalizedCity = city.trim().toLowerCase();
      
      const hasZip = activeData.some(d => d.zip === zipcode);
      const hasCity = activeData.some(d => d.city === normalizedCity);
      
      if (hasZip) {
        setResult('neighborhood'); // Right around the corner
      } else if (hasCity) {
        setResult('city'); // We serve the city
      } else {
        setResult('none');
      }
      setIsChecking(false);
    }, 1500);
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setIsChecking(true);
    
    try {
      const { error } = await supabase.from('appointments').insert([{
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        address: address,
        city: city,
        status: 'pending',
        notes: `WAITLIST LEAD: Customer checked density for ${city} and signed up for pioneer discount.`,
        lead_source: 'density_check'
      }]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Error signing up. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans selection:bg-green-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Live Area Analysis</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Is Flora in your <span className="text-green-500">Neighborhood?</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Join the neighborhood cluster and save. We offer special discounts for areas where our trucks already operate.
          </p>
        </div>

        {/* Search Box */}
        {!result && !submitted && (
          <div className="bg-white/[0.03] border border-white/10 p-2 rounded-[2.5rem] backdrop-blur-xl shadow-2xl shadow-black/50 group focus-within:border-green-500/50 transition-all">
            <form onSubmit={handleCheck} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 flex items-center gap-4 px-6 w-full">
                <MapPinIcon className="h-6 w-6 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter your property address..."
                  className="bg-transparent border-none focus:ring-0 w-full py-6 text-lg font-bold placeholder-gray-600 outline-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isChecking}
                />
              </div>
              <button
                type="submit"
                disabled={isChecking || !address}
                className="w-full sm:w-auto px-10 py-5 bg-green-500 text-black rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-green-400 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    Checking...
                  </>
                ) : (
                  <>Check My Area <ArrowRightIcon className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Neighborhood Match (Zip Code) */}
        {result === 'neighborhood' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/5 border border-green-500/30 rounded-[3rem] p-10 text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/40">
                <UserGroupIcon className="h-10 w-10 text-black" />
              </div>
              <h2 className="text-3xl font-black mb-4">We're right around the corner!</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                Good news! We already have active properties in <strong>{zipcode}</strong>. Since our crew is on your street weekly, we can offer our maximum density discount.
              </p>
              <div className="inline-block px-8 py-4 bg-white/5 border border-white/10 rounded-2xl mb-10">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Max Neighborhood Discount</p>
                <p className="text-4xl font-black">$20 OFF <span className="text-sm font-medium text-gray-500">per visit</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/contact?promo=ZIP_SAVER_20&address=${encodeURIComponent(address)}`} 
                  className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all active:scale-95">
                  Claim $20 Discount
                </Link>
                <button onClick={() => setResult(null)} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                  New Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* City Match Only */}
        {result === 'city' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/5 border border-emerald-500/30 rounded-[3rem] p-10 text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/40">
                <MapPinIcon className="h-10 w-10 text-black" />
              </div>
              <h2 className="text-3xl font-black mb-4">We're in {city}!</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                We currently service {city}, and we're looking to add more homes in your specific neighborhood to optimize our route.
              </p>
              <div className="inline-block px-8 py-4 bg-white/5 border border-white/10 rounded-2xl mb-10">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Standard City Discount</p>
                <p className="text-4xl font-black">$10 OFF <span className="text-sm font-medium text-gray-500">per visit</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/contact?promo=CITY_SAVER_10&address=${encodeURIComponent(address)}`} 
                  className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all active:scale-95">
                  Claim $10 Discount
                </Link>
                <button onClick={() => setResult(null)} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                  New Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Low/None Density Result */}
        {result === 'none' && !submitted && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/5 border border-blue-500/30 rounded-[3rem] p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <RocketLaunchIcon className="h-40 w-40 text-blue-500" />
              </div>
              
              <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/40">
                <RocketLaunchIcon className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-black mb-4">Be an Area Pioneer!</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                We haven't expanded into {city} yet, but we're looking for our first customer there to anchor a new route.
              </p>
              
              <div className="inline-block px-8 py-4 bg-white/5 border border-white/10 rounded-2xl mb-10">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Area Pioneer Discount</p>
                <p className="text-4xl font-black">$25 OFF <span className="text-sm font-medium text-gray-500">first 2 months</span></p>
              </div>

              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-left">
                <h3 className="text-xl font-black mb-4 text-center">Join the {city} Waitlist</h3>
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      required
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      required
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                  <button 
                    type="submit"
                    disabled={isChecking}
                    className="w-full py-5 bg-blue-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-400 transition-all"
                  >
                    {isChecking ? 'Joining...' : 'Get Pioneer Status'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Waitlist Success */}
        {submitted && (
          <div className="animate-in fade-in zoom-in duration-500 text-center py-20">
             <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
                <CheckCircleIcon className="h-12 w-12 text-black" />
              </div>
              <h2 className="text-4xl font-black mb-4">You're on the list!</h2>
              <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
                We've locked in your <strong>$25 Pioneer Discount</strong>. We'll reach out as soon as we're ready to start your area.
              </p>
              <Link href="/" className="text-green-500 font-black uppercase text-xs tracking-widest hover:underline">
                Back to Home
              </Link>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-32 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center border-t border-white/5 pt-20">
          <div>
            <div className="text-3xl font-black mb-1">12+</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cities Serviced</div>
          </div>
          <div>
            <div className="text-3xl font-black mb-1">450+</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Properties</div>
          </div>
          <div>
            <div className="text-3xl font-black mb-1">4.9/5</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
}
