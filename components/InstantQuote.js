'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { autoMeasureLawn } from '@/libs/actions/auto-measure';
import jsPDF from 'jspdf';
import { 
  MapPinIcon, 
  SparklesIcon, 
  ArrowRightIcon,
  XMarkIcon,
  CheckBadgeIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/solid';

import { supabase } from '@/lib/supabase';

export default function InstantQuoteMap({ onQuoteComplete, selectedPlace, setSelectedPlace }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [mapStatus, setMapStatus] = useState('Initializing Maps...');
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [aiOriginalArea, setAiOriginalArea] = useState(null);
  const [price, setPrice] = useState(0);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiSections, setAiSections] = useState([]);
  const [showAiAnalyzeButton, setShowAiAnalyzeButton] = useState(false);
  const [hideAddress, setHideAddress] = useState(false);
  const [aiImage, setAiImage] = useState(null);
  const [parcelData, setParcelData] = useState(null);
  const [selectedServices, setSelectedServices] = useState(['mowing']);
  const [expandedServices, setExpandedServices] = useState(['mowing']);
  const [mulchBeds, setMulchBeds] = useState({ small: 0, medium: 0, large: 0 });
  const [mulchSqFt, setMulchSqFt] = useState(0);
  const [overseedSqFt, setOverseedSqFt] = useState(0);
  const [mulchEdged, setMulchEdged] = useState(false);
  const [drawingTarget, setDrawingTarget] = useState('lawn'); // 'lawn', 'mulch', 'overseed'
  const [mulchColor, setMulchColor] = useState('Black');
  const [customMulchYards, setCustomMulchYards] = useState(0);
  const [treeTrimCount, setTreeTrimCount] = useState(0);
  const [shrubCounts, setShrubCounts] = useState({ small: 0, medium: 0, large: 0 });
  
  const [customJobs, setCustomJobs] = useState([{ id: Date.now(), details: '', price: 0 }]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' or 'leads'
  const [leads, setLeads] = useState([]);
  const [fallCleanedLastYear, setFallCleanedLastYear] = useState(true);
  const [mowingFrequency, setMowingFrequency] = useState('weekly');
  const [springIntensity, setSpringIntensity] = useState(1);
  const [fallIntensity, setFallIntensity] = useState(1);
  const [debrisDisposal, setDebrisDisposal] = useState('woods');
  const [isManualAreaMode, setIsManualAreaMode] = useState(false);
  const [manualAreaInput, setManualAreaInput] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // New Workflow States
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [hasPartialSent, setHasPartialSent] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadStatus, setLeadStatus] = useState(null);

  const drawingTargetRef = useRef('lawn');
  const isDrawingModeRef = useRef(false);

  useEffect(() => { drawingTargetRef.current = drawingTarget; }, [drawingTarget]);
  useEffect(() => { isDrawingModeRef.current = isDrawingMode; }, [isDrawingMode]);
  
  const defaultPricing = {
    mowingBase: 45,
    mowingBaseLimit: 2000,
    mowingPer1k: 10,
    mowingBiWeeklySurcharge: 1.3,
    mulchPrices: { Black: 135, Brown: 135, Red: 145 },
    mulchEdgingPrice: 1.25,
    mulchDepth: 3,
    springBase: 189,
    fallBase: 235,
    fallLegacyFee: 150,
    aerationBase: 150,
    aerationPer1k: 35.36,
    dethatchBase: 200,
    overseedBase: 125,
    overseedSeedPer1k: 45,
    overseedLaborPer1k: 35,
    springFactors: { md: 1.8, lg: 2.6 },
    fallFactors: { md: 1.83, lg: 2.83 },
    fallIntensityMedium: 1.5,
    fallIntensityHeavy: 2.2,
    disposalHaulFee: 125,
    treeTrimPrice: 75,
    snowBase: 75,
    fertBase: 95,
    fertPer1k: 12,
    shrubBase: 75,
    shrubPrices: { small: 25, medium: 45, large: 75 },
    gutterBase: 150
  };
  
  const [traceHistory, setTraceHistory] = useState([]);

  const [pricingConfig, setPricingConfig] = useState(defaultPricing);
  const [calibratedData, setCalibratedData] = useState({
    targetHourly: 80,
    crewSize: 1,
    globalAvgMinsPer1k: 0,
    isCalibrated: false
  });

  useEffect(() => {
    const fetchConfig = async () => {
      // Get initial user
      const { data: { user: su } } = await supabase.auth.getUser();
      setUser(su);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      // Fetch from the new Business Intelligence Master Workspace
      const { data, error } = await supabase
        .from('business_config')
        .select('data')
        .eq('category', 'master_pricing')
        .single();

      if (!error && data?.data) {
        // Map the new flat structure to the component's expected structure
        const d = data.data;
        const mappedConfig = {
          ...defaultPricing,
          mowingBase: d.lawn_mowing.base_house,
          mowingBaseLimit: d.lawn_mowing.base_sqft_limit,
          mowingPer1k: d.lawn_mowing.price_per_1k_sqft,
          mowingBiWeeklySurcharge: d.lawn_mowing.bi_weekly_surcharge,
          mulchPrices: { Black: d.materials.mulch_per_yd, Brown: d.materials.mulch_per_yd, Red: d.materials.mulch_per_yd + 10 },
          mulchEdgingPrice: d.materials.edging_per_ft,
          mulchDepth: d.materials.mulch_depth_inches,
          springBase: d.seasonal.spring_cleanup_base,
          fallBase: d.seasonal.fall_cleanup_base,
          springFactors: { md: d.seasonal.med_scale_mult_1_4k, lg: d.seasonal.lrg_scale_mult_5k_plus },
          fallFactors: { 
            md: d.seasonal.fall_med_scale_mult || (d.seasonal.med_scale_mult_1_4k + 0.03), 
            lg: d.seasonal.fall_lrg_scale_mult || (d.seasonal.lrg_scale_mult_5k_plus + 0.23) 
          },
          fallIntensityMedium: d.seasonal.fall_intensity_med || 1.5,
          fallIntensityHeavy: d.seasonal.fall_intensity_heavy || 2.2,
          aerationBase: d.advanced_care.aeration_base,
          aerationPer1k: d.advanced_care.aeration_price_per_1k,
          dethatchBase: d.advanced_care.dethatch_base,
          overseedSeedPer1k: d.advanced_care.seed_price_per_1k,
          snowBase: d.advanced_care.snow_base,
          fertBase: d.operations.fertilizer_base,
          gutterBase: d.operations.gutter_base,
          shrubPrices: d.operations.shrub_rates,
          disposalHaulFee: d.operations.disposal_fee,
          treeTrimPrice: d.materials.tree_trim_flat
        };
        setPricingConfig(mappedConfig);
        localStorage.setItem('floralawn_pricing', JSON.stringify(mappedConfig));
      } else {
        const saved = localStorage.getItem('floralawn_pricing');
        if (saved) {
          try { 
            const localMerged = { ...defaultPricing, ...JSON.parse(saved) };
            setPricingConfig(localMerged); 
          } catch (e) { console.error("Load failed"); }
        }
      }

      // Fetch Calibration Data
      const fetchCalibration = async () => {
        try {
          const { data: prefData } = await supabase.from('business_config').select('data').eq('category', 'calibration_preferences').single();
          const targetHourly = prefData?.data?.target_hourly || 80;
          const crewSize = prefData?.data?.crew_size || 1;

          const { data: verProps } = await supabase.from('business_config').select('data').eq('category', 'verified_properties').single();
          const verified = verProps?.data || {};

          const { data: custData } = await supabase.from('customers').select('address, last_job_duration_minutes').not('last_job_duration_minutes', 'is', null);
          
          let totalMins = 0;
          let totalSqft = 0;

          if (custData && custData.length > 0) {
            custData.forEach(c => {
               const matchedKey = Object.keys(verified).find(k => k.includes(c.address) || c.address.includes(k));
               if (matchedKey && verified[matchedKey] > 0) {
                 totalMins += c.last_job_duration_minutes;
                 totalSqft += verified[matchedKey];
               }
            });
          }
          
          let globalAvgMinsPer1k = 0;
          if (totalSqft > 0) {
             globalAvgMinsPer1k = totalMins / (totalSqft / 1000);
          } else {
             globalAvgMinsPer1k = 15; // Default fallback
          }

          setCalibratedData({
            targetHourly,
            crewSize,
            globalAvgMinsPer1k,
            isCalibrated: totalSqft > 0
          });

        } catch (e) {
          console.error("Calibration fetch failed", e);
        }
      };
      
      fetchCalibration();

      return () => subscription.unsubscribe();
    };
    fetchConfig();
  }, []);

  // Mobile Drawing Experience: Lock Body Scroll
  useEffect(() => {
    if (isDrawingMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawingMode]);


  const signInAdmin = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: `${origin}/auto-lawn` } 
    });
  };

  const fetchLeads = async () => {
    if (user?.email?.toLowerCase() !== 'esckoofficial@gmail.com') return;
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error) setLeads(data || []);
  };

  const deleteLead = async (id) => {
    if (confirm('Permanently remove this lead from the hub?')) {
      await supabase.from('leads').delete().eq('id', id);
      fetchLeads();
    }
  };

  const savePricing = async (newConfig) => {
    setPricingConfig(newConfig);
    localStorage.setItem('floralawn_pricing', JSON.stringify(newConfig));
    setIsSyncing(true);
    
    try {
      // 1. Save to the simple/internal pricing_config table
      await supabase.from('pricing_config').upsert({ id: 'default', config: newConfig });

      // 2. Sync back to the Business Intelligence Master Workspace (business_config)
      const masterPayload = {
        lawn_mowing: {
          base_house: newConfig.mowingBase,
          base_sqft_limit: newConfig.mowingBaseLimit,
          price_per_1k_sqft: newConfig.mowingPer1k,
          bi_weekly_surcharge: newConfig.mowingBiWeeklySurcharge
        },
        materials: {
          mulch_per_yd: newConfig.mulchPrices.Black,
          edging_per_ft: newConfig.mulchEdgingPrice,
          mulch_depth_inches: newConfig.mulchDepth,
          tree_trim_flat: newConfig.treeTrimPrice
        },
        seasonal: {
          spring_cleanup_base: newConfig.springBase,
          fall_cleanup_base: newConfig.fallBase,
          med_scale_mult_1_4k: newConfig.springFactors.md,
          lrg_scale_mult_5k_plus: newConfig.springFactors.lg,
          fall_med_scale_mult: newConfig.fallFactors.md,
          fall_lrg_scale_mult: newConfig.fallFactors.lg,
          fall_intensity_med: newConfig.fallIntensityMedium,
          fall_intensity_heavy: newConfig.fallIntensityHeavy
        },
        advanced_care: {
          aeration_base: newConfig.aerationBase,
          aeration_price_per_1k: newConfig.aerationPer1k,
          dethatch_base: newConfig.dethatchBase,
          seed_price_per_1k: newConfig.overseedSeedPer1k,
          snow_base: newConfig.snowBase
        },
        operations: {
          fertilizer_base: newConfig.fertBase,
          gutter_base: newConfig.gutterBase,
          shrub_rates: newConfig.shrubPrices,
          disposal_fee: newConfig.disposalHaulFee
        }
      };

      await supabase.from('business_config').upsert({ 
        category: 'master_pricing', 
        data: masterPayload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'category' });

    } catch (err) {
      console.error("Sync Error:", err);
    }
    
    setIsSyncing(false);
  };

  const services = [
    { id: 'mowing', name: `${mowingFrequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'} Mowing`, icon: '✂️', description: 'Trim, edge, and blow' },
    { id: 'mulch', name: 'Mulch Install', icon: '🪵', description: 'Premium dyed mulch' },
    { id: 'dethatching', name: 'Dethatching', icon: '🧹', description: 'Power-rake thatch removal' },
    { id: 'overseeding', name: 'Overseeding', icon: '🌱', description: 'Precision seed & labor' },
    { id: 'spring', name: 'Spring Cleanup', icon: '🌼', description: 'Debris & leaf removal' },
    { id: 'fall', name: 'Fall Cleanup', icon: '🍂', description: 'Final leaf clearance' },
    { id: 'aeration', name: 'Core Aeration', icon: '🚜', description: 'Soil de-compaction' },
    { id: 'tree_trimming', name: 'Tree Trimming', icon: '🌳', description: 'Small tree & limb care' },
    { id: 'snow_removal', name: 'Snow Removal', icon: '❄️', description: 'Driveway & walkway clear' },
    { id: 'fertilization', name: 'Fertilization', icon: '🧪', description: '6-Step weed & feed plan' },
    { id: 'shrub_pruning', name: 'Shrub Pruning', icon: '🌿', description: 'Detailed plant shaping' },
    { id: 'gutter_cleaning', name: 'Gutter Cleaning', icon: '🏠', description: 'Debris removal & flush' },
    { id: 'custom_job', name: 'Custom Requests', icon: '📋', description: 'Detailed unique tasks' },
  ];

  const getServicePrice = (id, area) => {
    let intensityMult = 1;
    if (id === 'spring') intensityMult = springIntensity === 1 ? 1 : springIntensity === 2 ? 1.5 : 2.2;
    if (id === 'fall') intensityMult = fallIntensity === 1 ? 1 : fallIntensity === 2 ? (pricingConfig.fallIntensityMedium || 1.5) : (pricingConfig.fallIntensityHeavy || 2.2);

    const { mowingBase, mowingBaseLimit, mowingPer1k, mowingBiWeeklySurcharge, springBase, fallBase, springFactors, fallFactors, aerationBase, dethatchBase, overseedBase, overseedSeedPer1k, overseedLaborPer1k, disposalHaulFee, treeTrimPrice, fallLegacyFee } = pricingConfig;

    if (id === 'mowing') {
       const mult = mowingFrequency === 'bi-weekly' ? (mowingBiWeeklySurcharge || 1.3) : 1;
       let bp = 0;
       
       if (calibratedData.isCalibrated && calibratedData.globalAvgMinsPer1k > 0 && area > 0) {
         // DYNAMIC HISTORICAL PRICING (Option B)
         const estimatedMins = (area / 1000) * calibratedData.globalAvgMinsPer1k;
         bp = (estimatedMins / 60) * calibratedData.crewSize * calibratedData.targetHourly;
         
         // Safety check: ensure it doesn't dip below the minimum base house price
         if (bp < mowingBase) bp = mowingBase;
       } else {
         // FALLBACK STATIC PRICING
         bp = area <= mowingBaseLimit ? mowingBase : (mowingBase + (Math.ceil(Math.max(0, area - mowingBaseLimit) / 1000) * mowingPer1k));
       }
       
       return Math.round(bp * mult);
    }
    if (id === 'mulch') {
       const mp = pricingConfig.mulchPrices?.[mulchColor] || 135;
       let y = customMulchYards > 0 ? customMulchYards : (mulchSqFt > 0 ? (mulchSqFt * (pricingConfig.mulchDepth/12))/27 : (mulchBeds.small*0.5+mulchBeds.medium+mulchBeds.large*2));
       const ec = mulchEdged ? Math.round((mulchSqFt > 0 ? Math.sqrt(mulchSqFt)*4 : y*30) * (pricingConfig.mulchEdgingPrice || 1.25)) : 0;
       return Math.max(0, Math.ceil(y * mp) + ec);
    }
    if (id === 'dethatching') return Math.round(dethatchBase * (area < 5000 ? 1 : area < 10000 ? 1.7 : 2.5));
    if (id === 'overseeding') {
       const osArea = overseedSqFt > 0 ? overseedSqFt : area;
       const per1kRate = (overseedSeedPer1k || 45) + (overseedLaborPer1k || 35);
       return Math.round(overseedBase + (osArea / 1000) * per1kRate);
    }
    if (id === 'spring') {
       const scaleMult = area < 5000 ? 1 : area < 10000 ? (springFactors.md || 1) : (springFactors.lg || 1);
       // Ensure the multiplier never effectively reduces the price below the base unless intended
       const multiplier = Math.max(1, scaleMult); 
       return Math.round(springBase * multiplier * intensityMult) + (debrisDisposal === 'haul' ? (disposalHaulFee || 125) : 0);
    }
    if (id === 'fall') {
       const scaleMult = area < 5000 ? 1 : area < 10000 ? (fallFactors.md || 1) : (fallFactors.lg || 1);
       const multiplier = Math.max(1, scaleMult);
       return Math.round(fallBase * multiplier * intensityMult) + (!fallCleanedLastYear ? 150 : 0) + (debrisDisposal === 'haul' ? (disposalHaulFee || 125) : 0);
    }
    if (id === 'aeration') return Math.max(aerationBase, Math.round((area / 1000) * (pricingConfig.aerationPer1k || 35.36)));
    if (id === 'tree_trimming') return treeTrimPrice || 75;
    if (id === 'snow_removal') return pricingConfig.snowBase || 75;
    if (id === 'fertilization') return Math.round((pricingConfig.fertBase || 95) + (area / 1000) * (pricingConfig.fertPer1k || 12));
    if (id === 'shrub_pruning') {
       const sp = pricingConfig.shrubPrices || { small: 25, medium: 45, large: 75 };
       const totalShrubs = (shrubCounts.small * sp.small) + (shrubCounts.medium * sp.medium) + (shrubCounts.large * sp.large);
       return totalShrubs;
    }
    if (id === 'gutter_cleaning') return pricingConfig.gutterBase || 150;
    if (id === 'custom_job') return customJobs.reduce((sum, job) => sum + (Number(job.price) || 0), 0);
    return 0;
  };

  const currentArea = isManualAreaMode && manualAreaInput ? Number(manualAreaInput) : (calculatedArea || 0);
  
  // Bulk Discount Logic
  const quoteBeforeDiscount = selectedServices.reduce((acc, curr) => acc + getServicePrice(curr, currentArea), 0);
  const discountRate = selectedServices.length >= 7 ? 0.15 : selectedServices.length >= 5 ? 0.10 : selectedServices.length >= 3 ? 0.05 : 0;
  const totalDiscount = Math.round(quoteBeforeDiscount * discountRate);
  const totalQuote = quoteBeforeDiscount - totalDiscount;

  const getFullBreakdown = () => {
     const standard = selectedServices.map(sid => ({
        name: services.find(s => s.id === sid).name,
        price: getServicePrice(sid, currentArea)
     }));
     const customs = customJobs.filter(j => j.details && j.price > 0).map(j => ({
        name: `CUSTOM: ${j.details}`,
        price: Number(j.price)
     }));
     const finalResult = [...standard, ...customs];
     if (totalDiscount > 0) {
        finalResult.push({ name: `MULTI-SERVICE DISCOUNT (${Math.round(discountRate * 100)}% OFF)`, price: -totalDiscount });
     }
     return finalResult;
  };

  // Sync with Global Window for Lead Gen Pipeline
  useEffect(() => {
    window.finalCalculatedArea = currentArea;
    window.finalCalculatedPrice = totalQuote;
    window.finalCalculatedDiscount = totalDiscount;
    window.finalCalculatedBreakdown = getFullBreakdown();
  }, [currentArea, totalQuote, customJobs, selectedServices]);

  const toggleService = (id) => {
    if (id === 'mowing') return;
    const isSelected = selectedServices.includes(id);
    setSelectedServices(prev => isSelected ? prev.filter(s => s !== id) : [...prev, id]);
    if (!isSelected && !expandedServices.includes(id)) setExpandedServices(prev => [...prev, id]);
  };

  const toggleExpand = (e, id) => { e.stopPropagation(); setExpandedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]); };

  const mapRef = useRef(null);
  const googleRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const isPrimalDrawRef = useRef(true);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!window.google || !window.google.maps) return false;
      try {
        const google = window.google;
        googleRef.current = google;
        await google.maps.importLibrary("places");
        setLoading(false);
        return true;
      } catch (err) { return false; }
    };
    initAutocomplete();
  }, []);

  useEffect(() => {
    if (selectedPlace && selectedPlace.geometry && mapRef.current) {
      setTimeout(() => initMap(selectedPlace.geometry.location), 100);
      setShowAiAnalyzeButton(true);
    }
  }, [selectedPlace]);

  const initMap = (location) => {
    const google = googleRef.current;
    if (!google.maps.drawing) return;
    const map = new google.maps.Map(mapRef.current, { center: location, zoom: 21, mapTypeId: 'satellite', tilt: 0, disableDefaultUI: true, zoomControl: true });
    
    // PROPERTY PIN
    new google.maps.Marker({
      position: location,
      map: map,
      title: "Target Property",
      animation: google.maps.Animation.DROP,
      icon: {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: "#22C55E",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
        scale: 2,
        anchor: new google.maps.Point(12, 22)
      }
    });

    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: null, 
      drawingControl: true, 
      drawingControlOptions: { position: google.maps.ControlPosition.TOP_LEFT, drawingModes: [google.maps.drawing.OverlayType.POLYGON] },
      polygonOptions: { fillOpacity: 0.5, strokeWeight: 4, clickable: true, editable: true, zIndex: 10 },
    });
    dm.setMap(map);
    drawingManagerRef.current = dm;

    google.maps.event.addListener(dm, 'polygoncomplete', (p) => {
      const aSqFt = Math.round(google.maps.geometry.spherical.computeArea(p.getPath()) * 10.7639);
      const target = drawingTargetRef.current;
      if (target === 'lawn') { 
         // Capture Static Map Image
         try {
           const encodedPath = google.maps.geometry.encoding.encodePath(p.getPath());
           const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat()},${location.lng()}&zoom=20&size=600x600&maptype=satellite&path=color:0x22C55E|fillcolor:0x22C55E80|weight:3|enc:${encodedPath}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
           setMapImageUrl(staticUrl);
         } catch(e) { console.error("Could not encode path for image"); }

         if (isPrimalDrawRef.current) {
            setCalculatedArea(aSqFt); 
            setAiReasoning("Manual calibration (First Zone)."); 
            isPrimalDrawRef.current = false;
         } else {
            setCalculatedArea(prev => prev + aSqFt);
            setAiReasoning("Manual calibration (Accumulating Multiple Zones).");
         }
         setIsPriceUnlocked(true);
      }
      else if (target === 'mulch') { setMulchSqFt(prev => prev + aSqFt); if (!selectedServices.includes('mulch')) setSelectedServices(prev => [...prev, 'mulch']); }
      else if (target === 'overseed') { setOverseedSqFt(prev => prev + aSqFt); if (!selectedServices.includes('overseeding')) setSelectedServices(prev => [...prev, 'overseeding']); }
      setIsManualAreaMode(false);
      setTraceHistory(prev => [...prev, { id: Date.now(), area: aSqFt, target, polygon: p }]);
      // NOTE: We DO NOT set isDrawingMode(false) here, allowing them to keep drawing multiple shapes.
    });

    window.startAiScan = async () => {
      if (isAiScanning) return; setIsAiScanning(true);
      const res = await autoMeasureLawn({ lat: location.lat(), lng: location.lng(), address: selectedPlace.formatted_address || selectedPlace.name });
      if (res?.success) { 
         setCalculatedArea(res.areaSqFt); 
         setAiOriginalArea(res.areaSqFt);
         setAiReasoning(res.reasoning); 
         setAiImage(res.base64Image); 
         isPrimalDrawRef.current = true;
      } else {
         alert("AI Scan Failed: " + (res?.error || "Unknown error occurred"));
      }
      setIsAiScanning(false);
    };

    // --- AUTO-PULSE TRIGGER ---
    setTimeout(() => { 
        if (!isAiScanning && calculatedArea === 0) {
            window.startAiScan();
        }
    }, 1500);
  };

  const startDrawing = (target) => {
     setDrawingTarget(target);
     setIsDrawingMode(true);
     let color = '#22C55E'; 
     if (target === 'mulch') color = '#D97706';
     if (target === 'overseed') color = '#10B981';
      if (drawingManagerRef.current) {
        if (target === 'lawn') handlePartialSubmit(); // Capture info before they start drawing
        drawingManagerRef.current.setOptions({ polygonOptions: { fillColor: color, strokeColor: color, fillOpacity: 0.5, strokeWeight: 4 } });
        drawingManagerRef.current.setDrawingMode('polygon');
     }
     if (mapRef.current && window.innerWidth < 1024) {
        mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
     }
  };

  const undoLastTrace = () => {
    if (traceHistory.length === 0) return;
    const lastTrace = traceHistory[traceHistory.length - 1];
    
    if (lastTrace.polygon) lastTrace.polygon.setMap(null);
    
    if (lastTrace.target === 'lawn') setCalculatedArea(prev => Math.max(0, prev - lastTrace.area));
    else if (lastTrace.target === 'mulch') setMulchSqFt(prev => Math.max(0, prev - lastTrace.area));
    else if (lastTrace.target === 'overseed') setOverseedSqFt(prev => Math.max(0, prev - lastTrace.area));
    
    setTraceHistory(prev => prev.slice(0, -1));
  };

  const addCustomJob = () => setCustomJobs([...customJobs, { id: Date.now(), details: '', price: 0 }]);
  const removeCustomJob = (id) => setCustomJobs(prev => prev.length > 1 ? prev.filter(j => j.id !== id) : [{ id: Date.now(), details: '', price: 0 }]);
  const updateCustomJob = (id, f, v) => setCustomJobs(prev => prev.map(j => j.id === id ? { ...j, [f]: v } : j));

  const downloadQuotePDF = () => {
    const doc = new jsPDF();
    const logoUrl = '/flora-logo-final.png';
    const finishPdf = (logoBase64 = null) => {
      const drawHeader = (d) => {
        if (logoBase64) d.addImage(logoBase64, 'PNG', 15, 10, 50, 20);
        else { d.setFont('helvetica', 'bold'); d.setFontSize(22); d.text('FLORALAWN', 15, 25); }
        d.setTextColor(150, 150, 150); d.setFontSize(8); d.setFont('helvetica', 'normal');
        d.text('FLORALAWN & LANDSCAPING INC.', 15, 34);
      };
      const drawFooter = (d) => {
        d.setTextColor(180, 180, 180); d.setFontSize(8); d.setFont('helvetica', 'normal');
        d.text('FloraLawn & Landscaping Inc. - Quote Document', 105, 285, { align: 'center' });
        d.text('Final price subject to onsite verification.', 105, 290, { align: 'center' });
      };
      drawHeader(doc);
      doc.text(`#${Math.floor(Math.random() * 9000) + 1000}`, 195, 30, { align: 'right' });
      doc.setTextColor(33, 33, 33); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
      doc.text('SERVICE QUOTE', 15, 55);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 62);
      doc.text(`Address: ${selectedPlace.name}`, 15, 67);
      doc.setDrawColor(240, 240, 240); doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, 75, 180, 15, 1, 1, 'FD');
      doc.setTextColor(60, 60, 60); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(`PROPERTY SIZE: ${currentArea.toLocaleString()} SQFT`, 20, 85);
      if (overseedSqFt > 0) doc.text(`[SPECIFIC MEASUREMENT: ${overseedSqFt.toLocaleString()} SQFT]`, 110, 85);

      doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.text('SERVICE DESCRIPTION', 15, 105);
      doc.text('TOTAL', 195, 105, { align: 'right' });
      doc.setDrawColor(200, 200, 200); doc.line(15, 108, 195, 108);

      let currentY = 118;
      selectedServices.forEach(sid => {
        if (currentY > 260) { doc.addPage(); currentY = 30; drawHeader(doc); }
        const s = services.find(sv => sv.id === sid);
        const p = getServicePrice(sid, currentArea);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(33, 33, 33); doc.setFontSize(10);
        doc.text(s.name, 15, currentY);
        doc.text(`$${p.toLocaleString()}`, 195, currentY, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120); doc.setFontSize(8);
        doc.text(s.description, 15, currentY + 5);
        doc.setDrawColor(245, 245, 245); doc.line(15, currentY + 9, 195, currentY + 9);
        currentY += 16;
      });
      customJobs.forEach(job => {
        if (job.details && job.price > 0) {
          const wrapped = doc.splitTextToSize(job.details, 140);
          if (currentY + (wrapped.length * 5) > 260) { doc.addPage(); currentY = 30; drawHeader(doc); }
          doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.5);
          doc.line(15, currentY - 2, 195, currentY - 2);
          doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 185, 129); doc.setFontSize(10);
          doc.text('CUSTOM JOB:', 15, currentY + 3);
          doc.text(`$${Number(job.price).toLocaleString()}`, 195, currentY + 3, { align: 'right' });
          doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30); doc.setFontSize(9);
          doc.text(wrapped, 45, currentY + 3);
          currentY += (wrapped.length * 5) + 12;
        }
      });
      if (currentY > 220) { doc.addPage(); currentY = 30; drawHeader(doc); }
      
      const totalY = currentY + 20;
      if (totalDiscount > 0) {
         doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100); doc.setFontSize(8);
         doc.text('SUBTOTAL:', 140, totalY - 10);
         doc.text(`$${quoteBeforeDiscount.toLocaleString()}`, 195, totalY - 10, { align: 'right' });
         doc.setTextColor(16, 185, 129);
         doc.text(`MULTI-SERVICE REWARD (${Math.round(discountRate * 100)}%):`, 140, totalY - 5);
         doc.text(`-$${totalDiscount.toLocaleString()}`, 195, totalY - 5, { align: 'right' });
      }

      doc.setDrawColor(33, 33, 33); doc.setFillColor(33, 33, 33);
      doc.roundedRect(135, totalY, 60, 20, 2, 2, 'FD');
      doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.text('TOTAL QUOTE', 145, totalY + 8);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(`$${totalQuote.toLocaleString()}`, 190, totalY + 14, { align: 'right' });
      drawFooter(doc);
      doc.save(`Floralawn_Standard_Quote_${selectedPlace.name.replace(/\s+/g, '_')}.pdf`);
    };
    const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = logoUrl;
    img.onload = () => {
       const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
       const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
       finishPdf(canvas.toDataURL('image/png'));
    };
    img.onerror = () => finishPdf();
  };
  const handlePartialSubmit = async () => {
    if (hasPartialSent || !leadForm.name || !leadForm.email) return;
    try {
      const dbPayload = {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        address: selectedPlace?.formatted_address || selectedPlace?.name || '',
        status: 'PARTIAL / ABANDONED',
        created_at: new Date().toISOString(),
        custom_details: '[AUTO-CAPTURED PARTIAL LEAD]'
      };
      await supabase.from('leads').insert([dbPayload]);
      setHasPartialSent(true);
      
      // Also send a quick notification to the API
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dbPayload,
          isPartial: true
        })
      }).catch(e => console.error("Email notification failed for partial lead", e));

    } catch (e) { console.error("Partial lead failed", e); }
  };

  const handleLeadSubmit = async () => {
    setIsSubmittingLead(true);
    setLeadStatus(null);
    try {
      // 1. Save to Supabase using the correct schema for 'leads'
      const dbPayload = {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        address: selectedPlace?.formatted_address || selectedPlace?.name || '',
        area: currentArea,
        price: totalQuote,
        breakdown: JSON.stringify(getFullBreakdown()),
        custom_details: (mapImageUrl ? `[LAWN_SNAPSHOT_URL]: ${mapImageUrl}\n\n` : '') + (leadForm.notes ? `[CUSTOMER_NOTES]: ${leadForm.notes}` : ''),
        status: 'NEW QUOTE',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('leads').insert([dbPayload]);
      if (error) throw error;
      
      // 2. Send email notification to owner via Resend API
      try {
        const emailPayload = {
          name: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email,
          address: selectedPlace?.formatted_address || selectedPlace?.name || '',
          sqft: currentArea,
          price: totalQuote,
          services: getFullBreakdown(),
          map_image_url: mapImageUrl || null,
          notes: leadForm.notes || null,
          notes: leadForm.notes || null
        };
        await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
      } catch (emailErr) {
        console.error("Non-fatal: Failed to send email notification", emailErr);
      }
      
      setLeadStatus({ type: 'success', message: 'Sent successfully! We will review and confirm.' });
      setLeadForm({ name: '', phone: '', email: '' });
      setTimeout(() => setLeadStatus(null), 5000);
    } catch (err) {
      console.error(err);
      setLeadStatus({ type: 'error', message: 'Failed to send lead.' });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="w-full">
      {selectedPlace && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-4 lg:gap-8 lg:min-h-[900px]">
          <AnimatePresence>
            {selectedPlace && !isAiScanning && (
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[500px] bg-white border border-slate-200 rounded-[2rem] lg:rounded-[3.5rem] p-5 lg:p-8 flex flex-col shadow-2xl lg:max-h-[900px] overflow-hidden text-left font-bold relative">
                <div className="mb-4 pb-4 border-b border-slate-100 flex flex-col gap-4 flex-shrink-0">
                  <div className="flex justify-between items-start font-bold">
                    <div className="max-w-[280px]">
                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 flex items-center gap-2"><CheckBadgeIcon className="w-4 h-4" /> Property Identified</p>
                      <h2 className={`text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-none ${hideAddress ? 'blur-md' : ''}`}>{selectedPlace.name}</h2>
                      <button onClick={() => setSelectedPlace(null)} className="text-[10px] font-black text-green-600 uppercase mt-2 hover:underline">Change Address</button>
                    </div>
                    {user?.email?.toLowerCase() === 'esckoofficial@gmail.com' && (
                      <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all text-slate-400 group"><Cog6ToothIcon className="w-5 h-5 group-hover:rotate-90 group-hover:text-slate-600 transition-all duration-500" /></button>
                    )}
                  </div>

                  <div className="block lg:hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mt-2 shadow-inner">
                     <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">Estimate Only — Review Required</p>
                     <p className="text-[10px] text-amber-700 font-bold mb-3">All quotes are sent for manual review. This helps you get a pricing idea, but final cost may vary slightly as we finalize accuracy.</p>
                     <button onClick={() => window.location.href = '/contact'} className="w-full bg-amber-500 text-white font-black uppercase text-[11px] py-2.5 rounded-xl shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
                        Open Main Contact Form
                     </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-center">
                    <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-1 opacity-60">Estimated Lot Scale</p>
                    <div className="flex items-baseline justify-center gap-2 font-bold"><p className="text-4xl lg:text-5xl font-black text-slate-900 italic tracking-tighter leading-none">{currentArea.toLocaleString()}</p><span className="text-sm lg:text-base font-black text-green-500 italic">SQFT</span></div>
                    <div className="flex gap-4 mt-4 font-bold">
                       <button onClick={() => window.startAiScan()} className="flex-1 py-3 bg-emerald-50 border border-emerald-100 text-emerald-600 font-black uppercase text-[8px] rounded-xl hover:bg-emerald-100 tracking-widest flex items-center justify-center gap-2 transition-all"><SparklesIcon className="w-3 h-3" /> API Re-Scan</button>
                       <button onClick={() => startDrawing('lawn')} className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 font-black uppercase text-[8px] rounded-xl hover:bg-slate-50 tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"><MapPinIcon className="w-3 h-3" /> Draw Calibration</button>
                    </div>
                  </div>
                </div>

                {!isPriceUnlocked ? (
                   <div className="flex-grow flex flex-col items-center justify-center text-center p-6 lg:p-8 bg-green-50/50 rounded-3xl border border-green-100 my-4">
                      <SparklesIcon className="w-12 h-12 text-green-500 mb-4 animate-pulse" />
                      <h3 className="text-xl lg:text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-tight mb-2">Unlock Your Exact Price</h3>
                      <p className="text-[10px] lg:text-xs text-slate-500 font-bold mb-6">To ensure 100% accuracy, please confirm your contact info and trace your lawn.</p>
                      
                      <div className="w-full space-y-3 mb-6">
                         <input 
                            type="text" 
                            placeholder="Your Name..." 
                            value={leadForm.name} 
                            onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-xs font-black uppercase tracking-widest focus:border-green-500 transition-all outline-none" 
                         />
                         <input 
                            type="email" 
                            placeholder="Email Address..." 
                            value={leadForm.email} 
                            onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-xs font-black uppercase tracking-widest focus:border-green-500 transition-all outline-none" 
                         />
                      </div>

                      <button 
                        onClick={() => startDrawing('lawn')} 
                        disabled={!leadForm.name || !leadForm.email}
                        className="w-full py-5 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:grayscale text-white font-black uppercase text-xs lg:text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
                      >
                         <MapPinIcon className="w-5 h-5" /> {leadForm.name ? `Start Drawing, ${leadForm.name.split(' ')[0]}!` : 'Start Drawing'}
                      </button>
                      <button onClick={() => { handlePartialSubmit(); setIsPriceUnlocked(true); }} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest underline decoration-slate-300 underline-offset-4">Skip & Use API Estimate</button>
                   </div>
                ) : (
                  <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar space-y-4 mb-6 relative">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-2 text-center shadow-sm">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5"><MapPinIcon className="w-3 h-3"/> Keep Drawing?</p>
                      <p className="text-[11px] text-green-700 font-bold leading-snug">
                        If you have more grass areas to cover, click the <span className="font-black text-slate-700">"Draw Calibration"</span> button above to keep adding to your total SQFT!
                      </p>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Quoting Details</p>
                       <button onClick={() => expandedServices.length === services.length ? setExpandedServices([]) : setExpandedServices(services.map(s => s.id))} className="text-[10px] font-black uppercase text-green-600 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full font-bold">{expandedServices.length === services.length ? <><ArrowsPointingInIcon className="w-3 h-3" /> Hide All</> : <><ArrowsPointingOutIcon className="w-3 h-3" /> See All Details</>}</button>
                    </div>
                    <div className="space-y-3 font-bold">
                      {services.map(s => {
                        const active = selectedServices.includes(s.id);
                        const expanded = expandedServices.includes(s.id);
                        return (
                          <div key={s.id} className={`w-full rounded-[2rem] border transition-all overflow-hidden ${active ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                             <button onClick={() => toggleService(s.id)} className="w-full p-5 flex justify-between items-center text-left">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all shadow-sm ${active ? 'bg-green-500 text-white' : 'bg-white text-slate-600'}`}>{s.icon}</div>
                                   <div className="max-w-[150px]">
                                      <div className="flex flex-col gap-0.5">
                                        <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${active ? 'text-green-700' : 'text-slate-700'}`}>{s.name}</p>
                                        {s.id === 'mowing' && calibratedData.isCalibrated && (
                                          <span className="text-[7px] bg-green-100 text-green-700 px-1 py-0.5 rounded uppercase max-w-fit font-black mb-1 mt-0.5">AI Calibrated Price</span>
                                        )}
                                      </div>
                                      <p className="text-[8px] text-slate-400 uppercase font-black opacity-80 truncate leading-none">{s.description}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <p className={`text-base font-black italic tracking-tighter ${active ? 'text-green-600' : 'text-slate-400'}`}>${getServicePrice(s.id, currentArea)}</p>
                                   <div onClick={(e) => toggleExpand(e, s.id)} className={`p-1.5 rounded-lg hover:bg-slate-200 ${expanded ? 'bg-slate-200 rotate-180' : ''}`}><ChevronDownIcon className="w-3 h-3 text-slate-500" /></div>
                                </div>
                             </button>
                             <AnimatePresence>
                               {expanded && (
                                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-6">
                                    {s.id === 'mowing' && (
                                       <>
                                       <div className="flex bg-slate-100 p-1 rounded-xl gap-2 border border-slate-200 font-bold">
                                          {['weekly', 'bi-weekly'].map(f => (
                                             <button key={f} onClick={() => setMowingFrequency(f)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${mowingFrequency === f ? 'bg-green-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
                                          ))}
                                       </div>
                                       <button 
                                          onClick={() => document.getElementById('lead-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_10px_20px_-10px_rgba(34,197,94,0.4)] hover:shadow-[0_15px_25px_-10px_rgba(34,197,94,0.5)] flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                          Send for Review <ArrowRightIcon className="w-4 h-4" />
                                        </button>
                                       </>
                                    )}
                                    {s.id === 'mulch' && (
                                       <div className="space-y-6 font-bold">
                                          <div className="flex justify-between items-center text-[10px] font-black text-amber-600 uppercase px-2 font-bold">
                                             <p>Mulch Bed Total</p>
                                             <div className="text-right">
                                                <p className="text-sm italic font-bold leading-none">{mulchSqFt.toLocaleString()} SQFT</p>
                                                {mulchSqFt > 0 && <p className="text-[10px] opacity-60 font-black">≈ {((mulchSqFt * (pricingConfig.mulchDepth/12))/27).toFixed(1)} YARDS</p>}
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                             <div className="flex bg-slate-100 p-1 rounded-xl gap-2 border border-slate-200">
                                                <input 
                                                   type="number" 
                                                   placeholder="Manual SQFT Override..." 
                                                   value={mulchSqFt || ''} 
                                                   onChange={(e) => setMulchSqFt(Number(e.target.value))}
                                                   className="w-full bg-transparent border-none focus:ring-0 text-slate-900 font-black p-3 text-xs placeholder-slate-400 uppercase tracking-widest"
                                                />
                                             </div>
                                             <div className="flex gap-2">
                                                {['Black', 'Brown', 'Red'].map(c => (
                                                   <button key={c} onClick={() => setMulchColor(c)} className={`flex-1 py-4 rounded-xl border text-[9px] font-black uppercase transition-all ${mulchColor === c ? 'bg-amber-500 border-amber-600 text-white shadow-xl' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}><span>{c}</span></button>
                                                ))}
                                             </div>
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); startDrawing('mulch'); }} className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase rounded-2xl text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all font-bold">
                                             {mulchSqFt > 0 ? <><PlusIcon className="w-4 h-4" /> Add Another Bed</> : <><MapPinIcon className="w-4 h-4" /> Precision Draw Beds</>}
                                          </button>
                                       </div>
                                    )}
                                    {s.id === 'overseeding' && (
                                       <div className="space-y-6 p-4 rounded-3xl bg-emerald-50 border border-emerald-100 font-bold">
                                          <div className="flex justify-between items-center mb-1"><p className="text-[10px] font-black text-emerald-600 uppercase">Isolated Seeding Total</p><p className="text-sm font-black text-emerald-700 italic">{(overseedSqFt || 0).toLocaleString()} SQFT</p></div>
                                          <div className="flex bg-white p-1 rounded-xl gap-2 border border-emerald-200 shadow-sm">
                                                <input 
                                                   type="number" 
                                                   placeholder="Manual SQFT..." 
                                                   value={overseedSqFt || ''} 
                                                   onChange={(e) => setOverseedSqFt(Number(e.target.value))}
                                                   className="w-full bg-transparent border-none focus:ring-0 text-slate-900 font-black p-3 text-xs placeholder-slate-400 uppercase tracking-widest"
                                                />
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); startDrawing('overseed'); }} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase rounded-2xl text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all font-bold">
                                             {overseedSqFt > 0 ? <><PlusIcon className="w-4 h-4" /> Add Seed Spot</> : <><SparklesIcon className="w-4 h-4" /> Focus Measure Spots</>}
                                          </button>
                                       </div>
                                    )}
                                    {(s.id === 'spring' || s.id === 'fall') && (
                                       <div className="space-y-6 font-bold">
                                          <div className="space-y-3">
                                             <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-2">Disposal Strategy</p>
                                             <div className="flex bg-slate-100 p-1 rounded-xl gap-2 border border-slate-200">
                                                {['woods', 'haul'].map(opt => (
                                                   <button key={opt} onClick={() => setDebrisDisposal(opt)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${debrisDisposal === opt ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{opt === 'woods' ? 'To The Woods' : 'Haul Away (Fee)'}</button>
                                                ))}
                                             </div>
                                          </div>
                                          <div className="space-y-3">
                                             <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-2">Debris Intensity</p>
                                             <div className="flex bg-slate-100 p-1 rounded-xl gap-2 border border-slate-200">
                                                {[1, 2, 3].map(v => (
                                                   <button key={v} onClick={() => s.id === 'spring' ? setSpringIntensity(v) : setFallIntensity(v)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${(s.id === 'spring' ? springIntensity : fallIntensity) === v ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{v === 1 ? 'Light' : v === 2 ? 'Medium' : 'Heavy'}</button>
                                                ))}
                                             </div>
                                          </div>
                                       </div>
                                    )}
                                    {s.id === 'shrub_pruning' && (
                                       <div className="space-y-6 font-bold">
                                          <p className="text-[9px] font-black text-green-600 uppercase tracking-widest px-2 leading-none mb-1">Plant Count by Size</p>
                                          {['small', 'medium', 'large'].map(size => (
                                             <div key={size} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                <p className="text-[11px] font-black uppercase text-slate-800">{size} Plants</p>
                                                <div className="flex items-center gap-6">
                                                   <button onClick={() => setShrubCounts({...shrubCounts, [size]: Math.max(0, shrubCounts[size] - 1)})} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 text-xl hover:bg-slate-100">-</button>
                                                   <span className="text-2xl font-black text-slate-900 italic min-w-[30px] text-center">{shrubCounts[size]}</span>
                                                   <button onClick={() => setShrubCounts({...shrubCounts, [size]: shrubCounts[size] + 1})} className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-xl hover:bg-green-400">+</button>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                    {s.id === 'custom_job' && (
                                       <div className="space-y-4 font-bold">
                                          <div className="flex justify-between items-center px-2 font-bold font-bold"><p className="text-[10px] font-black text-green-600 uppercase font-bold">Task List</p><button onClick={addCustomJob} className="text-[8px] font-black text-white uppercase bg-green-500 px-4 py-2 rounded-full shadow-lg hover:bg-green-400">+ Add Job</button></div>
                                          {customJobs.map((job) => (
                                             <div key={job.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-4">
                                                <div className="flex gap-4 font-bold">
                                                   <input placeholder="e.g. Power wash patio" value={job.details} onChange={(e) => updateCustomJob(job.id, 'details', e.target.value)} className="flex-grow bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-bold text-slate-900 placeholder-slate-400" />
                                                   <input placeholder="$0" type="number" value={job.price} onChange={(e) => updateCustomJob(job.id, 'price', e.target.value)} className="w-24 bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-black text-green-600 text-center" />
                                                   <button onClick={() => removeCustomJob(job.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-4 lg:pt-6 border-t border-slate-100 mt-6 font-bold pb-4">
                     <div className="flex justify-between items-end mb-4 px-2 lg:px-4 font-bold">
                        <div className="text-left font-bold">
                           <p id="lead-form-anchor" className="text-xs lg:text-sm font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-2 italic">Total Estimate</p>
                           {totalDiscount > 0 && (
                             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                               <span className="text-[9px] lg:text-[11px] font-black bg-green-100 text-green-700 px-2 py-0.5 lg:px-3 lg:py-1 rounded-lg uppercase tracking-wider inline-block">-{Math.round(discountRate * 100)}% REWARD</span>
                               <span className="text-xs lg:text-sm font-black text-slate-400 line-through opacity-60">${quoteBeforeDiscount.toLocaleString()}</span>
                             </motion.div>
                           )}
                        </div>
                        <p className="text-4xl lg:text-6xl font-black text-green-500 italic tracking-tighter leading-none">${totalQuote.toLocaleString()}</p>
                     </div>
                     
                     {mapImageUrl && (
                        <div className="mb-4 mt-2 px-2 lg:px-4">
                           <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Map Snapshot Attached</p>
                           <div className="w-full h-32 lg:h-40 rounded-xl border-2 border-slate-100 shadow-sm overflow-hidden relative">
                              <img src={mapImageUrl} alt="Lawn tracing map" className="w-full h-full object-cover" />
                           </div>
                        </div>
                     )}
                     
                     {leadStatus ? (
                       <div className={`p-4 rounded-xl text-center font-black uppercase text-sm border ${leadStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {leadStatus.message}
                       </div>
                     ) : (
                       <div className="space-y-3 mt-4">
                          <input placeholder="Full Name" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                          <div className="flex gap-3">
                             <input placeholder="Phone" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                             <input placeholder="Email Address" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" />
                          </div>
                          <div className="flex gap-3 lg:gap-4 font-bold pt-2">
                             <button onClick={downloadQuotePDF} className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center transition-all shadow-sm group"><ArrowDownTrayIcon className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-y-1 transition-transform" /></button>
                             <button onClick={handleLeadSubmit} disabled={isSubmittingLead || !leadForm.name || !leadForm.phone || !leadForm.email} className="flex-grow h-14 lg:h-16 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase rounded-xl shadow-xl flex justify-center items-center gap-2 transition-all active:scale-95 text-xs lg:text-sm">
                               {isSubmittingLead ? 'Sending...' : 'Send for Review'} <ArrowRightIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                             </button>
                          </div>
                       </div>
                     )}
                  </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`${isDrawingMode ? 'fixed inset-0 z-[200] rounded-0' : 'order-first lg:order-none min-h-[400px] lg:min-h-0 flex-grow relative rounded-[2rem] lg:rounded-[4rem]'} overflow-hidden shadow-6xl border-4 lg:border-8 border-white bg-slate-950 flex flex-col transition-all duration-500`}>
             <div ref={mapRef} className="w-full h-full min-h-[400px] lg:min-h-full" />
             <AnimatePresence>
                {isDrawingMode && (
                  <div className="absolute top-2 inset-x-0 flex justify-center z-[9999] pointer-events-none p-4">
                    <motion.div 
                      initial={{ opacity: 0, y: -40 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="pointer-events-auto bg-slate-950 border-4 border-white px-4 lg:px-8 py-3 lg:py-5 rounded-2xl lg:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row items-center gap-3 lg:gap-8 font-bold w-full lg:w-auto"
                    >
                        <div className="flex items-center gap-4 lg:gap-6">
                          <div className={`shrink-0 w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center animate-pulse ${drawingTarget === 'overseed' ? 'bg-emerald-500' : drawingTarget === 'mulch' ? 'bg-amber-500' : 'bg-green-500'}`}><SparklesIcon className="w-4 h-4 lg:w-6 lg:h-6 text-black" /></div>
                          <div className="text-left">
                            <p className="text-base lg:text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">MEASURING {drawingTarget.toUpperCase()}</p>
                            <p className="text-[7px] lg:text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">Tap each corner of your lawn to trace</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-auto w-full lg:w-auto justify-end">
                          {traceHistory.length > 0 && (
                             <button onClick={undoLastTrace} className="flex-1 lg:flex-none px-3 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] lg:text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10"><ArrowUturnLeftIcon className="w-3 h-3" /> Undo</button>
                          )}
                          <button onClick={() => { setIsDrawingMode(false); drawingManagerRef.current.setDrawingMode(null); }} className="flex-grow lg:flex-none px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black uppercase text-xs lg:text-sm shadow-xl transition-all active:scale-95">Save & Finish</button>
                        </div>
                    </motion.div>
                  </div>
                )}
             </AnimatePresence>

             <AnimatePresence>{isAiScanning && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-3xl flex flex-col items-center justify-center text-center"><SparklesIcon className="w-40 h-40 text-green-500 animate-pulse mb-10" /><h3 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight font-bold">Analyzing Property<br/>AI Measurement Engine</h3></motion.div>}</AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* PRO PRICING MASTER DASHBOARD - MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-[1200px] bg-slate-900 border border-white/10 rounded-[4rem] shadow-6xl overflow-hidden flex flex-col max-h-[95vh] border-b-8 border-b-green-500/50">
                <div className="p-10 border-b border-white/10 flex justify-between items-center bg-slate-800/40 font-bold">
                   <div className="flex items-center gap-12">
                      <div><h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">MASTER WORKSPACE</h3><p className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-none">Business Intelligence v2.0</p></div>
                      
                      <div className="flex bg-slate-950/50 p-2 rounded-2xl gap-2 border border-white/5">
                         <button onClick={() => setActiveTab('pricing')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pricing' ? 'bg-green-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Pricing Logic</button>
                         <button onClick={() => { setActiveTab('leads'); fetchLeads(); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'leads' ? 'bg-green-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
                            Lead Hub
                            {leads.length > 0 && <span className="bg-white/10 px-2 py-0.5 rounded-full text-[8px]">{leads.length}</span>}
                         </button>
                      </div>
                   </div>
                   <button onClick={() => setShowSettings(false)} className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white"><XMarkIcon className="w-8 h-8" /></button>
                </div>

                {activeTab === 'pricing' ? (
                  <div className="p-12 overflow-y-auto custom-scrollbar bg-slate-950/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left font-bold">
                     <div className="space-y-8">
                        <p className="text-[11px] font-black text-green-500 uppercase tracking-[0.2em] border-l-4 border-green-500 pl-4 py-1">Lawn & Mowing</p>
                        <div className="space-y-5">
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Base House ($)</label><input type="number" value={pricingConfig.mowingBase} onChange={(e) => savePricing({...pricingConfig, mowingBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white focus:border-green-500 transition-all" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Base SQFT Limit</label><input type="number" value={pricingConfig.mowingBaseLimit} onChange={(e) => savePricing({...pricingConfig, mowingBaseLimit: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Price Per +1k SQFT</label><input type="number" value={pricingConfig.mowingPer1k} onChange={(e) => savePricing({...pricingConfig, mowingPer1k: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Bi-Weekly Surcharge (ex: 1.3)</label><input type="number" step="0.1" value={pricingConfig.mowingBiWeeklySurcharge} onChange={(e) => savePricing({...pricingConfig, mowingBiWeeklySurcharge: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] border-l-4 border-amber-500 pl-4 py-1">Materials Master</p>
                        <div className="space-y-5">
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Mulch Price / YD ($)</label><input type="number" value={pricingConfig.mulchPrices.Black} onChange={(e) => savePricing({...pricingConfig, mulchPrices: { ...pricingConfig.mulchPrices, Black: Number(e.target.value), Brown: Number(e.target.value), Red: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Edging / FT ($)</label><input type="number" step="0.1" value={pricingConfig.mulchEdgingPrice} onChange={(e) => savePricing({...pricingConfig, mulchEdgingPrice: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Mulch Depth (Inches)</label><input type="number" value={pricingConfig.mulchDepth} onChange={(e) => savePricing({...pricingConfig, mulchDepth: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Tree Trim (Flat Rate)</label><input type="number" value={pricingConfig.treeTrimPrice} onChange={(e) => savePricing({...pricingConfig, treeTrimPrice: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] border-l-4 border-orange-500 pl-4 py-1">Seasonal Bases</p>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Spring Base ($)</label><input type="number" value={pricingConfig.springBase} onChange={(e) => savePricing({...pricingConfig, springBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-lg font-black text-white" /></div>
                              <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Fall Base ($)</label><input type="number" value={pricingConfig.fallBase} onChange={(e) => savePricing({...pricingConfig, fallBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-lg font-black text-white" /></div>
                           </div>
                           
                           <div className="border-t border-white/5 pt-4">
                              <p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-3 italic">Spring Scale Multipliers</p>
                              <div className="grid grid-cols-2 gap-3">
                                 <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Med (5k-10k) [x]</label><input type="number" step="0.1" value={pricingConfig.springFactors.md} onChange={(e) => savePricing({...pricingConfig, springFactors: { ...pricingConfig.springFactors, md: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                                 <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Lrg (10k+) [x]</label><input type="number" step="0.1" value={pricingConfig.springFactors.lg} onChange={(e) => savePricing({...pricingConfig, springFactors: { ...pricingConfig.springFactors, lg: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                              </div>
                           </div>

                           <div className="border-t border-white/5 pt-4">
                              <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-3 italic">Fall Scale Multipliers</p>
                              <div className="grid grid-cols-2 gap-3">
                                 <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Med (5k-10k) [x]</label><input type="number" step="0.1" value={pricingConfig.fallFactors.md} onChange={(e) => savePricing({...pricingConfig, fallFactors: { ...pricingConfig.fallFactors, md: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                                 <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Lrg (10k+) [x]</label><input type="number" step="0.1" value={pricingConfig.fallFactors.lg} onChange={(e) => savePricing({...pricingConfig, fallFactors: { ...pricingConfig.fallFactors, lg: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                              </div>
                           </div>

                           <div className="border-t border-white/5 pt-4">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Fall Intensity Scaling</p>
                              <div className="grid grid-cols-2 gap-3">
                                 <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Medium (x)</label><input type="number" step="0.1" value={pricingConfig.fallIntensityMedium} onChange={(e) => savePricing({...pricingConfig, fallIntensityMedium: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                                 <div><label className="text-[8px] font-black text-slate-500 uppercase mb-1 block">Heavy (x)</label><input type="number" step="0.1" value={pricingConfig.fallIntensityHeavy} onChange={(e) => savePricing({...pricingConfig, fallIntensityHeavy: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-4 py-1">Advanced Care</p>
                        <div className="space-y-5">
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Aeration Base ($)</label><input type="number" value={pricingConfig.aerationBase} onChange={(e) => savePricing({...pricingConfig, aerationBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Aeration Price / 1k ($)</label><input type="number" step="0.01" value={pricingConfig.aerationPer1k || 35.36} onChange={(e) => savePricing({...pricingConfig, aerationPer1k: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Dethatch Base ($)</label><input type="number" value={pricingConfig.dethatchBase} onChange={(e) => savePricing({...pricingConfig, dethatchBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Seed Price / 1k ($)</label><input type="number" value={pricingConfig.overseedSeedPer1k} onChange={(e) => savePricing({...pricingConfig, overseedSeedPer1k: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Snow Base ($)</label><input type="number" value={pricingConfig.snowBase} onChange={(e) => savePricing({...pricingConfig, snowBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] border-l-4 border-blue-500 pl-4 py-1">Operations</p>
                        <div className="space-y-5">
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Fertilizer Base ($)</label><input type="number" value={pricingConfig.fertBase} onChange={(e) => savePricing({...pricingConfig, fertBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Gutter Base ($)</label><input type="number" value={pricingConfig.gutterBase} onChange={(e) => savePricing({...pricingConfig, gutterBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[10px] font-black text-green-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">Shrub Size Rates</label>
                              <div className="grid grid-cols-3 gap-2">
                                 <div><label className="text-[8px] uppercase text-slate-600 block mb-1">Small</label><input type="number" value={pricingConfig.shrubPrices.small} onChange={(e) => savePricing({...pricingConfig, shrubPrices: {...pricingConfig.shrubPrices, small: Number(e.target.value)}})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                                 <div><label className="text-[8px] uppercase text-slate-600 block mb-1">Medium</label><input type="number" value={pricingConfig.shrubPrices.medium} onChange={(e) => savePricing({...pricingConfig, shrubPrices: {...pricingConfig.shrubPrices, medium: Number(e.target.value)}})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                                 <div><label className="text-[8px] uppercase text-slate-600 block mb-1">Large</label><input type="number" value={pricingConfig.shrubPrices.large} onChange={(e) => savePricing({...pricingConfig, shrubPrices: {...pricingConfig.shrubPrices, large: Number(e.target.value)}})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-black text-white" /></div>
                              </div>
                           </div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Disposal Fee (Haul)</label><input type="number" value={pricingConfig.disposalHaulFee} onChange={(e) => savePricing({...pricingConfig, disposalHaulFee: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="p-12 overflow-y-auto custom-scrollbar bg-slate-950/40 space-y-6">
                     {leads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 text-center opacity-40">
                           <MagnifyingGlassIcon className="w-20 h-20 mb-6" />
                           <p className="text-xl font-black uppercase tracking-widest">No Property Leads Recovered Yet</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                           {leads.map(lead => (
                              <div key={lead.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col hover:border-green-500/30 transition-all group">
                                 <div className="flex justify-between items-start mb-6">
                                    <div className="text-left font-bold">
                                       <div className="flex items-center gap-3 mb-2">
                                          <span className="text-[9px] font-black bg-green-500/20 text-green-400 px-3 py-1 rounded-full uppercase tracking-wider">{lead.status}</span>
                                          <span className="text-[9px] font-black text-slate-500 uppercase"><ClockIcon className="w-3 h-3 inline mr-1" /> {new Date(lead.created_at).toLocaleDateString()}</span>
                                       </div>
                                       <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">{lead.name}</h4>
                                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[300px]">{lead.address}</p>
                                    </div>
                                    <div className="flex gap-2 font-bold">
                                       <button onClick={() => deleteLead(lead.id)} className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all"><TrashIcon className="w-5 h-5" /></button>
                                       <a href={`mailto:${lead.email}`} className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all flex items-center gap-3 px-6 text-[10px] font-black uppercase tracking-widest">Reply & Close</a>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 font-bold">
                                    <div className="text-left font-bold">
                                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Mowable Area</p>
                                       <p className="text-xl font-black text-white italic tracking-tighter">{lead.area.toLocaleString()} <span className="text-[10px] text-green-500">SQFT</span></p>
                                    </div>
                                    <div className="text-left font-bold font-bold">
                                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Price Quoted</p>
                                       <p className="text-xl font-black text-green-500 italic tracking-tighter">${lead.price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-left font-bold">
                                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Reward</p>
                                       <p className="text-xl font-black px-2 text-amber-500 italic tracking-tighter">-${lead.discount.toLocaleString()}</p>
                                    </div>
                                 </div>
                                 {lead.custom_details && (
                                    <div className="mt-6 p-5 bg-white/5 rounded-2xl border border-white/5 text-left italic text-xs text-slate-400 font-bold">
                                       "{lead.custom_details}"
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                )}

                <div className="p-12 border-t border-white/10 bg-slate-800/40 flex justify-between items-center text-left font-bold">
                   <div className="max-w-md">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed flex items-center gap-2">
                         {isSyncing ? (
                           <span className="flex items-center gap-2 text-amber-500 animate-pulse">
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                              SYNCING TO CLOUD...
                           </span>
                         ) : user?.email?.toLowerCase() === 'esckoofficial@gmail.com' ? (
                           <span className="flex items-center gap-2 text-green-500">
                              <CheckBadgeIcon className="w-4 h-4" />
                              CLOUD SECURED
                           </span>
                         ) : (
                           <span className="flex items-center gap-2 text-slate-500 italic">
                              READ-ONLY (Admin Verification Required for Cloud Sync)
                           </span>
                         )}
                      </p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mt-1">Variable Persistence Enabled. AI Quote Engine processing with localized business logic.</p>
                   </div>
                   
                   {user?.email?.toLowerCase() === 'esckoofficial@gmail.com' ? (
                      <button onClick={() => setShowSettings(false)} className="px-20 py-8 bg-green-500 text-black font-black uppercase text-base rounded-3xl hover:bg-green-400 transition-all shadow-6xl active:scale-95">Secure Global Engine</button>
                   ) : (
                      <button onClick={signInAdmin} className="px-10 py-8 bg-white/5 border border-white/10 text-white font-black uppercase text-xs rounded-3xl hover:bg-white/10 transition-all flex items-center gap-4 group">
                         <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-all"><SparklesIcon className="w-4 h-4" /></div>
                         Verify Admin Identity
                      </button>
                   )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
