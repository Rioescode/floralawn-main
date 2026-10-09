'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import emailjs from '@emailjs/browser';
import Navigation from "@/components/Navigation";
import LeafSeason, { LeafGround } from "@/components/LeafSeason";
import { businessInfo } from "@/utils/business-info";
import Footer from "@/components/Footer";
import Link from "next/link";
import { sendNotification } from '@/lib/notifications';
import Image from 'next/image';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import GoogleSignInButton from '@/components/GoogleSignInButton';
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
import ServiceToggleGrid from "@/components/ServiceToggleGrid";
import CleanupYard from "@/components/CleanupYard";
import YardSeasonScene from "@/components/YardSeasonScene";
import { OTHER_SERVICES, YARD_SERVICES, resolveServiceList, serviceDisplayName } from "@/data/quote-services";

const CLEANUP_TASKS = [
  { id: 'lawn', label: 'Leaves on the lawn' },
  { id: 'beds', label: 'Garden beds' },
  { id: 'branches', label: 'Fallen branches' },
  { id: 'haul', label: 'Haul it away' },
];
const CLEANUP_SCOPES = [
  { id: 'front', label: 'Front yard' },
  { id: 'back', label: 'Back yard' },
  { id: 'whole', label: 'Whole property' },
];
const CLEANUP_SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];
const CLEANUP_TIMING = [
  { id: 'this-week', label: 'This week' },
  { id: 'next-week', label: 'Next week' },
  { id: 'flexible', label: 'Flexible' },
];
const MOW_OPTIONS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'once', label: 'One time' },
];
const LAST_CUT_OPTIONS = [
  { id: 'this-week', label: 'This week', days: 1 },
  { id: 'last-week', label: 'Last week', days: 10 },
  { id: 'few-weeks', label: '2–3 weeks ago', days: 27 },
  { id: 'month', label: 'Over a month', days: 48 },
  { id: 'unsure', label: 'Not sure', days: null },
];
const HEDGE_OPTIONS = [
  { id: 'few', label: 'A few bushes' },
  { id: 'line', label: 'A full line' },
  { id: 'unsure', label: 'Not sure' },
];
const SNOW_OPTIONS = [
  { id: 'driveway', label: 'Driveway' },
  { id: 'walk', label: 'Driveway and walk' },
  { id: 'steps', label: 'Driveway, walk, and steps' },
];
const LAWN_SIZE_SERVICES = ['Lawn Dethatching', 'Lawn Aeration', 'Overseeding', 'Lawn Fertilization', 'Weed Control'];

