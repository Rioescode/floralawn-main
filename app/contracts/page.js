'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PrinterIcon,
  ClipboardIcon,
  BookOpenIcon,
  PlusIcon,
  UserIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { CONTRACT_TEMPLATES, fillContractTemplate } from './templates';

const LAWN_CARE_SERVICES = {
  'mowing': 'Lawn Mowing',
  'fertilization': 'Lawn Fertilization',
  'weed_control': 'Weed Control',
  'aeration': 'Lawn Aeration',
  'overseeding': 'Overseeding',
  'mulching': 'Mulching',
  'hedge_trimming': 'Hedge Trimming',
  'garden_maintenance': 'Garden Maintenance',
  'spring_cleanup': 'Spring Cleanup',
  'fall_cleanup': 'Fall Cleanup',
  'leaf_removal': 'Leaf Removal',
  'snow_removal': 'Snow Removal',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [previewContractContent, setPreviewContractContent] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' or 'templates'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pendingLeads, setPendingLeads] = useState([]);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [contractFormData, setContractFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    propertySize: '',
    serviceFrequency: '',
    startDate: '',
    selectedServices: [],
    specialInstructions: '',
    monthlyPrice: '',
  });
  const [previewData, setPreviewData] = useState({
    CUSTOMER_NAME: 'John Doe',
    PROPERTY_ADDRESS: '123 Main Street',
    CITY: 'Providence',
    PHONE: '(401) 555-0123',
    EMAIL: 'john.doe@example.com',
    PROPERTY_SIZE: '1/2 acre',
    FREQUENCY: 'Weekly',
    DAY_OF_WEEK: 'Monday',
    START_DATE: new Date().toLocaleDateString(),
    MONTHLY_PRICE: '150',
    SPECIAL_INSTRUCTIONS: 'Please avoid the flower bed near the front door.',
    SEASON: 'Spring',
    END_SEASON: 'Fall',
    TIME_WINDOW: '9 AM - 5 PM',
    CONTRACT_DATE: new Date().toLocaleDateString(),
    END_DATE: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString(),
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchContracts();
      fetchPendingLeads();
    }
  }, [user]);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (user.email !== 'esckoofficial@gmail.com') {
        router.push('/');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from contracts table first
      let { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      // If contracts table doesn't exist, fetch from appointments with contract requests
      if (contractsError && contractsError.code === '42P01') {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('booking_type', 'Contract Request')
          .order('created_at', { ascending: false });

        if (appointmentsError) throw appointmentsError;
        
        // Transform appointments to contract format, extracting data from notes
        contractsData = appointmentsData?.map(apt => {
          // Parse notes to extract contract details
          const notes = apt.notes || '';
          const propertySizeMatch = notes.match(/Property Size:\s*(.+?)(?:\n|$)/i);
          const frequencyMatch = notes.match(/Frequency:\s*(.+?)(?:\n|$)/i);
          const priceMatch = notes.match(/Monthly Price:\s*\$?(.+?)(?:\n|$)/i);
          const instructionsMatch = notes.match(/Special Instructions:\s*(.+?)(?:\n*$)/is);
          
          // Map service names to IDs
          const serviceNames = apt.service_type?.split(', ') || [];
          const serviceIds = serviceNames.map(name => {
            const trimmed = name.trim();
            const id = Object.keys(LAWN_CARE_SERVICES).find(
              key => LAWN_CARE_SERVICES[key] === trimmed
            );
            return id || trimmed.toLowerCase().replace(/\s+/g, '_');
          });

          return {
            id: apt.id,
            customer_name: apt.customer_name,
            customer_email: apt.customer_email,
            customer_phone: apt.customer_phone,
            property_address: apt.street_address,
            city: apt.city,
            property_size: propertySizeMatch ? propertySizeMatch[1].trim() : '',
            service_frequency: frequencyMatch ? frequencyMatch[1].trim() : '',
            monthly_price: priceMatch ? priceMatch[1].trim() : '',
            start_date: apt.date,
            selected_services: serviceIds,
            special_instructions: instructionsMatch ? instructionsMatch[1].trim() : notes.split('Special Instructions:')[0] || '',
            status: apt.status || 'pending',
            created_at: apt.created_at,
          };
        }) || [];
      } else if (contractsError) {
        throw contractsError;
      }

      setContracts(contractsData || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLeads = async () => {
    try {
      // Fetch pending appointments (leads) - exclude Contract Request type as those are already confirmations
      const { data: leadsData, error: leadsError } = await supabase
        .from('appointments')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .neq('booking_type', 'Contract Request') // Exclude contract requests
        .order('created_at', { ascending: false })
        .limit(100);

      if (leadsError) {
        console.error('Error fetching pending leads:', leadsError);
        return;
      }

      // Also fetch pending customers from customers table
      try {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!customersError && customersData) {
          // Transform customers to appointment format
          const customerLeads = customersData.map(customer => ({
            id: customer.id,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            service_type: customer.service_type || 'Lawn Care',
            city: customer.address?.split(',')[1]?.trim() || '',
            street_address: customer.address?.split(',')[0]?.trim() || '',
            date: customer.next_service || new Date().toISOString(),
            notes: customer.notes || 'Contact form inquiry',
            status: 'pending',
            booking_type: 'Ready to Hire',
            created_at: customer.created_at,
          }));

          // Combine appointments and customer leads, remove duplicates by email
          const allLeads = [...(leadsData || []), ...customerLeads];
          const uniqueLeads = allLeads.filter((lead, index, self) =>
            index === self.findIndex(l => l.customer_email === lead.customer_email)
          );

          setPendingLeads(uniqueLeads);
        } else {
          setPendingLeads(leadsData || []);
        }
      } catch (customerError) {
        console.error('Error fetching customer leads:', customerError);
        setPendingLeads(leadsData || []);
      }
    } catch (error) {
      console.error('Error fetching pending leads:', error);
    }
  };

  const handleEditContract = (contract) => {
    setEditingContract(contract);
    
    // Convert service IDs/names to array format
    let services = [];
    if (contract.selected_services && Array.isArray(contract.selected_services)) {
      services = contract.selected_services;
    } else if (contract.selected_services) {
      // If it's a string, try to parse it
      services = contract.selected_services.split(',').map(s => s.trim());
    }
    
    // Map service names to IDs if needed
    const serviceIds = services.map(service => {
      // Check if it's already an ID
      if (LAWN_CARE_SERVICES[service]) {
        return service;
      }
      // Try to find the ID from the service name
      const id = Object.keys(LAWN_CARE_SERVICES).find(
        key => LAWN_CARE_SERVICES[key] === service
      );
      return id || service;
    }).filter(id => id && LAWN_CARE_SERVICES[id]);

    // Pre-fill form with contract data
    setContractFormData({
      customerName: contract.customer_name || '',
      email: contract.customer_email || '',
      phone: contract.customer_phone || '',
      address: contract.property_address || '',
      city: contract.city || '',
      propertySize: contract.property_size || '',
      serviceFrequency: contract.service_frequency || '',
      startDate: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
      selectedServices: serviceIds,
      specialInstructions: contract.special_instructions || '',
      monthlyPrice: contract.monthly_price || '',
    });

    setShowEditContractModal(true);
  };

  const handleUpdateContract = async () => {
    try {
      setSending(true);
      setSendError('');

      // Update contract data
      const contractData = {
        customer_name: contractFormData.customerName,
        customer_email: contractFormData.email,
        customer_phone: contractFormData.phone,
        property_address: contractFormData.address,
        city: contractFormData.city,
        property_size: contractFormData.propertySize,
        service_frequency: contractFormData.serviceFrequency,
        start_date: contractFormData.startDate || null,
        selected_services: contractFormData.selectedServices,
        special_instructions: contractFormData.specialInstructions,
        monthly_price: contractFormData.monthlyPrice || null,
      };

      // Try to update in contracts table
      try {
        const { error: updateError } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', editingContract.id);

        if (updateError && updateError.code !== '42P01') {
          throw updateError;
        }
      } catch (dbErr) {
        // If contracts table doesn't exist, update in appointments table
        const { error: aptError } = await supabase
          .from('appointments')
          .update({
            customer_name: contractFormData.customerName,
            customer_email: contractFormData.email,
            customer_phone: contractFormData.phone,
            service_type: contractFormData.selectedServices.map(id => LAWN_CARE_SERVICES[id] || id).join(', '),
            city: contractFormData.city,
            street_address: contractFormData.address,
            date: contractFormData.startDate ? new Date(contractFormData.startDate).toISOString() : new Date().toISOString(),
            notes: `Contract Request\n\nProperty Size: ${contractFormData.propertySize || 'Not specified'}\nFrequency: ${contractFormData.serviceFrequency || 'Not specified'}\nMonthly Price: $${contractFormData.monthlyPrice || 'To be determined'}\n\nSpecial Instructions: ${contractFormData.specialInstructions || 'None'}`,
          })
          .eq('id', editingContract.id);

        if (aptError) throw aptError;
      }

      // Refresh contracts
      fetchContracts();

      setSendSuccess('Service confirmation updated successfully!');
      setTimeout(() => {
        setShowEditContractModal(false);
        setEditingContract(null);
        setContractFormData({
          customerName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          propertySize: '',
          serviceFrequency: '',
          startDate: '',
          selectedServices: [],
          specialInstructions: '',
          monthlyPrice: '',
        });
        setSendSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error updating contract:', error);
      setSendError(error.message || 'Failed to update contract');
    } finally {
      setSending(false);
    }
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    
    // Map service_type to selected services
    const services = lead.service_type?.split(', ').map(s => {
      // Convert service names to IDs
      const serviceId = Object.keys(LAWN_CARE_SERVICES).find(
        id => LAWN_CARE_SERVICES[id] === s.trim()
      );
      return serviceId || s.trim().toLowerCase().replace(/\s+/g, '_');
    }) || [];

    // Auto-fill contract form with lead data
    setContractFormData({
      customerName: lead.customer_name || '',
      email: lead.customer_email || '',
      phone: lead.customer_phone || '',
      address: lead.street_address || '',
      city: lead.city || '',
      propertySize: '',
      serviceFrequency: '',
      startDate: lead.date ? new Date(lead.date).toISOString().split('T')[0] : '',
      selectedServices: services,
      specialInstructions: lead.notes || '',
      monthlyPrice: '',
    });

    setShowCreateContractModal(true);
  };

  const handleCreateContract = async () => {
    try {
      setSending(true);
      setSendError('');

      // Create contract data with all selected options
      const contractData = {
        customer_name: contractFormData.customerName,
        customer_email: contractFormData.email,
        customer_phone: contractFormData.phone,
        property_address: contractFormData.address,
        city: contractFormData.city,
        property_size: contractFormData.propertySize,
        service_frequency: contractFormData.serviceFrequency,
        start_date: contractFormData.startDate || null,
        selected_services: contractFormData.selectedServices,
        special_instructions: contractFormData.specialInstructions,
        monthly_price: contractFormData.monthlyPrice || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Try to save to contracts table
      let contractResult;
      try {
        const { data, error: dbError } = await supabase
          .from('contracts')
          .insert([contractData])
          .select()
          .single();

        if (dbError && dbError.code !== '42P01') {
          throw dbError;
        }
        contractResult = data;
      } catch (dbErr) {
        // If contracts table doesn't exist, create as appointment with Contract Request type
        const { data, error: aptError } = await supabase
          .from('appointments')
          .insert([{
            customer_name: contractFormData.customerName,
            customer_email: contractFormData.email,
            customer_phone: contractFormData.phone,
            service_type: contractFormData.selectedServices.map(id => LAWN_CARE_SERVICES[id] || id).join(', '),
            city: contractFormData.city,
            street_address: contractFormData.address,
            date: contractFormData.startDate ? new Date(contractFormData.startDate).toISOString() : new Date().toISOString(),
            notes: `Contract Request\n\nProperty Size: ${contractFormData.propertySize || 'Not specified'}\nFrequency: ${contractFormData.serviceFrequency || 'Not specified'}\nMonthly Price: $${contractFormData.monthlyPrice || 'To be determined'}\n\nSpecial Instructions: ${contractFormData.specialInstructions || 'None'}`,
            status: 'pending',
            booking_type: 'Contract Request'
          }])
          .select()
          .single();

        if (aptError) throw aptError;
        contractResult = { id: data.id, ...contractData };
      }

      // Update the lead status if it was selected
      if (selectedLead) {
        try {
          await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', selectedLead.id);
        } catch (updateError) {
          // Ignore errors when updating lead status
          console.log('Note: Could not update lead status:', updateError);
        }
      }

      // Refresh contracts and leads
      fetchContracts();
      fetchPendingLeads();

      setSendSuccess('Service confirmation created successfully!');
      setTimeout(() => {
        setShowCreateContractModal(false);
        setSelectedLead(null);
        setContractFormData({
          customerName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          propertySize: '',
          serviceFrequency: '',
          startDate: '',
          selectedServices: [],
          specialInstructions: '',
          monthlyPrice: '',
        });
        setSendSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error creating contract:', error);
      setSendError(error.message || 'Failed to create contract');
    } finally {
      setSending(false);
    }
  };

  const filterContracts = () => {
    let filtered = contracts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.customer_name?.toLowerCase().includes(term) ||
        contract.customer_email?.toLowerCase().includes(term) ||
        contract.customer_phone?.includes(term) ||
        contract.city?.toLowerCase().includes(term) ||
        contract.property_address?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  };

  const handleSendContract = async () => {
    if (!selectedContract) return;
    
    if (!sendEmail && !sendSMS) {
      setSendError('Please select at least one delivery method (Email or SMS)');
      return;
    }

    setSending(true);
    setSendError('');
    setSendSuccess('');

    try {
      const response = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContract.id,
          sendEmail,
          sendSMS,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send contract');
      }

      setSendSuccess(
        `${sendEmail && result.emailSent ? 'Email sent. ' : ''}` +
        `${sendSMS && result.smsSent ? 'SMS sent. ' : ''}` +
        `${result.errors?.length ? 'Some errors: ' + result.errors.join(', ') : ''}`
      );

      // Update contract status if sent successfully
      if (result.emailSent || result.smsSent) {
        try {
          await supabase
            .from('contracts')
            .update({ status: 'sent' })
            .eq('id', selectedContract.id);
        } catch (dbError) {
          // Ignore if contracts table doesn't exist - try appointments table instead
          try {
            await supabase
              .from('appointments')
              .update({ status: 'sent' })
              .eq('id', selectedContract.id);
          } catch (aptError) {
            // Ignore - status update is not critical
            console.log('Could not update status:', aptError);
          }
        }
        
        fetchContracts();
      }

      setTimeout(() => {
        setShowSendModal(false);
        setSelectedContract(null);
        setSendSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error sending contract:', error);
      setSendError(error.message || 'Failed to send contract');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatServices = (services) => {
    if (!services || !Array.isArray(services)) {
      return 'N/A';
    }
    return services.map(id => LAWN_CARE_SERVICES[id] || id).join(', ');
  };

  const handlePreviewContract = (contract) => {
    setSelectedContract(contract);
    
    // Format frequency for display
    const formatFrequency = (freq) => {
      if (!freq) return '';
      const freqMap = {
        'weekly': 'Weekly',
        'biweekly': 'Bi-Weekly',
        'monthly': 'Monthly',
        'one_time': 'One-Time Service',
        'seasonal': 'Seasonal'
      };
      return freqMap[freq] || freq;
    };

    // Get day of week from start date or default
    const getDayOfWeek = (date) => {
      if (!date) return 'Monday';
      const d = new Date(date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.getDay()];
    };

    // Build services list from selected services only - filter out invalid entries
    const buildServicesList = (selectedServices) => {
      if (!selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
        return 'Services to be determined';
      }
      
      // Filter and map only valid services
      const validServices = selectedServices
        .filter(id => {
          // Filter out null, undefined, empty strings, and invalid IDs
          if (!id || typeof id !== 'string') return false;
          // Check if it's a valid service ID or if it maps to a service name
          return LAWN_CARE_SERVICES[id] || id;
        })
        .map(serviceId => {
          const serviceName = LAWN_CARE_SERVICES[serviceId] || serviceId;
          return serviceName;
        })
        .filter(name => name && name !== 'undefined' && name !== 'null' && name.trim() !== '');
      
      if (validServices.length === 0) {
        return 'Services to be determined';
      }
      
      return validServices.map(serviceName => `✓ ${serviceName}`).join('\n');
    };

    // Prepare data for template with all contract details
    const contractData = {
      CUSTOMER_NAME: contract.customer_name || '[CUSTOMER_NAME]',
      PROPERTY_ADDRESS: contract.property_address || '[PROPERTY_ADDRESS]',
      CITY: contract.city || '[CITY]',
      PHONE: contract.customer_phone || '[PHONE]',
      EMAIL: contract.customer_email || '[EMAIL]',
      PROPERTY_SIZE: contract.property_size || 'Not specified',
      FREQUENCY: formatFrequency(contract.service_frequency) || 'To be determined',
      DAY_OF_WEEK: contract.start_date ? getDayOfWeek(contract.start_date) : 'Monday',
      START_DATE: contract.start_date ? new Date(contract.start_date).toLocaleDateString() : new Date().toLocaleDateString(),
      MONTHLY_PRICE: contract.monthly_price || contract.monthlyPrice || '[MONTHLY_PRICE]',
      SPECIAL_INSTRUCTIONS: contract.special_instructions || 'None',
      SEASON: 'Spring',
      END_SEASON: 'Fall',
      TIME_WINDOW: '9 AM - 5 PM',
      CONTRACT_DATE: contract.created_at ? new Date(contract.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      END_DATE: contract.start_date ? new Date(new Date(contract.start_date).setFullYear(new Date(contract.start_date).getFullYear() + 1)).toLocaleDateString() : '[END_DATE]',
      SERVICES_LIST: formatServices(contract.selected_services),
      SELECTED_SERVICES_LIST: buildServicesList(contract.selected_services),
    };

    // Choose template based on services and frequency
    const serviceCount = contract.selected_services?.length || 0;
    const frequency = contract.service_frequency;
    let templateKey = 'basic_weekly';
    
    if (frequency === 'seasonal') {
      templateKey = 'seasonal_contract';
    } else if (serviceCount > 5 || frequency === 'monthly') {
      templateKey = 'comprehensive_monthly';
    } else if (serviceCount > 3) {
      templateKey = 'comprehensive_monthly';
    } else {
      templateKey = 'basic_weekly';
    }

    const template = CONTRACT_TEMPLATES[templateKey];
    let filledContent = fillContractTemplate(template.content, contractData);
    
    // Build the services list with ONLY selected services
    const selectedServicesList = contract.selected_services && contract.selected_services.length > 0
      ? buildServicesList(contract.selected_services)
      : 'Services to be determined';
    
    // Replace the SERVICES INCLUDED section - find it and replace everything until the next section
    const servicesStart = filledContent.indexOf('SERVICES INCLUDED:');
    if (servicesStart !== -1) {
      // Find the end of the services section (next blank line followed by uppercase heading)
      let servicesEnd = filledContent.indexOf('\n\n', servicesStart);
      if (servicesEnd === -1) {
        servicesEnd = filledContent.indexOf('\nSERVICE SCHEDULE', servicesStart);
      }
      if (servicesEnd === -1) {
        servicesEnd = filledContent.indexOf('\nPROPERTY DETAILS', servicesStart);
      }
      if (servicesEnd === -1) {
        servicesEnd = filledContent.indexOf('\nPRICING', servicesStart);
      }
      if (servicesEnd === -1) {
        servicesEnd = filledContent.length;
      }
      
      // Replace the entire services section with only selected services
      const beforeServices = filledContent.substring(0, servicesStart);
      const afterServices = filledContent.substring(servicesEnd);
      filledContent = beforeServices + `SERVICES INCLUDED:\n${selectedServicesList}` + afterServices;
    }
    
    setPreviewContractContent(filledContent);
    setShowContractPreview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <DocumentTextIcon className="w-8 h-8 text-green-600" />
                  Service Confirmations
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create and send service confirmations to customers
                </p>
              </div>
              {activeTab === 'contracts' && (
                <button
                  onClick={() => {
                    setShowCreateContractModal(true);
                    fetchPendingLeads();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Service Confirmation
                </button>
              )}
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'contracts'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                  <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Confirmations ({contracts.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'templates'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                  <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5" />
                  Templates
                </div>
              </button>
            </div>
          </div>

          {activeTab === 'contracts' && (
            <>
              {/* Filters */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FunnelIcon className="w-5 h-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contracts List */}
            </>
          )}

          {activeTab === 'templates' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Service Confirmation Templates</h2>
                <p className="text-gray-600 text-sm">
                  Choose from friendly service confirmation templates. Click "Preview" to see a sample, or use them when sending confirmations to customers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(CONTRACT_TEMPLATES).map(([key, template]) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{template.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {key === 'basic_weekly' && 'Perfect for simple weekly lawn mowing services'}
                      {key === 'comprehensive_monthly' && 'Complete lawn care package with all services included'}
                      {key === 'seasonal_contract' && 'Full-season services covering spring, summer, and fall'}
                      {key === 'commercial_contract' && 'Professional service confirmation for business properties'}
                      {key === 'simple_agreement' && 'Quick and simple confirmation for basic services'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const filled = fillContractTemplate(template.content, previewData);
                          setSelectedTemplate({ ...template, filledContent: filled });
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Templates</h3>
                <ul className="list-disc list-inside text-blue-800 space-y-2 text-sm">
                  <li>Click "Preview" to see a sample service confirmation with example data</li>
                  <li>When sending confirmations, the system automatically uses appropriate templates</li>
                  <li>Replace placeholders like [CUSTOMER_NAME] with actual customer information</li>
                  <li>Customize services and pricing based on what the customer requested</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <>
              {/* Contracts List */}
          <div className="divide-y divide-gray-200">
            {filteredContracts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No contracts found.
              </div>
            ) : (
              filteredContracts.map((contract) => (
                <div key={contract.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.customer_name || 'Unknown'}
                        </h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                          <span>{contract.customer_email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          <span>{contract.customer_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Services:</span>
                          <span>{formatServices(contract.selected_services)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span>{contract.service_frequency || 'N/A'}</span>
                        </div>
                        {contract.property_address && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Address:</span>{' '}
                            {contract.property_address}, {contract.city}
                          </div>
                        )}
                        {contract.property_size && (
                          <div>
                            <span className="font-medium">Property Size:</span> {contract.property_size}
                          </div>
                        )}
                        {contract.start_date && (
                          <div>
                            <span className="font-medium">Start Date:</span>{' '}
                            {format(new Date(contract.start_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        {contract.special_instructions && (
                          <div className="md:col-span-2 mt-2 p-2 bg-gray-50 rounded text-xs">
                            <span className="font-medium">Notes:</span> {contract.special_instructions}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-400">
                        Submitted: {format(new Date(contract.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handlePreviewContract(contract)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleEditContract(contract)}
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowSendModal(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Send Contract Modal */}
      {showSendModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Send Service Confirmation</h2>
              <p className="mt-1 text-sm text-gray-500">
                Send service confirmation to {selectedContract.customer_name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {sendSuccess}
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      Send via Email
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedContract.customer_email || 'No email available'}
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendSMS}
                    onChange={(e) => setSendSMS(e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      Send via SMS
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedContract.customer_phone || 'No phone number available'}
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-2">Service Summary:</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Services:</strong> {formatServices(selectedContract.selected_services)}</div>
                  {selectedContract.service_frequency && (
                    <div><strong>Frequency:</strong> {selectedContract.service_frequency}</div>
                  )}
                  {selectedContract.property_size && (
                    <div><strong>Property Size:</strong> {selectedContract.property_size}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSelectedContract(null);
                  setSendError('');
                  setSendSuccess('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendContract}
                disabled={sending || (!sendEmail && !sendSMS)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  sending || (!sendEmail && !sendSMS)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {sending ? 'Sending...' : 'Send Confirmation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract from Lead Modal */}
      {showCreateContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Service Confirmation</h2>
              <p className="mt-1 text-sm text-gray-500">
                Select a lead to create a friendly service confirmation
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                  {sendSuccess}
                </div>
              )}

              {!selectedLead ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Select a Lead</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingLeads.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No pending leads found.
                      </div>
                    ) : (
                      pendingLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{lead.customer_name}</h4>
                              <div className="mt-2 text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <EnvelopeIcon className="w-4 h-4" />
                                  {lead.customer_email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <PhoneIcon className="w-4 h-4" />
                                  {lead.customer_phone}
                                </div>
                                <div className="flex items-center gap-2">
                                  <DocumentTextIcon className="w-4 h-4" />
                                  <span className="font-medium">Service:</span> {lead.service_type}
                                </div>
                                {lead.city && (
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    {lead.city} • {format(new Date(lead.date), 'MMM d, yyyy')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Service Confirmation Details</h3>
                    <button
                      onClick={() => {
                        setSelectedLead(null);
                        setContractFormData({
                          customerName: '',
                          email: '',
                          phone: '',
                          address: '',
                          city: '',
                          propertySize: '',
                          serviceFrequency: '',
                          startDate: '',
                          selectedServices: [],
                          specialInstructions: '',
                          monthlyPrice: '',
                        });
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Change Lead
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contractFormData.customerName}
                        onChange={(e) => setContractFormData({...contractFormData, customerName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={contractFormData.email}
                        onChange={(e) => setContractFormData({...contractFormData, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={contractFormData.phone}
                        onChange={(e) => setContractFormData({...contractFormData, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contractFormData.city}
                        onChange={(e) => setContractFormData({...contractFormData, city: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={contractFormData.address}
                        onChange={(e) => setContractFormData({...contractFormData, address: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Size
                      </label>
                      <select
                        value={contractFormData.propertySize}
                        onChange={(e) => setContractFormData({...contractFormData, propertySize: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select size</option>
                        <option value="Less than 1/4 acre">Less than 1/4 acre</option>
                        <option value="1/4 to 1/2 acre">1/4 to 1/2 acre</option>
                        <option value="1/2 to 1 acre">1/2 to 1 acre</option>
                        <option value="1 to 2 acres">1 to 2 acres</option>
                        <option value="More than 2 acres">More than 2 acres</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Frequency
                      </label>
                      <select
                        value={contractFormData.serviceFrequency}
                        onChange={(e) => setContractFormData({...contractFormData, serviceFrequency: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select frequency</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="one_time">One-Time</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={contractFormData.startDate}
                        onChange={(e) => setContractFormData({...contractFormData, startDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Price ($)
                      </label>
                      <input
                        type="number"
                        value={contractFormData.monthlyPrice}
                        onChange={(e) => setContractFormData({...contractFormData, monthlyPrice: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="150"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Services <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {Object.entries(LAWN_CARE_SERVICES).map(([id, name]) => (
                          <label key={id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={contractFormData.selectedServices.includes(id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setContractFormData({
                                    ...contractFormData,
                                    selectedServices: [...contractFormData.selectedServices, id]
                                  });
                                } else {
                                  setContractFormData({
                                    ...contractFormData,
                                    selectedServices: contractFormData.selectedServices.filter(s => s !== id)
                                  });
                                }
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        value={contractFormData.specialInstructions}
                        onChange={(e) => setContractFormData({...contractFormData, specialInstructions: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Any special requests or notes..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateContractModal(false);
                  setSelectedLead(null);
                  setContractFormData({
                    customerName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    propertySize: '',
                    serviceFrequency: '',
                    startDate: '',
                    selectedServices: [],
                    specialInstructions: '',
                    monthlyPrice: '',
                  });
                  setSendError('');
                  setSendSuccess('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={sending}
              >
                Cancel
              </button>
              {selectedLead && (
                <button
                  onClick={handleCreateContract}
                  disabled={sending || !contractFormData.customerName || !contractFormData.email || !contractFormData.phone || contractFormData.selectedServices.length === 0}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    sending || !contractFormData.customerName || !contractFormData.email || !contractFormData.phone || contractFormData.selectedServices.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {sending ? 'Creating...' : 'Create Confirmation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {showContractPreview && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
              <h2 className="text-2xl font-bold text-gray-900">Service Confirmation Preview</h2>
              <p className="mt-1 text-sm text-gray-500">
                Preview service confirmation for {selectedContract.customer_name}
              </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Contract - ${selectedContract.customer_name}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                            h1 { color: #22C55E; }
                            h2 { color: #111827; margin-top: 20px; }
                            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
                          </style>
                        </head>
                        <body>
                          <h1>Contract Preview</h1>
                          <pre>${previewContractContent}</pre>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    setShowContractPreview(false);
                    setSelectedContract(null);
                    setPreviewContractContent('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowContractPreview(false);
                    setShowSendModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Send Confirmation
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {previewContractContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {showEditContractModal && editingContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Service Confirmation</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update service confirmation details for {editingContract.customer_name}
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                  {sendSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractFormData.customerName}
                      onChange={(e) => setContractFormData({...contractFormData, customerName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={contractFormData.email}
                      onChange={(e) => setContractFormData({...contractFormData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contractFormData.phone}
                      onChange={(e) => setContractFormData({...contractFormData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractFormData.city}
                      onChange={(e) => setContractFormData({...contractFormData, city: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={contractFormData.address}
                      onChange={(e) => setContractFormData({...contractFormData, address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Size
                    </label>
                    <select
                      value={contractFormData.propertySize}
                      onChange={(e) => setContractFormData({...contractFormData, propertySize: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select size</option>
                      <option value="Less than 1/4 acre">Less than 1/4 acre</option>
                      <option value="1/4 to 1/2 acre">1/4 to 1/2 acre</option>
                      <option value="1/2 to 1 acre">1/2 to 1 acre</option>
                      <option value="1 to 2 acres">1 to 2 acres</option>
                      <option value="More than 2 acres">More than 2 acres</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Frequency
                    </label>
                    <select
                      value={contractFormData.serviceFrequency}
                      onChange={(e) => setContractFormData({...contractFormData, serviceFrequency: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="one_time">One-Time</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={contractFormData.startDate}
                      onChange={(e) => setContractFormData({...contractFormData, startDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      value={contractFormData.monthlyPrice}
                      onChange={(e) => setContractFormData({...contractFormData, monthlyPrice: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="150"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Services <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {Object.entries(LAWN_CARE_SERVICES).map(([id, name]) => (
                        <label key={id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contractFormData.selectedServices.includes(id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setContractFormData({
                                  ...contractFormData,
                                  selectedServices: [...contractFormData.selectedServices, id]
                                });
                              } else {
                                setContractFormData({
                                  ...contractFormData,
                                  selectedServices: contractFormData.selectedServices.filter(s => s !== id)
                                });
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={contractFormData.specialInstructions}
                      onChange={(e) => setContractFormData({...contractFormData, specialInstructions: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditContractModal(false);
                  setEditingContract(null);
                  setContractFormData({
                    customerName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    propertySize: '',
                    serviceFrequency: '',
                    startDate: '',
                    selectedServices: [],
                    specialInstructions: '',
                    monthlyPrice: '',
                  });
                  setSendError('');
                  setSendSuccess('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateContract}
                disabled={sending || !contractFormData.customerName || !contractFormData.email || !contractFormData.phone || contractFormData.selectedServices.length === 0}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  sending || !contractFormData.customerName || !contractFormData.email || !contractFormData.phone || contractFormData.selectedServices.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {sending ? 'Updating...' : 'Update Confirmation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.title}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>${selectedTemplate.title}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                            h1 { color: #22C55E; }
                            h2 { color: #111827; margin-top: 20px; }
                            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
                          </style>
                        </head>
                        <body>
                          <h1>${selectedTemplate.title}</h1>
                          <pre>${selectedTemplate.filledContent}</pre>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedTemplate.filledContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

