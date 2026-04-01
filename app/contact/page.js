'use client';

import { useState, useEffect, useRef } from 'react';
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
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', service: '', message: ''
  });
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

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    const params = new URLSearchParams(window.location.search);
    const location = params.get('location');
    const service = params.get('service');
    const ref = params.get('ref');
    if (location) setFormData(prev => ({ ...prev, city: location }));
    if (service) { setFormData(prev => ({ ...prev, service: service })); setShowMessageHelper(true); }
    if (ref) setReferralCode(ref.toUpperCase());

    // --- GOOGLE PLACES AUTOCOMPLETE ---
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const templateParams = {
        user_name: formData.name,
        user_email: formData.email,
        user_phone: formData.phone,
        user_address: `${formData.address}, ${formData.city}, RI`,
        service_type: formData.service.toLowerCase().replace(/\s+/g, '_'),
        message: formData.message,
        to_name: process.env.NEXT_PUBLIC_APP_NAME,
        reply_to: formData.email,
        // Visual Quote Metadata (Transmitted to Dashboard Template if used)
        has_media: mediaFiles.length > 0 ? 'YES' : 'NO',
        media_count: mediaFiles.length,
        discount_status: (showMediaSection && mediaFiles.length > 0) ? '10% VISUAL CREDIT APPLIED' : 'NONE'
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

      // Save data for admin
      if (emailPreferences.subscribe || smsPreferences.subscribe) {
        await supabaseAdmin.from('email_subscribers').upsert({
          name: formData.name, email: formData.email, phone: formData.phone, city: formData.city, source: 'contact_form',
          preferences: { email: emailPreferences, sms: smsPreferences }, subscribed_at: new Date().toISOString()
        }, { onConflict: 'email' });
      }

      await supabaseAdmin.from('appointments').insert([{
        customer_name: formData.name, customer_email: formData.email, customer_phone: formData.phone,
        service_type: formData.service, city: formData.city, status: 'pending', notes: formData.message
      }]);

      await sendNotification(`📬 New Elite Quote Inquiry from ${formData.name} in ${formData.city}!`);
      
      // Update success message to be more normal
      setStatus({ type: 'success', message: 'Your inquiry has been sent! We will respond within 1-6 hours. Please check your email for confirmation.' });
      
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
            discountApplied: showMediaSection && mediaFiles.length > 0
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
                        { t: 'Rhode Island Local Experts', i: MapPinIcon }
                     ].map((s, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                           <s.i className={`w-6 h-6 ${s.i === StarIconSolid ? 'text-yellow-400' : 'text-green-500'}`} />
                           <span className="font-black text-xs uppercase tracking-tight italic">{s.t}</span>
                        </div>
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
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Phone Number *</label>
                              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300" placeholder="(401) 000-0000" />
                           </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Email Address *</label>
                           <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300" placeholder="your@email.com" />
                        </div>

                        {/* LOCATION INFO */}
                        <div className="grid md:grid-cols-1 gap-8">
                           <div>
                              <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">City *</label>
                              <select required name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold appearance-none">
                                 <option value="">Select City...</option>
                                 {['Pawtucket', 'Providence', 'East Providence', 'North Providence', 'Johnston', 'Cranston', 'Warwick', 'Attleboro', 'North Attleboro', 'Cumberland', 'Woonsocket', 'Lincoln', 'Barrington', 'Bristol', 'Warren'].map(c => <option key={c} value={c}>{c}</option>)}
                                 <option value="Other">Other City</option>
                              </select>
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

                        {/* MESSAGE AREA */}
                        <div>
                           <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Message / Inquiry Details *</label>
                           {showMessageHelper && (
                             <div className="mb-4 flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                                <span className="text-xs font-bold text-green-700">Need help writing?</span>
                                <button type="button" onClick={insertTemplate} className="text-xs font-black text-green-600 underline">Insert Template</button>
                             </div>
                           )}
                           <textarea required name="message" value={formData.message} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-6 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold h-40 resize-none placeholder-slate-300" placeholder="Describe your property needs..." />
                        </div>


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