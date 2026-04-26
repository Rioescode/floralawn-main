'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const MAP_LOCATIONS = [
  { name: 'Providence', lat: 41.823989, lng: -71.412834 },
  { name: 'Cranston', lat: 41.779823, lng: -71.437279 },
  { name: 'Warwick', lat: 41.700104, lng: -71.416168 },
  { name: 'Pawtucket', lat: 41.878712, lng: -71.382835 },
  { name: 'East Providence', lat: 41.813713, lng: -71.370056 },
  { name: 'Woonsocket', lat: 42.002876, lng: -71.514778 },
  { name: 'Newport', lat: 41.490101, lng: -71.312828 },
  { name: 'Cumberland', lat: 41.966667, lng: -71.433333 },
  { name: 'Johnston', lat: 41.823158, lng: -71.489777 },
  { name: 'North Kingstown', lat: 41.5548, lng: -71.4556 },
  { name: 'Bristol', lat: 41.677132, lng: -71.266159 },
  { name: 'Smithfield', lat: 41.922043, lng: -71.549507 },
  { name: 'Lincoln', lat: 41.911011, lng: -71.4385 },
  { name: 'Portsmouth', lat: 41.59972, lng: -71.25055 },
  { name: 'Barrington', lat: 41.74052, lng: -71.30825 }
];

export default function ServiceAreaMap() {
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let map;
    const initMap = () => {
      if (!window.google || !window.google.maps || !mapRef.current) return;
      
      const rhodeIslandCenter = { lat: 41.7, lng: -71.45 };
      
      map = new window.google.maps.Map(mapRef.current, {
        center: rhodeIslandCenter,
        zoom: 10,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ weight: "2.00" }]
          },
          {
            featureType: "all",
            elementType: "geometry.stroke",
            stylers: [{ color: "#9c9c9c" }]
          },
          {
            featureType: "all",
            elementType: "labels.text",
            stylers: [{ visibility: "on" }]
          },
          {
            featureType: "landscape",
            elementType: "all",
            stylers: [{ color: "#f2f2f2" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road",
            elementType: "all",
            stylers: [{ saturation: -100 }, { lightness: 45 }]
          },
          {
            featureType: "road",
            elementType: "geometry.fill",
            stylers: [{ color: "#eeeeee" }]
          },
          {
            featureType: "road.highway",
            elementType: "all",
            stylers: [{ visibility: "simplified" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [{ color: "#22c55e" }, { lightness: 40 }]
          },
          {
            featureType: "transit",
            elementType: "all",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "water",
            elementType: "all",
            stylers: [{ color: "#cbd5e1" }, { visibility: "on" }]
          },
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#e2e8f0" }]
          }
        ]
      });

      // Add markers
      MAP_LOCATIONS.forEach(location => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          title: location.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#22c55e",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff"
          }
        });

        // Add small info window functionality
        const infoWindow = new window.google.maps.InfoWindow({
           content: `<div style="padding: 4px 8px; font-weight: 900; font-family: Inter, sans-serif; color: #0f172a; text-transform: uppercase; font-size: 11px;">$${location.name}, RI</div>`
        });

        marker.addListener("mouseover", () => infoWindow.open(map, marker));
        marker.addListener("mouseout", () => infoWindow.close());
      });

      setIsLoaded(true);
    };

    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        initMap();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative rounded-3xl overflow-hidden shadow-xl border border-slate-200">
       <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Live Coverage Map</p>
       </div>

      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-0">
          <div className="flex flex-col items-center">
             <MapPinIcon className="w-8 h-8 text-slate-300 animate-bounce mb-2" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Satellite Array...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-[500px]" />
    </div>
  );
}
