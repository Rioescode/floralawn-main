'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square3Stack3DIcon, 
  MapPinIcon, 
  TrashIcon, 
  SparklesIcon, 
  PencilIcon,
  XMarkIcon,
  ArrowRightIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { autoMeasureLawn } from '@/libs/actions/auto-measure';

export default function AutoLawn2() {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [addressRaw, setAddressRaw] = useState('');
  const [drawings, setDrawings] = useState([]); // { id, name, type (lawn, mulch, edging), shape, measure }
  const [activeTool, setActiveTool] = useState('lawn'); // 'lawn', 'mulch', 'edging', 'snow'
  
  const mapRef = useRef(null);
  const googleRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Tools Configuration
  const tools = {
    lawn: { name: 'Mowing Area', type: 'polygon', color: '#22C55E', unit: 'SQFT' },
    mulch: { name: 'Mulch Beds', type: 'polygon', color: '#8B5A2B', unit: 'SQFT' },
    snow: { name: 'Snow Plowing', type: 'polygon', color: '#3B82F6', unit: 'SQFT' },
    edging: { name: 'Linear Edging', type: 'polyline', color: '#EAB308', unit: 'LF' },
  };

  useEffect(() => {
    const initMaps = async () => {
      if (!window.google || !window.google.maps) {
        setTimeout(initMaps, 1000);
        return;
      }
      try {
        const google = window.google;
        googleRef.current = google;
        await google.maps.importLibrary("places");
        await google.maps.importLibrary("geometry");
        await google.maps.importLibrary("drawing");
        setIsMapLoaded(true);
        initGoogleMap();
      } catch (err) {
        console.error("Maps init error:", err);
      }
    };
    initMaps();
  }, []);

  const initGoogleMap = () => {
    const google = googleRef.current;
    if (!mapRef.current) return;
    
    // Default center (Providence, RI)
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 41.8240, lng: -71.4128 },
      zoom: 18,
      mapTypeId: 'satellite',
      tilt: 0,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: true,
    });

    mapRef.current.mapObject = map;

    // Search Autocomplete
    if (autocompleteRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["geometry", "formatted_address"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          map.panTo(place.geometry.location);
          map.setZoom(21);
          setAddressRaw(place.formatted_address);
        }
      });
    }

    // Drawing Manager Setup
    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false, // We use custom UI
      polygonOptions: {
        fillColor: tools.lawn.color,
        fillOpacity: 0.4,
        strokeColor: tools.lawn.color,
        strokeWeight: 3,
        clickable: true,
        editable: true,
        zIndex: 1
      },
      polylineOptions: {
        strokeColor: tools.lawn.color,
        strokeWeight: 4,
        clickable: true,
        editable: true,
        zIndex: 2
      }
    });

    dm.setMap(map);
    drawingManagerRef.current = dm;

    // Listener for shape completion
    google.maps.event.addListener(dm, 'overlaycomplete', function(e) {
      const shape = e.overlay;
      const toolKey = activeToolRef.current;
      const toolDef = tools[toolKey];
      
      let measurement = 0;
      if (e.type === google.maps.drawing.OverlayType.POLYGON) {
        measurement = google.maps.geometry.spherical.computeArea(shape.getPath());
      } else if (e.type === google.maps.drawing.OverlayType.POLYLINE) {
        measurement = google.maps.geometry.spherical.computeLength(shape.getPath());
      }

      // 1 Meter = 3.28084 Feet (Area = ft^2)
      const measuredValue = e.type === google.maps.drawing.OverlayType.POLYGON 
        ? measurement * 10.7639 // SqM to SqFt
        : measurement * 3.28084; // M to Ft
      
      const newLayer = {
        id: Date.now().toString(),
        name: toolDef.name + " " + Math.floor(Math.random()*100),
        toolKey: toolKey,
        type: e.type,
        color: toolDef.color,
        unit: toolDef.unit,
        measure: Math.round(measuredValue),
        shape: shape
      };

      setDrawings(prev => [...prev, newLayer]);

      // Add listener to update measurements when shape is edited
      const updateMeasurement = () => {
        let newMeasure = 0;
        if (e.type === google.maps.drawing.OverlayType.POLYGON) {
          newMeasure = google.maps.geometry.spherical.computeArea(shape.getPath()) * 10.7639;
        } else {
          newMeasure = google.maps.geometry.spherical.computeLength(shape.getPath()) * 3.28084;
        }
        setDrawings(prev => prev.map(d => d.id === newLayer.id ? { ...d, measure: Math.round(newMeasure) } : d));
      };

      shape.getPath().addListener('set_at', updateMeasurement);
      shape.getPath().addListener('insert_at', updateMeasurement);
      shape.getPath().addListener('remove_at', updateMeasurement);
    });
  };

  // Keep a ref of active tool for the Google Maps listener
  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
    
    if (drawingManagerRef.current && googleRef.current && isMapLoaded) {
      const dm = drawingManagerRef.current;
      const google = googleRef.current;
      const t = tools[activeTool];
      
      if (t.type === 'polygon') {
        dm.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        dm.setOptions({
          polygonOptions: { fillColor: t.color, fillOpacity: 0.4, strokeColor: t.color, strokeWeight: 3, editable: true }
        });
      } else if (t.type === 'polyline') {
        dm.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
        dm.setOptions({
          polylineOptions: { strokeColor: t.color, strokeWeight: 5, editable: true }
        });
      }
    }
  }, [activeTool, isMapLoaded]);

  const deleteDrawing = (id) => {
    setDrawings(prev => {
      const target = prev.find(d => d.id === id);
      if (target && target.shape) {
        target.shape.setMap(null); // Remove from google map
      }
      return prev.filter(d => d.id !== id);
    });
  };

  const calculateTotal = (toolKey) => {
    return drawings.filter(d => d.toolKey === toolKey).reduce((acc, curr) => acc + curr.measure, 0);
  };

  const runAiSimulation = async () => {
    if (!addressRaw || !mapRef.current.mapObject) return;
    setIsAiScanning(true);
    const center = mapRef.current.mapObject.getCenter();
    try {
      const res = await autoMeasureLawn({ lat: center.lat(), lng: center.lng(), address: addressRaw });
      if (res?.success) {
        
        // VISUALIZE THE AREA ON THE MAP USING A CIRCLE OF EXACT AREA
        const google = window.google;
        const areaSqMeters = res.areaSqFt / 10.7639;
        const radiusMeters = Math.sqrt(areaSqMeters / Math.PI);
        
        const aiShape = new google.maps.Circle({
          strokeColor: tools.lawn.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          strokePosition: google.maps.StrokePosition.OUTSIDE,
          fillColor: tools.lawn.color,
          fillOpacity: 0.35,
          map: mapRef.current.mapObject,
          center: center,
          radius: radiusMeters,
          editable: false,
          clickable: false
        });

        setDrawings(prev => [...prev, {
          id: Date.now().toString(),
          name: "🤖 AI Estimation",
          toolKey: 'lawn',
          type: 'polygon',
          color: tools.lawn.color,
          unit: 'SQFT',
          measure: Math.round(res.areaSqFt),
          reasoning: res.reasoning,
          shape: aiShape 
        }]);
      } else {
        alert(res?.error || 'AI Scan Failed');
      }
    } catch(e) {
      alert("Error running Auto-Scan");
    }
    setIsAiScanning(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 text-slate-900 font-sans relative flex">
      {/* 100% SIZE GOOGLE MAP */}
      <div className="absolute inset-0 z-0 bg-slate-800" ref={mapRef}></div>
      
      {!isMapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900 text-white font-black animate-pulse text-2xl uppercase tracking-[0.3em]">
          Initializing AutoLawn 2.0 Engine...
        </div>
      )}

      {/* TOP INJECTED UI FLOATING OVER MAP */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-2xl">
        <div className="bg-white/90 backdrop-blur-xl p-3 rounded-full shadow-2xl border border-white/20 flex gap-3 items-center">
            <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
               <SparklesIcon className="w-6 h-6" />
            </div>
            <input 
              ref={autocompleteRef}
              className="w-full bg-transparent border-none outline-none font-black text-slate-900 placeholder:text-slate-400 text-lg px-2"
              placeholder="Search target property address..."
            />
            <button 
              type="button"
              onClick={runAiSimulation} 
              disabled={isAiScanning || !addressRaw} 
              className="px-6 py-3 bg-green-500 hover:bg-green-400 text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full transition-all shrink-0 ml-2 disabled:opacity-50 disabled:grayscale flex items-center gap-2"
            >
               {isAiScanning ? (
                 <><div className="w-3 h-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"/> SCANNING</>
               ) : 'AUTO-SCAN'}
            </button>
            <a href="/" className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full transition-all shrink-0">
               Exit
            </a>
        </div>
      </div>

      {/* LEFT SIDEBAR - THE LEGEND */}
      <motion.div 
        initial={{ x: -400 }}
        animate={{ x: 0 }}
        className="relative z-10 w-96 h-full bg-white/95 backdrop-blur-2xl shadow-[20px_0_40px_rgba(0,0,0,0.1)] border-r border-slate-200 flex flex-col pt-24"
      >
        <div className="px-8 pb-6 border-b border-slate-100 flex-shrink-0">
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-950 mb-1 leading-none uppercase">AutoLawn <span className="text-green-500">2.0</span></h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Professional Grade Measurement</p>
        </div>

        {/* TOOL SELECTION PANEL */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Drawing Tool</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(tools).map(key => (
              <button 
                key={key}
                onClick={() => setActiveTool(key)}
                className={`py-3 px-4 rounded-xl text-left border-2 transition-all flex flex-col gap-1 ${activeTool === key ? 'bg-white shadow-md scale-105' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white/50'}`}
                style={{ borderColor: activeTool === key ? tools[key].color : 'transparent' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tools[key].color }} />
                  <span className="font-black text-xs uppercase tracking-tight text-slate-900">{tools[key].name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* LAYERS SCROLL VIEW */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Square3Stack3DIcon className="w-4 h-4" /> Property Layers ({drawings.length})</p>
          
          <AnimatePresence>
            {drawings.length === 0 ? (
               <div className="text-center p-8 bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                  <PencilIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Draw on the map to create layers</p>
               </div>
            ) : (
                drawings.map(d => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={d.id} 
                    className="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-colors group"
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: d.color }} />
                        <div>
                          <p className="font-black text-sm italic text-slate-900">{d.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{d.type === 'polygon' ? 'Area' : 'Perimeter'} Measurement</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-black text-lg text-slate-900 leading-none">{d.measure.toLocaleString()}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{d.unit}</p>
                        </div>
                        <button onClick={() => deleteDrawing(d.id)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {d.reasoning && (
                       <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 opacity-50" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-1 flex items-center gap-1">
                             <SparklesIcon className="w-3 h-3" /> Core Logic
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed">
                             "{d.reasoning}"
                          </p>
                       </div>
                    )}
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM TOTAL PANE */}
        <div className="p-6 bg-slate-950 text-white rounded-tr-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex justify-between items-center">
            Total Estimates <PrinterIcon className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </p>
          
          <div className="space-y-3">
             {Object.keys(tools).map(key => {
                const total = calculateTotal(key);
                if (total === 0) return null;
                return (
                  <div key={key} className="flex justify-between items-end border-b border-white/10 pb-3">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tools[key].color }} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{tools[key].name}</span>
                     </div>
                     <span className="text-xl font-black italic">{total.toLocaleString()} <span className="text-xs text-slate-500 not-italic">{tools[key].unit}</span></span>
                  </div>
                )
             })}
          </div>

          <button className="w-full mt-6 bg-green-500 hover:bg-green-400 text-slate-950 font-black p-4 rounded-2xl flex items-center justify-center gap-2 transition-colors italic uppercase tracking-wider text-sm">
             Generate PDF Proposal <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
