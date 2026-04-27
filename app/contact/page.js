'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import emailjs from '@emailjs/browser';
import Navigation from "@/components/Navigation";
import { businessInfo } from "@/utils/business-info";
import Footer from "@/components/Footer";
import Link from "next/link";
import { sendNotification } from '@/lib/notifications';
import Image from 'next/image';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { 
  PhoneIcon, 
  MapPinIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  SparklesIcon, 
  CalendarIcon, 
  ArrowRightIcon,
  EnvelopeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  VideoCameraIcon,
  TrashIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CheckBadgeIcon } from '@heroicons/react/24/solid';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', service: '', message: '', promoCode: ''
  });
  const [cleanupAssessment, setCleanupAssessment] = useState({
    lastCleaned: '',
    conditionLevel: 3
  });
  const [mulchAssessment, setMulchAssessment] = useState({
    yardsUsedBefore: '',
    currentYardMeasurement: '',
    needsEdging: 'no',
    knowsEdgingMeasurement: 'no',
    edgingMeasurement: '',
    useCalculator: false,
    sqFt: ''
  });
  const [estimatePreference, setEstimatePreference] = useState('walk_around');
  const [emailPreferences, setEmailPreferences] = useState({ subscribe: false, frequency: 'monthly' });
  const [smsPreferences, setSmsPreferences] = useState({ subscribe: false });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessageHelper, setShowMessageHelper] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  // Media Upload State
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [showMediaSection, setShowMediaSection] = useState(false);
  const fileInputRef = useRef(null);

  const addressRef = useRef(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    const location = searchParams.get('location');
    const service = searchParams.get('service');
    const ref = searchParams.get('ref');
    const promo = searchParams.get('promo');
    if (location) setFormData(prev => ({ ...prev, city: location }));
    if (service) { 
      // Handle the 'id' passed from offers page
      const serviceMap = {
        'spring-dethatch': 'Spring Cleanup',
        'first-cut-special': 'Lawn Mowing',
        'prepay-unlock': 'Lawn Mowing',
        'honor-service': 'Lawn Mowing',
        'referral-credit': 'Other'
      };
      setFormData(prev => ({ ...prev, service: serviceMap[service] || service })); 
      setShowMessageHelper(true); 
    }
    if (ref) setReferralCode(ref.toUpperCase());
    if (promo) setFormData(prev => ({ ...prev, promoCode: promo.toUpperCase() }));
  }, [searchParams]);

  useEffect(() => {
    let autocomplete;
    const initAutocomplete = async () => {
      if (!window.google || !window.google.maps) return;
      
      try {
        const { Autocomplete } = await window.google.maps.importLibrary("places");
        autocomplete = new Autocomplete(addressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.address_components) return;

          let streetAddress = "";
          let streetNumber = "";
          let route = "";
          let city = "";

          for (const component of place.address_components) {
            const componentType = component.types[0];
            switch (componentType) {
              case "street_number":
                streetNumber = component.long_name;
                break;
              case "route":
                route = component.long_name;
                break;
              case "locality":
                city = component.long_name;
                break;
            }
          }

          setFormData(prev => ({
            ...prev,
            address: `${streetNumber} ${route}`.trim(),
            city: city || prev.city
          }));
        });
      } catch (err) {
        console.error("Autocomplete failed:", err);
      }
    };

    // Check for google maps every second until ready
    const checkInterval = setInterval(() => {
      if (window.google && window.google.maps) {
        initAutocomplete();
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  // Mulch Yard Calculator
  useEffect(() => {
    if (mulchAssessment.useCalculator && mulchAssessment.sqFt) {
      const sqFt = parseFloat(mulchAssessment.sqFt);
      if (!isNaN(sqFt)) {
        // Standard 3-inch mulch depth calculation: SqFt / 108
        const yards = sqFt / 108;
        setMulchAssessment(prev => ({ 
          ...prev, 
          currentYardMeasurement: `${yards.toFixed(1)} yards` 
        }));
      }
    }
  }, [mulchAssessment.sqFt, mulchAssessment.useCalculator]);

  const serviceTemplates = {
    'Lawn Mowing': 'I need regular lawn mowing service for my property. [Describe size/condition]. I would like service [weekly/bi-weekly].',
    'Lawn Fertilization': 'I\'m interested in lawn fertilization service. [Describe condition]. I would like to schedule [seasonal] treatments.',
    'Mulching': 'I need mulching service for my garden beds. Area is approx [size]. I prefer [type of mulch].',
    'Spring Cleanup': 'I need spring cleanup service. Help with [specific tasks like leaf removal].',
    'Fall Cleanup': 'I need fall cleanup service. Help with [specific tasks like leaf removal].'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const insertTemplate = () => {
    if (formData.service && serviceTemplates[formData.service]) {
      setFormData(prev => ({ ...prev, message: serviceTemplates[formData.service] }));
      setShowMessageHelper(false);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);

    // Generate previews
    const newPreviews = files.map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        isVideo
      };
    });
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
  };

  const removeMedia = (index) => {
    const updatedFiles = [...mediaFiles];
    updatedFiles.splice(index, 1);
    const updatedPreviews = [...mediaPreviews];
    URL.revokeObjectURL(updatedPreviews[index].url);
    updatedPreviews.splice(index, 1);
    
    setMediaFiles(updatedFiles);
    setMediaPreviews(updatedPreviews);
  };

  const isCleanupService = ['Spring Cleanup', 'Fall Cleanup'].includes(formData.service);
  const isMulchService = formData.service === 'Mulching';

  const conditionLabels = [
    { level: 1, label: 'Light', desc: 'Minimal debris, mostly maintained', color: 'text-green-600', bg: 'bg-green-50 border-green-300' },
    { level: 2, label: 'Moderate', desc: 'Some leaves & growth buildup', color: 'text-lime-600', bg: 'bg-lime-50 border-lime-300' },
    { level: 3, label: 'Heavy', desc: 'Significant pileup, needs real work', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
    { level: 4, label: 'Overgrown', desc: 'Dense debris, hard to walk through', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-300' },
    { level: 5, label: 'Severe', desc: 'Neglected for a season+, full restoration', color: 'text-red-600', bg: 'bg-red-50 border-red-300' },
  ];
  const currentCondition = conditionLabels[cleanupAssessment.conditionLevel - 1];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Build assessment context
      let cleanupContext = '';
      if (isCleanupService) {
        cleanupContext = `[CLEANUP ASSESSMENT]\nLast Cleaned: ${cleanupAssessment.lastCleaned || 'Not specified'}\nCondition Level: ${cleanupAssessment.conditionLevel}/5 — ${currentCondition.label} (${currentCondition.desc})\n\n`;
      }

      let mulchContext = '';
      if (isMulchService) {
        mulchContext = `[MULCH & EDGING ASSESSMENT]\n` +
          `Yards used before: ${mulchAssessment.yardsUsedBefore || 'Not specified'}\n` +
          `Yard measurement: ${mulchAssessment.currentYardMeasurement || 'Not specified'}\n` +
          `Needs edging: ${mulchAssessment.needsEdging.toUpperCase()}\n` +
          `Edging measurement: ${mulchAssessment.edgingMeasurement || (mulchAssessment.knowsEdgingMeasurement === 'no' ? 'Will provide photo' : 'Not specified')}\n\n`;
      }

      const templateParams = {
        user_name: formData.name,
        user_email: formData.email,
        user_phone: formData.phone,
        user_address: `${formData.address}, ${formData.city}, RI`,
        service_type: formData.service.toLowerCase().replace(/\s+/g, '_'),
        message: `[PREFERS: ${estimatePreference === 'meet_person' ? 'Meet In Person' : 'Walk Around & Email Pricing'}]\n\n` + cleanupContext + mulchContext + formData.message,
        to_name: process.env.NEXT_PUBLIC_APP_NAME,
        reply_to: formData.email,
        promo_code: formData.promoCode || 'NONE',
        // Visual Quote Metadata (Transmitted to Dashboard Template if used)
        has_media: mediaFiles.length > 0 ? 'YES' : 'NO',
        media_count: mediaFiles.length,
        discount_status: (showMediaSection && (mediaFiles.length > 0 || (isMulchService && mulchAssessment.edgingMeasurement))) ? '10% CONCIERGE CREDIT APPLIED' : 'NONE'
      };
      await emailjs.send(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID, process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, templateParams);
      
      // --- ELITE MEDIA UPLOAD ---
      let uploadedUrls = [];
      if (mediaFiles.length > 0) {
        console.log('🚀 Initiating Elite Media Upload to Supabase...');
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `contact-visuals/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('contact-visuals')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('contact-visuals')
              .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          } else {
            console.error('❌ Upload error:', uploadError);
          }
        }
      }

      // DB saving moved to server-side API route for security and reliability
      
      await sendNotification(`📬 New Elite Quote Inquiry from ${formData.name} in ${formData.city}!`);
      
      // Update success message to be more normal
      setStatus({ type: 'success', message: "Your inquiry has been sent! You'll receive a quote by email within 1–2 business days. If we're extra busy, it may take a little longer — but we'll get to you. Check your email for a confirmation." });
      
      // Send professional confirmation to customer via internal API (Uses Resend)
      try {
        await fetch('/api/send-contact-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            service: formData.service,
            message: formData.message,
            sendSMS: smsPreferences.subscribe,
            // Visual Quote Confirmation
            hasMedia: mediaFiles.length > 0,
            mediaUrls: uploadedUrls,
            discountApplied: showMediaSection && mediaFiles.length > 0,
            // Cleanup Assessment (sent as structured data, not in message)
            cleanupData: isCleanupService ? {
              lastCleaned: cleanupAssessment.lastCleaned || 'Not specified',
              conditionLevel: cleanupAssessment.conditionLevel,
              conditionLabel: currentCondition.label,
              conditionDesc: currentCondition.desc
            } : null,
            promoCode: formData.promoCode || null,
            estimatePreference: estimatePreference,
            emailPreferences,
            smsPreferences
          }),
        });
      } catch (confError) {
        console.warn('Silent bypass: Remote confirmation fallback active.', confError);
      }

      // Smooth scroll to success message
      setTimeout(() => {
        document.getElementById('submission-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);

      setFormData({ name: '', email: '', phone: '', address: '', city: '', service: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Transmission failed. Direct line: (401) 389-0913' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    const origin = window.location.origin;
    if (referralCode) localStorage.setItem('pending_referral_code', referralCode);
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback?redirect=/contact` } });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navigation />
      
      {/* ELITE HERO */}
      <section className="relative pt-44 pb-32 overflow-hidden bg-slate-950">
         <div className="absolute inset-0 bg-[url('/images/landscaping-service-image.jpg')] bg-cover opacity-20 scale-105" />
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/60 to-slate-950" />
         <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-8xl font-black text-white tracking-tight leading-[1.2] italic mb-8 uppercase">
               Priority <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent block md:inline-block pb-2">Quote Request</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium italic">
               Request your free estimate below. Our team provides 1-6 hour digital quotes for RI & MA homeowners.
            </p>
         </div>
      </section>

      <section className="py-24">
         <div className="max-w-7xl mx-auto px-4">
             {/* MOBILE SPEED STATUS - HIGH VISIBILITY WHITE */}
             <div className="lg:hidden mb-10 bg-white p-8 rounded-[3rem] flex items-center justify-between border-2 border-slate-100 shadow-2xl">
                <div className="flex items-center gap-5 relative z-10">
                   <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                      <ClockIcon className="w-8 h-8 text-green-600" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reply Time</p>
                      <p className="text-xl font-black italic text-slate-900 underline decoration-green-500 underline-offset-4">1-6 Hours</p>
                   </div>
                </div>
                <div className="flex flex-col items-end opacity-40">
                   <div className="flex text-yellow-500 gap-0.5 mb-1">
                      {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-3 h-3" />)}
                   </div>
                   <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">RI Elite</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start justify-items-center lg:justify-items-stretch w-full">
               
               {/* SIDEBAR - MOVED TO BOTTOM ON MOBILE */}
               <div className="lg:col-span-4 space-y-8 order-2 lg:order-1 w-full">
                  <div className="bg-slate-50 p-6 md:p-10 rounded-[3rem] border border-slate-100">
                     <h2 className="text-2xl font-black italic mb-10 tracking-tight">Direct Support</h2>
                     <a href="tel:4013890913" className="flex items-center gap-6 group mb-10">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-green-600 transition-all group-hover:bg-green-600 group-hover:text-white">
                           <PhoneIcon className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest leading-none mb-1">Direct Line</p>
                           <p className="text-2xl font-black">(401) 389-0913</p>
                        </div>
                     </a>
                     <div className="flex items-center gap-6 mb-10">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-green-600">
                           <ClockIcon className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest leading-none mb-1">Reply Time</p>
                           <p className="text-2xl font-black italic underline decoration-green-500 underline-offset-4">1-6 Hours</p>
                        </div>
                     </div>
                  </div>

                  {/* TRUST STATS */}
                  <div className="grid grid-cols-1 gap-4">
                     {[
                        { t: 'Fully Insured & Bonded', i: ShieldCheckIcon },
                        { t: '4.9 Google Reputation', i: StarIconSolid },
                        { t: 'Rhode Island Local Experts', i: MapPinIcon },
                        { t: 'Sister Company: RI Junkworks', i: SparklesIcon, link: 'https://rijunkworks.com' }
                     ].map((s, i) => (
                        s.link ? (
                           <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 bg-white hover:bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm transition-all group cursor-pointer">
                              <div className="flex items-center gap-4">
                                 <s.i className="w-6 h-6 text-orange-500" />
                                 <span className="font-black text-xs uppercase tracking-tight italic text-slate-900 group-hover:text-orange-600 transition-colors">{s.t}</span>
                              </div>
                              <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                           </a>
                        ) : (
                           <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                              <s.i className={`w-6 h-6 ${s.i === StarIconSolid ? 'text-yellow-400' : 'text-green-500'}`} />
                              <span className="font-black text-xs uppercase tracking-tight italic text-slate-900">{s.t}</span>
                           </div>
                        )
                     ))}
                  </div>
               </div>

                {/* MAIN FORM - MOVED TO TOP ON MOBILE */}
               <div className="lg:col-span-8 order-1 lg:order-2 w-full">
                  <div className="bg-white p-6 md:p-20 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-slate-50 relative">
                     
                      <form onSubmit={handleSubmit} className="space-y-8">
                        {/* PERSONAL INFO */}
                        <div className="grid md:grid-cols-2 gap-8">
                           <div>
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Full Name *</label>
                              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300" placeholder="e.g. Michael Rossi" />
                           </div>
                           <div>
                              <div className="flex items-center justify-between mb-3">
                                 <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest block">Phone Number *</label>
                                 <div className="flex gap-1">
                                    {['401', '508', '617', '774'].map(code => (
                                       <button 
                                         key={code} 
                                         type="button" 
                                         onClick={() => setFormData(prev => ({ ...prev, phone: prev.phone ? prev.phone : `(${code}) ` }))}
                                         className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                                       >
                                         {code}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300" placeholder="(401) 000-0000" />
                           </div>
                        </div>

                        <div>
                           <div className="flex items-center justify-between mb-3">
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest block">Email Address *</label>
                              <div className="flex gap-1">
                                 {['@gmail.com', '@yahoo.com', '@hotmail.com'].map(ext => (
                                    <button 
                                      key={ext} 
                                      type="button" 
                                      onClick={() => setFormData(prev => ({ ...prev, email: prev.email.includes('@') ? prev.email.split('@')[0] + ext : prev.email + ext }))}
                                      className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                                    >
                                      {ext}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300" placeholder="your@email.com" />
                        </div>

                        {/* LOCATION INFO */}
                        <div className="grid md:grid-cols-2 gap-8">
                           <div>
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Street Address *</label>
                              <input 
                                ref={addressRef}
                                required 
                                type="text" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300" 
                                placeholder="Enter your address..." 
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">City *</label>
                              <input 
                                readOnly 
                                required 
                                name="city" 
                                 value={formData.city} 
                                 className="w-full bg-slate-50/70 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-500 transition-all font-bold placeholder-slate-400" 
                                 placeholder="Auto-filled from address..." 
                              />
                           </div>
                        </div>

                        {/* SERVICE SELECTION */}
                        <div>
                           <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Service Required *</label>
                           <select required name="service" value={formData.service} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold">
                              <option value="">Select Service...</option>
                              <optgroup label="Lawn Care">
                                 <option value="Lawn Mowing">Lawn Mowing</option>
                                 <option value="Lawn Fertilization">Lawn Fertilization</option>
                                 <option value="Weed Control">Weed Control</option>
                                 <option value="Lawn Aeration">Lawn Aeration</option>
                                 <option value="Overseeding">Overseeding</option>
                                 <option value="Lawn Dethatching">Lawn Dethatching</option>
                              </optgroup>
                              <optgroup label="Landscaping">
                                 <option value="Mulching">Mulching</option>
                                 <option value="Hedge Trimming">Hedge Trimming</option>
                                 <option value="Spring Cleanup">Spring Cleanup</option>
                                 <option value="Fall Cleanup">Fall Cleanup</option>
                                 <option value="Leaf Removal">Leaf Removal</option>
                              </optgroup>
                              <option value="Snow Removal">Snow Removal</option>
                              <option value="Other">Other / Property Maintenance</option>
                           </select>
                        </div>

                        {/* PROMO CODE OPTIONAL */}
                        <div>
                           <div className="flex items-center justify-between mb-3">
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest block">Promo / Reward Code</label>
                              {formData.promoCode && (
                                 <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20 animate-pulse">
                                    <CheckBadgeIcon className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Offer Applied</span>
                                 </div>
                              )}
                           </div>
                           <input 
                              type="text" 
                              name="promoCode" 
                              value={formData.promoCode} 
                              onChange={handleChange} 
                              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-black placeholder-slate-300 uppercase italic tracking-widest" 
                              placeholder="e.g. SPRING2025" 
                           />
                        </div>

                        {/* CLEANUP ASSESSMENT PANEL — Spring / Fall only */}
                        {isCleanupService && (
                           <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500/30 rounded-[2.5rem] p-8 space-y-7 animate-in fade-in slide-in-from-top-4 duration-500">

                             {/* Animated leaf background */}
                             <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
                               {['🍂','🍃','🍁','🍂','🍃'].map((leaf, i) => (
                                 <span key={i} className="absolute text-2xl opacity-10" style={{
                                   left: `${10 + i * 20}%`,
                                   top: '-10%',
                                   animation: `leafFall ${3 + i * 0.7}s ease-in ${i * 0.4}s infinite`,
                                 }}>{leaf}</span>
                               ))}
                             </div>

                             <style>{`
                               @keyframes leafFall {
                                 0%   { transform: translateY(0) rotate(0deg);   opacity: 0.08; }
                                 50%  { transform: translateY(180px) rotate(180deg) translateX(20px); opacity: 0.15; }
                                 100% { transform: translateY(380px) rotate(360deg) translateX(-10px); opacity: 0; }
                               }
                               .cleanup-slider::-webkit-slider-thumb {
                                 appearance: none; width: 24px; height: 24px;
                                 border-radius: 50%; background: #22c55e;
                                 cursor: pointer; border: 3px solid white;
                                 box-shadow: 0 2px 8px rgba(34,197,94,0.5);
                               }
                               .cleanup-slider::-moz-range-thumb {
                                 width: 24px; height: 24px; border-radius: 50%;
                                 background: #22c55e; cursor: pointer;
                                 border: 3px solid white;
                               }
                             `}</style>

                             {/* Header */}
                             <div className="relative flex items-center gap-4">
                               <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{animation:'bounce 2s infinite'}}>🍂</div>
                               <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Instant Online Estimate</p>
                                 <p className="font-black italic text-white text-lg leading-tight">Cleanup Assessment</p>
                               </div>
                               <span className="ml-auto bg-green-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30">Quick Quote</span>
                             </div>

                             {/* Q1: Last cleaned */}
                             <div className="relative">
                               <label className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest mb-3 block">
                                 📅 When was the property last cleaned?
                               </label>
                               <select
                                 value={cleanupAssessment.lastCleaned}
                                 onChange={e => setCleanupAssessment(p => ({ ...p, lastCleaned: e.target.value }))}
                                 className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-green-500 transition-all font-bold"
                               >
                                 <option value="">Select timeframe...</option>
                                 <option value="Last Spring">Last Spring</option>
                                 <option value="Last Fall">Last Fall</option>
                                 <option value="Last Season">Last Season</option>
                                 <option value="Within the last month">Within the last month</option>
                                 <option value="1–3 months ago">1–3 months ago</option>
                                 <option value="Over a year ago">Over a year ago</option>
                                 <option value="Never / Not sure">Never / Not sure</option>
                               </select>
                             </div>

                             {/* Q2: Condition slider */}
                             <div className="relative">
                               <div className="flex items-center justify-between mb-4">
                                 <label className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">
                                   🌿 How bad is the current condition?
                                 </label>
                                 <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${currentCondition.bg} ${currentCondition.color}`}>
                                   {cleanupAssessment.conditionLevel}/5 · {currentCondition.label}
                                 </span>
                               </div>

                               {/* Track labels */}
                               <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                                 <span className="text-green-400">Light</span>
                                 <span>Moderate</span>
                                 <span>Heavy</span>
                                 <span>Overgrown</span>
                                 <span className="text-red-400">Severe</span>
                               </div>

                               {/* Range slider */}
                               <input
                                 type="range"
                                 min="1" max="5" step="1"
                                 value={cleanupAssessment.conditionLevel}
                                 onChange={e => setCleanupAssessment(p => ({ ...p, conditionLevel: Number(e.target.value) }))}
                                 className="cleanup-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                                 style={{
                                   background: `linear-gradient(to right, #22c55e ${(cleanupAssessment.conditionLevel-1)*25}%, #334155 ${(cleanupAssessment.conditionLevel-1)*25}%)`
                                 }}
                               />

                               {/* Live condition card */}
                               <div className={`mt-4 p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${currentCondition.bg}`}>
                                 <span className="text-3xl" style={{animation: cleanupAssessment.conditionLevel >= 4 ? 'bounce 1s infinite' : 'none'}}>
                                   {['🌿','🍃','🍂','🌾','🪵'][cleanupAssessment.conditionLevel - 1]}
                                 </span>
                                 <div>
                                   <p className={`text-sm font-black uppercase tracking-widest ${currentCondition.color}`}>{currentCondition.label} Condition</p>
                                   <p className="text-[12px] text-slate-600 font-semibold mt-0.5">{currentCondition.desc}</p>
                                  </div>
                                  <div className="ml-auto flex gap-1">
                                    {[1,2,3,4,5].map(i => (
                                      <div key={i} className={`w-2 h-6 rounded-full transition-all ${i <= cleanupAssessment.conditionLevel ? currentCondition.color.replace('text-','bg-') : 'bg-slate-200'}`} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                         )}

                         {/* MULCH & EDGING ASSESSMENT PANEL */}
                         {isMulchService && (
                            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500/30 rounded-[2.5rem] p-8 space-y-7 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center text-2xl shrink-0">🪵</div>
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Project Scoping</p>
                                   <p className="font-black italic text-white text-lg leading-tight">Mulch & Edging Details</p>
                                </div>
                                <span className="ml-auto bg-green-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30">10% Credit Possible</span>
                             </div>

                             <div className="grid md:grid-cols-2 gap-8 items-start">
                                <div>
                                   <div className="flex items-center mb-3 min-h-[26px]">
                                      <label className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest block">
                                         📦 Yards used in previous years?
                                      </label>
                                   </div>
                                   <input 
                                      type="text" 
                                      value={mulchAssessment.yardsUsedBefore} 
                                      onChange={e => setMulchAssessment(p => ({ ...p, yardsUsedBefore: e.target.value }))}
                                      className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-500" 
                                      placeholder="e.g. 5 yards" 
                                   />
                                </div>
                                <div>
                                   <div className="flex items-center justify-between mb-3 min-h-[26px]">
                                      <label className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest block">
                                         📐 Current measurement (yards)?
                                      </label>
                                      <button 
                                         type="button"
                                         onClick={() => setMulchAssessment(p => ({ ...p, useCalculator: !p.useCalculator }))}
                                         className={`text-[9px] font-black px-2 py-1 rounded-md transition-all ${mulchAssessment.useCalculator ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-700 text-slate-300'}`}
                                      >
                                         {mulchAssessment.useCalculator ? '✓ Calculator Active' : '+ Use Calculator'}
                                      </button>
                                   </div>
                                   
                                   {!mulchAssessment.useCalculator ? (
                                      <input 
                                         type="text" 
                                         value={mulchAssessment.currentYardMeasurement} 
                                         onChange={e => setMulchAssessment(p => ({ ...p, currentYardMeasurement: e.target.value }))}
                                         className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-500" 
                                         placeholder="Enter total yards..." 
                                      />
                                   ) : (
                                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                         <div className="relative">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Total Area to Mulch</label>
                                            <div className="relative">
                                               <span className="absolute right-4 top-4 text-[10px] text-slate-500 font-bold">sq ft</span>
                                               <input 
                                                  type="number" 
                                                  value={mulchAssessment.sqFt} 
                                                  onChange={e => setMulchAssessment(p => ({ ...p, sqFt: e.target.value }))}
                                                  className="w-full bg-slate-100 border-2 border-white rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-black placeholder-slate-400" 
                                                  placeholder="e.g. 700" 
                                               />
                                            </div>
                                         </div>
                                         <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-xl flex items-center justify-between">
                                            <p className="text-[10px] font-black text-green-400 italic">Estimated Need:</p>
                                            <p className="text-sm font-black text-white">{mulchAssessment.currentYardMeasurement || '0.0 yards'}</p>
                                         </div>
                                         <p className="text-[8px] text-slate-500 font-bold italic text-center leading-tight">Calculated at a standard 3" depth for professional coverage.</p>
                                      </div>
                                   )}
                                </div>
                             </div>

                             <div className="pt-4 border-t border-slate-700/50">
                                <label className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest mb-4 block">
                                   ✂️ Do you need fresh edging for your beds?
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                   {['yes', 'no'].map(opt => (
                                      <button
                                         key={opt}
                                         type="button"
                                         onClick={() => setMulchAssessment(p => ({ ...p, needsEdging: opt }))}
                                         className={`py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${mulchAssessment.needsEdging === opt ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                      >
                                         {opt}
                                      </button>
                                   ))}
                                </div>
                             </div>

                             {mulchAssessment.needsEdging === 'yes' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                   <div>
                                      <label className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest mb-4 block text-green-400">
                                         ⭐ Save Time Reward (10% OFF)
                                      </label>
                                      <p className="text-[10px] text-slate-400 font-bold italic mb-4 leading-relaxed">
                                         Provide the linear footage of your beds or upload a photo below to unlock your <span className="text-white underline decoration-yellow-500 decoration-2 font-black">10% DISCOUNT</span>.
                                      </p>
                                      
                                      <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">
                                         Do you know the measurement?
                                      </label>
                                      <div className="grid grid-cols-2 gap-4 mb-4">
                                         <button
                                            type="button"
                                            onClick={() => setMulchAssessment(p => ({ ...p, knowsEdgingMeasurement: 'yes' }))}
                                            className={`py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${mulchAssessment.knowsEdgingMeasurement === 'yes' ? 'bg-slate-100 border-white text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                         >
                                            Yes, I have it
                                         </button>
                                         <button
                                            type="button"
                                            onClick={() => {
                                               setMulchAssessment(p => ({ ...p, knowsEdgingMeasurement: 'no' }));
                                               setShowMediaSection(true);
                                            }}
                                            className={`py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${mulchAssessment.knowsEdgingMeasurement === 'no' ? 'bg-slate-100 border-white text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                         >
                                            No, will take photo
                                         </button>
                                      </div>

                                      {mulchAssessment.knowsEdgingMeasurement === 'yes' ? (
                                         <input 
                                            type="text" 
                                            value={mulchAssessment.edgingMeasurement} 
                                            onChange={e => setMulchAssessment(p => ({ ...p, edgingMeasurement: e.target.value }))}
                                            className="w-full bg-slate-100 border-2 border-white rounded-2xl px-6 py-4 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-black placeholder-slate-400 shadow-inner" 
                                            placeholder="e.g. 150 linear feet" 
                                         />
                                      ) : (
                                         <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3">
                                            <PhotoIcon className="w-5 h-5 text-green-400" />
                                            <p className="text-[10px] font-bold text-green-400 italic">Scroll down to the Visuals section to upload your photo!</p>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             )}
                          </div>
                       )}

                        {/* ESTIMATE PREFERENCE */}
                        <div>
                           <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Estimate Style *</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <button 
                                 type="button"
                                 onClick={() => setEstimatePreference('walk_around')}
                                 className={`p-5 rounded-[2rem] border-2 text-left transition-all ${estimatePreference === 'walk_around' ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-slate-50 border-slate-50 opacity-60 hover:opacity-100'}`}
                              >
                                 <p className="font-black italic text-slate-900 mb-1 text-sm md:text-base">Walk & Email</p>
                                 <p className="text-[10px] text-slate-500 font-bold leading-tight">Inspect property anytime & email prices.</p>
                              </button>

                              <button 
                                 type="button"
                                 onClick={() => setEstimatePreference('meet_person')}
                                 className={`p-5 rounded-[2rem] border-2 text-left transition-all ${estimatePreference === 'meet_person' ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-slate-50 border-slate-50 opacity-60 hover:opacity-100'}`}
                              >
                                 <p className="font-black italic text-slate-900 mb-1 text-sm md:text-base">Meet In Person</p>
                                 <p className="text-[10px] text-slate-500 font-bold leading-tight">I'd like to be home to meet the team.</p>
                              </button>
                           </div>
                        </div>

                        {/* MESSAGE AREA */}
                        <div>
                           <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Message Details *</label>
                           {showMessageHelper && (
                             <div className="mb-4 flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                                <span className="text-xs font-bold text-green-700">Need help writing?</span>
                                <button type="button" onClick={insertTemplate} className="text-xs font-black text-green-600 underline">Insert Template</button>
                             </div>
                           )}
                           <textarea required name="message" value={formData.message} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-6 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold h-40 resize-none placeholder-slate-300" placeholder="Describe your property needs..." />
                        </div>

                        {/* MEDIA STRATEGY - TOGGLE SECTION */}
                        {!showMediaSection ? (
                           <button 
                             type="button"
                             onClick={() => setShowMediaSection(true)}
                             className="w-full p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-between group hover:border-green-500/50 hover:bg-green-50/30 transition-all"
                           >
                              <div className="flex items-center gap-6">
                                 <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-green-600 transition-all group-hover:scale-110 group-hover:rotate-3">
                                    <PhotoIcon className="w-6 h-6" />
                                 </div>
                                 <div className="text-left">
                                    <div className="flex items-center gap-2 mb-1.5">
                                       <span className="bg-green-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full leading-none">Photo Reward</span>
                                       <div className="w-1 h-1 rounded-full bg-slate-300" />
                                       <span className="text-[9px] font-black italic text-slate-400 uppercase tracking-widest">Optional</span>
                                    </div>
                                    <p className="text-lg font-black italic text-slate-900 group-hover:text-green-600 transition-colors leading-tight">Add Visuals & Get 10% Off</p>
                                 </div>
                              </div>
                              <div className="bg-yellow-400 text-slate-900 font-black px-5 py-3 rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-2 group-hover:bg-slate-950 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                 Unlock Reward <ArrowRightIcon className="w-4 h-4" />
                              </div>
                           </button>
                        ) : (
                           <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-green-500/30 transition-all group relative animate-in fade-in slide-in-from-top-4 duration-500">
                              {/* CLOSE BUTTON */}
                              <button 
                                 type="button" 
                                 onClick={() => setShowMediaSection(false)}
                                 className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors z-20"
                              >
                                 <span className="text-xl leading-none">×</span>
                              </button>

                              {/* DISCOUNT BADGE */}
                              <div className="absolute -top-4 right-10 bg-yellow-400 text-slate-900 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 animate-bounce">
                                 <SparklesIcon className="w-3 h-3" /> 10% Visual Credit Applied
                              </div>

                              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                                 <div>
                                    <h3 className="text-xl font-black italic text-slate-900 uppercase tracking-tighter mb-2 flex items-center gap-3">
                                       Property Visuals <span className="text-green-600 text-[10px] bg-green-100 px-3 py-1 rounded-full border border-green-200 uppercase tracking-widest leading-none underline decoration-2 decoration-green-600 underline-offset-4">10% Credit Active</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold italic leading-relaxed">
                                       Upload your property photos or clips below to lock in your <span className="text-slate-950 underline decoration-yellow-500 decoration-2 font-black">10% OFF</span> estimate reward.
                                    </p>
                                 </div>
                                 <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-slate-950 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-green-600 transition-all shrink-0 shadow-2xl"
                                 >
                                    <DocumentPlusIcon className="w-5 h-5" /> Add Files
                                 </button>
                                 <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    multiple 
                                    accept="image/*,video/*"
                                    onChange={handleMediaChange}
                                    className="hidden" 
                                 />
                              </div>

                              {mediaPreviews.length > 0 ? (
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {mediaPreviews.map((preview, idx) => (
                                       <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 group/item bg-white">
                                          {preview.isVideo ? (
                                             <video src={preview.url} className="w-full h-full object-cover" />
                                          ) : (
                                             <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                                          )}
                                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                             <button 
                                                type="button"
                                                onClick={() => removeMedia(idx)}
                                                className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                                             >
                                                <TrashIcon className="w-5 h-5" />
                                             </button>
                                          </div>
                                          {preview.isVideo && (
                                             <div className="absolute top-2 right-2 p-1.5 bg-slate-950/60 rounded-lg text-white font-black text-[8px] uppercase tracking-widest backdrop-blur-md border border-white/10">
                                                VIDEO
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-6 p-8 bg-white rounded-2xl border border-slate-100 opacity-60">
                                    <div className="flex -space-x-3">
                                       <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shadow-lg border border-slate-100"><PhotoIcon className="w-6 h-6 text-slate-400" /></div>
                                       <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shadow-lg border border-slate-100"><VideoCameraIcon className="w-6 h-6 text-slate-400" /></div>
                                    </div>
                                    <p className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                                       No visuals attached. Upload now for 10% off.
                                    </p>
                                 </div>
                              )}
                           </div>
                        )}

                        {/* PRESERVED MARKETING PREFERENCES */}
                        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dotted border-slate-200">
                           <h4 className="text-xs font-black italic uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-slate-900">
                              Stay Connected
                           </h4>
                           <div className="space-y-6">
                              <label className="flex items-center gap-4 cursor-pointer group">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${emailPreferences.subscribe ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                 </div>
                                 <input type="checkbox" className="hidden" checked={emailPreferences.subscribe} onChange={(e) => setEmailPreferences({...emailPreferences, subscribe: e.target.checked})} />
                                 <div>
                                    <p className="font-black text-xs uppercase tracking-tight italic text-slate-900">Email Newsletter</p>
                                    <p className="text-[10px] text-slate-400 font-bold italic">Receive seasonal discounts and professional lawn care tips.</p>
                                 </div>
                              </label>
                              <label className="flex items-center gap-4 cursor-pointer">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${smsPreferences.subscribe ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                 </div>
                                 <input type="checkbox" className="hidden" checked={smsPreferences.subscribe} onChange={(e) => setSmsPreferences({...smsPreferences, subscribe: e.target.checked})} />
                                 <div>
                                    <p className="font-black text-xs uppercase tracking-tight italic text-slate-900">SMS Notifications</p>
                                    <p className="text-[10px] text-slate-400 font-bold italic">Receive reminders and status updates regarding your property.</p>
                                 </div>
                              </label>
                           </div>
                        </div>

                        <button 
                          disabled={isSubmitting}
                          className="w-full bg-green-600 hover:bg-green-500 text-white font-black p-8 rounded-[2rem] text-2xl shadow-2xl transition-all disabled:opacity-50 italic group flex items-center justify-center gap-6"
                        >
                           {isSubmitting ? 'ESTABLISHING CONNECTION...' : (
                              <>Request My Free Estimate <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-3 transition-all" /></>
                           )}
                        </button>

                        {/* ACCOUNT PORTAL CARD - NOW BELOW FORM (OPTIONAL) */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white mt-16 shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                              <div className="flex-1 text-center md:text-left">
                                 <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest mb-4">Optional Concierge Feature</div>
                                 <h3 className="text-2xl font-black italic tracking-tighter mb-2 underline decoration-green-500 underline-offset-8 decoration-4">Priority Account Access</h3>
                                 <p className="text-slate-400 font-semibold italic text-sm">Sign up in 1-click to track quotes, skip dates, and manage payments.</p>
                              </div>
                              <button 
                                type="button"
                                onClick={signInWithGoogle}
                                className="bg-white text-slate-900 font-black px-10 py-5 rounded-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 group/btn"
                              >
                                 <Image src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="G" width={20} height={20} />
                                 Google Signup
                                 <ArrowRightIcon className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                              </button>
                           </div>
                        </div>

                        {status.message && (
                           <div 
                             id="submission-status"
                             className={`p-8 rounded-[2rem] font-black text-center italic tracking-tight ${status.type === 'success' ? 'bg-green-100 text-green-900 shadow-inner' : 'bg-red-100 text-red-900 border border-red-200'}`}
                           >
                              {status.message}
                           </div>
                        )}
                        
                        {referralCode && (
                           <div className="text-center p-4 bg-slate-900/5 rounded-2xl border border-slate-200">
                              <p className="text-xs font-black italic uppercase tracking-widest text-slate-500">Reward Code Applied: <span className="text-green-600">{referralCode}</span></p>
                           </div>
                        )}
                     </form>
                  </div>
               </div>
            </div>
         </div>
         </section>
         <Footer />
      </div>
   );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>}>
      <ContactForm />
    </Suspense>
  );
}