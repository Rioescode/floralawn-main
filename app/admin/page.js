'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from './error-boundary';
import {
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserPlusIcon,
  GiftIcon,
  BanknotesIcon,
  Squares2X2Icon,
  AtSymbolIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    service_type: 'lawn_mowing',
    frequency: 'weekly',
    price: '',
    status: 'active',
    notes: ''
  });
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    service_type: 'lawn_mowing',
    frequency: 'weekly',
    price: '',
    next_service: '',
    status: 'active',
    notes: '',
    user_id: null
  });
  const [userAccounts, setUserAccounts] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Additional features state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showEmailList, setShowEmailList] = useState(false);
  const [showMonthlyRevenue, setShowMonthlyRevenue] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [showBookingRequests, setShowBookingRequests] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [skippedServices, setSkippedServices] = useState([]);
  const [newLeadNotification, setNewLeadNotification] = useState(null);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalExpenses: 0
  });

  const [workingMonths, setWorkingMonths] = useState([
    'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'
  ]);

  const [monthlyExpenses, setMonthlyExpenses] = useState({
    January: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    February: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    March: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    April: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    May: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    June: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    July: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    August: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    September: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    October: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    November: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 },
    December: { gas: 0, employee: 0, equipment: 0, maintenance: 0, other: 0 }
  });

  const [monthlyActualRevenue, setMonthlyActualRevenue] = useState({
    January: 0, February: 0, March: 0, April: 0, May: 0, June: 0,
    July: 0, August: 0, September: 0, October: 0, November: 0, December: 0
  });

  const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchAppointments();
      fetchUserAccounts();
      fetchSkippedServices();
      
      // Real-time subscription for new leads
      const appointmentsChannel = supabase
        .channel('admin-appointments')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'appointments', filter: 'status=eq.pending' }, 
          (payload) => {
            const newLead = payload.new;
            if (newLead.booking_type === 'Ready to Hire' || newLead.booking_type === 'Contract Request') {
              fetchAppointments();
              setNewLeadNotification({
                name: newLead.customer_name || 'Unknown',
                email: newLead.customer_email || '',
                service: newLead.service_type || 'Service Request',
                time: new Date().toLocaleTimeString()
              });
              setTimeout(() => setNewLeadNotification(null), 10000);
            }
          }
        )
        .subscribe();
      
      // Real-time subscription for new customers
      const customersChannel = supabase
        .channel('admin-customers')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'customers' }, 
          () => fetchCustomers()
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'customers' }, 
          () => fetchCustomers()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(appointmentsChannel);
        supabase.removeChannel(customersChannel);
      };
    }
  }, [user]);

  const fetchUserAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserAccounts(data || []);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
    }
  };

  const filteredUserAccounts = userAccounts.filter(account => {
    if (!userSearchTerm) return true;
    const search = userSearchTerm.toLowerCase();
    return (
      account.email?.toLowerCase().includes(search) ||
      account.full_name?.toLowerCase().includes(search)
    );
  });

  const selectUserAccount = (account) => {
    setSelectedUser(account);
    setNewCustomerData({...newCustomerData, user_id: account.id});
    setUserSearchTerm('');
    setShowUserSelector(false);
  };

  const hasCustomerRecord = (userId) => {
    return customers.some(c => c.user_id === userId);
  };

  useEffect(() => {
    filterCustomers();
    calculateStats();
  }, [customers, searchTerm, statusFilter, workingMonths, monthlyExpenses, monthlyActualRevenue]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        router.push('/login');
        return;
      }
      
      // Check admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      
      const emailMatch = currentUser.email?.toLowerCase().trim() === 'esckoofficial@gmail.com';
      const isAdmin = profile?.role === 'admin' || emailMatch;
      
      if (!isAdmin) {
        router.push('/');
        return;
      }
      
      setUser(currentUser);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAppointments(data || []);
      
      const pendingLeads = (data || []).filter(apt => 
        apt.status === 'pending' &&
        (apt.booking_type === 'Ready to Hire' || apt.booking_type === 'Contract Request')
      );
      setPendingLeadsCount(pendingLeads.length);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchSkippedServices = async () => {
    try {
      const { data, error } = await supabase
        .from('skipped_services')
        .select(`*, customers (id, name, email, phone, service_type, frequency)`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSkippedServices(data || []);
    } catch (error) {
      console.error('Error fetching skipped services:', error);
    }
  };

  const calculateStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const pendingCustomers = customers.filter(c => c.status === 'pending').length;
    const workingMonthsCount = workingMonths.length;

    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    
    const revenueCustomers = customers.filter(c => c.status === 'active' || c.status === 'pending');
    
    revenueCustomers.forEach(customer => {
      const price = parseFloat(customer.price) || 0;
      switch (customer.frequency) {
        case 'weekly':
          weeklyRevenue += price;
          monthlyRevenue += price * 4;
          break;
        case 'bi_weekly':
        case 'bi-weekly':
          weeklyRevenue += price * 0.5;
          monthlyRevenue += price * 2;
          break;
        case 'monthly':
          weeklyRevenue += price * 0.25;
          monthlyRevenue += price;
          break;
        default:
          weeklyRevenue += price * 0.25;
          monthlyRevenue += price;
      }
    });

    const projectedYearlyRevenue = Math.round(monthlyRevenue * workingMonthsCount);
    const actualWorkingRevenue = workingMonths.reduce((sum, month) => sum + (parseFloat(monthlyActualRevenue[month]) || 0), 0);
    
    const totalWorkingExpenses = workingMonths.reduce((sum, month) => {
      const monthExp = monthlyExpenses[month];
      return sum + Object.values(monthExp).reduce((s, e) => s + (parseFloat(e) || 0), 0);
    }, 0);

    setStats({
      total: totalCustomers,
      active: activeCustomers,
      pending: pendingCustomers,
      weeklyRevenue: Math.round(weeklyRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      yearlyRevenue: projectedYearlyRevenue,
      actualRevenue: Math.round(actualWorkingRevenue),
      totalExpenses: Math.round(totalWorkingExpenses),
      netProfit: Math.round(actualWorkingRevenue - totalWorkingExpenses),
      workingMonthsCount
    });
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const toggleMonth = (month) => {
    setWorkingMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const formatServiceType = (type) => {
    if (!type) return 'N/A';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirmCustomer = async (customerId) => {
    try {
      setActionLoading(customerId);
      const { error } = await supabase
        .from('customers')
        .update({ status: 'active' })
        .eq('id', customerId);
      
      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      console.error('Error confirming customer:', error);
      alert('Failed to confirm customer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleScratchCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to scratch this customer?')) return;
    
    try {
      setActionLoading(customerId);
      const { error } = await supabase
        .from('customers')
        .update({ status: 'cancelled' })
        .eq('id', customerId);
      
      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      console.error('Error scratching customer:', error);
      alert('Failed to scratch customer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnscratchCustomer = async (customerId) => {
    try {
      setActionLoading(customerId);
      const { error } = await supabase
        .from('customers')
        .update({ status: 'active' })
        .eq('id', customerId);
      
      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      console.error('Error unscratching customer:', error);
      alert('Failed to unscratch customer');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (customer) => {
    setEditFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      service_type: customer.service_type || 'lawn_mowing',
      frequency: customer.frequency || 'weekly',
      price: customer.price || '',
      status: customer.status || 'active',
      notes: customer.notes || ''
    });
    setEditingCustomer(customer);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(editingCustomer.id);
      const { error } = await supabase
        .from('customers')
        .update(editFormData)
        .eq('id', editingCustomer.id);
      
      if (error) throw error;
      
      setEditingCustomer(null);
      fetchCustomers();
      alert('Customer updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setActionLoading('new');
      
      // Prepare data, convert empty strings to null for optional fields
      const submitData = {
        ...newCustomerData,
        next_service: newCustomerData.next_service || null,
        user_id: newCustomerData.user_id || null
      };
      
      const { error } = await supabase
        .from('customers')
        .insert([submitData]);
      
      if (error) throw error;
      
      setShowAddCustomer(false);
      setSelectedUser(null);
      setUserSearchTerm('');
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
        address: '',
        service_type: 'lawn_mowing',
        frequency: 'weekly',
        price: '',
        next_service: '',
        status: 'active',
        notes: '',
        user_id: null
      });
      fetchCustomers();
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    } finally {
      setActionLoading(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Service', 'Frequency', 'Price', 'Status'];
    const csvData = filteredCustomers.map(c => [
      c.name, c.email, c.phone, c.address, c.service_type, c.frequency, c.price, c.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* New Lead Notification Toast */}
        {newLeadNotification && (
          <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm animate-pulse">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">New Lead!</h3>
                <p className="text-xs font-medium">{newLeadNotification.name}</p>
                <p className="text-xs">{newLeadNotification.service}</p>
                <p className="text-xs opacity-75">{newLeadNotification.time}</p>
              </div>
              <button onClick={() => setNewLeadNotification(null)} className="text-white hover:text-gray-200">
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Top Navigation Menu - Row 1: Page Links */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pendingLeadsCount > 0 && (
                <Link href="/admin/signups-leads" className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  {pendingLeadsCount} New
                </Link>
              )}
              <Link href="/admin/signups-leads" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
                <UserPlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Ups &</span> Leads
              </Link>
              <Link href="/admin/work-requests" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
                <ClockIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Work</span> Requests
              </Link>
              <Link href="/admin/completed-jobs" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
                <CheckCircleIcon className="w-4 h-4" />
                Completed
              </Link>
              <Link href="/admin/completion-history" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors">
                <ChartBarIcon className="w-4 h-4" />
                History
              </Link>
              <Link href="/contracts" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
                <DocumentTextIcon className="w-4 h-4" />
                Contracts
              </Link>
              <Link href="/admin/referrals" className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium hover:bg-pink-200 transition-colors">
                <UserGroupIcon className="w-4 h-4" />
                Referrals
              </Link>
              <Link href="/admin/loyalty" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors">
                <GiftIcon className="w-4 h-4" />
                Loyalty
              </Link>
              <Link href="/schedule" className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium hover:bg-cyan-200 transition-colors">
                <CalendarIcon className="w-4 h-4" />
                Schedule
              </Link>
              <Link href="/routes" className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium hover:bg-teal-200 transition-colors">
                <MapPinIcon className="w-4 h-4" />
                Routes
              </Link>
            </div>
          </div>
        </div>

        {/* Row 2: Action Tools */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Actions</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* New Leads Notification */}
                {(customers.filter(c => c.status === 'pending').length > 0 || pendingLeadsCount > 0) && (
                  <button
                    onClick={() => setShowPendingPanel(!showPendingPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                      showPendingPanel 
                        ? 'bg-yellow-200 border-yellow-400 text-yellow-900' 
                        : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    🔔 {customers.filter(c => c.status === 'pending').length + pendingLeadsCount} New
                    {pendingLeadsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {pendingLeadsCount} Lead{pendingLeadsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                )}
                
                <button onClick={() => setShowBulkImport(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Bulk Import
                </button>
                <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export CSV
                </button>
                <button onClick={() => setShowEmailList(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <AtSymbolIcon className="w-4 h-4" />
                  Email Lists
                </button>
                <Link href="/analytics" className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  <ChartBarIcon className="w-4 h-4" />
                  📈 Analytics
                </Link>
                <Link href="/email-marketing" className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                  <EnvelopeIcon className="w-4 h-4" />
                  📧 Email Marketing
                </Link>
                <Link href="/admin/signups-leads" className="flex items-center gap-1.5 px-3 py-1.5 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
                  <UserPlusIcon className="w-4 h-4" />
                  👥 Sign Ups & Leads
                </Link>
                <Link href="/admin/referrals" className="flex items-center gap-1.5 px-3 py-1.5 border border-pink-300 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors">
                  <GiftIcon className="w-4 h-4" />
                  🎁 Referrals & Rewards
                </Link>
                <Link href="/admin/work-requests" className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                  <ClockIcon className="w-4 h-4" />
                  ⏰ Work Requests
                </Link>
                <Link href="/admin/completed-jobs" className="flex items-center gap-1.5 px-3 py-1.5 border border-teal-300 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors">
                  <CheckCircleIcon className="w-4 h-4" />
                  ✅ Completed Jobs
                </Link>
                <Link href="/admin/completion-history" className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
                  <ChartBarIcon className="w-4 h-4" />
                  📊 Completion History
                </Link>
                <Link href="/contracts" className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
                  <DocumentTextIcon className="w-4 h-4" />
                  📄 Contracts
                </Link>
                <button onClick={() => setShowMonthlyRevenue(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <BanknotesIcon className="w-4 h-4" />
                  📊 Monthly Revenue
                </button>
                <button onClick={() => setShowExpenseTracker(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  Expenses
                </button>
                <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ClipboardDocumentListIcon className="w-4 h-4" />
                  Notes
                </Link>
                <Link href="/invoices" className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <DocumentTextIcon className="w-4 h-4" />
                  Invoices
                </Link>
                <button 
                  onClick={() => setShowBookingRequests(!showBookingRequests)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                    showBookingRequests ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Booking Requests ({appointments.filter(a => a.status === 'pending').length})
                </button>
                <button 
                  onClick={() => {
                    setShowActivity(!showActivity);
                    if (!showActivity) fetchSkippedServices();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                    showActivity ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ClockIcon className="w-4 h-4" />
                  Customer Activity {skippedServices.length > 0 && `(${skippedServices.length})`}
                </button>
                <button onClick={() => setShowAddCustomer(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  <PlusIcon className="w-4 h-4" />
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Items Panel - Shows when clicking 🔔 New button */}
        {showPendingPanel && (
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xl">🔔</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Action Required</h3>
                    <p className="text-sm text-gray-500">{customers.filter(c => c.status === 'pending').length + pendingLeadsCount} items need your attention</p>
                  </div>
                </div>
                <button onClick={() => setShowPendingPanel(false)} className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors">
                  <XCircleIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Customers */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Pending Customers</h4>
                      <p className="text-xs text-gray-500">{customers.filter(c => c.status === 'pending').length} awaiting confirmation</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {customers.filter(c => c.status === 'pending').length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">All caught up!</p>
                      </div>
                    ) : (
                      customers.filter(c => c.status === 'pending').map((customer) => (
                        <div key={customer.id} className="p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                              <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{formatServiceType(customer.service_type)}</span>
                                <span className="text-sm font-medium text-green-600">{formatCurrency(customer.price)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleConfirmCustomer(customer.id)}
                                className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm transition-all"
                              >✓ Confirm</button>
                              <button
                                onClick={() => openEditModal(customer)}
                                className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                              >✏️ Edit</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pending Leads/Appointments */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">New Leads</h4>
                      <p className="text-xs text-gray-500">{pendingLeadsCount} from contact form</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No new leads</p>
                      </div>
                    ) : (
                      appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).map((apt) => (
                        <div key={apt.id} className="p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900 truncate">{apt.customer_name}</p>
                                {apt.customer_id ? (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Account</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Guest</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">{apt.customer_email}</p>
                              <p className="text-sm text-gray-500">{apt.customer_phone}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{apt.service_type}</span>
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{apt.booking_type}</span>
                                <span className="text-xs text-gray-500">⏱ {formatTimeAgo(apt.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={async () => {
                                  await supabaseAdmin.from('appointments').update({ status: 'confirmed' }).eq('id', apt.id);
                                  const { data: existing } = await supabaseAdmin.from('customers').select('id').or(`email.eq.${apt.customer_email},phone.eq.${apt.customer_phone}`).limit(1);
                                  if (!existing || existing.length === 0) {
                                    const { error } = await supabaseAdmin.from('customers').insert([{
                                      name: apt.customer_name, email: apt.customer_email, phone: apt.customer_phone,
                                      address: `${apt.street_address || ''}, ${apt.city || ''}`.trim(),
                                      service_type: 'lawn_mowing', frequency: 'weekly', price: 0, status: 'pending'
                                    }]);
                                    if (error) {
                                      console.error('Error adding customer:', error);
                                      alert('Error adding customer: ' + error.message);
                                    } else {
                                      alert(`Customer "${apt.customer_name}" added!`);
                                    }
                                  }
                                  fetchAppointments(); fetchCustomers();
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm transition-all"
                              >✓ Confirm</button>
                              <button
                                onClick={async () => {
                                  await supabaseAdmin.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
                                  fetchAppointments();
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                              >✗ Cancel</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">Manage your customers, track services, and analyze performance</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weekly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weeklyRevenue)}</p>
                  <p className="text-xs text-gray-400">Projected Weekly</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
                  <p className="text-xs text-gray-400">Projected Monthly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Panel - Gradient */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <p className="text-white/80 text-sm">📊 Projected Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.yearlyRevenue)}</p>
                <p className="text-white/60 text-xs">Based on {stats.workingMonthsCount} working months</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CurrencyDollarIcon className="w-6 h-6" />
                </div>
                <p className="text-white/80 text-sm">💰 Actual Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.actualRevenue)}</p>
                <p className="text-white/60 text-xs">From working months only</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <p className="text-white/80 text-sm">💸 Total Expenses</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
                <p className="text-white/60 text-xs">Gas, employees, equipment</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <BanknotesIcon className="w-6 h-6" />
                </div>
                <p className="text-white/80 text-sm">{stats.netProfit >= 0 ? '📈 Net Profit' : '📉 Net Loss'}</p>
                <p className={`text-3xl font-bold ${stats.netProfit < 0 ? 'text-red-200' : ''}`}>
                  {formatCurrency(Math.abs(stats.netProfit))}
                </p>
                <p className="text-white/60 text-xs">Revenue - Expenses</p>
              </div>
            </div>
          </div>

          {/* Working Months Selector */}
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Working Months</h3>
              </div>
              <span className="text-sm text-gray-500">{workingMonths.length} of 12 months selected</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Select the months you actively work to get accurate yearly projections</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
              {allMonths.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => toggleMonth(month)}
                  className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    workingMonths.includes(month)
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {shortMonths[idx]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setWorkingMonths(['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'])}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200"
              >
                🌱 Spring-Fall (9 months)
              </button>
              <button
                onClick={() => setWorkingMonths(['April', 'May', 'June', 'July', 'August', 'September', 'October'])}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium hover:bg-yellow-200"
              >
                ☀️ Peak Season (7 months)
              </button>
              <button
                onClick={() => setWorkingMonths(allMonths)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200"
              >
                📅 All Year (12 months)
              </button>
              <button
                onClick={() => setWorkingMonths([])}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Quick Activity Panels - Always Visible */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Booking Requests Inline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  📋 Booking Requests 
                  {appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).length > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).length}
                    </span>
                  )}
                </h3>
                <button onClick={() => fetchAppointments()} className="text-xs text-blue-600 hover:text-blue-700">Refresh</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No pending requests</p>
                ) : (
                  appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).slice(0, 5).map((apt) => (
                    <div 
                      key={apt.id} 
                      className="p-3 border border-blue-200 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setSelectedBooking(apt)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">{apt.customer_name}</p>
                            {apt.customer_id ? (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Account</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">Guest</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{apt.customer_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{apt.service_type}</span>
                            <span className="text-xs text-orange-600 font-medium">⏱ {formatTimeAgo(apt.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={async () => {
                              await supabaseAdmin.from('appointments').update({ status: 'confirmed' }).eq('id', apt.id);
                              const { data: existing } = await supabaseAdmin.from('customers').select('id').or(`email.eq.${apt.customer_email},phone.eq.${apt.customer_phone}`).limit(1);
                              if (!existing || existing.length === 0) {
                                const { error } = await supabaseAdmin.from('customers').insert([{
                                  name: apt.customer_name, email: apt.customer_email, phone: apt.customer_phone,
                                  address: `${apt.street_address || ''}, ${apt.city || ''}`.trim(),
                                  service_type: 'lawn_mowing', frequency: 'weekly', price: 0, status: 'pending'
                                }]);
                                if (error) console.error('Error:', error);
                              }
                              fetchAppointments(); fetchCustomers();
                            }}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >✓</button>
                          <button
                            onClick={async () => {
                              await supabaseAdmin.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
                              fetchAppointments();
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >✗</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Activity Inline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  📊 Recent Activity
                  {skippedServices.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">{skippedServices.length} skipped</span>
                  )}
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {skippedServices.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-red-600 mb-2">⚠️ Skipped Services</p>
                    {skippedServices.slice(0, 3).map((skip) => (
                      <div key={skip.id} className="p-2 border border-red-200 rounded-lg bg-red-50 mb-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{skip.customers?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{skip.reason || 'No reason'}</p>
                          </div>
                          <span className="text-xs text-red-500">⏱ {formatTimeAgo(skip.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{apt.customer_name}</p>
                          {apt.customer_id ? (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">Acct</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">Guest</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">{apt.service_type}</p>
                          <span className="text-xs text-gray-400">• {formatTimeAgo(apt.created_at)}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{apt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'table' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'cards' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>

          {/* Customer List */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <UserIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500 sm:hidden">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <div className="text-sm text-gray-900">{customer.email}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-900">{formatServiceType(customer.service_type)}</div>
                          <div className="text-sm text-gray-500 capitalize">{customer.frequency?.replace('_', '-')}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(customer.price)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {customer.status === 'pending' && (
                              <button
                                onClick={() => handleConfirmCustomer(customer.id)}
                                disabled={actionLoading === customer.id}
                                className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === customer.id ? '...' : '✓ Confirm'}
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(customer)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            {customer.status === 'cancelled' ? (
                              <button
                                onClick={() => handleUnscratchCustomer(customer.id)}
                                disabled={actionLoading === customer.id}
                                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === customer.id ? '...' : '↩ Unscratch'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleScratchCustomer(customer.id)}
                                disabled={actionLoading === customer.id}
                                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === customer.id ? '...' : '✗ Scratch'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No customers found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <UserIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(customer.price)}</p>
                      <p className="text-xs text-gray-500 capitalize">{customer.frequency?.replace('_', '-')}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.email}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Service:</span> {formatServiceType(customer.service_type)}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {customer.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmCustomer(customer.id)}
                        disabled={actionLoading === customer.id}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === customer.id ? '...' : '✓ Confirm'}
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(customer)}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-center text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    {customer.status === 'cancelled' ? (
                      <button
                        onClick={() => handleUnscratchCustomer(customer.id)}
                        disabled={actionLoading === customer.id}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === customer.id ? '...' : '↩ Unscratch'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleScratchCustomer(customer.id)}
                        disabled={actionLoading === customer.id}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === customer.id ? '...' : '✗ Scratch'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No customers found</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Add New Customer
            </button>
            <Link
              href="/admin/signups-leads"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <UserPlusIcon className="w-5 h-5" />
              View New Leads
            </Link>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export All
            </button>
          </div>
        </div>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setSelectedBooking(null)}></div>
              <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transform transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedBooking.customer_name}</h3>
                      <div className="flex items-center gap-2">
                        {selectedBooking.customer_id ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Has Account</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Guest</span>
                        )}
                        <span className="text-xs text-gray-500">⏱ {formatTimeAgo(selectedBooking.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full hover:bg-gray-100">
                    <XCircleIcon className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4 text-left">
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">📞 Contact Information</h4>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${selectedBooking.customer_email}`} className="text-blue-600 hover:underline">{selectedBooking.customer_email}</a>
                      </p>
                      {selectedBooking.customer_phone && (
                        <p className="flex items-center gap-2 text-sm">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${selectedBooking.customer_phone}`} className="text-blue-600 hover:underline">{selectedBooking.customer_phone}</a>
                        </p>
                      )}
                      {(selectedBooking.city || selectedBooking.street_address) && (
                        <p className="flex items-center gap-2 text-sm">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{selectedBooking.street_address}{selectedBooking.street_address && selectedBooking.city ? ', ' : ''}{selectedBooking.city}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">🌱 Service Request</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Service Type:</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">{selectedBooking.service_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Request Type:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">{selectedBooking.booking_type}</span>
                      </div>
                      {selectedBooking.date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Preferred Date:</span>
                          <span className="text-sm font-medium text-gray-900">{new Date(selectedBooking.date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message/Notes */}
                  {selectedBooking.notes && (
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">💬 Customer Message</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={async () => {
                      await supabaseAdmin.from('appointments').update({ status: 'confirmed' }).eq('id', selectedBooking.id);
                      const { data: existing } = await supabaseAdmin.from('customers').select('id').or(`email.eq.${selectedBooking.customer_email},phone.eq.${selectedBooking.customer_phone}`).limit(1);
                      if (!existing || existing.length === 0) {
                        const { error } = await supabaseAdmin.from('customers').insert([{
                          name: selectedBooking.customer_name,
                          email: selectedBooking.customer_email,
                          phone: selectedBooking.customer_phone,
                          address: `${selectedBooking.street_address || ''}, ${selectedBooking.city || ''}`.trim(),
                          service_type: 'lawn_mowing',
                          frequency: 'weekly',
                          price: 0,
                          status: 'pending',
                          notes: selectedBooking.notes ? `From contact form: ${selectedBooking.notes}` : 'From contact form'
                        }]);
                        if (error) {
                          console.error('Error adding customer:', error);
                          alert('Error adding customer: ' + error.message);
                        } else {
                          alert(`Customer "${selectedBooking.customer_name}" added!`);
                        }
                      }
                      fetchAppointments();
                      fetchCustomers();
                      setSelectedBooking(null);
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    ✓ Confirm & Add Customer
                  </button>
                  <button
                    onClick={async () => {
                      await supabaseAdmin.from('appointments').update({ status: 'cancelled' }).eq('id', selectedBooking.id);
                      fetchAppointments();
                      setSelectedBooking(null);
                    }}
                    className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                  >
                    ✗ Decline
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex gap-2 justify-center">
                  <a
                    href={`mailto:${selectedBooking.customer_email}?subject=Re: Your ${selectedBooking.service_type} Inquiry`}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📧 Email
                  </a>
                  {selectedBooking.customer_phone && (
                    <a
                      href={`tel:${selectedBooking.customer_phone}`}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      📞 Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Requests Panel */}
        {showBookingRequests && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Booking Requests ({appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).length} pending)
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => fetchAppointments()} className="text-sm text-blue-600 hover:text-blue-700">Refresh</button>
                  <button onClick={() => setShowBookingRequests(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending booking requests from contact forms</p>
                ) : (
                  appointments.filter(a => a.status === 'pending' && (a.booking_type === 'Ready to Hire' || a.booking_type === 'Contract Request')).map((apt) => (
                    <div key={apt.id} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">{apt.customer_name}</p>
                            {apt.customer_id ? (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">Account</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">Guest</span>
                            )}
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">{apt.status}</span>
                            <span className="text-xs text-orange-600 font-medium">⏱ {formatTimeAgo(apt.created_at)}</span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center"><EnvelopeIcon className="h-4 w-4 mr-1" />{apt.customer_email}</p>
                            <p className="flex items-center"><PhoneIcon className="h-4 w-4 mr-1" />{apt.customer_phone}</p>
                            <p className="flex items-center"><MapPinIcon className="h-4 w-4 mr-1" />{apt.city}{apt.street_address ? `, ${apt.street_address}` : ''}</p>
                            <p className="flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />{new Date(apt.date).toLocaleDateString()}</p>
                            <p className="font-medium text-gray-700">{apt.service_type}</p>
                            {apt.notes && <p className="text-xs text-gray-500 italic">Notes: {apt.notes}</p>}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <button
                            onClick={async () => {
                              try {
                                // Update appointment status
                                await supabaseAdmin.from('appointments').update({ status: 'confirmed' }).eq('id', apt.id);
                                
                                // Check if customer exists
                                const { data: existing } = await supabaseAdmin.from('customers').select('id').or(`email.eq.${apt.customer_email},phone.eq.${apt.customer_phone}`).limit(1);
                                
                                if (!existing || existing.length === 0) {
                                  // Create customer
                                  const customerData = {
                                    name: apt.customer_name || 'Unknown',
                                    email: apt.customer_email || null,
                                    phone: apt.customer_phone || 'No phone',
                                    address: apt.street_address ? `${apt.street_address}, ${apt.city || ''}` : apt.city || '',
                                    service_type: 'lawn_mowing',
                                    frequency: 'weekly',
                                    price: 0,
                                    status: 'pending',
                                    notes: apt.notes ? `From contact form: ${apt.notes}` : 'From contact form',
                                    next_service: apt.date ? new Date(apt.date).toISOString().split('T')[0] : null
                                  };
                                  const { error } = await supabaseAdmin.from('customers').insert([customerData]);
                                  if (error) {
                                    console.error('Error adding customer:', error);
                                    alert('Error adding customer: ' + error.message);
                                  } else {
                                    alert(`Customer "${apt.customer_name}" has been added!`);
                                  }
                                }
                                fetchAppointments();
                                fetchCustomers();
                              } catch (error) {
                                alert('Error: ' + error.message);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            ✓ Confirm
                          </button>
                          <button
                            onClick={async () => {
                              await supabaseAdmin.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
                              fetchAppointments();
                            }}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Activity Panel */}
        {showActivity && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Customer Activity</h3>
                <button onClick={() => setShowActivity(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Skipped Services */}
              {skippedServices.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-red-600 mb-3">⚠️ Skipped Services ({skippedServices.length})</h4>
                  <div className="space-y-2">
                    {skippedServices.slice(0, 5).map((skip) => (
                      <div key={skip.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{skip.customers?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{skip.reason || 'No reason given'}</p>
                            <p className="text-xs text-gray-400">{new Date(skip.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">Skipped</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Appointments */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📅 Recent Appointments</h4>
                <div className="space-y-2">
                  {appointments.slice(0, 10).map((apt) => (
                    <div key={apt.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{apt.customer_name}</p>
                          <p className="text-sm text-gray-500">{apt.service_type}</p>
                          <p className="text-xs text-gray-400">{new Date(apt.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{apt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowBulkImport(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Bulk Import Customers</h3>
                  <button onClick={() => setShowBulkImport(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Paste customer data (one per line: Name, Email, Phone, Address, Service, Price)</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
                  placeholder="John Doe, john@email.com, 555-1234, 123 Main St, lawn_mowing, 50"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowBulkImport(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Lists Modal */}
        {showEmailList && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEmailList(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Email Lists</h3>
                  <button onClick={() => setShowEmailList(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">All Customers ({customers.length})</h4>
                    <p className="text-sm text-gray-500 mb-2">{customers.map(c => c.email).filter(Boolean).slice(0, 5).join(', ')}...</p>
                    <button 
                      onClick={() => {
                        const emails = customers.map(c => c.email).filter(Boolean).join('\n');
                        const blob = new Blob([emails], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'all-customers-emails.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >📥 Download Emails</button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Active Customers ({customers.filter(c => c.status === 'active').length})</h4>
                    <button 
                      onClick={() => {
                        const emails = customers.filter(c => c.status === 'active').map(c => c.email).filter(Boolean).join('\n');
                        const blob = new Blob([emails], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'active-customers-emails.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >📥 Download Emails</button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Weekly Customers ({customers.filter(c => c.frequency === 'weekly').length})</h4>
                    <button 
                      onClick={() => {
                        const emails = customers.filter(c => c.frequency === 'weekly').map(c => c.email).filter(Boolean).join('\n');
                        const blob = new Blob([emails], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'weekly-customers-emails.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >📥 Download Emails</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Revenue Modal */}
        {showMonthlyRevenue && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowMonthlyRevenue(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Monthly Revenue Tracker</h3>
                  <button onClick={() => setShowMonthlyRevenue(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
                    <div key={month} className={`p-4 border rounded-lg ${workingMonths.includes(month) ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                      <h4 className="font-medium text-gray-900 text-sm mb-2">{month}</h4>
                      <input
                        type="number"
                        value={monthlyActualRevenue[month] || ''}
                        onChange={(e) => setMonthlyActualRevenue({...monthlyActualRevenue, [month]: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="$0"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    Total: {formatCurrency(Object.values(monthlyActualRevenue).reduce((sum, val) => sum + (parseFloat(val) || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expense Tracker Modal */}
        {showExpenseTracker && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowExpenseTracker(false)}></div>
              <div className="relative bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Expense Tracker</h3>
                  <button onClick={() => setShowExpenseTracker(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {workingMonths.map((month) => (
                    <div key={month} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm mb-3">{month}</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500">Gas</label>
                          <input
                            type="number"
                            value={monthlyExpenses[month]?.gas || ''}
                            onChange={(e) => setMonthlyExpenses({
                              ...monthlyExpenses,
                              [month]: {...monthlyExpenses[month], gas: e.target.value}
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="$0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Employee</label>
                          <input
                            type="number"
                            value={monthlyExpenses[month]?.employee || ''}
                            onChange={(e) => setMonthlyExpenses({
                              ...monthlyExpenses,
                              [month]: {...monthlyExpenses[month], employee: e.target.value}
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="$0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Equipment</label>
                          <input
                            type="number"
                            value={monthlyExpenses[month]?.equipment || ''}
                            onChange={(e) => setMonthlyExpenses({
                              ...monthlyExpenses,
                              [month]: {...monthlyExpenses[month], equipment: e.target.value}
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="$0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-700">
                    Total Expenses: {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddCustomer(false)}></div>
              
              <div className="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle bg-white rounded-2xl shadow-xl transform transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Add New Customer</h3>
                  <button
                    onClick={() => setShowAddCustomer(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={newCustomerData.name}
                        onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newCustomerData.email}
                        onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newCustomerData.phone}
                        onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                      <select
                        value={newCustomerData.service_type}
                        onChange={(e) => setNewCustomerData({...newCustomerData, service_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="lawn_mowing">Lawn Mowing</option>
                        <option value="lawn_care">Lawn Care</option>
                        <option value="landscaping">Landscaping</option>
                        <option value="mulch">Mulch Installation</option>
                        <option value="spring_cleanup">Spring Cleanup</option>
                        <option value="fall_cleanup">Fall Cleanup</option>
                        <option value="hedge_trimming">Hedge Trimming</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={newCustomerData.frequency}
                        onChange={(e) => setNewCustomerData({...newCustomerData, frequency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="one_time">One Time</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                      <input
                        type="number"
                        value={newCustomerData.price}
                        onChange={(e) => setNewCustomerData({...newCustomerData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Date</label>
                      <input
                        type="date"
                        value={newCustomerData.next_service}
                        onChange={(e) => setNewCustomerData({...newCustomerData, next_service: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={newCustomerData.status}
                        onChange={(e) => setNewCustomerData({...newCustomerData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={newCustomerData.address}
                        onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Customer address"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={newCustomerData.notes}
                        onChange={(e) => setNewCustomerData({...newCustomerData, notes: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Additional notes about the customer"
                      />
                    </div>
                  </div>
                  
                  {/* Link to User Account */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link to User Account (Optional)</label>
                    <p className="text-xs text-gray-500 mb-3">If this customer has an account, link them to ensure automatic customer creation worked correctly.</p>
                    
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">{selectedUser.full_name || selectedUser.email}</p>
                          <p className="text-sm text-green-600">{selectedUser.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setNewCustomerData({...newCustomerData, user_id: null});
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => {
                            setUserSearchTerm(e.target.value);
                            setShowUserSelector(true);
                          }}
                          onFocus={() => setShowUserSelector(true)}
                          placeholder="Search by email or name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {showUserSelector && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredUserAccounts.length > 0 ? (
                              filteredUserAccounts.slice(0, 10).map((account) => (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() => selectUserAccount(account)}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{account.full_name || 'No name'}</p>
                                    <p className="text-sm text-gray-500">{account.email}</p>
                                  </div>
                                  {hasCustomerRecord(account.id) && (
                                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">Has Customer</span>
                                  )}
                                </button>
                              ))
                            ) : (
                              <p className="px-4 py-3 text-gray-500 text-sm">No users found</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCustomer(false);
                        setSelectedUser(null);
                        setUserSearchTerm('');
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === 'new'}
                      className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'new' ? 'Adding...' : 'Add Customer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingCustomer(null)}></div>
              
              <div className="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle bg-white rounded-2xl shadow-xl transform transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Edit Customer</h3>
                  <button
                    onClick={() => setEditingCustomer(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                      <select
                        value={editFormData.service_type}
                        onChange={(e) => setEditFormData({...editFormData, service_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="lawn_mowing">Lawn Mowing</option>
                        <option value="lawn_care">Lawn Care</option>
                        <option value="landscaping">Landscaping</option>
                        <option value="mulch">Mulch Installation</option>
                        <option value="spring_cleanup">Spring Cleanup</option>
                        <option value="fall_cleanup">Fall Cleanup</option>
                        <option value="hedge_trimming">Hedge Trimming</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={editFormData.frequency}
                        onChange={(e) => setEditFormData({...editFormData, frequency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="one_time">One Time</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(null)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === editingCustomer.id}
                      className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === editingCustomer.id ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

