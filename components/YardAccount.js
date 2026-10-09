'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import YardSeasonScene from '@/components/YardSeasonScene';

const QUOTE_SERVICES = [
  'Lawn Mowing',
  'Lawn Fertilization',
  'Weed Control',
  'Lawn Aeration',
  'Overseeding',
  'Lawn Dethatching',
  'Mulching',
  'Hedge Trimming',
  'Spring Cleanup',
  'Fall Cleanup',
  'Leaf Removal',
  'Snow Removal',
  'Junk Removal',
  'Power Washing',
  'Other',
];

function ServiceChoice({ id, value, onChange }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3"
    >
      <option value="">Select a service</option>
      {QUOTE_SERVICES.map((name) => <option key={name}>{name}</option>)}
    </select>
  );
}

function serviceLabel(type) {
  if (!type) return 'Yard service';
  if (type.includes(' ')) return type;
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function visitLabel(row) {
  const noted = row?.notes?.match(/Service needed: ([^\n]+)/);
  if (noted) return noted[1].trim();
  return serviceLabel(row?.service_type);
}

function personName(user, yard) {
  return yard?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
}

export default function YardAccount({
  user,
  userRole,
  services = [],
  adminLeads = [],
  adminNewCustomers = [],
  loadingAdmin = false,
  onSkip,
  onChangeDate,
  onSaveYard,
  onSignOut,
  onOpenCustomerView,
  preview = false,
}) {
  const yard = services[0];
  const nextVisit = services.find((row) => row.next_service && row.status !== 'cancelled') || null;
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteWhen, setQuoteWhen] = useState('flexible');
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [quotePrimarySelected, setQuotePrimarySelected] = useState(true);
  const [quotePrimaryService, setQuotePrimaryService] = useState('');
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [extraAddresses, setExtraAddresses] = useState([]);
  const [yardSize, setYardSize] = useState(user?.user_metadata?.yard_size || 'medium');
  const addressRef = useRef(null);
  const extraAddressRefs = useRef({});

  useEffect(() => {
    setYardSize(user?.user_metadata?.yard_size || 'medium');
  }, [user?.user_metadata?.yard_size]);

  useEffect(() => {
    setAddress(yard?.address || '');
    setPhone(yard?.phone && yard.phone !== 'Not provided' ? yard.phone : '');
  }, [yard?.id, yard?.address, yard?.phone]);

  useEffect(() => {
    if (!user?.email || userRole === 'admin') return;
    let cancelled = false;
    supabase
      .from('contact_leads')
      .select('id, service_type, created_at, status, city, address, notes')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) setQuotes(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, userRole]);

  useEffect(() => {
    if (!yard) return undefined;
    let autocomplete;
    let stopped = false;

    const initAutocomplete = async () => {
      if (stopped || !addressRef.current || !window.google?.maps) return;
      try {
        const { Autocomplete } = await window.google.maps.importLibrary('places');
        if (stopped || !addressRef.current) return;
        autocomplete = new Autocomplete(addressRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address'],
          types: ['address'],
        });
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(41.1444, -71.8906),
          new window.google.maps.LatLng(42.0188, -71.1205)
        );
        autocomplete.setBounds(bounds);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place?.formatted_address) setAddress(place.formatted_address);
        });
      } catch (err) {
        console.error('Autocomplete failed:', err);
      }
    };

    const checkInterval = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(checkInterval);
        initAutocomplete();
      }
    }, 500);

    return () => {
      stopped = true;
      clearInterval(checkInterval);
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [yard?.id]);

  useEffect(() => {
    if (!showQuote || extraAddresses.length === 0) return undefined;
    let stopped = false;

    const initExtra = async () => {
      if (stopped || !window.google?.maps) return;
      try {
        const { Autocomplete } = await window.google.maps.importLibrary('places');
        if (stopped) return;
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(41.1444, -71.8906),
          new window.google.maps.LatLng(42.0188, -71.1205)
        );
        extraAddresses.forEach((row) => {
          const input = extraAddressRefs.current[row.id];
          if (!input || input.dataset.placesBound === '1') return;
          input.dataset.placesBound = '1';
          const autocomplete = new Autocomplete(input, {
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address'],
            types: ['address'],
          });
          autocomplete.setBounds(bounds);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place?.formatted_address) return;
            setExtraAddresses((current) => current.map((item) => (
              item.id === row.id ? { ...item, value: place.formatted_address } : item
            )));
          });
        });
      } catch (err) {
        console.error('Autocomplete failed:', err);
      }
    };

    const checkInterval = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(checkInterval);
        initExtra();
      }
    }, 500);

    return () => {
      stopped = true;
      clearInterval(checkInterval);
    };
  }, [showQuote, extraAddresses.length]);

  const todayLabel = format(new Date(), 'EEEE, MMMM d');

  if (userRole === 'admin') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const overnight = adminLeads.filter((lead) => new Date(lead.created_at) >= start);
    const newAccounts = adminNewCustomers.filter((row) => new Date(row.created_at) >= start);

    return (
      <section className="mb-10 text-[#1B2838]">
        <p className="text-sm text-[#5C6B62]">{todayLabel}</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">Morning sheet</h1>
        {loadingAdmin ? (
          <p className="mt-6 text-sm">Loading overnight activity.</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-10">
              <p>
                <span className="block text-6xl font-semibold leading-none text-[#2F6B4F]">{overnight.length}</span>
                <span className="mt-2 block text-sm">quotes since midnight</span>
              </p>
              <p>
                <span className="block text-6xl font-semibold leading-none">{newAccounts.length}</span>
                <span className="mt-2 block text-sm">new accounts</span>
              </p>
            </div>
            <ul className="mt-8 border-t border-[#C9D4CC]">
              {overnight.length === 0 ? (
                <li className="py-4 text-sm text-[#5C6B62]">No new quotes since midnight.</li>
              ) : (
                overnight.slice(0, 8).map((lead) => (
                  <li key={lead.id} className="grid grid-cols-1 sm:grid-cols-[5.5rem_1fr] gap-1 sm:gap-4 py-3 border-b border-[#C9D4CC]">
                    <span className="text-sm text-[#5C6B62]">{format(new Date(lead.created_at), 'h:mm a')}</span>
                    <span>
                      <span className="block font-semibold">{lead.customer_name || 'New quote'}</span>
                      <span className="block text-sm text-[#5C6B62]">
                        {serviceLabel(lead.service_type)}
                        {lead.city ? `, ${lead.city}` : lead.address ? `, ${lead.address}` : ''}
                      </span>
                    </span>
                  </li>
                ))
              )}
            </ul>
            {newAccounts.length > 0 && (
              <ul className="mt-4 text-sm">
                {newAccounts.slice(0, 5).map((row) => (
                  <li key={row.id} className="py-1">
                    New account: {row.name || row.email}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/schedule" className="inline-flex items-center justify-center min-h-11 px-4 bg-[#E8C547] text-[#1B2838] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2838]">
                Open today&apos;s route
              </Link>
              <Link href="/customers" className="inline-flex items-center justify-center min-h-11 px-4 border border-[#1B2838] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6B4F]">
                All customers
              </Link>
              {onOpenCustomerView && (
                <button type="button" onClick={onOpenCustomerView} className="inline-flex items-center justify-center min-h-11 px-4 bg-[#2F6B4F] text-white font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2838]">
                  Customer dashboard
                </button>
              )}
            </div>
          </>
        )}
      </section>
    );
  }

  const first = personName(user, yard).split(' ')[0];

  async function saveYard(event) {
    event.preventDefault();
    setSaving(true);
    setSavedNote('');
    const note = await onSaveYard({ address: address.trim(), phone: phone.trim() });
    setSavedNote(note);
    setSaving(false);
  }

  return (
    <section className="mb-10 text-[#1B2838]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#5C6B62]">{todayLabel}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">{first}&apos;s yard</h1>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/customer/support" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2F6B4F]">Support</Link>
          {!preview && (
            <button type="button" onClick={onSignOut} className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2F6B4F]">
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="border border-[#C9D4CC] bg-white p-4 sm:p-5">
        <YardSeasonScene
          lastService={nextVisit?.last_service || yard?.last_service}
          nextService={nextVisit?.next_service}
          frequency={nextVisit?.frequency || yard?.frequency}
          size={yardSize}
          onSizeChange={(next) => {
            setYardSize(next);
            if (!preview) supabase.auth.updateUser({ data: { yard_size: next } });
          }}
        />
      </div>

      <div className="grid gap-6">
      <div className="bg-[#1B2838] p-5 sm:p-6 text-white">
        <p className="text-sm text-[#A9C2B3]">Next visit</p>
        {nextVisit?.next_service ? (
          <>
            <p className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-none">
              {format(new Date(`${nextVisit.next_service}T12:00:00`), 'EEEE, MMMM d')}
            </p>
            <p className="mt-3 text-lg">{visitLabel(nextVisit)}</p>
            {nextVisit.address && <p className="text-sm text-[#A9C2B3]">{nextVisit.address}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onSkip(nextVisit)}
                className="min-h-11 px-4 bg-white text-[#1B2838] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Skip this visit
              </button>
              <button
                type="button"
                onClick={() => onChangeDate(nextVisit)}
                className="min-h-11 px-4 border border-white/60 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Change the date
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-3xl font-semibold tracking-tight leading-tight">No visit on the books</p>
            <p className="mt-3 max-w-md text-sm text-[#A9C2B3]">Request a quote and the date will show up here once it is scheduled.</p>
            <button type="button" onClick={() => { setEditingQuoteId(null); setShowQuote(true); setQuoteMessage(''); }} className="mt-5 inline-flex items-center justify-center min-h-11 px-4 bg-[#E8C547] text-[#1B2838] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Get a free quote
            </button>
          </>
        )}
      </div>

      {yard && (
        <form onSubmit={saveYard} className="border border-[#C9D4CC] bg-white p-5">
          <h2 className="text-lg font-semibold">Yard details</h2>
          <label className="mt-4 block text-sm" htmlFor="yard-address">
            Address
            <input
              id="yard-address"
              ref={addressRef}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Start typing the street"
              autoComplete="off"
              className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2F6B4F]"
            />
          </label>
          <label className="mt-4 block text-sm" htmlFor="yard-phone">
            Phone
            <input
              id="yard-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2F6B4F]"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 min-h-11 px-4 bg-[#2F6B4F] text-white font-semibold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2838]"
          >
            {saving ? 'Saving' : 'Save yard details'}
          </button>
          {savedNote && <p className="mt-3 text-sm">{savedNote}</p>}
        </form>
      )}
      </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
      {quotes.length > 0 && (
        <div className="border border-[#C9D4CC] bg-white p-5">
          <h2 className="text-lg font-semibold">Your quotes</h2>
          <ul className="mt-2 border-t border-[#C9D4CC]">
            {quotes.map((quote) => (
              <li key={quote.id} className="py-3 border-b border-[#C9D4CC] text-sm flex items-center justify-between gap-3">
                <span>
                  <span className="font-semibold">{serviceLabel(quote.service_type)}</span>
                  <span className="text-[#5C6B62]"> {format(new Date(quote.created_at), 'MMMM d')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const notes = quote.notes || '';
                    const propertyMatches = [...notes.matchAll(/Property \d+: (.+)/g)];
                    const when = notes.match(/When: (.+)/)?.[1] || '';
                    const note = notes.match(/Note: (.+)/)?.[1] || '';
                    if (when.startsWith('On ')) {
                      setQuoteWhen('date');
                      setQuoteDate(when.slice(3).trim());
                    } else if (when === 'This week') {
                      setQuoteWhen('this-week');
                      setQuoteDate('');
                    } else if (when === 'Next week') {
                      setQuoteWhen('next-week');
                      setQuoteDate('');
                    } else {
                      setQuoteWhen('flexible');
                      setQuoteDate('');
                    }
                    setQuoteNote(note);
                    const parsed = propertyMatches.map((match) => {
                      const [place, svc] = match[1].split(' — ');
                      return { address: (place || '').trim(), service: (svc || serviceLabel(quote.service_type)).trim() };
                    });
                    const primary = address || yard?.address || '';
                    const first = parsed[0];
                    const firstIsPrimary = !first || first.address === primary;
                    setQuotePrimarySelected(firstIsPrimary);
                    setQuotePrimaryService(firstIsPrimary ? (first?.service || serviceLabel(quote.service_type)) : '');
                    const extras = firstIsPrimary ? parsed.slice(1) : parsed;
                    setExtraAddresses(extras.map((row, index) => ({
                      id: `edit-${quote.id}-${index}`,
                      value: row.address,
                      service: row.service,
                      selected: true,
                    })));
                    setEditingQuoteId(String(quote.id).startsWith('new-') ? null : quote.id);
                    setShowQuote(true);
                    setQuoteMessage('');
                  }}
                  className="underline underline-offset-4"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        {showQuote ? (
          <form
            className="border border-[#C9D4CC] bg-white p-5"
            onSubmit={async (event) => {
              event.preventDefault();
              const quoteName = yard?.name || user?.user_metadata?.full_name || '';
              const quoteEmail = user?.email || yard?.email || '';
              const primaryAddress = address || yard?.address || '';
              const chosen = [
                quotePrimarySelected ? { address: primaryAddress, service: quotePrimaryService } : null,
                ...extraAddresses.filter((row) => row.selected).map((row) => ({ address: row.value.trim(), service: row.service })),
              ].filter((row) => row && row.address && row.service);
              if (!quoteName.trim() || quoteName.trim().length < 2 || !quoteEmail) {
                setQuoteMessage('Add a name and email on the account first.');
                return;
              }
              if (chosen.length === 0) {
                setQuoteMessage('Choose a property and a service for this quote.');
                return;
              }
              if (quoteWhen === 'date' && !quoteDate) {
                setQuoteMessage('Pick a date, or choose a flexible time.');
                return;
              }
              const whenLabel = quoteWhen === 'date'
                ? `On ${quoteDate}`
                : quoteWhen === 'this-week'
                  ? 'This week'
                  : quoteWhen === 'next-week'
                    ? 'Next week'
                    : 'Flexible, any day';
              const propertyLines = chosen.map((row, index) => `Property ${index + 1}: ${row.address} — ${row.service}`);
              const serviceSummary = [...new Set(chosen.map((row) => row.service))].join(', ');
              const quoteBody = [
                `Services: ${serviceSummary}`,
                'Sent from: Yard account',
                `When: ${whenLabel}`,
                `Yard size: ${yardSize.charAt(0).toUpperCase()}${yardSize.slice(1)}`,
                ...propertyLines,
                quoteNote.trim() ? `Note: ${quoteNote.trim()}` : '',
              ].filter(Boolean).join('\n');
              setQuoteSending(true);
              setQuoteMessage('');
              try {
                const response = await fetch('/api/send-contact-confirmation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: quoteName,
                    email: quoteEmail,
                    phone: phone || yard?.phone || '',
                    address: chosen[0].address,
                    service: serviceSummary,
                    message: quoteBody,
                    leadId: editingQuoteId || undefined,
                    estimatePreference: 'walk_around',
                  }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Could not send the quote.');
                const saved = {
                  id: result.leadId || editingQuoteId || `new-${Date.now()}`,
                  service_type: serviceSummary,
                  created_at: new Date().toISOString(),
                  status: 'pending',
                  address: chosen[0].address,
                  notes: quoteBody,
                };
                setQuotes((current) => {
                  if (!editingQuoteId) return [saved, ...current];
                  const exists = current.some((item) => item.id === editingQuoteId);
                  if (!exists) return [saved, ...current];
                  return current.map((item) => (item.id === editingQuoteId ? { ...item, ...saved, created_at: item.created_at } : item));
                });
                setQuoteWhen('flexible');
                setQuoteDate('');
                setQuoteNote('');
                setQuotePrimarySelected(true);
                setQuotePrimaryService('');
                setExtraAddresses([]);
                setEditingQuoteId(null);
                setShowQuote(false);
                setQuoteMessage(result.updated ? 'Quote updated.' : 'Quote sent. We reply in 1–6 hours.');
              } catch (err) {
                setQuoteMessage(err.message || 'Could not send the quote.');
              } finally {
                setQuoteSending(false);
              }
            }}
          >
            <h2 className="text-lg font-semibold">{editingQuoteId ? 'Edit quote' : 'Get a quote'}</h2>
            <p className="mt-1 text-sm text-[#5C6B62]">Choose the property, then the service. You can change either one before you send.</p>
            <label className="mt-4 block text-sm" htmlFor="dash-quote-when">
              When
              <select
                id="dash-quote-when"
                value={quoteWhen}
                onChange={(event) => setQuoteWhen(event.target.value)}
                className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3"
              >
                <option value="flexible">Flexible, any day</option>
                <option value="this-week">This week</option>
                <option value="next-week">Next week</option>
                <option value="date">A specific date</option>
              </select>
            </label>
            {quoteWhen === 'date' && (
              <label className="mt-4 block text-sm" htmlFor="dash-quote-date">
                Date
                <input
                  id="dash-quote-date"
                  type="date"
                  required
                  value={quoteDate}
                  onChange={(event) => setQuoteDate(event.target.value)}
                  className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3"
                />
              </label>
            )}
            <div className="mt-4 border border-[#C9D4CC] p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quotePrimarySelected}
                  onChange={(event) => setQuotePrimarySelected(event.target.checked)}
                />
                Quote this property
              </label>
              <p className="mt-2 text-sm">{address || yard?.address || 'Add an address above first.'}</p>
              {quotePrimarySelected && (
                <label className="mt-3 block text-sm" htmlFor="dash-quote-service-primary">
                  Service
                  <ServiceChoice id="dash-quote-service-primary" value={quotePrimaryService} onChange={(event) => setQuotePrimaryService(event.target.value)} />
                </label>
              )}
            </div>
            {extraAddresses.map((row, index) => (
              <div key={row.id} className="mt-4 border border-[#C9D4CC] p-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setExtraAddresses((current) => current.map((item) => (
                          item.id === row.id ? { ...item, selected: checked } : item
                        )));
                      }}
                    />
                    Quote property {index + 2}
                  </label>
                  <button
                    type="button"
                    onClick={() => setExtraAddresses((current) => current.filter((item) => item.id !== row.id))}
                    className="text-sm underline underline-offset-4"
                  >
                    Remove
                  </button>
                </div>
                <input
                  id={`dash-quote-address-${row.id}`}
                  ref={(node) => {
                    if (node) extraAddressRefs.current[row.id] = node;
                    else delete extraAddressRefs.current[row.id];
                  }}
                  value={row.value}
                  onChange={(event) => {
                    const next = event.target.value;
                    setExtraAddresses((current) => current.map((item) => (
                      item.id === row.id ? { ...item, value: next } : item
                    )));
                  }}
                  placeholder="Start typing the street"
                  autoComplete="off"
                  className="mt-2 w-full min-h-11 border border-[#C9D4CC] bg-white px-3"
                />
                {row.selected && (
                  <label className="mt-3 block text-sm" htmlFor={`dash-quote-service-${row.id}`}>
                    Service
                    <ServiceChoice
                      id={`dash-quote-service-${row.id}`}
                      value={row.service}
                      onChange={(event) => {
                        const next = event.target.value;
                        setExtraAddresses((current) => current.map((item) => (
                          item.id === row.id ? { ...item, service: next } : item
                        )));
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraAddresses((current) => [...current, { id: `${Date.now()}`, value: '', service: '', selected: true }])}
              className="mt-3 text-sm underline underline-offset-4"
            >
              Add another property
            </button>
            <label className="mt-4 block text-sm" htmlFor="dash-quote-note">
              Note
              <input
                id="dash-quote-note"
                value={quoteNote}
                onChange={(event) => setQuoteNote(event.target.value)}
                placeholder="Gate code, back yard only, or anything else"
                className="mt-1 w-full min-h-11 border border-[#C9D4CC] bg-white px-3"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" disabled={quoteSending} className="min-h-11 px-4 bg-[#1B2838] text-white font-semibold disabled:opacity-60">
                {quoteSending ? 'Saving' : editingQuoteId ? 'Save quote' : 'Send quote request'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuote(false);
                  setEditingQuoteId(null);
                }}
                className="min-h-11 px-4 border border-[#1B2838] font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="border border-[#C9D4CC] bg-white p-5">
            <h2 className="text-lg font-semibold">Need something else done?</h2>
            <p className="mt-1 text-sm text-[#5C6B62]">Mowing, cleanups, mulch, snow. Pick the service and we reply in 1–6 hours.</p>
            <button type="button" onClick={() => { setEditingQuoteId(null); setShowQuote(true); setQuoteMessage(''); }} className="mt-4 min-h-11 px-4 bg-[#2F6B4F] text-white font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2838]">
              Get a quote
            </button>
          </div>
        )}
        {quoteMessage && <p className="mt-3 text-sm">{quoteMessage}</p>}
      </div>
      </div>
    </section>
  );
}
