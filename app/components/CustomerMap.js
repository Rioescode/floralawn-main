"use client";

import { useEffect, useRef, useState, memo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPinIcon, HomeIcon, CheckCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';

const CustomerMap = ({ 
  customers, 
  homeBase, 
  homeBaseCoords,
  selectedWeek, 
  completedCustomers, 
  movedCustomers,
  onCustomerClick 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [google, setGoogle] = useState(null);
  const markersRef = useRef({}); // { customerId: Marker }
  const hqMarkerRef = useRef(null);
  const coordsCacheRef = useRef({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFittedBounds = useRef(false);

  const dayColors = {
    'Monday Week 1': '#3B82F6',
    'Monday Week 2': '#60A5FA',
    'Tuesday Week 1': '#8B5CF6',
    'Tuesday Week 2': '#A78BFA',
    'Wednesday Week 1': '#EC4899',
    'Wednesday Week 2': '#F472B6',
    'Thursday Week 1': '#10B981',
    'Thursday Week 2': '#34D399',
    'Friday Week 1': '#F59E0B',
    'Friday Week 2': '#FBBF24',
    'Saturday Week 1': '#6366F1',
    'Saturday Week 2': '#818CF8',
    'Sunday Week 1': '#EF4444',
    'Sunday Week 2': '#F87171',
    'Unassigned': '#64748B'
  };

  const darkStyle = [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] }
  ];

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });
        const googleInstance = await loader.load();
        const mapInstance = new googleInstance.maps.Map(mapRef.current, {
          center: { lat: 41.8240, lng: -71.4128 },
          zoom: 11,
          styles: darkStyle,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        setGoogle(googleInstance);
        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) initMap();
  }, []);

  useEffect(() => {
    if (!map || !google) return;

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];

    // 1. Manage HQ Marker
    if (homeBase || homeBaseCoords) {
      const updateHQ = async () => {
        let position = homeBaseCoords;

        if (!position && homeBase) {
          /* DISABLED FOR VERIFICATION
          if (!coordsCacheRef.current[homeBase]) {
            const results = await new Promise(resolve => geocoder.geocode({ address: homeBase }, resolve));
            if (results && results[0]) coordsCacheRef.current[homeBase] = results[0].geometry.location;
          }
          position = coordsCacheRef.current[homeBase];
          */
          console.log("TEST: HQ Geocoding is DISABLED. If HQ is missing, it needs to be saved in Settings.");
        }

        if (position) {
          if (!hqMarkerRef.current) {
            hqMarkerRef.current = new google.maps.Marker({ map });
          }
          hqMarkerRef.current.setPosition(position);
          hqMarkerRef.current.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/><path d="M20 12L12 20H15V28H25V20H28L20 12Z" fill="#3b82f6"/></svg>`),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          });
          bounds.extend(position);
        }
      };
      updateHQ();
    }

    const currentCustomerIds = new Set(customers.map(c => c.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentCustomerIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    customers.filter(c => c.address).forEach(async (customer) => {
      let position = null;

      // FIRST: Check if we already have coordinates in the database (Zero-Cost Path)
      if (customer.latitude && customer.longitude) {
        position = { lat: parseFloat(customer.latitude), lng: parseFloat(customer.longitude) };
      } 
      // SECOND: Check memory cache
      else if (coordsCacheRef.current[customer.address]) {
        position = coordsCacheRef.current[customer.address];
      } 
      // THIRD: Call API (Expensive Path - DISABLED FOR VERIFICATION)
      /* 
      else {
        console.log("TEST: Geocoding is DISABLED. If you see this, this customer is missing DB coordinates:", customer.name);
        const results = await new Promise(resolve => geocoder.geocode({ address: customer.address }, resolve));
        if (results && results[0]) {
          position = results[0].geometry.location;
          coordsCacheRef.current[customer.address] = position;
        }
      }
      */

      if (!position) return;

      const scheduledDay = customer.scheduled_day || 'Unassigned';
      const dayColor = dayColors[scheduledDay] || dayColors['Unassigned'];
      const dayParts = scheduledDay.split(' ');
      const isToday = dayParts[0] === todayName;

      let marker = markersRef.current[customer.id];
      const markerIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.6 0 0 7.6 0 17C0 27.5 17 44 17 44S34 27.5 34 17C34 7.6 26.4 0 17 0Z" fill="${dayColor}"/>
            <circle cx="17" cy="17" r="14" fill="#0f172a" stroke="${isToday ? 'white' : 'transparent'}" stroke-width="2"/>
            <text x="17" y="22" text-anchor="middle" fill="white" font-family="Inter, sans-serif" font-size="12" font-weight="900">${customer.name.charAt(0).toUpperCase()}</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(34, 44),
        anchor: new google.maps.Point(17, 44),
        labelOrigin: new google.maps.Point(17, 54)
      };

      if (!marker) {
        marker = new google.maps.Marker({
          map,
          title: customer.name,
          label: { text: customer.name, color: 'white', fontSize: '10px', fontWeight: '900' }
        });
        
        marker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 16px; min-width: 240px; background: #0f172a; color: white; border-radius: 16px; font-family: Inter, sans-serif;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 900; color: #3b82f6;">${customer.name}</h3>
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #64748b;">${customer.address}</p>
                <div style="margin-top: 12px; border-top: 1px solid #1e293b; padding-top: 12px;">
                  <p style="font-size: 10px; font-weight: 900; color: #3b82f6; text-transform: uppercase;">Quick Reassign Day</p>
                  <select id="day-reassign-${customer.id}" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px; color: white; font-size: 11px; margin-top: 4px;">
                    ${Object.keys(dayColors).filter(d => d !== 'Unassigned').map(day => `
                      <option value="${day}" ${customer.scheduled_day === day ? 'selected' : ''}>${day}</option>
                    `).join('')}
                  </select>
                  <button id="btn-reassign-${customer.id}" style="width: 100%; margin-top: 8px; background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 8px; font-size: 10px; font-weight: 900; cursor: pointer;">UPDATE DAY</button>
                </div>
              </div>
            `
          });
          infoWindow.open(map, marker);
          google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const btn = document.getElementById(`btn-reassign-${customer.id}`);
            const select = document.getElementById(`day-reassign-${customer.id}`);
            if (btn && select && window.handleMapReassign) {
              btn.onclick = () => { window.handleMapReassign(customer.id, select.value); infoWindow.close(); };
            }
          });
          onCustomerClick?.(customer);
        });
        markersRef.current[customer.id] = marker;
      }

      marker.setPosition(position);
      marker.setIcon(markerIcon);
      bounds.extend(position);
    });

    if (!hasFittedBounds.current && !bounds.isEmpty()) {
      setTimeout(() => {
        map.fitBounds(bounds);
        if (map.getZoom() > 14) map.setZoom(14);
        hasFittedBounds.current = true;
      }, 2000);
    }
  }, [map, google, customers, homeBase]);

  return (
    <div className="relative group">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[20] rounded-[2.5rem]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white font-black text-xs uppercase tracking-widest">Elite Map Sync...</div>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[600px] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden" />
      
      <div className="absolute bottom-6 left-6 lg:right-auto lg:w-[450px] bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl z-[10]">
        <div className="flex items-center gap-3 mb-4">
          <MapPinIcon className="h-4 w-4 text-blue-500" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest text-left">Week-by-Week Route Intelligence</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest mb-1">Week 1</p>
            {Object.entries(dayColors).filter(([day]) => day.includes('Week 1')).map(([day, color]) => {
              const count = customers.filter(c => c.scheduled_day === day).length;
              return (
                <div key={day} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{day.replace(' Week 1', '')}</span>
                  </div>
                  <span className="text-[10px] font-black text-white/60">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest mb-1">Week 2</p>
            {Object.entries(dayColors).filter(([day]) => day.includes('Week 2')).map(([day, color]) => {
              const count = customers.filter(c => c.scheduled_day === day).length;
              return (
                <div key={day} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{day.replace(' Week 2', '')}</span>
                  </div>
                  <span className="text-[10px] font-black text-white/60">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-blue-400"><HomeIcon className="h-3.5 w-3.5" /><span>HQ</span></div>
          <div className="flex items-center gap-2 text-emerald-400"><CheckCircleIcon className="h-3.5 w-3.5" /><span>Done</span></div>
          <div className="flex items-center gap-2 text-amber-400"><ArrowRightCircleIcon className="h-3.5 w-3.5" /><span>Moved</span></div>
        </div>
      </div>
    </div>
  );
};

export default memo(CustomerMap);