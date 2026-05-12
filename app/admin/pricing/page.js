'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { 
  CurrencyDollarIcon, 
  CircleStackIcon, 
  BeakerIcon, 
  TruckIcon, 
  SunIcon, 
  CloudIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function BusinessIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState({
    lawn_mowing: {
      base_house: 50,
      base_sqft_limit: 6000,
      price_per_1k_sqft: 10,
      bi_weekly_surcharge: 1.3
    },
    materials: {
      mulch_per_yd: 135,
      edging_per_ft: 1.25,
      mulch_depth_inches: 3,
      tree_trim_flat: 75
    },
    seasonal: {
      spring_cleanup_base: 189,
      fall_cleanup_base: 235,
      med_scale_mult_1_4k: 1.8,
      lrg_scale_mult_5k_plus: 2.6
    },
    advanced_care: {
      aeration_base: 150,
      aeration_price_per_1k: 35.36,
      dethatch_base: 167,
      seed_price_per_1k: 45,
      snow_base: 75
    },
    operations: {
      fertilizer_base: 35,
      gutter_base: 150,
      shrub_rates: {
        small: 25,
        medium: 45,
        large: 75
      },
      disposal_fee: 125
    }
  });

  // Dynamic jobs list fetched from database
  const [trackedJobs, setTrackedJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [hiddenJobIds, setHiddenJobIds] = useState([]);

  const fetchHiddenJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('data')
        .eq('category', 'calibration_hidden_jobs')
        .single();
      if (!error && data?.data?.ids) {
        setHiddenJobIds(data.data.ids);
      }
    } catch (err) {}
  };

  const hideJob = async (e, jobId) => {
    e.stopPropagation();
    const newHidden = [...hiddenJobIds, jobId];
    setHiddenJobIds(newHidden);
    try {
      await supabase
        .from('business_config')
        .upsert({
          category: 'calibration_hidden_jobs',
          data: { ids: newHidden },
          updated_at: new Date().toISOString()
        }, { onConflict: 'category' });
      toast.success('Removed from calibration view');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrackedJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, address, last_job_duration_minutes, price, notes')
        .not('last_job_duration_minutes', 'is', null)
        .order('updated_at', { ascending: false });
      
      if (!error && data) {
        setTrackedJobs(data);
      }
    } catch (err) {
      console.error('Error fetching tracked jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Calibration State
  const [calibration, setCalibration] = useState({
    address: '',
    actual_time: 45, // minutes
    crew_size: 1, // number of people
    actual_sqft: 5000,
    target_hourly: 80,
    suggested_base: 0,
    suggested_per_1k: 0,
    isLoadingInfo: false
  });

  const fetchCalibrationPrefs = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('data')
        .eq('category', 'calibration_preferences')
        .single();
      if (!error && data?.data) {
        setCalibration(prev => ({
          ...prev,
          target_hourly: data.data.target_hourly || prev.target_hourly,
          crew_size: data.data.crew_size || prev.crew_size
        }));
      }
    } catch (err) {}
  };

  const saveCalibrationPrefs = async (field, value) => {
    try {
      const { data } = await supabase
        .from('business_config')
        .select('data')
        .eq('category', 'calibration_preferences')
        .single();
      const current = data?.data || { target_hourly: 80, crew_size: 1 };
      await supabase
        .from('business_config')
        .upsert({
          category: 'calibration_preferences',
          data: { ...current, [field]: value },
          updated_at: new Date().toISOString()
        }, { onConflict: 'category' });
    } catch (err) {}
  };

  const getPropertyInfo = async () => {
    if (!calibration.address) {
      toast.error('Please enter an address first');
      return;
    }

    try {
      setCalibration(prev => ({ ...prev, isLoadingInfo: true }));
      const res = await fetch(`/api/rentcast?address=${encodeURIComponent(calibration.address)}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Simple math: Lot Size - House Footprint
      const estimatedLawn = Math.max(0, (data.lotSize || 0) - (data.squareFootage || 0));
      
      setCalibration(prev => ({
        ...prev,
        actual_sqft: estimatedLawn || prev.actual_sqft
      }));

      // SAVE TO DATABASE: Find customer by address and update their notes
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, name, notes')
        .ilike('address', `%${calibration.address}%`)
        .limit(1)
        .single();

      if (customerData) {
        const verifiedTag = `[VERIFIED: Lot ${data.lotSize} | House ${data.squareFootage} | Lawn ${estimatedLawn}]`;
        const updatedNotes = customerData.notes 
          ? `${verifiedTag}\n${customerData.notes.replace(/\[VERIFIED:.*?\]\n?/, '')}`
          : verifiedTag;

        await supabase
          .from('customers')
          .update({ notes: updatedNotes })
          .eq('id', customerData.id);
        
        toast.success(`Saved to ${customerData.name}'s notes!`);
      }

      toast.success(`Verified: ${estimatedLawn} sqft mowable area`);
      return estimatedLawn; // Return for individual button usage
    } catch (error) {
      console.error(error);
      toast.error('Could not verify property info.');
      return null;
    } finally {
      setCalibration(prev => ({ ...prev, isLoadingInfo: false }));
    }
  };

  useEffect(() => {
    fetchPricing();
    fetchVerifiedProperties();
    fetchTrackedJobs();
    fetchHiddenJobs();
    fetchCalibrationPrefs();
  }, []);

  const [verifiedJobs, setVerifiedJobs] = useState({}); // { address: sqft }
  const [correctedAddresses, setCorrectedAddresses] = useState({}); // { originalAddress: fullAddress }

  const fetchVerifiedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('data')
        .eq('category', 'verified_properties')
        .single();
      
      if (!error && data?.data) {
        setVerifiedJobs(data.data);
      }
    } catch (err) {
      console.error('Error fetching verified properties:', err);
    }
  };

  const saveVerifiedPropertyToDB = async (address, sqft) => {
    try {
      // 1. Get current list
      const { data: current } = await supabase
        .from('business_config')
        .select('data')
        .eq('category', 'verified_properties')
        .single();
      
      const newList = { ...(current?.data || {}), [address]: sqft };

      // 2. Upsert back to Supabase
      await supabase
        .from('business_config')
        .upsert({
          category: 'verified_properties',
          data: newList,
          updated_at: new Date().toISOString()
        }, { onConflict: 'category' });
      
      setVerifiedJobs(newList);
    } catch (err) {
      console.error('Error saving verified property:', err);
    }
  };
  const addressRef = useRef(null);

  // Initialize Autocomplete
  useEffect(() => {
    if (typeof google !== 'undefined' && addressRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(addressRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setCalibration(prev => ({ ...prev, address: place.formatted_address }));
        }
      });
    }
  }, [loading]);

  const verifyIndividualJob = async (e, job) => {
    e.stopPropagation(); // Don't trigger the selectFridayJob
    const addressToScan = correctedAddresses[job.address] || job.address;
    
    if (verifiedJobs[addressToScan]) return;

    try {
      setCalibration(prev => ({ ...prev, address: addressToScan, isLoadingInfo: true }));
      const res = await fetch(`/api/rentcast?address=${encodeURIComponent(addressToScan)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const estimatedLawn = Math.max(0, (data.lotSize || 0) - (data.squareFootage || 0));
      
      // Update Verified State and Save to Database
      await saveVerifiedPropertyToDB(addressToScan, estimatedLawn);
      
      // Save to Notes (logic mirrored from getPropertyInfo)
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, name, notes')
        .ilike('address', `%${job.address}%`)
        .limit(1)
        .single();

      if (customerData) {
        const verifiedTag = `[VERIFIED: Lot ${data.lotSize} | House ${data.squareFootage} | Lawn ${estimatedLawn}]`;
        const updatedNotes = customerData.notes 
          ? `${verifiedTag}\n${customerData.notes.replace(/\[VERIFIED:.*?\]\n?/, '')}`
          : verifiedTag;

        await supabase.from('customers').update({ notes: updatedNotes }).eq('id', customerData.id);
        toast.success(`Saved to ${customerData.name}`);
      }
    } catch (err) {
      toast.error('Scan failed');
    } finally {
      setCalibration(prev => ({ ...prev, isLoadingInfo: false }));
    }
  };

  const selectFridayJob = (job) => {
    setCalibration(prev => ({
      ...prev,
      address: job.address,
      actual_time: job.time,
      actual_sqft: job.sqft
    }));
    toast.success('Loaded Friday tracked job!');
  };

  useEffect(() => {
    calculateSuggestions();
  }, [calibration.actual_time, calibration.actual_sqft, calibration.target_hourly, calibration.crew_size]);

  const calculateSuggestions = () => {
    const hours = (calibration.actual_time / 60) * calibration.crew_size;
    const targetPrice = hours * calibration.target_hourly;
    
    // We assume the target price should be achieved at the given sqft
    // We can solve for base + (extra_sqft/1000 * per_1k) = targetPrice
    // To simplify, let's keep the ratio of base to per_1k consistent with current settings
    const currentBase = pricing.lawn_mowing.base_house;
    const currentLimit = pricing.lawn_mowing.base_sqft_limit;
    const currentPer1k = pricing.lawn_mowing.price_per_1k_sqft;
    
    const extraSqft = Math.max(0, calibration.actual_sqft - currentLimit);
    const extraUnits = Math.ceil(extraSqft / 1000);
    
    // Current price for this sqft
    const currentPrice = currentBase + (extraUnits * currentPer1k);
    
    // Ratio to scale everything by
    const scaleFactor = currentPrice > 0 ? targetPrice / currentPrice : 1;
    
    setCalibration(prev => ({
      ...prev,
      suggested_base: Math.round(currentBase * scaleFactor),
      suggested_per_1k: Math.round(currentPer1k * scaleFactor)
    }));
  };

  const applySuggestions = () => {
    setPricing(prev => ({
      ...prev,
      lawn_mowing: {
        ...prev.lawn_mowing,
        base_house: calibration.suggested_base,
        price_per_1k_sqft: calibration.suggested_per_1k
      }
    }));
    toast.success('Suggested rates applied to Lawn & Mowing!');
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const [lastSynced, setLastSynced] = useState(null);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_config')
        .select('data, updated_at')
        .eq('category', 'master_pricing')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No existing pricing found, using defaults.');
        } else {
          console.error('Error fetching pricing:', error);
          toast.error('Failed to load pricing config');
        }
      } else if (data?.data) {
        setPricing(data.data);
        if (data.updated_at) setLastSynced(new Date(data.updated_at).toLocaleString());
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('business_config')
        .upsert({
          category: 'master_pricing',
          data: pricing,
          updated_at: now
        }, { onConflict: 'category' });

      if (error) throw error;
      setLastSynced(new Date(now).toLocaleString());
      toast.success('Master Workspace Synchronized!');
    } catch (err) {
      console.error('Error saving pricing:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (category, field, value) => {
    setPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const updateShrubField = (size, value) => {
    setPricing(prev => ({
      ...prev,
      operations: {
        ...prev.operations,
        shrub_rates: {
          ...prev.operations.shrub_rates,
          [size]: parseFloat(value) || 0
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Business Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white selection:bg-green-500/30">
      <Toaster position="bottom-right" />
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full mb-4">
              <CircleStackIcon className="h-4 w-4 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Master Workspace</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Business Intelligence <span className="text-green-500">v2.0</span></h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-gray-400 text-sm">AI Quote Engine processing with localized business logic.</p>
              {lastSynced && (
                <>
                  <span className="text-gray-700">•</span>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last Updated: <span className="text-green-500">{lastSynced}</span></p>
                </>
              )}
            </div>
          </div>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Lawn & Mowing */}
          <PricingSection title="Lawn & Mowing" icon={<SunIcon className="h-5 w-5 text-yellow-500" />}>
            <PriceField label="Base House ($)" value={pricing.lawn_mowing.base_house} onChange={v => updateField('lawn_mowing', 'base_house', v)} />
            <PriceField label="Base SQFT Limit" value={pricing.lawn_mowing.base_sqft_limit} onChange={v => updateField('lawn_mowing', 'base_sqft_limit', v)} />
            <PriceField label="Price Per +1k SQFT" value={pricing.lawn_mowing.price_per_1k_sqft} onChange={v => updateField('lawn_mowing', 'price_per_1k_sqft', v)} />
            <PriceField label="Bi-Weekly Surcharge" value={pricing.lawn_mowing.bi_weekly_surcharge} onChange={v => updateField('lawn_mowing', 'bi_weekly_surcharge', v)} step="0.1" />
          </PricingSection>

          {/* Materials Master */}
          <PricingSection title="Materials Master" icon={<CircleStackIcon className="h-5 w-5 text-orange-500" />}>
            <PriceField label="Mulch Price / YD ($)" value={pricing.materials.mulch_per_yd} onChange={v => updateField('materials', 'mulch_per_yd', v)} />
            <PriceField label="Edging / FT ($)" value={pricing.materials.edging_per_ft} onChange={v => updateField('materials', 'edging_per_ft', v)} step="0.01" />
            <PriceField label="Mulch Depth (Inches)" value={pricing.materials.mulch_depth_inches} onChange={v => updateField('materials', 'mulch_depth_inches', v)} />
            <PriceField label="Tree Trim (Flat Rate)" value={pricing.materials.tree_trim_flat} onChange={v => updateField('materials', 'tree_trim_flat', v)} />
          </PricingSection>

          {/* Seasonal Bases */}
          <PricingSection title="Seasonal Bases" icon={<CloudIcon className="h-5 w-5 text-blue-500" />}>
            <PriceField label="Spring Cleanup Base" value={pricing.seasonal.spring_cleanup_base} onChange={v => updateField('seasonal', 'spring_cleanup_base', v)} />
            <PriceField label="Fall Cleanup Base" value={pricing.seasonal.fall_cleanup_base} onChange={v => updateField('seasonal', 'fall_cleanup_base', v)} />
            <PriceField label="Med Scale Mult (1-4.9k)" value={pricing.seasonal.med_scale_mult_1_4k} onChange={v => updateField('seasonal', 'med_scale_mult_1_4k', v)} step="0.1" />
            <PriceField label="Lrg Scale Mult (5k+)" value={pricing.seasonal.lrg_scale_mult_5k_plus} onChange={v => updateField('seasonal', 'lrg_scale_mult_5k_plus', v)} step="0.1" />
          </PricingSection>

          {/* Advanced Care */}
          <PricingSection title="Advanced Care" icon={<BeakerIcon className="h-5 w-5 text-purple-500" />}>
            <PriceField label="Aeration Base ($)" value={pricing.advanced_care.aeration_base} onChange={v => updateField('advanced_care', 'aeration_base', v)} />
            <PriceField label="Aeration Price / 1k ($)" value={pricing.advanced_care.aeration_price_per_1k} onChange={v => updateField('advanced_care', 'aeration_price_per_1k', v)} step="0.01" />
            <PriceField label="Dethatch Base ($)" value={pricing.advanced_care.dethatch_base} onChange={v => updateField('advanced_care', 'dethatch_base', v)} />
            <PriceField label="Seed Price / 1k ($)" value={pricing.advanced_care.seed_price_per_1k} onChange={v => updateField('advanced_care', 'seed_price_per_1k', v)} />
            <PriceField label="Snow Base ($)" value={pricing.advanced_care.snow_base} onChange={v => updateField('advanced_care', 'snow_base', v)} />
          </PricingSection>

          {/* Operations */}
          <PricingSection title="Operations" icon={<TruckIcon className="h-5 w-5 text-green-500" />}>
            <PriceField label="Fertilizer Base ($)" value={pricing.operations.fertilizer_base} onChange={v => updateField('operations', 'fertilizer_base', v)} />
            <PriceField label="Gutter Base ($)" value={pricing.operations.gutter_base} onChange={v => updateField('operations', 'gutter_base', v)} />
            <PriceField label="Disposal Fee (Haul)" value={pricing.operations.disposal_fee} onChange={v => updateField('operations', 'disposal_fee', v)} />
          </PricingSection>

          {/* Shrub Rates */}
          <PricingSection title="Shrub Size Rates" icon={<CheckCircleIcon className="h-5 w-5 text-emerald-500" />}>
            <PriceField label="Small" value={pricing.operations.shrub_rates.small} onChange={v => updateShrubField('small', v)} />
            <PriceField label="Medium" value={pricing.operations.shrub_rates.medium} onChange={v => updateShrubField('medium', v)} />
            <PriceField label="Large" value={pricing.operations.shrub_rates.large} onChange={v => updateShrubField('large', v)} />
          </PricingSection>
        </div>

        {/* Profitability Calibration Tool */}
        <div className="mt-12 bg-gradient-to-br from-green-600/10 to-blue-600/10 border border-green-500/30 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-500/20">
              <ClockIcon className="h-6 w-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Profitability Calibration <span className="text-green-500">BETA</span></h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Adjust pricing based on actual Friday field data (Driving to Completion)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">Step 1: Field Data</h4>
              
              {/* Friday Job Quick Select */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Quick Load Tracked Jobs (W1 & W2)</p>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {trackedJobs.filter(job => !hiddenJobIds.includes(job.id)).length === 0 && !isLoadingJobs && (
                    <p className="text-[10px] text-gray-600 italic p-4 text-center border border-dashed border-white/10 rounded-2xl">No tracked jobs found yet. Start tracking on your schedule!</p>
                  )}
                  {trackedJobs.filter(job => !hiddenJobIds.includes(job.id)).map((job, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl group hover:border-green-500/30 transition-all relative">
                      <button 
                        onClick={(e) => hideJob(e, job.id)}
                        className="absolute -top-2 -right-2 bg-red-500/20 hover:bg-red-500 border border-red-500/50 text-red-500 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-black z-10"
                        title="Remove from this view"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[11px] font-black text-white">{job.name}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase truncate max-w-[200px]">{correctedAddresses[job.address] || job.address}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">{job.last_job_duration_minutes}m</span>
                          <span className="text-[8px] text-gray-500 font-bold mt-1">${job.price}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setCalibration(prev => ({ 
                              ...prev, 
                              address: job.address,
                              actual_time: job.last_job_duration_minutes,
                              actual_sqft: (verifiedJobs[job.address] || 5000)
                            }));
                            addressRef.current.focus();
                            // Listener logic for corrections
                            const checker = setInterval(() => {
                              if (calibration.address !== job.address) {
                                setCorrectedAddresses(prev => ({ ...prev, [job.address]: calibration.address }));
                                clearInterval(checker);
                              }
                            }, 500);
                            setTimeout(() => clearInterval(checker), 5000);
                          }}
                          className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase text-gray-400 transition-all"
                        >
                          Select & Correct
                        </button>
                        
                        <button 
                          onClick={(e) => verifyIndividualJob(e, job)}
                          disabled={calibration.isLoadingInfo}
                          className={`flex-1 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${
                            (verifiedJobs[job.address] || verifiedJobs[correctedAddresses[job.address]])
                              ? 'bg-green-500/20 border-green-500/50 text-green-500' 
                              : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/30'
                          }`}
                        >
                          {(verifiedJobs[job.address] || verifiedJobs[correctedAddresses[job.address]])
                            ? `${verifiedJobs[job.address] || verifiedJobs[correctedAddresses[job.address]]} SQFT` 
                            : (calibration.isLoadingInfo && (calibration.address === job.address || calibration.address === correctedAddresses[job.address]) ? '...' : 'Scan API')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-green-500">
                    Address Search
                  </label>
                  <input
                    ref={addressRef}
                    type="text"
                    value={calibration.address}
                    onChange={e => setCalibration(prev => ({...prev, address: e.target.value}))}
                    placeholder="Search for corrected address..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-green-500 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                <button 
                  onClick={getPropertyInfo}
                  disabled={calibration.isLoadingInfo}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase rounded-xl transition-all disabled:opacity-50"
                >
                  {calibration.isLoadingInfo ? 'Scanning...' : 'Get API Property Info'}
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Crew Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setCalibration(prev => ({ ...prev, crew_size: size }));
                        saveCalibrationPrefs('crew_size', size);
                      }}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                        calibration.crew_size === size 
                          ? 'bg-green-500 text-black border-green-500 shadow-lg shadow-green-500/20' 
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {size} {size === 1 ? 'Person' : 'People'}
                    </button>
                  ))}
                </div>
              </div>

              <PriceField 
                label="Actual Time (Minutes)" 
                value={calibration.actual_time} 
                onChange={v => setCalibration(prev => ({...prev, actual_time: parseFloat(v) || 0}))} 
              />
              <PriceField 
                label="Property SQFT" 
                value={calibration.actual_sqft} 
                onChange={v => setCalibration(prev => ({...prev, actual_sqft: parseFloat(v) || 0}))} 
              />
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Step 2: Business Goals</h4>
              <PriceField 
                label="Target Rate per Man-Hour ($)" 
                value={calibration.target_hourly} 
                onChange={v => {
                  const val = parseFloat(v) || 0;
                  setCalibration(prev => ({...prev, target_hourly: val}));
                  saveCalibrationPrefs('target_hourly', val);
                }} 
              />
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Target Price for Job</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-white italic tracking-tighter">
                    ${Math.round((calibration.actual_time / 60) * calibration.crew_size * calibration.target_hourly)}
                  </p>
                  <p className="text-[10px] text-green-500 font-bold uppercase mb-1.5 tracking-widest">
                    ({calibration.crew_size} {calibration.crew_size === 1 ? 'person' : 'people'} x {calibration.actual_time}m)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-white/5 p-6 rounded-[2rem] border border-white/10">
              <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Step 3: AI Recommendations</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">New Base House</span>
                  <span className="text-xl font-black text-green-500 italic">${calibration.suggested_base}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">New Price Per 1k</span>
                  <span className="text-xl font-black text-green-500 italic">${calibration.suggested_per_1k}</span>
                </div>
                <button 
                  onClick={applySuggestions}
                  className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/20"
                >
                  Apply To Engine
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Master Registry - The Real Numbers from Supabase */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-black text-xs uppercase tracking-widest">Master Registry</h3>
            </div>
            <span className="text-[10px] font-medium text-gray-500">
              Database Table: <code className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">business_config</code>
            </span>
          </div>
          
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Config Category</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Last Sync</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 font-bold text-xs">MP</div>
                        <div>
                          <p className="font-bold text-sm">master_pricing</p>
                          <p className="text-[10px] text-gray-500">Global logic for Mowing, Cleanups, and Materials</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-400 font-medium">Synced Successfully</span>
                      </div>
                    </td>
                    <td className="py-6 text-right">
                      <button onClick={fetchPricing} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                        Refresh Live
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BIG SYNC BUTTON AT THE BOTTOM */}
        <div className="mt-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-4 px-8 py-8 bg-green-600 hover:bg-green-500 text-black font-black uppercase text-base tracking-[0.2em] rounded-[2.5rem] transition-all shadow-3xl shadow-green-500/20 active:scale-[0.98] disabled:opacity-50 group"
          >
            {saving ? (
              <ArrowPathIcon className="h-6 w-6 animate-spin" />
            ) : (
              <CloudIcon className="h-6 w-6 group-hover:scale-125 transition-transform" />
            )}
            {saving ? 'Synchronizing Workspace...' : 'Sync Master Workspace'}
          </button>
          
          <div className="mt-6 flex flex-col items-center gap-2 opacity-60">
             <div className="flex items-center gap-3">
                <div className="h-[1px] w-12 bg-green-500/30"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Secure Global Engine</p>
                <div className="h-[1px] w-12 bg-green-500/30"></div>
             </div>
             <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Variable Persistence Enabled • AI Quote Engine processing</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-8 bg-green-500/5 border border-green-500/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <BeakerIcon className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h4 className="font-bold">Variable Persistence Enabled</h4>
              <p className="text-xs text-gray-500">Settings are globally locked to the AI Quote Engine.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/20">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Cloud Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingSection({ title, icon, children }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
          {icon}
        </div>
        <h3 className="font-bold text-sm tracking-wide uppercase">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function PriceField({ label, value, onChange, step = "1" }) {
  return (
    <div className="group">
      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-green-500">
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-green-500 outline-none transition-all"
      />
    </div>
  );
}
