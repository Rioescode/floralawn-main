'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

const NAVY = '#1B2838';
const GREEN = '#2F6B4F';
const GOLD = '#E8C547';

const TOWNS = [
  { name: 'Providence', state: 'RI', lat: 41.824, lng: -71.413 },
  { name: 'Cranston', state: 'RI', lat: 41.78, lng: -71.437 },
  { name: 'Pawtucket', state: 'RI', lat: 41.879, lng: -71.383 },
  { name: 'Central Falls', state: 'RI', lat: 41.89, lng: -71.392 },
  { name: 'East Providence', state: 'RI', lat: 41.814, lng: -71.37 },
  { name: 'North Providence', state: 'RI', lat: 41.85, lng: -71.466 },
  { name: 'Woonsocket', state: 'RI', lat: 42.003, lng: -71.515 },
  { name: 'Cumberland', state: 'RI', lat: 41.967, lng: -71.433 },
  { name: 'Lincoln', state: 'RI', lat: 41.911, lng: -71.435 },
  { name: 'Johnston', state: 'RI', lat: 41.822, lng: -71.507 },
  { name: 'Smithfield', state: 'RI', lat: 41.922, lng: -71.55 },
  { name: 'North Smithfield', state: 'RI', lat: 41.967, lng: -71.55 },
  { name: 'Burrillville', state: 'RI', lat: 41.955, lng: -71.702 },
  { name: 'Glocester', state: 'RI', lat: 41.905, lng: -71.68 },
  { name: 'Foster', state: 'RI', lat: 41.854, lng: -71.758 },
  { name: 'Scituate', state: 'RI', lat: 41.81, lng: -71.6 },
  { name: 'Warwick', state: 'RI', lat: 41.7, lng: -71.416 },
  { name: 'West Warwick', state: 'RI', lat: 41.697, lng: -71.522 },
  { name: 'Coventry', state: 'RI', lat: 41.686, lng: -71.6 },
  { name: 'East Greenwich', state: 'RI', lat: 41.66, lng: -71.456 },
  { name: 'West Greenwich', state: 'RI', lat: 41.63, lng: -71.66 },
  { name: 'North Kingstown', state: 'RI', lat: 41.572, lng: -71.447 },
  { name: 'Exeter', state: 'RI', lat: 41.577, lng: -71.54 },
  { name: 'South Kingstown', state: 'RI', lat: 41.437, lng: -71.501 },
  { name: 'Narragansett', state: 'RI', lat: 41.43, lng: -71.455 },
  { name: 'Richmond', state: 'RI', lat: 41.505, lng: -71.669 },
  { name: 'Hopkinton', state: 'RI', lat: 41.461, lng: -71.778 },
  { name: 'Charlestown', state: 'RI', lat: 41.383, lng: -71.642 },
  { name: 'Westerly', state: 'RI', lat: 41.378, lng: -71.827 },
  { name: 'Jamestown', state: 'RI', lat: 41.497, lng: -71.367 },
  { name: 'Newport', state: 'RI', lat: 41.49, lng: -71.313 },
  { name: 'Middletown', state: 'RI', lat: 41.546, lng: -71.291 },
  { name: 'Portsmouth', state: 'RI', lat: 41.6, lng: -71.251 },
  { name: 'Tiverton', state: 'RI', lat: 41.626, lng: -71.214 },
  { name: 'Little Compton', state: 'RI', lat: 41.51, lng: -71.171 },
  { name: 'Bristol', state: 'RI', lat: 41.677, lng: -71.266 },
  { name: 'Warren', state: 'RI', lat: 41.73, lng: -71.282 },
  { name: 'Barrington', state: 'RI', lat: 41.741, lng: -71.309 },
  { name: 'New Shoreham', state: 'RI', lat: 41.173, lng: -71.558, island: true },
  { name: 'Seekonk', state: 'MA', lat: 41.808, lng: -71.337 },
  { name: 'Rehoboth', state: 'MA', lat: 41.84, lng: -71.249 },
  { name: 'Attleboro', state: 'MA', lat: 41.945, lng: -71.285 },
  { name: 'North Attleboro', state: 'MA', lat: 41.984, lng: -71.333 },
  { name: 'Plainville', state: 'MA', lat: 42.004, lng: -71.333 },
  { name: 'Wrentham', state: 'MA', lat: 42.067, lng: -71.328 },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'RI', label: 'Rhode Island' },
  { id: 'MA', label: 'Mass.' },
];

