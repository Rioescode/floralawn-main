"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  DocumentTextIcon,
  PrinterIcon,
  PlusIcon,
  TrashIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

function InvoiceMakerContent() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  
  const [docType, setDocType] = useState('Invoice'); // 'Invoice' | 'Quote'
  const [isManual, setIsManual] = useState(false);
  const [isManualBalance, setIsManualBalance] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    customer_id: '',
    manual_customer: {
      name: '',
      address: '',
      email: '',
      phone: ''
    },
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    services: [{ description: '', quantity: 1, rate: '', amount: '' }],
    notes: '',
    payment_terms: '15',
    deposit_amount: '0',
    manual_balance: '0'
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const addressRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      generateInvoiceNumber();
    }
  }, [user]);

  // Handle leadId from query param
  useEffect(() => {
    if (leadId && customers.length > 0) {
      setInvoiceData(prev => ({
        ...prev,
        customer_id: leadId
      }));
      setDocType('Quote'); // Default to Quote for leads
    }
  }, [leadId, customers]);

  // --- GOOGLE PLACES AUTOCOMPLETE ---
  useEffect(() => {
    if (!isManual) return;

    let autocomplete;
    const initAutocomplete = async () => {
      if (!window.google || !window.google.maps) return;
      try {
        const { Autocomplete } = await window.google.maps.importLibrary("places");
        autocomplete = new Autocomplete(addressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["formatted_address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.formatted_address) return;
          
          setInvoiceData(prev => ({
            ...prev,
            manual_customer: {
              ...prev.manual_customer,
              address: place.formatted_address
            }
          }));
        });
      } catch (err) {
        console.error("Autocomplete failure:", err);
      }
    };

    const checkInterval = setInterval(() => {
      if (window.google && window.google.maps) {
        initAutocomplete();
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isManual]);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (!authUser) {
        setUser({ email: 'guest@floralawn.com', id: 'guest' });
      } else {
        setUser(authUser);
      }
    } catch (error) {
      console.error('Auth check skipped:', error);
      setUser({ email: 'guest@floralawn.com', id: 'guest' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Fetch Active Customers
      const { data: activeData, error: activeError } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (activeError) throw activeError;

      // Fetch Pending Leads
      const { data: leadData, error: leadError } = await supabase
        .from('contact_leads')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (leadError) throw leadError;

      // Combine them
      const combined = [
        ...(activeData || []).map(c => ({ ...c, type: 'customer' })),
        ...(leadData || []).map(l => ({ 
          id: l.id, 
          name: l.customer_name, 
          email: l.customer_email, 
          address: l.address,
          phone: l.customer_phone,
          type: 'lead' 
        }))
      ];

      setCustomers(combined);
    } catch (error) {
      console.error('Error fetching customers/leads:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const prefix = docType === 'Invoice' ? 'INV' : 'QT';
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setInvoiceData(prev => ({
      ...prev,
      invoice_number: `${prefix}-${year}${month}-${random}`
    }));
  };

  useEffect(() => {
    generateInvoiceNumber();
  }, [docType]);

  const quickServices = [
    { name: "Lawn Mowing", rate: "" },
    { name: "Fertilization", rate: "" },
    { name: "Dethatching", rate: "" },
    { name: "Aeration", rate: "" },
    { name: "Overseeding", rate: "" },
    { name: "Mulching", rate: "" },
    { name: "Spring Cleanup", rate: "" },
    { name: "Fall Cleanup", rate: "" },
    { name: "Hedge Trimming", rate: "" },
    { name: "Leaf Removal", rate: "" },
    { name: "Pruning", rate: "" },
    { name: "Weed Control", rate: "" }
  ];

  const addQuickService = (serviceName) => {
    setInvoiceData(prev => {
      const isFirstEmpty = prev.services.length === 1 && !prev.services[0].description;
      const newService = { description: serviceName, quantity: 1, rate: '', amount: '' };
      return {
        ...prev,
        services: isFirstEmpty ? [newService] : [...prev.services, newService]
      };
    });
  };

  const addService = () => {
    setInvoiceData(prev => ({
      ...prev,
      services: [...prev.services, { description: '', quantity: 1, rate: '', amount: '' }]
    }));
  };

  const updateService = (index, field, value) => {
    const newServices = [...invoiceData.services];
    newServices[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(newServices[index].quantity) || 0;
      const rate = parseFloat(newServices[index].rate) || 0;
      newServices[index].amount = (quantity * rate).toFixed(2);
    }
    setInvoiceData(prev => ({ ...prev, services: newServices }));
  };

  const removeService = (index) => {
    if (invoiceData.services.length > 1) {
      setInvoiceData(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateSubtotal = () => {
    return invoiceData.services.reduce((total, service) => {
      return total + (parseFloat(service.amount) || 0);
    }, 0);
  };

  const calculateBalanceFormatted = () => {
    if (isManualBalance) {
      return parseFloat(invoiceData.manual_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }
    const sub = calculateSubtotal();
    const dep = parseFloat(invoiceData.deposit_amount) || 0;
    return (sub - dep).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const generateEliteInvoice = () => {
    let selectedCustomer = null;
    if (isManual) {
      selectedCustomer = invoiceData.manual_customer;
    } else {
      selectedCustomer = customers.find(c => c.id === invoiceData.customer_id);
    }

    if (!selectedCustomer || !selectedCustomer.name) {
      alert('Please select or enter customer details');
      return;
    }

    const subtotal = calculateSubtotal();
    const deposit = parseFloat(invoiceData.deposit_amount) || 0;
    const balance = calculateBalanceFormatted();

    const invoiceHTML = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; background: white; border-radius: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 4px solid #10b981; padding-bottom: 30px;">
          <div>
            <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" style="max-height: 70px; margin-bottom: 16px;">
            <h1 style="font-size: 36px; font-weight: 900; font-style: italic; margin: 0; color: #065f46; text-transform: uppercase;">${docType}</h1>
            <p style="font-size: 14px; font-weight: 800; color: #64748b; margin-top: 4px;"># ${invoiceData.invoice_number}</p>
          </div>
          <div style="text-align: right; font-size: 13px; color: #64748b;">
            <p style="font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">Flora Lawn & Landscaping Inc.</p>
            <p>45 Vernon St, Pawtucket, RI 02860</p>
            <p>(401) 389-0913</p>
            <p>floralawncareri@gmail.com</p>
            <div style="margin-top: 20px; font-weight: 800; color: #0f172a;">
              <p>DATE: ${new Date(invoiceData.invoice_date).toLocaleDateString()}</p>
              <p>DUE: ${new Date(invoiceData.due_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 40px; padding: 24px; background: #f0fdf4; border-radius: 20px; border: 1px solid #dcfce7;">
          <h2 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #059669; margin-bottom: 12px; letter-spacing: 0.1em;">Bill To:</h2>
          <p style="font-size: 20px; font-weight: 900; color: #064e3b; margin: 0;">${selectedCustomer.name}</p>
          <p style="font-size: 15px; font-weight: 600; color: #374151; margin-top: 6px;">${selectedCustomer.address || 'Rhode Island, USA'}</p>
          ${selectedCustomer.phone ? `<p style="font-size: 14px; color: #4b5563; margin-top: 4px;">${selectedCustomer.phone}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr>
              <th style="padding: 16px 0; text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0;">Description</th>
              <th style="padding: 16px 0; text-align: center; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; width: 80px;">Qty</th>
              <th style="padding: 16px 0; text-align: right; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; width: 120px;">Rate</th>
              <th style="padding: 16px 0; text-align: right; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.services.map(s => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 20px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${s.description}</td>
                <td style="padding: 20px 0; text-align: center; font-size: 15px; font-weight: 600; color: #475569;">${s.quantity}</td>
                <td style="padding: 20px 0; text-align: right; font-size: 15px; font-weight: 600; color: #475569;">$${parseFloat(s.rate || 0).toLocaleString()}</td>
                <td style="padding: 20px 0; text-align: right; font-size: 16px; font-weight: 900; color: #059669;">$${parseFloat(s.amount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 280px; background: #f8fafc; padding: 24px; border-radius: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #64748b;">
              <span>Subtotal</span>
              <span>$${subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; font-weight: 800; color: #10b981;">
              <span>Deposit Paid</span>
              <span>-$${deposit.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 16px; border-top: 3px solid #0f172a;">
              <span style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a;">Balance Due</span>
              <span style="font-size: 24px; font-weight: 900; color: #059669;">$${balance}</span>
            </div>
          </div>
        </div>

        ${invoiceData.notes ? `
          <div style="margin-top: 50px; padding: 24px; border-radius: 16px; border: 1px dashed #cbd5e1; background: #fdfdfd;">
            <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Notes & Terms</h3>
            <p style="font-size: 13px; font-weight: 500; color: #475569; margin: 0;">${invoiceData.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 80px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; font-style: italic;">Thank you for choosing Flora Lawn & Landscaping — Rhode Island's Finest</p>
        </div>
      </div>
    `;
    
    setGeneratedInvoice(invoiceHTML);
    setTimeout(() => {
      document.getElementById('invoice-preview-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  const printInvoice = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30 selection:text-green-400">
      <Navigation />
      
      <section className="relative pt-44 pb-32 overflow-hidden">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />
         
         <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none italic uppercase mb-10">
               Flora <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent underline decoration-green-500 decoration-8 underline-offset-[1.5rem]">Financials</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium italic">
               Generate elite invoices, quotes, and deposit requests for Rhode Island properties.
            </p>
         </div>
      </section>

      <section className="pb-32">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
               <div className="lg:col-span-12 space-y-8">
                  <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-10 md:p-20 relative overflow-hidden">
                      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-12 mb-16 border-b border-white/10 pb-16">
                         <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-2 rounded-[2.5rem] border border-white/10">
                            <button 
                              onClick={() => setDocType('Invoice')}
                              className={`px-10 py-5 rounded-[2rem] font-black italic uppercase transition-all ${docType === 'Invoice' ? 'bg-green-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                            >
                               Invoice
                            </button>
                            <button 
                              onClick={() => setDocType('Quote')}
                              className={`px-10 py-5 rounded-[2rem] font-black italic uppercase transition-all ${docType === 'Quote' ? 'bg-green-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                            >
                               Quote
                            </button>
                         </div>

                         <div className="flex flex-wrap items-center gap-8">
                            <div className="flex items-center gap-4 px-8 py-6 bg-white/5 rounded-3xl border border-white/10">
                               <div className="text-right">
                                  <p className="text-[10px] font-black italic text-slate-500 uppercase leading-none mb-1">Total</p>
                                  <p className="text-2xl font-black italic text-green-400">${calculateSubtotal().toLocaleString()}</p>
                               </div>
                               <div className="text-right group cursor-pointer" onClick={() => setIsManualBalance(!isManualBalance)}>
                                  <div className="flex items-center gap-2 justify-end">
                                    <p className="text-[10px] font-black italic text-slate-500 uppercase leading-none">Balance Due</p>
                                    <SparklesIcon className={`w-3 h-3 ${isManualBalance ? 'text-green-400' : 'text-slate-700'}`} />
                                  </div>
                                  {isManualBalance ? (
                                    <input 
                                      type="number"
                                      autoFocus
                                      value={invoiceData.manual_balance}
                                      onChange={(e) => setInvoiceData({...invoiceData, manual_balance: e.target.value})}
                                      className="bg-transparent text-right text-2xl font-black italic border-b-2 border-green-500 outline-none w-32"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <p className="text-2xl font-black italic">${calculateBalanceFormatted()}</p>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="mb-16">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black italic uppercase tracking-wider">Customer Details</h3>
                            <button 
                              onClick={() => setIsManual(!isManual)}
                              className="text-xs font-black uppercase tracking-widest italic text-green-400 hover:underline"
                            >
                               {isManual ? "Select from Database" : "Enter Manual Customer"}
                            </button>
                         </div>

                         {!isManual ? (
                           <div className="relative group max-w-xl">
                              <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                              <select 
                                value={invoiceData.customer_id}
                                onChange={(e) => setInvoiceData({...invoiceData, customer_id: e.target.value})}
                                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-16 pr-8 py-5 text-lg font-bold text-white focus:outline-none focus:border-green-500 transition-all appearance-none"
                              >
                                <option value="" className="bg-slate-900">Choose Customer or Lead...</option>
                                {customers.map(c => (
                                  <option key={`${c.type}-${c.id}`} value={c.id} className="bg-slate-900">
                                    {c.type === 'lead' ? '✦ LEAD: ' : ''}{c.name} ({c.address || 'No Address'})
                                  </option>
                                ))}
                              </select>
                           </div>
                         ) : (
                           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                              <div className="relative group">
                                 <IdentificationIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                 <input 
                                   placeholder="Full Name"
                                   value={invoiceData.manual_customer.name}
                                   onChange={(e) => setInvoiceData({...invoiceData, manual_customer: {...invoiceData.manual_customer, name: e.target.value}})}
                                   className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-16 pr-6 py-5 font-bold focus:border-green-500 outline-none"
                                 />
                              </div>
                              <div className="relative group lg:col-span-1">
                                 <MapPinIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                 <input 
                                   ref={addressRef}
                                   placeholder="Street Address Suggestion..."
                                   value={invoiceData.manual_customer.address}
                                   onChange={(e) => setInvoiceData({...invoiceData, manual_customer: {...invoiceData.manual_customer, address: e.target.value}})}
                                   className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-16 pr-6 py-5 font-bold focus:border-green-500 outline-none"
                                 />
                              </div>
                              <div className="relative group">
                                 <EnvelopeIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                 <input 
                                   placeholder="Email"
                                   value={invoiceData.manual_customer.email}
                                   onChange={(e) => setInvoiceData({...invoiceData, manual_customer: {...invoiceData.manual_customer, email: e.target.value}})}
                                   className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-16 pr-6 py-5 font-bold focus:border-green-500 outline-none"
                                 />
                              </div>
                              <div className="relative group">
                                 <PhoneIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                 <input 
                                   placeholder="Phone"
                                   value={invoiceData.manual_customer.phone}
                                   onChange={(e) => setInvoiceData({...invoiceData, manual_customer: {...invoiceData.manual_customer, phone: e.target.value}})}
                                   className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-16 pr-6 py-5 font-bold focus:border-green-500 outline-none"
                                 />
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="mb-16 animate-in fade-in slide-in-from-right-10 duration-1000">
                         <h3 className="text-xl font-black italic uppercase tracking-wider mb-6 flex items-center gap-2">
                           Quick Selection <SparklesIcon className="w-5 h-5 text-green-400" />
                         </h3>
                         <div className="flex flex-wrap gap-3">
                           {quickServices.map((qs, i) => (
                             <button
                               key={i}
                               onClick={() => addQuickService(qs.name)}
                               className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-green-600 hover:scale-105 transition-all outline-none"
                             >
                               {qs.name}
                             </button>
                           ))}
                         </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16 border-t border-white/10 pt-16">
                         <div>
                            <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-4 block">Document #</label>
                            <input value={invoiceData.invoice_number} readOnly className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-8 py-5 font-bold text-slate-500 outline-none" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-4 block">Document Date</label>
                            <input type="date" value={invoiceData.invoice_date} onChange={(e) => setInvoiceData({...invoiceData, invoice_date: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-8 py-5 font-bold outline-none [color-scheme:dark]" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-4 block">Due Date</label>
                            <input type="date" value={invoiceData.due_date} onChange={(e) => setInvoiceData({...invoiceData, due_date: e.target.value})} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-8 py-5 font-bold outline-none [color-scheme:dark]" />
                         </div>
                         <div>
                            <label className="text-[10px] font-black italic text-green-500 uppercase tracking-widest mb-4 block">Deposit Paid ($)</label>
                            <input type="number" value={invoiceData.deposit_amount} onChange={(e) => setInvoiceData({...invoiceData, deposit_amount: e.target.value})} className="w-full bg-green-500/10 border-2 border-green-500/20 rounded-2xl px-8 py-5 font-black text-green-400 outline-none" />
                         </div>
                      </div>

                      <div className="mb-16">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black italic uppercase tracking-wider">Line Items</h3>
                            <button onClick={addService} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl border border-white/10 transition-all font-black text-xs uppercase tracking-widest">
                               <PlusIcon className="w-4 h-4 text-green-400" /> Add Item
                            </button>
                         </div>
                         <div className="space-y-4">
                            {invoiceData.services.map((service, index) => (
                               <div key={index} className="grid grid-cols-12 gap-4 items-center group">
                                  <div className="col-span-12 md:col-span-6">
                                     <input placeholder="Service description" value={service.description} onChange={(e) => updateService(index, 'description', e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 font-bold focus:border-green-500 outline-none" />
                                  </div>
                                  <div className="col-span-4 md:col-span-2">
                                     <input type="number" placeholder="Qty" value={service.quantity} onChange={(e) => updateService(index, 'quantity', e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-4 py-4 font-bold text-center" />
                                  </div>
                                  <div className="col-span-4 md:col-span-2">
                                     <input type="number" placeholder="Rate" value={service.rate} onChange={(e) => updateService(index, 'rate', e.target.value)} className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-4 py-4 font-bold text-center" />
                                  </div>
                                  <div className="col-span-3 md:col-span-1 text-right font-black italic text-green-400">${service.amount || '0.00'}</div>
                                  <div className="col-span-1 text-right">
                                     <button onClick={() => removeService(index)} disabled={invoiceData.services.length === 1} className="text-slate-600 hover:text-red-500 transition-colors disabled:opacity-0"><TrashIcon className="w-5 h-5" /></button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-10 items-end">
                         <div>
                            <label className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-4 block">Internal Notes</label>
                            <textarea value={invoiceData.notes} onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})} placeholder="Special requests..." className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-6 font-bold h-32 resize-none outline-none focus:border-green-500" />
                         </div>
                         <div className="flex flex-col gap-4">
                            <button 
                              onClick={generateEliteInvoice}
                              disabled={(!isManual && !invoiceData.customer_id) || (isManual && !invoiceData.manual_customer.name)}
                              className="w-full bg-green-600 hover:bg-green-500 text-white font-black p-8 rounded-[2rem] text-xl shadow-2xl transition-all disabled:opacity-30 italic group flex items-center justify-center gap-4"
                            >
                               Finalize Elite {docType} <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                         </div>
                      </div>
                  </div>
               </div>

               {generatedInvoice && (
                  <div id="invoice-preview-container" className="lg:col-span-12 mt-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 px-10 gap-6 text-center sm:text-left">
                         <h2 className="text-4xl font-black italic tracking-tight">{docType} <span className="text-green-500">Preview</span></h2>
                         <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
                            <button 
                              onClick={async () => {
                                const btn = document.getElementById('send-email-btn');
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '<span class="animate-pulse">Sending...</span>';
                                btn.disabled = true;
                                try {
                                  let selectedCustomer = isManual ? invoiceData.manual_customer : customers.find(c => c.id === invoiceData.customer_id);
                                  const response = await fetch('/api/send-invoice-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      email: selectedCustomer.email,
                                      name: selectedCustomer.name,
                                      subject: `Elite ${docType}: ${invoiceData.invoice_number} from Flora Lawn`,
                                      html: generatedInvoice,
                                      docType: docType
                                    })
                                  });
                                  const res = await response.json();
                                  if (res.success) {
                                    btn.innerHTML = '✅ Sent Successfully';
                                    btn.className = "bg-green-500 text-white font-black px-10 py-5 rounded-2xl flex items-center gap-4 transition-all shadow-xl";
                                  } else {
                                    throw new Error(res.error);
                                  }
                                } catch (err) {
                                  alert("Failed to send: " + err.message);
                                  btn.innerHTML = originalText;
                                  btn.disabled = false;
                                }
                              }}
                              id="send-email-btn"
                              className="bg-green-600 text-white font-black px-10 py-5 rounded-2xl flex items-center gap-4 hover:bg-green-500 hover:scale-105 transition-all shadow-xl shadow-green-500/20"
                            >
                               <EnvelopeIcon className="w-6 h-6" /> Send via Email
                            </button>
                            <button onClick={printInvoice} className="bg-white text-slate-900 font-black px-10 py-5 rounded-2xl flex items-center gap-4 hover:bg-green-400 hover:scale-105 transition-all shadow-xl">
                               <PrinterIcon className="w-6 h-6" /> Print {docType}
                            </button>
                         </div>
                      </div>
                      <div className="bg-white rounded-[3rem] p-12 md:p-24 shadow-2xl border border-white/10 min-h-[1000px] overflow-x-auto">
                          <div className="invoice-html-rendered text-slate-900" dangerouslySetInnerHTML={{ __html: generatedInvoice }} />
                      </div>
                  </div>
               )}
            </div>
         </div>
      </section>

      <Footer />
      <style jsx global>{`
        @media print {
          body > :not(#invoice-preview-container) { display: none !important; }
          #invoice-preview-container { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          .bg-slate-950 { background: white !important; }
          #invoice-preview-container h2, #invoice-preview-container button { display: none !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
        }
        .invoice-html-rendered table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
        .invoice-html-rendered th { text-align: left; padding: 1rem; border-bottom: 2px solid #e2e8f0; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; color: #64748b; }
        .invoice-html-rendered td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
      `}</style>
    </div>
  );
}

export default function InvoiceMakerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div></div>}>
      <InvoiceMakerContent />
    </Suspense>
  );
}