function ChoiceRow({ label, value, options, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option.id)}
              className={`px-4 py-2.5 rounded-full border-2 text-sm font-bold transition-colors ${
                on ? 'border-red-800 bg-red-50 text-stone-900' : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', service: '', message: '', promoCode: '', preferredMeetingDate: ''
  });
  const [submissionStep, setSubmissionStep] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [cleanupAssessment, setCleanupAssessment] = useState({
    lastCleaned: '',
    conditionLevel: 3,
    tasks: ['lawn', 'haul'],
    scope: 'whole',
    size: 'medium',
    timing: 'flexible',
  });
  const [jobDetails, setJobDetails] = useState({
    mow: 'weekly',
    lastCut: 'last-week',
    hedge: 'line',
    snow: 'driveway',
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
  const [showMessageHelper, setShowMessageHelper] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pickedServices, setPickedServices] = useState([]);
  const [accountUser, setAccountUser] = useState(null);
  const [prefilledFromAccount, setPrefilledFromAccount] = useState(false);
  
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
    const picked = resolveServiceList(service, searchParams.get('services'));
    if (picked.length) {
      setPickedServices(picked);
      setFormData(prev => ({ ...prev, service: picked[0] }));
      setShowMessageHelper(true);
    }
    if (ref) setReferralCode(ref.toUpperCase());
    if (promo) setFormData(prev => ({ ...prev, promoCode: promo.toUpperCase() }));

    const pkgName = searchParams.get('package');
    const pkgServices = (searchParams.get('services') || '').split(',').map(s => s.trim()).filter(Boolean);
    if (pkgName || pkgServices.length) {
      const name = pkgName || 'Custom Plan';
      setSelectedPackage({ name, services: pkgServices });
      const intro = `I'm interested in the ${name}${pkgServices.length ? ` (${pkgServices.join(', ')})` : ''}. Please send me a quote for my property.`;
      setFormData(prev => (prev.message ? prev : { ...prev, message: intro }));
      setShowMessageHelper(false);
    } else {
      setSelectedPackage(null);
    }
  }, [searchParams]);

  useEffect(() => {
    let autocomplete;
    const initAutocomplete = async () => {
      if (!window.google || !window.google.maps) return;
      
      try {
        const { Autocomplete } = await window.google.maps.importLibrary("places");
        autocomplete = new Autocomplete(addressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address", "geometry"],
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
          if (!place.address_components) return;

          let streetAddress = "";
          let streetNumber = "";
          let route = "";
          let city = "";
          let state = "";
          let zip = "";

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
              case "administrative_area_level_1":
                state = component.short_name;
                break;
              case "postal_code":
                zip = component.long_name;
                break;
            }
          }

          setFormData(prev => ({
            ...prev,
            address: place.formatted_address || `${streetNumber} ${route}`.trim(),
            city: city || prev.city,
            state: state || 'RI',
            zipCode: zip || prev.zipCode
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

  const generateAIDraft = async () => {
    if (!formData.service) {
      setStatus({ type: 'error', message: 'Please select a service first to use AI drafting.' });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/draft-ai-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          service: formData.service,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          estimatePreference: estimatePreference,
          assessmentData: isCleanupService ? cleanupAssessment : (isMulchService ? mulchAssessment : null)
        })
      });

      const data = await response.json();
      if (data.draft) {
        setFormData(prev => ({ ...prev, message: data.draft }));
        setShowMessageHelper(false);
      } else {
        throw new Error(data.error || 'Failed to generate draft');
      }
    } catch (err) {
      console.error('AI Draft Error:', err);
      // Fallback to template if AI fails
      insertTemplate();
    } finally {
      setIsGeneratingAI(false);
    }
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

  const isCleanupService = pickedServices.some((service) => service === 'Spring Cleanup' || service === 'Fall Cleanup' || service === 'Leaf Removal');
  const isMulchService = pickedServices.includes('Mulching');
  const needsMow = pickedServices.includes('Lawn Mowing');
  const lastCutDays = LAST_CUT_OPTIONS.find((item) => item.id === jobDetails.lastCut)?.days ?? null;
  const lastCutDate = lastCutDays === null
    ? null
    : new Date(Date.now() - lastCutDays * 86400000).toLocaleDateString('en-CA');
  const needsLawnSize = pickedServices.some((service) => LAWN_SIZE_SERVICES.includes(service));
  const needsHedge = pickedServices.includes('Hedge Trimming');
  const needsSnow = pickedServices.includes('Snow Removal');
  const showJobDetails = needsMow || needsLawnSize || needsHedge || needsSnow;

  const conditionLabels = [
    { level: 1, label: 'Light', desc: 'Minimal debris, mostly maintained', color: 'text-green-600', bg: 'bg-green-50 border-green-300' },
    { level: 2, label: 'Moderate', desc: 'Some leaves & growth buildup', color: 'text-lime-600', bg: 'bg-lime-50 border-lime-300' },
    { level: 3, label: 'Heavy', desc: 'Significant pileup, needs real work', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
    { level: 4, label: 'Overgrown', desc: 'Dense debris, hard to walk through', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-300' },
    { level: 5, label: 'Severe', desc: 'Neglected for a season+, full restoration', color: 'text-red-600', bg: 'bg-red-50 border-red-300' },
  ];
  const currentCondition = conditionLabels[cleanupAssessment.conditionLevel - 1];
  const cleanupTaskNames = CLEANUP_TASKS.filter((task) => cleanupAssessment.tasks.includes(task.id)).map((task) => task.label);
  const cleanupScopeLabel = CLEANUP_SCOPES.find((item) => item.id === cleanupAssessment.scope)?.label || 'Whole property';
  const cleanupTimingLabel = CLEANUP_TIMING.find((item) => item.id === cleanupAssessment.timing)?.label || 'Flexible';
  const cleanupSizeLabel = CLEANUP_SIZES.find((item) => item.id === cleanupAssessment.size)?.label || 'Medium';
  const cleanupSummary = `${cleanupSizeLabel} yard, ${cleanupScopeLabel.toLowerCase()}. ${cleanupTaskNames.length ? cleanupTaskNames.join(', ') : 'No tasks picked'}. Leaf cover: ${currentCondition.label.toLowerCase()}. Timing: ${cleanupTimingLabel}.${cleanupAssessment.lastCleaned ? ` Last cleaned: ${cleanupAssessment.lastCleaned}.` : ''}`;

  const toggleCleanupTask = (id) => {
    setCleanupAssessment((prev) => ({
      ...prev,
      tasks: prev.tasks.includes(id) ? prev.tasks.filter((task) => task !== id) : [...prev.tasks, id],
    }));
  };

  const toggleService = (form) => {
    setPickedServices((prev) => {
      const next = prev.includes(form) ? prev.filter((item) => item !== form) : [...prev, form];
      setFormData((current) => ({ ...current, service: next[0] || '' }));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickedServices.length) {
      setStatus({ type: 'error', message: 'Select at least one service.' });
      return;
    }
    setIsSubmitting(true);
    setSubmissionStep('Verifying Data...');
    try {
      // Small delay for perceived reliability
      await new Promise(r => setTimeout(r, 500));

      // Build assessment context
      let cleanupContext = '';
      if (isCleanupService) {
        cleanupContext = [
          '[CLEANUP ASSESSMENT]',
          `Yard size: ${cleanupSizeLabel}`,
          `Area: ${cleanupScopeLabel}`,
          `Tasks: ${cleanupTaskNames.length ? cleanupTaskNames.join(', ') : 'None picked'}`,
          `Leaf cover: ${cleanupAssessment.conditionLevel}/5, ${currentCondition.label} (${currentCondition.desc})`,
          `Timing: ${cleanupTimingLabel}`,
          `Last cleaned: ${cleanupAssessment.lastCleaned || 'Not sure'}`,
        ].join('\n') + '\n\n';
      }

      let mulchContext = '';
      if (isMulchService) {
        mulchContext = `[MULCH & EDGING ASSESSMENT]\n` +
          `Yards used before: ${mulchAssessment.yardsUsedBefore || 'Not specified'}\n` +
          `Yard measurement: ${mulchAssessment.currentYardMeasurement || 'Not specified'}\n` +
          `Needs edging: ${mulchAssessment.needsEdging.toUpperCase()}\n` +
          `Edging measurement: ${mulchAssessment.edgingMeasurement || (mulchAssessment.knowsEdgingMeasurement === 'no' ? 'Will provide photo' : 'Not specified')}\n\n`;
      }

      const jobLines = [];
      if (needsMow) jobLines.push(`Mowing: ${MOW_OPTIONS.find((item) => item.id === jobDetails.mow)?.label}`);
      if (needsMow) jobLines.push(`Last cut: ${LAST_CUT_OPTIONS.find((item) => item.id === jobDetails.lastCut)?.label}`);
      if ((needsMow || needsLawnSize) && !isCleanupService) jobLines.push(`Yard size: ${CLEANUP_SIZES.find((item) => item.id === cleanupAssessment.size)?.label}`);
      if (needsHedge) jobLines.push(`Hedges: ${HEDGE_OPTIONS.find((item) => item.id === jobDetails.hedge)?.label}`);
      if (needsSnow) jobLines.push(`Snow: ${SNOW_OPTIONS.find((item) => item.id === jobDetails.snow)?.label}`);
      const jobContext = jobLines.length ? `[JOB DETAILS]\n${jobLines.join('\n')}\n\n` : '';

      const selectedNames = pickedServices.map(serviceDisplayName);
      const servicesLine = selectedNames.length ? `Services: ${selectedNames.join(', ')}\n\n` : '';
      const packageContext = selectedPackage
        ? `[PACKAGE: ${selectedPackage.name}]${selectedPackage.services.length ? `\nIncludes: ${selectedPackage.services.join(', ')}` : ''}\n\n`
        : '';

      const templateParams = {
        user_name: formData.name,
        user_email: formData.email,
        user_phone: formData.phone,
        user_address: `${formData.address}${formData.state ? `, ${formData.state}` : ''}${formData.zipCode ? ` ${formData.zipCode}` : ''}`,
        service_type: formData.service.toLowerCase().replace(/\s+/g, '_'),
        message: `[PREFERS: ${estimatePreference === 'meet_person' ? 'Meet In Person' : 'Walk Around & Email Pricing'}]\n\n` + servicesLine + jobContext + packageContext + cleanupContext + mulchContext + formData.message,
        to_name: process.env.NEXT_PUBLIC_APP_NAME,
        reply_to: formData.email,
        promo_code: formData.promoCode || 'NONE',
        // Visual Quote Metadata (Transmitted to Dashboard Template if used)
        has_media: mediaFiles.length > 0 ? 'YES' : 'NO',
        media_count: mediaFiles.length,
        discount_status: (showMediaSection && (mediaFiles.length > 0 || (isMulchService && mulchAssessment.edgingMeasurement))) ? '10% CONCIERGE CREDIT APPLIED' : 'NONE'
      };
      setSubmissionStep('Sending Secure Inquiry...');
      await emailjs.send(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID, process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, templateParams);
      
      // --- ELITE MEDIA UPLOAD ---
      let uploadedUrls = [];
      if (mediaFiles.length > 0) {
        setSubmissionStep('Uploading Property Visuals...');
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

      // Note: Lead saving and subscriber logic moved to server-side API route for reliability
      
      await sendNotification(`📬 New Elite Quote Inquiry from ${formData.name} in ${formData.city}!`);
      
      setSubmissionStep('Finalizing Lead Dossier...');
      
      // Send professional confirmation to customer + Save to DB via internal API
      try {
        const response = await fetch('/api/send-contact-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            service: formData.service,
            message: servicesLine + jobContext + packageContext + cleanupContext + mulchContext + (formData.message.trim() ? `[MESSAGE]\n${formData.message.trim()}` : ''),
            packageName: selectedPackage?.name || null,
            packageServices: selectedPackage?.services || [],
            sendSMS: smsPreferences.subscribe,
            hasMedia: mediaFiles.length > 0,
            mediaUrls: uploadedUrls,
            discountApplied: showMediaSection && mediaFiles.length > 0,
            cleanupData: isCleanupService ? {
              lastCleaned: cleanupAssessment.lastCleaned || 'Not specified',
              conditionLevel: cleanupAssessment.conditionLevel,
              conditionLabel: currentCondition.label,
              conditionDesc: cleanupSummary
            } : null,
            promoCode: formData.promoCode || null,
            estimatePreference: estimatePreference,
            emailPreferences,
            smsPreferences
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Server processing failed');
        }

        if (accountUser?.id) {
          const addressParts = [formData.address, formData.city, formData.state, formData.zipCode].filter(Boolean);
          const fullAddress = formData.city && formData.address?.includes(formData.city)
            ? formData.address
            : addressParts.join(', ');
          await fetch('/api/create-customer-from-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: accountUser.id,
              email: formData.email || accountUser.email,
              name: formData.name,
              phone: formData.phone,
              address: fullAddress,
              service: formData.service,
              quoteAlreadySent: true,
            }),
          });
        }

        // ONLY NOW show success message
        setStatus({ 
          type: 'success', 
          message: "Your inquiry has been sent! You'll receive a quote by email within 1–2 business days. Check your email for a confirmation." 
        });
        
        setSubmissionStep('Success!');
        // Clear form
        setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', service: '', message: '', promoCode: '', preferredMeetingDate: '' });
        setPickedServices([]);
        setSelectedPackage(null);
        
        // Smooth scroll to success message
        setTimeout(() => {
          document.getElementById('submission-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

      } catch (confError) {
        console.error('Submission processing error:', confError);
        setStatus({ 
          type: 'error', 
          message: `Submission partially failed: ${confError.message}. We've received your data, but confirmation may be delayed.` 
        });
      }
    } catch (err) {
      console.error('Submission crash:', err);
      setStatus({ type: 'error', message: 'Transmission failed. Direct line: (401) 389-0913' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveQuoteForAccount = (quoteAlreadySent = false) => {
    const addressParts = [formData.address, formData.city, formData.state, formData.zipCode].filter(Boolean);
    const fullAddress = formData.city && formData.address?.includes(formData.city)
      ? formData.address
      : addressParts.join(', ');
    localStorage.setItem('pending_quote_account', JSON.stringify({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: fullAddress,
      service: formData.service,
      quoteAlreadySent,
    }));
  };

  const prepareGoogleAccount = () => {
    if (referralCode) localStorage.setItem('pending_referral_code', referralCode);
    saveQuoteForAccount(status.type === 'success');
  };

  const signOutAccount = async () => {
    await supabase.auth.signOut();
    setAccountUser(null);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAccountUser(data.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccountUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!accountUser?.id) {
      setPrefilledFromAccount(false);
      return undefined;
    }
    let cancelled = false;
    const fill = (row) => {
      if (cancelled) return;
      const meta = accountUser.user_metadata || {};
      const phone = row?.phone && row.phone !== 'Not provided' ? row.phone : '';
      setFormData((prev) => ({
        ...prev,
        name: prev.name || row?.name || meta.full_name || '',
        email: prev.email || accountUser.email || row?.email || '',
        phone: prev.phone || phone,
        address: prev.address || row?.address || '',
      }));
      if (meta.yard_size) setCleanupAssessment((prev) => ({ ...prev, size: meta.yard_size }));
      setPrefilledFromAccount(true);
    };
    supabase
      .from('customers')
      .select('name, email, phone, address')
      .eq('user_id', accountUser.id)
      .limit(1)
      .then(({ data }) => fill(data?.[0]));
    return () => {
      cancelled = true;
    };
  }, [accountUser?.id]);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navigation />
      
      {/* ELITE HERO */}
      <section className="relative pt-36 pb-28 md:pt-44 md:pb-36 overflow-hidden bg-[#1c0a0e]">
         <img
            src="/images/fall-house-hero.jpg"
            alt="Home with red and gold maple trees and a freshly cleaned lawn"
            className="absolute inset-0 w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-[#1c0a0e]/90 via-[#1c0a0e]/65 to-[#1c0a0e]" />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(28,10,14,0.65)_75%)]" />
         <LeafSeason className="z-[1]" />
         <LeafGround className="z-[2]" />

         <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6b1d2a]/80 border border-yellow-300/30 text-yellow-200 text-[11px] font-black uppercase tracking-[0.25em] mb-7 backdrop-blur">
               Free Quotes · RI &amp; MA
            </p>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.95]">
               Get a free quote
               <span className="block bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500 bg-clip-text text-transparent pb-2">
                  for your yard
               </span>
            </h1>
            {selectedPackage ? (
               <p className="mt-6 text-lg md:text-xl text-stone-200 font-medium">
                  You picked <span className="font-black text-yellow-300">{selectedPackage.name}</span>. Add your address and we size the price to your yard.
               </p>
            ) : (
               <p className="mt-6 text-lg md:text-xl text-stone-200 max-w-2xl mx-auto font-medium">
                  Leaf cleanup is one of our jobs. We also quote mowing, dethatch, spring cleanup, mulch, hedge trimming, aeration, and snow. We reply in 1 to 6 hours.
               </p>
            )}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
               <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur text-sm font-bold text-white">
                  <ClockIcon className="w-5 h-5 text-yellow-300" /> Reply in 1–6 hours
               </span>
               <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur text-sm font-bold text-white">
                  <ShieldCheckIcon className="w-5 h-5 text-yellow-300" /> Free, no obligation
               </span>
               <a
                  href="tel:4013890913"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-900 text-sm font-black transition-colors"
               >
                  <PhoneIcon className="w-5 h-5" /> (401) 389-0913
               </a>
            </div>
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
                        {prefilledFromAccount && (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-green-200 bg-green-50 px-5 py-4">
                            <p className="text-sm font-semibold text-green-900">
                              Welcome back{formData.name ? `, ${formData.name.split(' ')[0]}` : ''}. We filled in your saved details. Change anything that is different for this job.
                            </p>
                            <Link href="/customer/dashboard" className="text-sm font-bold text-green-900 underline underline-offset-4">
                              Your yard
                            </Link>
                          </div>
                        )}
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
                        <div className="md:col-span-2">
                           <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Property Address Search *</label>
                           <div className="relative group">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                 <MapPinIcon className="w-6 h-6" />
                              </div>
                              <input 
                                ref={addressRef}
                                required 
                                type="text" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-16 pr-32 py-6 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold placeholder-slate-300 shadow-sm" 
                                placeholder="Search Your Address..." 
                              />
                              {formData.zipCode && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300">
                                   <CheckBadgeIcon className="w-4 h-4" /> Verified
                                </div>
                              )}
                           </div>
                           <div className="flex flex-wrap gap-4 mt-3">
                              <p className="text-[10px] text-slate-400 font-bold italic">Start typing to find your property. We use satellite data for accuracy.</p>
                              {formData.city && (
                                <div className="flex gap-2">
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase">{formData.city}, {formData.state}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase">{formData.zipCode}</span>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="hidden">
                           <input type="hidden" name="city" value={formData.city} />
                           <input type="hidden" name="state" value={formData.state} />
                           <input type="hidden" name="zipCode" value={formData.zipCode} />
                        </div>

                        {selectedPackage && (
                           <div className="relative overflow-hidden rounded-[2rem] bg-[#1c0a0e] text-white p-6 border-2 border-red-800">
                              <div className="flex items-start justify-between gap-4">
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-300">🍁 Selected Package</p>
                                    <h3 className="text-2xl font-black tracking-tight mt-1">{selectedPackage.name}</h3>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => setSelectedPackage(null)}
                                    className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white px-3 py-1.5 rounded-full border border-white/15"
                                 >
                                    Remove
                                 </button>
                              </div>
                              {selectedPackage.services.length > 0 && (
                                 <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedPackage.services.map(s => (
                                       <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm font-bold">
                                          <CheckBadgeIcon className="w-4 h-4 text-yellow-300" /> {s}
                                       </span>
                                    ))}
                                 </div>
                              )}
                              <p className="mt-4 text-xs font-bold text-white/60">Free quote, sized to your yard. We confirm the price before any work starts.</p>
                           </div>
                        )}

                        <div>
                           <div className="flex items-end justify-between gap-3 mb-3">
                              <label className="text-sm font-semibold text-slate-600">Services</label>
                              <p className="text-sm font-bold text-red-800">{pickedServices.length} {pickedServices.length === 1 ? 'service' : 'services'} selected</p>
                           </div>
                           <ServiceToggleGrid services={YARD_SERVICES} selected={pickedServices} onToggle={toggleService} />
                           <p className="mt-5 mb-3 text-sm font-semibold text-slate-600">Other services</p>
                           <ServiceToggleGrid services={OTHER_SERVICES} selected={pickedServices} onToggle={toggleService} />
                           <input type="hidden" name="service" value={formData.service} />
                        </div>

                        {showJobDetails && (
                          <div className="rounded-[2rem] border-2 border-stone-200 bg-stone-50 p-5 sm:p-6 space-y-5">
                            <div>
                              <p className="text-sm font-semibold text-slate-500">For the services you picked</p>
                              <p className="mt-1 text-lg font-bold text-slate-900">One detail each, so the price is closer</p>
                            </div>
                            {(needsMow || needsLawnSize) && (
                              <div className="rounded-2xl border border-stone-200 bg-white p-3">
                                <p className="mb-2 text-sm font-semibold text-slate-700">Pick the yard size that looks closest to yours</p>
                                <YardSeasonScene
                                  lastService={needsMow ? lastCutDate : null}
                                  frequency="monthly"
                                  size={cleanupAssessment.size}
                                  onSizeChange={(size) => setCleanupAssessment((prev) => ({ ...prev, size }))}
                                />
                              </div>
                            )}
                            {needsMow && (
                              <ChoiceRow
                                label="When was it last cut?"
                                value={jobDetails.lastCut}
                                options={LAST_CUT_OPTIONS}
                                onChange={(lastCut) => setJobDetails((prev) => ({ ...prev, lastCut }))}
                              />
                            )}
                            {needsMow && (
                              <ChoiceRow
                                label="How often should we mow?"
                                value={jobDetails.mow}
                                options={MOW_OPTIONS}
                                onChange={(mow) => setJobDetails((prev) => ({ ...prev, mow }))}
                              />
                            )}
                            {needsHedge && (
                              <ChoiceRow
                                label="How much hedge?"
                                value={jobDetails.hedge}
                                options={HEDGE_OPTIONS}
                                onChange={(hedge) => setJobDetails((prev) => ({ ...prev, hedge }))}
                              />
                            )}
                            {needsSnow && (
                              <ChoiceRow
                                label="What should we clear of snow?"
                                value={jobDetails.snow}
                                options={SNOW_OPTIONS}
                                onChange={(snow) => setJobDetails((prev) => ({ ...prev, snow }))}
                              />
                            )}
                          </div>
                        )}

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

                        {isCleanupService && (
                           <div className="bg-slate-900 border-2 border-green-500/30 rounded-[2rem] p-6 sm:p-8 space-y-6">
                             <style>{`
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
                             <div>
                               <p className="text-sm font-semibold text-green-300">Cleanup details</p>
                               <p className="mt-1 text-xl font-bold text-white">What should we clear?</p>
                               <p className="mt-2 text-sm text-slate-300">These answers are what we use to price the visit. We confirm the number before any work.</p>
                             </div>

                             <CleanupYard
                               tasks={cleanupAssessment.tasks}
                               scope={cleanupAssessment.scope}
                               cover={cleanupAssessment.conditionLevel}
                               size={cleanupAssessment.size}
                             />

                             <div>
                               <p className="text-sm font-semibold text-slate-300 mb-2">How big is the yard?</p>
                               <div className="grid grid-cols-3 gap-2">
                                 {CLEANUP_SIZES.map((item) => {
                                   const on = cleanupAssessment.size === item.id;
                                   return (
                                     <button
                                       key={item.id}
                                       type="button"
                                       aria-pressed={on}
                                       onClick={() => setCleanupAssessment((prev) => ({ ...prev, size: item.id }))}
                                       className={`px-3 py-3 rounded-2xl border-2 text-sm font-bold transition-colors ${on ? 'border-white bg-white text-slate-900' : 'border-white/25 text-white hover:border-white/50'}`}
                                     >
                                       {item.label}
                                     </button>
                                   );
                                 })}
                               </div>
                             </div>

                             <div className="flex flex-wrap gap-2">
                               {CLEANUP_TASKS.map((task) => {
                                 const on = cleanupAssessment.tasks.includes(task.id);
                                 return (
                                   <button
                                     key={task.id}
                                     type="button"
                                     aria-pressed={on}
                                     onClick={() => toggleCleanupTask(task.id)}
                                     className={`px-4 py-2.5 rounded-full border-2 text-sm font-bold transition-colors ${on ? 'border-white bg-white text-slate-900' : 'border-white/25 text-white hover:border-white/50'}`}
                                   >
                                     {task.label}
                                   </button>
                                 );
                               })}
                             </div>

                             <div>
                               <p className="text-sm font-semibold text-slate-300 mb-2">How much of the property?</p>
                               <div className="grid grid-cols-3 gap-2">
                                 {CLEANUP_SCOPES.map((item) => {
                                   const on = cleanupAssessment.scope === item.id;
                                   return (
                                     <button
                                       key={item.id}
                                       type="button"
                                       aria-pressed={on}
                                       onClick={() => setCleanupAssessment((prev) => ({ ...prev, scope: item.id }))}
                                       className={`px-3 py-3 rounded-2xl border-2 text-sm font-bold transition-colors ${on ? 'border-white bg-white text-slate-900' : 'border-white/25 text-white hover:border-white/50'}`}
                                     >
                                       {item.label}
                                     </button>
                                   );
                                 })}
                               </div>
                             </div>

                             <div>
                               <p className="text-sm font-semibold text-slate-300 mb-2">When do you want it done?</p>
                               <div className="grid grid-cols-3 gap-2">
                                 {CLEANUP_TIMING.map((item) => {
                                   const on = cleanupAssessment.timing === item.id;
                                   return (
                                     <button
                                       key={item.id}
                                       type="button"
                                       aria-pressed={on}
                                       onClick={() => setCleanupAssessment((prev) => ({ ...prev, timing: item.id }))}
                                       className={`px-3 py-3 rounded-2xl border-2 text-sm font-bold transition-colors ${on ? 'border-white bg-white text-slate-900' : 'border-white/25 text-white hover:border-white/50'}`}
                                     >
                                       {item.label}
                                     </button>
                                   );
                                 })}
                               </div>
                             </div>

                             <div>
                               <label className="text-sm font-semibold text-slate-300 mb-2 block" htmlFor="last-cleaned">When was it last cleaned?</label>
                               <select
                                 id="last-cleaned"
                                 value={cleanupAssessment.lastCleaned}
                                 onChange={(e) => setCleanupAssessment((prev) => ({ ...prev, lastCleaned: e.target.value }))}
                                 className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-green-500 font-semibold"
                               >
                                 <option value="">Not sure</option>
                                 <option value="This season">This season</option>
                                 <option value="Last season">Last season</option>
                                 <option value="Over a year ago">Over a year ago</option>
                                 <option value="Never">Never</option>
                               </select>
                             </div>

                             <div>
                               <div className="flex items-center justify-between mb-3">
                                 <label className="text-sm font-semibold text-slate-300" htmlFor="leaf-cover">How much leaf cover?</label>
                                 <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${currentCondition.bg} ${currentCondition.color}`}>
                                   {currentCondition.label}
                                 </span>
                               </div>
                               <input
                                 id="leaf-cover"
                                 type="range"
                                 min="1"
                                 max="5"
                                 step="1"
                                 value={cleanupAssessment.conditionLevel}
                                 onChange={(e) => setCleanupAssessment((prev) => ({ ...prev, conditionLevel: Number(e.target.value) }))}
                                 className="cleanup-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                                 style={{
                                   background: `linear-gradient(to right, #22c55e ${(cleanupAssessment.conditionLevel - 1) * 25}%, #334155 ${(cleanupAssessment.conditionLevel - 1) * 25}%)`
                                 }}
                               />
                               <p className="mt-3 text-sm text-slate-300">{currentCondition.desc}</p>
                             </div>

                             <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                               We&apos;ll quote: {cleanupSummary}
                             </p>
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
                           
                           {estimatePreference === 'meet_person' && (
                              <div className="mt-6 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl animate-in zoom-in-95 duration-300">
                                <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-3 block">Preferred Appointment Date *</label>
                                <div className="relative">
                                  <CalendarIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-green-600 pointer-events-none" />
                                  <input 
                                    required 
                                    type="date" 
                                    name="preferredMeetingDate" 
                                    value={formData.preferredMeetingDate} 
                                    onChange={handleChange} 
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-slate-900 focus:outline-none focus:border-green-500 transition-all font-bold [color-scheme:light]" 
                                  />
                                </div>
                                <p className="mt-3 text-[10px] text-slate-400 font-bold italic">Note: Our team will contact you to confirm the exact arrival window.</p>
                              </div>
                            )}
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
                                    <p className="font-black text-xs uppercase tracking-tight italic text-slate-900">Email Status Updates</p>
                                    <p className="text-[10px] text-slate-400 font-bold italic">Receive job appointment status, seasonal updates, and service reminders.</p>
                                 </div>
                              </label>
                              <label className="flex items-center gap-4 cursor-pointer">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${smsPreferences.subscribe ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                 </div>
                                 <input type="checkbox" className="hidden" checked={smsPreferences.subscribe} onChange={(e) => setSmsPreferences({...smsPreferences, subscribe: e.target.checked})} />
                                 <div>
                                    <p className="font-black text-xs uppercase tracking-tight italic text-slate-900">SMS Notifications</p>
                                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-1">
                                       By checking this box, you agree to receive automated SMS notifications and job status updates from Flora Lawn & Landscaping. Message frequency varies. Message and data rates may apply. Reply STOP to opt out. See our <Link href="/privacy-policy" className="underline hover:text-green-600">Privacy Policy</Link> and <Link href="/terms-of-service" className="underline hover:text-green-600">Terms of Service</Link>.
                                    </p>
                                 </div>
                              </label>
                           </div>
                        </div>

                        <p className="text-sm text-[#5C6B62]">
                           Optional. Create an account below to see this quote when it is ready. Your name, phone, address, and service are saved on the account.
                        </p>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-green-600 hover:bg-green-500 text-white font-black p-8 rounded-[2rem] text-2xl shadow-2xl transition-all disabled:opacity-50 italic group flex items-center justify-center gap-6"
                        >
                           {isSubmitting ? (
                             <div className="flex items-center justify-center gap-4">
                                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="tracking-widest">{submissionStep.toUpperCase()}</span>
                             </div>
                           ) : (
                             <span className="flex items-center justify-center gap-4">
                                Get My Free Quote
                                <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-3 transition-all" />
                             </span>
                           )}
                        </button>
                        <p className="text-center text-sm font-semibold text-slate-500 -mt-4">
                           Takes about 1 minute. We reply in 1–6 hours. We never share your info.
                        </p>

                        <div className="mt-10 border border-[#C9D4CC] bg-[#F3F6F4] p-6 md:p-8 text-[#1B2838]">
                           <h3 className="text-2xl font-semibold tracking-tight">Optional: see when your quote is ready</h3>
                           <p className="mt-3 max-w-md text-sm text-[#5C6B62]">You can send the quote without an account. If you create one, this form comes with you: name, phone, address, and service. Then open the account to see the quote when we reply.</p>
                           {accountUser ? (
                              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                                 <p className="text-sm flex-1">Signed in as {accountUser.email}. Sending this quote saves it on your account.</p>
                                 <Link href="/customer/dashboard" className="inline-flex items-center justify-center min-h-11 px-4 bg-[#1B2838] text-white font-semibold text-sm">
                                    Open my account
                                 </Link>
                                 <button type="button" onClick={signOutAccount} className="min-h-11 px-4 border border-[#1B2838] font-semibold text-sm">
                                    Sign out
                                 </button>
                              </div>
                           ) : (
                              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                                 <div className="w-full sm:w-72">
                                    <GoogleSignInButton
                                       redirectTo="/auth/callback?redirect=/customer/dashboard"
                                       onBefore={prepareGoogleAccount}
                                    />
                                 </div>
                                 <Link href="/login?redirect=/customer/dashboard" onClick={() => saveQuoteForAccount(status.type === 'success')} className="text-sm underline underline-offset-4">
                                    I already have an account
                                 </Link>
                              </div>
                           )}
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