const FIT_PADDING = { top: 56, right: 56, bottom: 28, left: 28 };

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#F3F6F1' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6B7A72' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F3F6F1' }, { weight: 3 }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: NAVY }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#9AAFA3' }, { weight: 1.2 }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#E3ECDF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DCE6DD' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#C9D6CC' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFDFE6' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7C95A1' }] },
];

function pinIcon(active) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: active ? 10 : 6.5,
    fillColor: active ? GOLD : GREEN,
    fillOpacity: 1,
    strokeColor: active ? NAVY : '#FFFFFF',
    strokeWeight: active ? 3 : 2,
  };
}

function labelHtml(town) {
  const state = town.state === 'MA' ? 'Massachusetts' : 'Rhode Island';
  return `<div style="font-family:Inter,system-ui,sans-serif;padding:6px 8px 4px;color:${NAVY};white-space:nowrap;overflow:hidden;">
    <div style="font-weight:800;font-size:14px;line-height:1.25;">${town.name}</div>
    <div style="font-size:11px;font-weight:600;line-height:1.4;color:${GREEN};">${state} · In our service area</div>
  </div>`;
}

export default function ServiceAreaMap() {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markers = useRef({});
  const infoWindow = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);

  const counts = useMemo(() => ({
    all: TOWNS.length,
    RI: TOWNS.filter((t) => t.state === 'RI').length,
    MA: TOWNS.filter((t) => t.state === 'MA').length,
  }), []);

  const visibleTowns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOWNS
      .filter((t) => filter === 'all' || t.state === filter)
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, query]);

  useEffect(() => {
    let cancelled = false;

    const initMap = () => {
      if (cancelled || mapObj.current || !mapRef.current) return;
      const g = window.google.maps;

      const map = new g.Map(mapRef.current, {
        center: { lat: 41.75, lng: -71.45 },
        zoom: 9,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: g.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: 'cooperative',
        isFractionalZoomEnabled: true,
        clickableIcons: false,
        styles: MAP_STYLES,
      });
      mapObj.current = map;
      infoWindow.current = new g.InfoWindow({ disableAutoPan: true, headerDisabled: true });

      TOWNS.forEach((town) => {
        const marker = new g.Marker({
          position: { lat: town.lat, lng: town.lng },
          map,
          title: `${town.name}, ${town.state}`,
          icon: pinIcon(false),
        });
        marker.addListener('click', () => setActive(town.name));
        marker.addListener('mouseover', () => {
          infoWindow.current.setContent(labelHtml(town));
          infoWindow.current.open({ map, anchor: marker });
        });
        markers.current[town.name] = marker;
      });

      setIsLoaded(true);
    };

    const interval = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(interval);
        initMap();
      }
    }, 300);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (!isLoaded || !map) return;
    const g = window.google.maps;
    const bounds = new g.LatLngBounds();

    TOWNS.forEach((town) => {
      const shown = filter === 'all' || town.state === filter;
      markers.current[town.name]?.setVisible(shown);
      if (shown && !town.island) bounds.extend({ lat: town.lat, lng: town.lng });
    });

    if (!active) map.fitBounds(bounds, FIT_PADDING);
  }, [filter, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapObj.current;
    if (!isLoaded || !map) return;

    Object.entries(markers.current).forEach(([name, marker]) => {
      marker.setIcon(pinIcon(name === active));
      marker.setZIndex(name === active ? 1000 : undefined);
    });

    const town = TOWNS.find((t) => t.name === active);
    if (!town) {
      infoWindow.current?.close();
      return;
    }
    map.panTo({ lat: town.lat, lng: town.lng });
    if (map.getZoom() < 11) map.setZoom(11);
    infoWindow.current.setContent(labelHtml(town));
    infoWindow.current.open({ map, anchor: markers.current[town.name] });
  }, [active, isLoaded]);

  const showAll = () => {
    setActive(null);
    const map = mapObj.current;
    if (!map) return;
    const bounds = new window.google.maps.LatLngBounds();
    TOWNS.filter((t) => !t.island && (filter === 'all' || t.state === filter))
      .forEach((t) => bounds.extend({ lat: t.lat, lng: t.lng }));
    map.fitBounds(bounds, FIT_PADDING);
  };

  const changeFilter = (id) => {
    setActive(null);
    setFilter(id);
  };

  return (
    <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 flex flex-col p-6 text-white lg:order-1 lg:p-7" style={{ background: NAVY }}>
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Service area</p>
        <h3 className="mt-2 text-2xl font-black leading-tight">
          {counts.all} towns across Rhode Island &amp; Southern Mass.
        </h3>
        <p className="mt-2 text-sm text-slate-300">Tap a town to see it on the map.</p>

        <div className="mt-5 grid grid-cols-3 gap-1 bg-white/10 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => changeFilter(f.id)}
              className={`px-2 py-2 text-xs font-bold transition-colors ${
                filter === f.id ? 'bg-white text-slate-900' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {f.label} <span className="opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        <label className="relative mt-3 block">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find your town"
            className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-white/40 focus:outline-none"
          />
        </label>

        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[260px] lg:space-y-0.5 lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1">
          {visibleTowns.map((town) => {
            const isActive = active === town.name;
            return (
              <li key={town.name} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(isActive ? null : town.name)}
                  className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    isActive ? 'text-slate-900' : 'bg-white/5 text-slate-100 hover:bg-white/10 lg:bg-transparent'
                  }`}
                  style={isActive ? { background: GOLD } : undefined}
                >
                  <MapPinIcon className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1">{town.name}</span>
                  <span className="text-[11px] font-bold opacity-60">{town.state}</span>
                </button>
              </li>
            );
          })}
          {visibleTowns.length === 0 && (
            <li className="px-3 py-3 text-sm text-slate-300">
              Not on the list? We may still cover you.{' '}
              <Link href="/contact" className="font-bold underline" style={{ color: GOLD }}>Ask us</Link>
            </li>
          )}
        </ul>

        <div className="mt-auto pt-5">
          <Link
            href="/contact"
            className="block py-3 text-center text-sm font-black text-slate-900 transition-opacity hover:opacity-90"
            style={{ background: GOLD }}
          >
            Get a free quote
          </Link>
        </div>
      </aside>

      <div className="relative order-1 min-h-[380px] sm:min-h-[460px] lg:order-2 lg:min-h-[580px]">
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2 bg-white/95 px-3 py-2 shadow-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: GREEN }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: GREEN }} />
          </span>
          <p className="text-xs font-bold text-slate-800">Where we work</p>
        </div>

        {active && (
          <button
            type="button"
            onClick={showAll}
            className="absolute right-4 top-4 z-10 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-md hover:bg-white"
          >
            Show all towns
          </button>
        )}

        {!isLoaded && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#F3F6F1]">
            <div className="flex flex-col items-center">
              <MapPinIcon className="mb-2 h-8 w-8 animate-bounce" style={{ color: GREEN }} />
              <p className="text-xs font-bold text-slate-500">Loading map…</p>
            </div>
          </div>
        )}

        <div ref={mapRef} className="service-area-map absolute inset-0" />
      </div>
    </div>
  );
}
