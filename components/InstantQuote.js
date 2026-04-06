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
  ArrowDownTrayIcon
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
    dethatchBase: 200,
    overseedBase: 125,
    overseedSeedPer1k: 45,
    overseedLaborPer1k: 35,
    springFactors: { md: 1.8, lg: 2.6 },
    fallFactors: { md: 1.83, lg: 2.83 },
    disposalHaulFee: 125,
    treeTrimPrice: 75,
    snowBase: 75,
    fertBase: 95,
    fertPer1k: 12,
    shrubBase: 75,
    shrubPrices: { small: 25, medium: 45, large: 75 },
    gutterBase: 150
  };

  const [pricingConfig, setPricingConfig] = useState(defaultPricing);

  useEffect(() => {
    const fetchConfig = async () => {
      // Get initial user
      const { data: { user: su } } = await supabase.auth.getUser();
      setUser(su);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      const { data } = await supabase.from('pricing_config').select('config').eq('id', 'default').single();
      if (data?.config) {
        const mergedConfig = { ...defaultPricing, ...data.config };
        setPricingConfig(mergedConfig);
        localStorage.setItem('floralawn_pricing', JSON.stringify(mergedConfig));
      } else {
        const saved = localStorage.getItem('floralawn_pricing');
        if (saved) {
          try { 
            const localMerged = { ...defaultPricing, ...JSON.parse(saved) };
            setPricingConfig(localMerged); 
          } catch (e) { console.error("Load failed"); }
        }
      }

      return () => subscription.unsubscribe();
    };
    fetchConfig();
  }, []);

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
    await supabase.from('pricing_config').upsert({ id: 'default', config: newConfig });
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
    if (id === 'fall') intensityMult = fallIntensity === 1 ? 1 : fallIntensity === 2 ? 1.5 : 2.2;

    const { mowingBase, mowingBaseLimit, mowingPer1k, mowingBiWeeklySurcharge, springBase, fallBase, springFactors, fallFactors, aerationBase, dethatchBase, overseedBase, overseedSeedPer1k, overseedLaborPer1k, disposalHaulFee, treeTrimPrice } = pricingConfig;

    if (id === 'mowing') {
       const mult = mowingFrequency === 'bi-weekly' ? (mowingBiWeeklySurcharge || 1.3) : 1;
       let bp = area <= mowingBaseLimit ? mowingBase : (mowingBase + (Math.ceil(Math.max(0, area - mowingBaseLimit) / 1000) * mowingPer1k));
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
    if (id === 'spring') return Math.round(springBase * (area < 5000 ? 1 : area < 10000 ? springFactors.md : springFactors.lg) * intensityMult) + (debrisDisposal === 'haul' ? (disposalHaulFee || 125) : 0);
    if (id === 'fall') return Math.round(fallBase * (area < 5000 ? 1 : area < 10000 ? fallFactors.md : fallFactors.lg) * intensityMult) + (!fallCleanedLastYear ? 150 : 0) + (debrisDisposal === 'haul' ? (disposalHaulFee || 125) : 0);
    if (id === 'aeration') return Math.round(aerationBase * (area < 5000 ? 1 : area < 10000 ? 1.66 : 2.66));
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
      if (target === 'lawn') { setCalculatedArea(aSqFt); setAiReasoning("Manual calibration."); }
      else if (target === 'mulch') { setMulchSqFt(prev => prev + aSqFt); if (!selectedServices.includes('mulch')) setSelectedServices(prev => [...prev, 'mulch']); }
      else if (target === 'overseed') { setOverseedSqFt(prev => prev + aSqFt); if (!selectedServices.includes('overseeding')) setSelectedServices(prev => [...prev, 'overseeding']); }
      setIsManualAreaMode(false); setIsDrawingMode(false); dm.setDrawingMode(null);
    });

    window.startAiScan = async () => {
      if (isAiScanning) return; setIsAiScanning(true);
      const res = await autoMeasureLawn({ lat: location.lat(), lng: location.lng(), address: selectedPlace.formatted_address || selectedPlace.name });
      if (res?.success) { setCalculatedArea(res.areaSqFt); setAiReasoning(res.reasoning); setAiImage(res.base64Image); }
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
        drawingManagerRef.current.setOptions({ polygonOptions: { fillColor: color, strokeColor: color, fillOpacity: 0.5, strokeWeight: 4 } });
        drawingManagerRef.current.setDrawingMode('polygon');
     }
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

  return (
    <div className="w-full">
      {selectedPlace && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-4 lg:gap-8 lg:min-h-[900px]">
          <AnimatePresence>
            {selectedPlace && !isAiScanning && (
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[500px] bg-slate-900 border border-white/10 rounded-[2rem] lg:rounded-[3.5rem] p-5 lg:p-8 flex flex-col shadow-6xl lg:max-h-[900px] overflow-hidden text-left font-bold">
                <div className="mb-4 pb-4 border-b border-white/10 flex flex-col gap-4 flex-shrink-0">
                  <div className="flex justify-between items-start font-bold">
                    <div className="max-w-[280px]">
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1 flex items-center gap-2"><CheckBadgeIcon className="w-4 h-4" /> Property Identified</p>
                      <h2 className={`text-xl font-black text-white italic uppercase tracking-tighter leading-none ${hideAddress ? 'blur-md' : ''}`}>{selectedPlace.name}</h2>
                      <button onClick={() => setSelectedPlace(null)} className="text-[10px] font-black text-green-500 uppercase mt-2 hover:underline">Change Address</button>
                    </div>
                    {user?.email?.toLowerCase() === 'esckoofficial@gmail.com' && (
                      <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all text-slate-500 group"><Cog6ToothIcon className="w-5 h-5 group-hover:rotate-90 group-hover:text-white transition-all duration-500" /></button>
                    )}
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-center">
                    <p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1 opacity-60">Property Scale</p>
                    <div className="flex items-baseline justify-center gap-2 font-bold"><p className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter leading-none">{currentArea.toLocaleString()}</p><span className="text-sm lg:text-base font-black text-green-500 italic">SQFT</span></div>
                    <div className="flex gap-4 mt-4 font-bold">
                       <button onClick={() => window.startAiScan()} className="flex-1 py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black uppercase text-[8px] rounded-xl hover:bg-emerald-600/40 tracking-widest flex items-center justify-center gap-2 transition-all"><SparklesIcon className="w-3 h-3" /> AI Re-Scan</button>
                       <button onClick={() => startDrawing('lawn')} className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-400 font-black uppercase text-[8px] rounded-xl hover:bg-white/10 tracking-widest flex items-center justify-center gap-2 transition-all"><MapPinIcon className="w-3 h-3" /> Calibration</button>
                    </div>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar space-y-4 mb-6 relative">
                  <div className="flex justify-between items-center px-4 py-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Quoting Details</p>
                     <button onClick={() => expandedServices.length === services.length ? setExpandedServices([]) : setExpandedServices(services.map(s => s.id))} className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full font-bold">{expandedServices.length === services.length ? <><ArrowsPointingInIcon className="w-3 h-3" /> Hide All</> : <><ArrowsPointingOutIcon className="w-3 h-3" /> See All Details</>}</button>
                  </div>
                  <div className="space-y-3 font-bold">
                    {services.map(s => {
                      const active = selectedServices.includes(s.id);
                      const expanded = expandedServices.includes(s.id);
                      return (
                        <div key={s.id} className={`w-full rounded-[2rem] border transition-all overflow-hidden ${active ? 'bg-green-600/10 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
                           <button onClick={() => toggleService(s.id)} className="w-full p-5 flex justify-between items-center text-left">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-800 transition-all ${active ? 'bg-green-600 shadow-lg' : ''}`}>{s.icon}</div>
                                 <div className="max-w-[150px]">
                                    <p className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-green-400' : 'text-white'}`}>{s.name}</p>
                                    <p className="text-[8px] text-slate-500 uppercase font-black opacity-60 truncate">{s.description}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <p className={`text-base font-black italic tracking-tighter ${active ? 'text-green-400' : 'text-slate-400'}`}>${getServicePrice(s.id, currentArea)}</p>
                                 <div onClick={(e) => toggleExpand(e, s.id)} className={`p-1.5 rounded-lg hover:bg-white/10 ${expanded ? 'bg-white/10 rotate-180' : ''}`}><ChevronDownIcon className="w-3 h-3 text-slate-500" /></div>
                              </div>
                           </button>
                           <AnimatePresence>
                              {expanded && (
                                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 pt-2 border-t border-white/5 space-y-6">
                                    {s.id === 'mowing' && (
                                       <div className="flex bg-slate-950/50 p-1 rounded-xl gap-2 border border-white/5 font-bold">
                                          {['weekly', 'bi-weekly'].map(f => (
                                             <button key={f} onClick={() => setMowingFrequency(f)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${mowingFrequency === f ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{f}</button>
                                          ))}
                                       </div>
                                    )}
                                    {s.id === 'mulch' && (
                                       <div className="space-y-6 font-bold">
                                          <div className="flex justify-between items-center text-[10px] font-black text-amber-500 uppercase px-2 font-bold">
                                             <p>Mulch Bed Total</p>
                                             <div className="text-right">
                                                <p className="text-sm italic font-bold leading-none">{mulchSqFt.toLocaleString()} SQFT</p>
                                                {mulchSqFt > 0 && <p className="text-[10px] opacity-60 font-black">≈ {((mulchSqFt * (pricingConfig.mulchDepth/12))/27).toFixed(1)} YARDS</p>}
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                             <div className="flex bg-slate-950/50 p-1 rounded-xl gap-2 border border-white/5">
                                                <input 
                                                   type="number" 
                                                   placeholder="Manual SQFT Override..." 
                                                   value={mulchSqFt || ''} 
                                                   onChange={(e) => setMulchSqFt(Number(e.target.value))}
                                                   className="w-full bg-transparent border-none focus:ring-0 text-white font-black p-3 text-xs placeholder-slate-600 uppercase tracking-widest"
                                                />
                                             </div>
                                             <div className="flex gap-2">
                                                {['Black', 'Brown', 'Red'].map(c => (
                                                   <button key={c} onClick={() => setMulchColor(c)} className={`flex-1 py-4 rounded-xl border text-[9px] font-black uppercase transition-all ${mulchColor === c ? 'bg-amber-600 border-amber-500 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-400'}`}><span>{c}</span></button>
                                                ))}
                                             </div>
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); startDrawing('mulch'); }} className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase rounded-2xl text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all font-bold">
                                             {mulchSqFt > 0 ? <><PlusIcon className="w-4 h-4" /> Add Another Bed</> : <><MapPinIcon className="w-4 h-4" /> Precision Draw Beds</>}
                                          </button>
                                       </div>
                                    )}
                                    {s.id === 'overseeding' && (
                                       <div className="space-y-6 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 font-bold">
                                          <div className="flex justify-between items-center mb-1"><p className="text-[10px] font-black text-emerald-400 uppercase">Isolated Seeding Total</p><p className="text-sm font-black text-emerald-300 italic">{(overseedSqFt || 0).toLocaleString()} SQFT</p></div>
                                          <div className="flex bg-slate-950/50 p-1 rounded-xl gap-2 border border-white/5">
                                                <input 
                                                   type="number" 
                                                   placeholder="Manual SQFT..." 
                                                   value={overseedSqFt || ''} 
                                                   onChange={(e) => setOverseedSqFt(Number(e.target.value))}
                                                   className="w-full bg-transparent border-none focus:ring-0 text-white font-black p-3 text-xs placeholder-slate-600 uppercase tracking-widest"
                                                />
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); startDrawing('overseed'); }} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-2xl text-[10px] shadow-xl flex items-center justify-center gap-3 transition-all font-bold">
                                             {overseedSqFt > 0 ? <><PlusIcon className="w-4 h-4" /> Add Seed Spot</> : <><SparklesIcon className="w-4 h-4" /> Focus Measure Spots</>}
                                          </button>
                                       </div>
                                    )}
                                    {(s.id === 'spring' || s.id === 'fall') && (
                                       <div className="space-y-6 font-bold">
                                          <div className="space-y-3">
                                             <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest px-2">Disposal Strategy</p>
                                             <div className="flex bg-slate-950/50 p-1 rounded-xl gap-2 border border-white/5">
                                                {['woods', 'haul'].map(opt => (
                                                   <button key={opt} onClick={() => setDebrisDisposal(opt)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${debrisDisposal === opt ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{opt === 'woods' ? 'To The Woods' : 'Haul Away (Fee)'}</button>
                                                ))}
                                             </div>
                                          </div>
                                          <div className="space-y-3">
                                             <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest px-2">Debris Intensity</p>
                                             <div className="flex bg-slate-950/50 p-1 rounded-xl gap-2 border border-white/5">
                                                {[1, 2, 3].map(v => (
                                                   <button key={v} onClick={() => s.id === 'spring' ? setSpringIntensity(v) : setFallIntensity(v)} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${(s.id === 'spring' ? springIntensity : fallIntensity) === v ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{v === 1 ? 'Light' : v === 2 ? 'Medium' : 'Heavy'}</button>
                                                ))}
                                             </div>
                                          </div>
                                       </div>
                                    )}
                                    {s.id === 'shrub_pruning' && (
                                       <div className="space-y-6 font-bold">
                                          <p className="text-[9px] font-black text-green-400 uppercase tracking-widest px-2 leading-none mb-1">Plant Count by Size</p>
                                          {['small', 'medium', 'large'].map(size => (
                                             <div key={size} className="flex justify-between items-center bg-slate-950/50 p-5 rounded-2xl border border-white/5">
                                                <p className="text-[11px] font-black uppercase text-white">{size} Plants</p>
                                                <div className="flex items-center gap-6">
                                                   <button onClick={() => setShrubCounts({...shrubCounts, [size]: Math.max(0, shrubCounts[size] - 1)})} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white text-xl">-</button>
                                                   <span className="text-2xl font-black text-white italic min-w-[30px] text-center">{shrubCounts[size]}</span>
                                                   <button onClick={() => setShrubCounts({...shrubCounts, [size]: shrubCounts[size] + 1})} className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center text-white text-xl">+</button>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                    {s.id === 'custom_job' && (
                                       <div className="space-y-4 font-bold">
                                          <div className="flex justify-between items-center px-2 font-bold font-bold"><p className="text-[10px] font-black text-green-500 uppercase font-bold">Task List</p><button onClick={addCustomJob} className="text-[8px] font-black text-white uppercase bg-green-600 px-4 py-2 rounded-full shadow-lg">+ Add Job</button></div>
                                          {customJobs.map((job) => (
                                             <div key={job.id} className="bg-slate-950/50 p-4 rounded-3xl border border-white/5 space-y-4">
                                                <div className="flex gap-4 font-bold">
                                                   <input placeholder="e.g. Power wash patio" value={job.details} onChange={(e) => updateCustomJob(job.id, 'details', e.target.value)} className="flex-grow bg-slate-900 border border-white/5 rounded-xl p-3 text-[11px] font-bold text-white placeholder-slate-600" />
                                                   <input placeholder="$0" type="number" value={job.price} onChange={(e) => updateCustomJob(job.id, 'price', e.target.value)} className="w-24 bg-slate-900 border border-white/5 rounded-xl p-3 text-[11px] font-black text-green-400 text-center" />
                                                   <button onClick={() => removeCustomJob(job.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><TrashIcon className="w-4 h-4" /></button>
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
                </div>

                <div className="pt-4 lg:pt-6 border-t border-white/10 flex-shrink-0 font-bold">
                   <div className="flex justify-between items-end mb-4 lg:mb-6 px-2 lg:px-4 font-bold">
                      <div className="text-left font-bold">
                         <p className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-[0.1em] leading-none mb-2 italic">Total Estimate</p>
                         {totalDiscount > 0 && (
                           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                             <span className="text-[9px] lg:text-[11px] font-black bg-green-500 text-black px-2 py-0.5 lg:px-3 lg:py-1 rounded-lg uppercase tracking-wider inline-block">-{Math.round(discountRate * 100)}% REWARD</span>
                             <span className="text-xs lg:text-sm font-black text-slate-500 line-through opacity-60">${quoteBeforeDiscount.toLocaleString()}</span>
                           </motion.div>
                         )}
                      </div>
                      <p className="text-4xl lg:text-7xl font-black text-green-500 italic tracking-tighter leading-none">${totalQuote.toLocaleString()}</p>
                   </div>
                   <div className="flex gap-3 lg:gap-4 font-bold">
                      <button onClick={downloadQuotePDF} className="shrink-0 w-14 h-14 lg:w-20 lg:h-20 bg-white/5 hover:bg-white/10 text-white rounded-2xl lg:rounded-[2rem] flex items-center justify-center transition-all shadow-xl group"><ArrowDownTrayIcon className="w-5 h-5 lg:w-8 lg:h-8 group-hover:translate-y-1 transition-transform" /></button>
                      <button onClick={() => {
                        const payload = { 
                          area: currentArea, 
                          price: totalQuote, 
                          breakdown: getFullBreakdown(),
                          address: selectedPlace.name 
                        };
                        onQuoteComplete(payload);
                      }} className="flex-grow h-14 lg:h-20 bg-green-500 hover:bg-green-400 text-black font-black uppercase rounded-2xl lg:rounded-[2rem] shadow-4xl flex justify-center items-center gap-2 lg:gap-4 transition-all active:scale-95 text-xs lg:text-base">Confirm Rate <ArrowRightIcon className="w-4 h-4 lg:w-6 lg:h-6" /></button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="order-first lg:order-none min-h-[400px] lg:min-h-0 flex-grow relative rounded-[2rem] lg:rounded-[4rem] overflow-hidden shadow-6xl border-4 lg:border-8 border-white bg-slate-950 flex flex-col">
             <div ref={mapRef} className="w-full h-full min-h-[400px] lg:min-h-full" />
             <AnimatePresence>
                {isDrawingMode && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-4 lg:top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border-4 border-white px-4 lg:px-10 py-4 lg:py-6 rounded-[2rem] shadow-6xl flex items-center gap-4 lg:gap-6 font-bold w-[90%] lg:w-auto">
                     <div className={`shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center animate-pulse ${drawingTarget === 'overseed' ? 'bg-emerald-500' : drawingTarget === 'mulch' ? 'bg-amber-500' : 'bg-green-500'}`}><SparklesIcon className="w-5 h-5 lg:w-6 lg:h-6 text-black" /></div>
                     <div className="text-left"><p className="text-lg lg:text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">MEASURING {drawingTarget.toUpperCase()}</p><p className="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">Isolated spot detection active...</p></div>
                     <button onClick={() => { setIsDrawingMode(false); drawingManagerRef.current.setDrawingMode(null); }} className="ml-auto p-2 bg-white/5 rounded-full"><XMarkIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" /></button>
                  </motion.div>
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
                        <div className="space-y-5">
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Spring Cleanup Base</label><input type="number" value={pricingConfig.springBase} onChange={(e) => savePricing({...pricingConfig, springBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Fall Cleanup Base</label><input type="number" value={pricingConfig.fallBase} onChange={(e) => savePricing({...pricingConfig, fallBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Med Scale Mult (1-4.9k)</label><input type="number" step="0.1" value={pricingConfig.springFactors.md} onChange={(e) => savePricing({...pricingConfig, springFactors: { ...pricingConfig.springFactors, md: Number(e.target.value) }, fallFactors: { ...pricingConfig.fallFactors, md: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Lrg Scale Mult (5k+)</label><input type="number" step="0.1" value={pricingConfig.springFactors.lg} onChange={(e) => savePricing({...pricingConfig, springFactors: { ...pricingConfig.springFactors, lg: Number(e.target.value) }, fallFactors: { ...pricingConfig.fallFactors, lg: Number(e.target.value) }})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-4 py-1">Advanced Care</p>
                        <div className="space-y-5">
                           <div><label className="text-[9px] font-black text-slate-500 uppercase mb-2 block">Aeration Base ($)</label><input type="number" value={pricingConfig.aerationBase} onChange={(e) => savePricing({...pricingConfig, aerationBase: Number(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-2xl font-black text-white" /></div>
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
