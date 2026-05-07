'use client';

import { useState, useEffect } from 'react';
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
  ClockIcon
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
