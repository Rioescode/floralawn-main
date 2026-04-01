"use client";

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/app/admin/error-boundary';
import '@/lib/error-handler';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  EyeIcon,
  StarIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  AtSymbolIcon,
  UserGroupIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserPlusIcon,
  GiftIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';

export default function CustomersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [processingAI, setProcessingAI] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('cards'); // table or cards
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showCustomerDetails, setShowCustomerDetails] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    adjustedYearlyRevenue: 0, // Add this for UI compatibility
    workingMonthsCount: 0,
    avgPrice: 0,
    topService: ''
  });
  const [showEmailList, setShowEmailList] = useState(false);
  const [emailSegments, setEmailSegments] = useState({
    all: [],
    active: [],
    highValue: [],
    weekly: [],
    biWeekly: [],
    recent: [],
    inactive: []
  });
  const [workingMonths, setWorkingMonths] = useState([
    'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'
  ]); // Default 9 months (no Dec, Jan, Feb)
  const [showMonthlyRevenue, setShowMonthlyRevenue] = useState(false);
  const [monthlyActualRevenue, setMonthlyActualRevenue] = useState({
    January: 0, February: 0, March: 0, April: 0, May: 0, June: 0,
    July: 0, August: 0, September: 0, October: 0, November: 0, December: 0
  });
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [hideNumbers, setHideNumbers] = useState({
    revenue: false,
    expenses: false,
    profit: false,
    all: false
  });
  const [monthlyExpenses, setMonthlyExpenses] = useState({
    January: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    February: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    March: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    April: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    May: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    June: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    July: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    August: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    September: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    October: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    November: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 },
    December: { gas: 0, employee: 0, employeeHours: 0, employeeRate: 25, equipment: 0, maintenance: 0, other: 0 }
  });
  const [skippedServices, setSkippedServices] = useState([]);
  const [showActivity, setShowActivity] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showBookingRequests, setShowBookingRequests] = useState(false);
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [completionMessage, setCompletionMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
  const [newLeadNotification, setNewLeadNotification] = useState(null);

  const [formData, setFormData] = useState({
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
  const [filteredUserAccounts, setFilteredUserAccounts] = useState([]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:148',message:'Page mounted, calling checkAuth',data:{isSecureContext:window.isSecureContext,protocol:window.location.protocol,userAgent:navigator.userAgent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchEarnings();
      fetchSkippedServices();
      fetchAppointments();
      
      // Set up real-time subscription for new customers (contact form leads)
      const customersChannel = supabase
        .channel('customers-changes')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'customers',
            filter: 'status=eq.pending'
          },
          (payload) => {
            console.log('New pending customer detected:', payload.new);
            // Refresh customers list to show new lead in table
            fetchCustomers();
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'customers'
          },
          () => {
            // Refresh when customer status changes
            fetchCustomers();
          }
        )
        .subscribe();
      
      // Set up real-time subscription for new leads (appointments)
      const appointmentsChannel = supabase
        .channel('appointments-changes')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'appointments',
            filter: 'status=eq.pending'
          }, 
          (payload) => {
            const newLead = payload.new;
            // Only notify for leads from contact forms (Ready to Hire or Contract Request)
            if (newLead.booking_type === 'Ready to Hire' || newLead.booking_type === 'Contract Request') {
              console.log('New lead detected:', newLead);
              // Refresh appointments to get updated count
              fetchAppointments();
              
              // Show notification
              setNewLeadNotification({
                name: newLead.customer_name || 'Unknown',
                email: newLead.customer_email || '',
                service: newLead.service_type || 'Service Request',
                time: new Date().toLocaleTimeString()
              });
              
              // Auto-hide notification after 10 seconds
              setTimeout(() => {
                setNewLeadNotification(null);
              }, 10000);
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments'
          },
          () => {
            // Refresh when status changes
            fetchAppointments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(customersChannel);
        supabase.removeChannel(appointmentsChannel);
      };
    }
  }, [user]);

  useEffect(() => {
    filterCustomers();
    calculateStats();
  }, [customers, searchTerm, statusFilter, serviceFilter, frequencyFilter, priceRange, sortBy, sortOrder, workingMonths, monthlyActualRevenue, monthlyExpenses]);

  useEffect(() => {
    if (customers.length > 0) {
      generateEmailSegments();
    }
  }, [customers]);

  const checkAuth = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:252',message:'checkAuth entry',data:{isSecureContext:window.isSecureContext,protocol:window.location.protocol},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:255',message:'getUser result',data:{hasUser:!!currentUser,hasError:!!authError,errorMessage:authError?.message,userId:currentUser?.id,email:currentUser?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (authError || !currentUser) {
        console.error('Auth error:', authError);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:257',message:'Auth failed, redirecting to login',data:{authError:authError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        router.push('/login');
        return;
      }
      
      // Check user role from profiles table (more reliable than email check)
      let profile = null;
      let profileError = null;
      
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:265',message:'Fetching profile',data:{userId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const profileResult = await supabase
          .from('profiles')
          .select('role, id')
          .eq('id', currentUser.id)
          .single();
        
        profile = profileResult.data;
        profileError = profileResult.error;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:273',message:'Profile result',data:{hasProfile:!!profile,role:profile?.role,hasError:!!profileError,errorCode:profileError?.code,errorMessage:profileError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // If profile doesn't exist, create it with admin role for this email
        if (profileError && profileError.code === 'PGRST116' && currentUser.email?.toLowerCase() === 'esckoofficial@gmail.com') {
          console.log('Profile not found, creating admin profile...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              role: 'admin'
            })
            .select()
            .single();
          
          if (!createError && newProfile) {
            profile = newProfile;
            profileError = null;
          }
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        profileError = err;
      }
      
      console.log('Profile check:', { profile, profileError, userId: currentUser.id, email: currentUser.email });
      
      // Allow access if role is admin OR email matches (fallback for mobile/edge cases)
      const emailMatch = currentUser.email?.toLowerCase().trim() === 'esckoofficial@gmail.com';
      const isAdmin = profile?.role === 'admin' || emailMatch;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:301',message:'Admin check result',data:{role:profile?.role,email:currentUser.email,emailMatch,isAdmin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (!isAdmin) {
        console.log('Access denied - not admin:', { role: profile?.role, email: currentUser.email, emailMatch });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:304',message:'Access denied, redirecting',data:{role:profile?.role,email:currentUser.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        router.push('/');
        return;
      }
      
      console.log('Admin access granted:', { role: profile?.role, email: currentUser.email });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6e3ee97a-f227-492c-bc51-d1baa7386ced',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customers/page.js:309',message:'Admin access granted',data:{role:profile?.role,email:currentUser.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
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
      console.log('Fetching customers...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        alert('Authentication error. Please log in again.');
        router.push('/login');
        return;
      }
      
      console.log('Current user:', user?.email);
      console.log('User ID:', user?.id);
      
      // Test the is_admin function first
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_admin');
      
      console.log('Admin check result:', adminCheck, 'Error:', adminError);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error hint:', error.hint);
        
        // If RLS error, provide specific guidance
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          alert('RLS Policy Error: Admin access is blocked. Please run the migration: 20250101000003_fix_admin_with_function.sql in Supabase SQL Editor.');
        } else {
          alert(`Error loading customers: ${error.message}. Check console for details.`);
        }
        throw error;
      }
      
      console.log('Fetched customers:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample customer:', data[0]);
      } else {
        console.warn('No customers returned. This could mean:');
        console.warn('1. No customers in database');
        console.warn('2. RLS policies are blocking access');
        console.warn('3. Migration not applied');
      }
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert(`Error loading customers: ${error.message || 'Unknown error'}. Please check console and ensure the migration has been applied.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_earnings')
        .select('*')
        .single();

      if (error) throw error;
      setEarnings(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Get recent 100 appointments

      if (error) throw error;
      setAppointments(data || []);
      
      // Count pending leads from contact form only (exclude completed services)
      // Only count appointments with status 'pending' and booking_type from contact forms
      const pendingLeads = (data || []).filter(apt => 
        apt.status === 'pending' && 
        (apt.booking_type === 'Ready to Hire' || apt.booking_type === 'Contract Request')
      );
      setPendingLeadsCount(pendingLeads.length);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleMarkAsDone = async () => {
    if (!selectedAppointment) return;

    try {
      setMarkingDone(true);

      // Update appointment status to completed
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAppointment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating appointment:', updateError);
        throw updateError;
      }

      // Verify the update was successful
      if (!updatedAppointment || updatedAppointment.status !== 'completed') {
        throw new Error('Failed to update appointment status');
      }

      // Create completed_job record
      try {
        // Get customer info to get price
        let amountDue = 0;
        let customerId = null;
        
        if (selectedAppointment.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('id, price')
            .eq('id', selectedAppointment.customer_id)
            .single();
          
          if (customer) {
            amountDue = customer.price || 0;
            customerId = customer.id;
          }
        }
        
        // Check if completed_job already exists for this appointment
        const { data: existingJob } = await supabaseAdmin
          .from('completed_jobs')
          .select('id')
          .eq('appointment_id', selectedAppointment.id)
          .single();
        
        if (!existingJob) {
          // Create completed_job record
          const { error: jobError } = await supabaseAdmin
            .from('completed_jobs')
            .insert({
              appointment_id: selectedAppointment.id,
              customer_id: selectedAppointment.customer_id || null,
              customer_name: selectedAppointment.customer_name,
              customer_email: selectedAppointment.customer_email,
              customer_phone: selectedAppointment.customer_phone || null,
              customer_address: selectedAppointment.street_address || null,
              service_type: selectedAppointment.service_type || 'lawn_mowing',
              service_description: selectedAppointment.notes || null,
              job_date: selectedAppointment.date,
              completed_date: new Date().toISOString(),
              amount_due: amountDue,
              amount_paid: 0,
              payment_status: 'unpaid'
            });
          
          if (jobError) {
            console.error('Error creating completed job:', jobError);
          }
        }
      } catch (jobError) {
        console.error('Error creating completed job record:', jobError);
        // Don't fail the whole operation if completed_job creation fails
      }

      // Award loyalty points for completed service
      try {
        // Calculate points based on service type (default: 10 points per service)
        let pointsToAward = 10;
        
        // Get customer info to award points
        const customerId = selectedAppointment.customer_id;
        const userId = selectedAppointment.customer_id; // Assuming customer_id is user_id
        
        if (customerId) {
          // Get customer record to find user_id
          const { data: customer } = await supabase
            .from('customers')
            .select('id, user_id, price')
            .eq('id', customerId)
            .single();
          
          if (customer) {
            // Award points based on service price (1 point per $1, minimum 10)
            if (customer.price) {
              pointsToAward = Math.max(10, Math.floor(customer.price));
            }
            
            const loyaltyResponse = await fetch('/api/loyalty', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'earn',
                userId: customer.user_id,
                customerId: customer.id,
                points: pointsToAward,
                serviceId: selectedAppointment.id,
                serviceType: selectedAppointment.service_type || 'Service',
                serviceDate: new Date().toISOString(),
                description: `Completed ${selectedAppointment.service_type || 'service'}`
              })
            });
            
            // Don't fail the whole operation if loyalty points fail
            if (!loyaltyResponse.ok) {
              console.error('Failed to award loyalty points:', await loyaltyResponse.text());
            }
          }
        }
      } catch (loyaltyError) {
        console.error('Error awarding loyalty points:', loyaltyError);
        // Don't fail the whole operation
      }

      // Send message if requested
      if (sendEmail || sendSMS) {
        const response = await fetch('/api/customers/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: selectedAppointment.id,
            message: completionMessage,
            sendEmail: sendEmail,
            sendSMS: sendSMS
          })
        });

        const result = await response.json();
        if (!result.success) {
          console.error('Error sending message:', result.error);
          alert('Appointment marked as done, but failed to send message. You can send it manually.');
        } else {
          // If SMS link is provided, open it
          if (result.smsLink && sendSMS) {
            window.open(result.smsLink, '_blank');
          }
        }
      }

      // Refresh appointments
      await fetchAppointments();

      // Close modal and reset
      setShowMarkDoneModal(false);
      setSelectedAppointment(null);
      setCompletionMessage('');
      setSendEmail(true);
      setSendSMS(false);

      alert('Appointment marked as done' + (sendEmail || sendSMS ? ' and message sent!' : '!'));
    } catch (error) {
      console.error('Error marking as done:', error);
      alert('Failed to mark appointment as done. Please try again.');
    } finally {
      setMarkingDone(false);
    }
  };

  const fetchSkippedServices = async () => {
    try {
      const { data, error } = await supabase
        .from('skipped_services')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            service_type,
            frequency
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSkippedServices(data || []);
    } catch (error) {
      console.error('Error fetching skipped services:', error);
    }
  };

  // Calculate customer statistics
  const calculateStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const pendingCustomers = customers.filter(c => c.status === 'pending').length;
    const completedCustomers = customers.filter(c => c.status === 'completed').length;
    const cancelledCustomers = customers.filter(c => c.status === 'cancelled').length;
    
    // Calculate working months count early so it can be used in revenue calculations
    const workingMonthsCount = workingMonths.length;
    
    // Calculate revenue projections based on frequency
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    
    // Include both active and pending customers for revenue projections
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
        case 'seasonal':
          weeklyRevenue += price * 0.08; // ~4 times per year
          monthlyRevenue += price * 0.33;
          break;
        case 'one_time':
        case 'one-time':
          // Don't include one-time in recurring revenue projections
          break;
        default:
          // Default to monthly if frequency is unclear
          weeklyRevenue += price * 0.25;
          monthlyRevenue += price;
      }
    });

    // Calculate projected yearly revenue based on monthly revenue and working months
    const projectedYearlyRevenue = Math.round(monthlyRevenue * workingMonthsCount);
    
    // Calculate additional stats
    const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
    const avgPrice = customers.length > 0 ? totalRevenue / customers.length : 0;
    
    // Calculate accurate yearly revenue based on working months
    // yearlyRevenue is now already calculated based on working months
    
    // Calculate actual revenue from monthly inputs
    const actualYearlyRevenue = Object.values(monthlyActualRevenue).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    const actualWorkingRevenue = workingMonths.reduce((sum, month) => sum + (parseFloat(monthlyActualRevenue[month]) || 0), 0);
    
    // Calculate total expenses
    const totalYearlyExpenses = Object.values(monthlyExpenses).reduce((sum, monthExpenses) => {
      return sum + Object.values(monthExpenses).reduce((monthSum, expense) => monthSum + (parseFloat(expense) || 0), 0);
    }, 0);
    const totalWorkingExpenses = workingMonths.reduce((sum, month) => {
      const monthExpenses = monthlyExpenses[month];
      return sum + Object.values(monthExpenses).reduce((monthSum, expense) => monthSum + (parseFloat(expense) || 0), 0);
    }, 0);
    
    // Calculate net profit
    const netYearlyProfit = actualYearlyRevenue - totalYearlyExpenses;
    const netWorkingProfit = actualWorkingRevenue - totalWorkingExpenses;
    
    // Find most common service type
    const serviceCounts = customers.reduce((acc, c) => {
      acc[c.service_type] = (acc[c.service_type] || 0) + 1;
      return acc;
    }, {});
    const topService = Object.keys(serviceCounts).length > 0 ? 
      Object.keys(serviceCounts).reduce((a, b) => 
        serviceCounts[a] > serviceCounts[b] ? a : b, '') : '';

    setStats({
      total: totalCustomers,
      totalCustomers,
      active: activeCustomers,
      activeCustomers,
      pending: pendingCustomers,
      completed: completedCustomers,
      cancelled: cancelledCustomers,
      totalRevenue,
      weeklyRevenue: Math.round(weeklyRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      yearlyRevenue: projectedYearlyRevenue,
      adjustedYearlyRevenue: projectedYearlyRevenue, // Add this for UI compatibility
      actualYearlyRevenue: Math.round(actualYearlyRevenue),
      actualWorkingRevenue: Math.round(actualWorkingRevenue),
      totalYearlyExpenses: Math.round(totalYearlyExpenses),
      totalWorkingExpenses: Math.round(totalWorkingExpenses),
      netYearlyProfit: Math.round(netYearlyProfit),
      netWorkingProfit: Math.round(netWorkingProfit),
      workingMonthsCount,
      avgPrice,
      topService: formatServiceType(topService)
    });
  };

  // Enhanced filtering with price range and sorting
  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(customer => customer.service_type === serviceFilter);
    }

    // Frequency filter
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(customer => customer.frequency === frequencyFilter);
    }

    // Price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(customer => parseFloat(customer.price) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(customer => parseFloat(customer.price) <= parseFloat(priceRange.max));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortBy === 'created_at' || sortBy === 'next_service') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting customer data:', formData);
      
      // Prepare data for submission, handling empty dates
      const submitData = {
        ...formData,
        next_service: formData.next_service || null // Convert empty string to null
      };
      
      if (editingCustomer) {
        const { data, error } = await supabase
          .from('customers')
          .update(submitData)
          .eq('id', editingCustomer.id)
          .select();

        console.log('Update result:', { data, error });
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([submitData])
          .select();

        console.log('Insert result:', { data, error });
        if (error) throw error;
      }

      resetForm();
      fetchCustomers();
      fetchEarnings();
    } catch (error) {
      console.error('Detailed error saving customer:', error);
      alert(`Error saving customer: ${error.message || 'Unknown error'}. Check console for details.`);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      service_type: customer.service_type,
      frequency: customer.frequency,
      price: customer.price.toString(),
      next_service: customer.next_service ? customer.next_service.split('T')[0] : '',
      status: customer.status,
      notes: customer.notes || '',
      user_id: customer.user_id || null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCustomers();
      fetchEarnings();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
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
    setEditingCustomer(null);
    setShowAddForm(false);
    setUserSearchTerm('');
    setShowUserSelector(false);
  };

  const fetchUserAccounts = async () => {
    try {
      // Fetch all user profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also get which users already have customer records
      const { data: customersWithUsers } = await supabase
        .from('customers')
        .select('user_id, name, email')
        .not('user_id', 'is', null);

      const usersWithCustomers = new Set(customersWithUsers?.map(c => c.user_id) || []);

      // Map profiles with customer status
      const accounts = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
        hasCustomer: usersWithCustomers.has(profile.id),
        created_at: profile.created_at
      }));

      setUserAccounts(accounts);
      setFilteredUserAccounts(accounts);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
    }
  };

  useEffect(() => {
    if (showAddForm && !editingCustomer) {
      fetchUserAccounts();
    }
  }, [showAddForm, editingCustomer]);

  useEffect(() => {
    if (userSearchTerm) {
      const filtered = userAccounts.filter(user =>
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUserAccounts(filtered);
    } else {
      setFilteredUserAccounts(userAccounts);
    }
  }, [userSearchTerm, userAccounts]);

  // Close user selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserSelector && !event.target.closest('.user-selector-container')) {
        setShowUserSelector(false);
      }
    };

    if (showUserSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserSelector]);

  const processBulkImport = async () => {
    if (!bulkText.trim()) return;
    
    setProcessingAI(true);
    try {
      // Parse bulk text with Claude AI
      const response = await fetch('/api/parse-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: bulkText }),
      });

      if (!response.ok) throw new Error('Failed to process bulk import');

      const { customers } = await response.json();
      
      if (!customers || customers.length === 0) {
        alert('No valid customers found in the text. Please check your input.');
        return;
      }
      
      // Insert all customers
      let successCount = 0;
      for (const customer of customers) {
        const { error } = await supabase
          .from('customers')
          .insert([customer]);

        if (error) {
          console.error('Error inserting customer:', customer.name, error);
        } else {
          successCount++;
        }
      }

      // Reset and refresh
      setBulkText('');
      setShowBulkImport(false);
      
      // Force refresh the data
      await fetchCustomers();
      await fetchEarnings();
      
      // Refresh the page to ensure everything updates
      window.location.reload();
      
      alert(`Successfully imported ${successCount} out of ${customers.length} customers!`);
    } catch (error) {
      console.error('Error processing bulk import:', error);
      alert('Error processing bulk import. Please try again.');
    } finally {
      setProcessingAI(false);
    }
  };

  const parseSimpleBulk = () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n').filter(line => line.trim());
    const customers = [];
    
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        customers.push({
          name: parts[0] || '',
          address: parts[1] || '',
          phone: parts[2] || '',
          email: parts[3] || '',
          service_type: 'lawn_mowing',
          frequency: 'weekly',
          price: parseFloat(parts[4]) || 50.00,
          status: 'active',
          notes: parts[5] || ''
        });
      }
    });

    return customers;
  };

  const processBulkManual = async () => {
    const customers = parseSimpleBulk();
    if (customers.length === 0) {
      alert('No valid customer data found. Please check your format.');
      return;
    }

    try {
      let successCount = 0;
      for (const customer of customers) {
        const { error } = await supabase
          .from('customers')
          .insert([customer]);

        if (error) {
          console.error('Error inserting customer:', customer.name, error);
        } else {
          successCount++;
        }
      }

      setBulkText('');
      setShowBulkImport(false);
      
      // Force refresh the data
      await fetchCustomers();
      await fetchEarnings();
      
      // Refresh the page to ensure everything updates
      window.location.reload();
      
      alert(`Successfully imported ${successCount} out of ${customers.length} customers!`);
    } catch (error) {
      console.error('Error processing bulk import:', error);
      alert('Error processing bulk import. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatServiceType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFrequency = (freq) => {
    return freq?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const formatCurrency = (amount, type = 'general') => {
    if (hideNumbers.all) {
      return '••••••';
    }
    
    if (type === 'revenue' && hideNumbers.revenue) {
      return '••••••';
    }
    
    if (type === 'expenses' && hideNumbers.expenses) {
      return '••••••';
    }
    
    if (type === 'profit' && hideNumbers.profit) {
      return '••••••';
    }
    
    return `$${Math.round(amount || 0).toLocaleString()}`;
  };

  const formatPercentage = (percentage, type = 'general') => {
    if (hideNumbers.all) {
      return '••%';
    }
    
    if (type === 'profit' && hideNumbers.profit) {
      return '••%';
    }
    
    return `${percentage}%`;
  };

  const toggleNumberVisibility = (type) => {
    setHideNumbers(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const ClickableNumber = ({ children, type, className = "" }) => (
    <span 
      onClick={() => toggleNumberVisibility(type)}
      className={`cursor-pointer hover:opacity-75 hover:scale-105 transition-all duration-200 select-none ${className}`}
      title={`Click to ${hideNumbers[type] ? 'show' : 'hide'} ${type} numbers`}
      style={{ 
        textDecoration: hideNumbers[type] ? 'none' : 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '4px'
      }}
    >
      {children}
    </span>
  );

  const testDatabaseAccess = async () => {
    try {
      console.log('Testing database access...');
      
      // Test if we can read from customers table
      const { data: customers, error: readError } = await supabase
        .from('customers')
        .select('*')
        .limit(5);
        
      console.log('Read test - Error:', readError);
      console.log('Read test - Data:', customers);
      
      // Test if we can insert a simple customer
      const testCustomer = {
        name: 'Test Customer',
        phone: '123-456-7890',
        service_type: 'lawn_mowing',
        frequency: 'weekly',
        price: 50.00,
        status: 'active'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert([testCustomer])
        .select();
        
      console.log('Insert test - Error:', insertError);
      console.log('Insert test - Data:', insertData);
      
      if (insertData && insertData.length > 0) {
        // Clean up test customer
        await supabase
          .from('customers')
          .delete()
          .eq('id', insertData[0].id);
      }
      
    } catch (error) {
      console.error('Database test error:', error);
    }
  };

  // Export customers to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Address', 'Service Type', 'Frequency', 'Price', 'Status', 'Next Service', 'Notes'];
    const csvData = filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      formatServiceType(customer.service_type),
      formatFrequency(customer.frequency),
      customer.price,
      customer.status,
      customer.next_service || '',
      customer.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedCustomers.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: newStatus })
        .in('id', selectedCustomers);

      if (error) throw error;
      
      fetchCustomers();
      setSelectedCustomers([]);
      alert(`Updated ${selectedCustomers.length} customers to ${newStatus}`);
    } catch (error) {
      console.error('Error updating customers:', error);
      alert('Error updating customers');
    }
  };

  // New bulk frequency update function
  const handleBulkFrequencyUpdate = async (newFrequency) => {
    if (selectedCustomers.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .update({ frequency: newFrequency })
        .in('id', selectedCustomers);

      if (error) throw error;
      
      fetchCustomers();
      setSelectedCustomers([]);
      alert(`Updated ${selectedCustomers.length} customers to ${newFrequency.replace('_', '-')}`);
    } catch (error) {
      console.error('Error updating customer frequency:', error);
      alert('Error updating customer frequency');
    }
  };

  // Quick frequency toggle for individual customer
  const toggleCustomerFrequency = async (customerId, currentFrequency) => {
    try {
      const frequencies = ['weekly', 'bi_weekly', 'monthly', 'seasonal'];
      const currentIndex = frequencies.indexOf(currentFrequency);
      const nextIndex = (currentIndex + 1) % frequencies.length;
      const newFrequency = frequencies[nextIndex];

      const { error } = await supabase
        .from('customers')
        .update({ frequency: newFrequency })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, frequency: newFrequency }
          : customer
      ));
    } catch (error) {
      console.error('Error updating frequency:', error);
    }
  };

  const convertPendingToActive = async (customerId) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          status: 'active',
          next_service: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next week
        })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { 
              ...customer, 
              status: 'active',
              next_service: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          : customer
      ));
    } catch (error) {
      console.error('Error converting to active:', error);
    }
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  // Generate email segments for marketing
  const generateEmailSegments = () => {
    const validEmails = customers.filter(c => c.email && c.email.includes('@'));
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const avgPrice = validEmails.reduce((sum, c) => sum + parseFloat(c.price || 0), 0) / validEmails.length;

    setEmailSegments({
      all: validEmails,
      active: validEmails.filter(c => c.status === 'active'),
      highValue: validEmails.filter(c => parseFloat(c.price || 0) > avgPrice),
      weekly: validEmails.filter(c => c.frequency === 'weekly'),
      biWeekly: validEmails.filter(c => c.frequency === 'bi_weekly'),
      recent: validEmails.filter(c => new Date(c.created_at) > thirtyDaysAgo),
      inactive: validEmails.filter(c => c.status === 'pending' || c.status === 'cancelled')
    });
  };

  // Export email list by segment
  const exportEmailList = (segment, segmentName) => {
    const emailData = segment.map(customer => ({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      service: formatServiceType(customer.service_type),
      frequency: formatFrequency(customer.frequency),
      price: customer.price,
      status: customer.status,
      address: customer.address || ''
    }));

    const headers = ['Name', 'Email', 'Phone', 'Service', 'Frequency', 'Price', 'Status', 'Address'];
    const csvContent = [headers, ...emailData.map(row => Object.values(row))]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-list-${segmentName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Safe clipboard copy function with mobile fallback - no errors thrown
  const safeCopyToClipboard = async (text) => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = typeof window !== 'undefined' && (
        window.isSecureContext || 
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );

      // Try modern clipboard API first (works in secure contexts)
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText && isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (err) {
          // Silently fail and try fallback - don't log errors on mobile
          if (window.location.protocol === 'https:') {
            console.warn('Clipboard API failed, trying fallback');
          }
        }
      }

      // Fallback method for mobile/insecure contexts
      if (typeof document !== 'undefined') {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          textArea.style.opacity = '0';
          textArea.style.pointerEvents = 'none';
          document.body.appendChild(textArea);
          
          // Try to select and copy
          if (textArea.select) {
            textArea.select();
            textArea.setSelectionRange(0, 99999); // For mobile devices
          }
          
          const successful = document.execCommand && document.execCommand('copy');
          document.body.removeChild(textArea);
          
          return successful || false;
        } catch (err) {
          // Silently fail - don't throw errors
          return false;
        }
      }
      
      return false;
    } catch (err) {
      // Catch all errors silently
      return false;
    }
  };

  // Copy emails to clipboard
  const copyEmailsToClipboard = async (segment) => {
    const emails = segment.map(c => c.email).join(', ');
    const success = await safeCopyToClipboard(emails);
    if (success) {
      alert(`Copied ${segment.length} email addresses to clipboard!`);
    } else {
      alert('Failed to copy emails. Please try selecting the text manually.');
    }
  };

  // Generate email templates
  const generateEmailTemplate = (type, segment) => {
    const templates = {
      coupon: `Subject: 🌿 Special Discount for Our Valued Customers!

Hi [Name],

We appreciate your business! Here's an exclusive 15% discount on your next service.

Use code: SAVE15
Valid until: [Date]

Book now: [Your Phone Number]

Best regards,
Flora Landscaping Team`,

      upsell: `Subject: 🏡 Upgrade Your Lawn Care Package

Hi [Name],

Based on your ${segment.length > 0 ? formatFrequency(segment[0]?.frequency) : ''} service, we think you'd love our premium package:

✅ Additional services included
✅ Priority scheduling  
✅ Seasonal maintenance

Call us to learn more: [Your Phone Number]

Best,
Flora Landscaping`,

      seasonal: `Subject: 🍂 Seasonal Service Reminder

Hi [Name],

It's time for seasonal lawn preparation! 

Our team is ready to help with:
- Fall cleanup
- Leaf removal
- Winter preparation

Schedule today: [Your Phone Number]

Flora Landscaping Team`,

      reactivation: `Subject: We Miss You! 🌱 Come Back Offer

Hi [Name],

We noticed it's been a while since your last service. We'd love to have you back!

Special comeback offer: 20% off your next service
Code: COMEBACK20

Ready to restore your lawn? Call: [Your Phone Number]

Flora Landscaping`
    };

    return templates[type] || templates.coupon;
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Premium Top Navigation Menu */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-[56px] z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-2 sm:py-3 hide-scrollbar pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            <Link
              href="/customers"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/customers' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Customers
            </Link>
            <Link
              href="/admin/work-requests"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/admin/work-requests' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Work Requests
            </Link>
            <Link
              href="/admin/completed-jobs"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/admin/completed-jobs' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Completed Jobs
            </Link>
            <Link
              href="/schedule"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/schedule' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Schedule
            </Link>
            <Link
              href="/admin/completion-history"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/admin/completion-history' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Completion History
            </Link>
            <Link
              href="/admin/referrals"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/admin/referrals' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Referrals
            </Link>
            <Link
              href="/admin/signups-leads"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/admin/signups-leads' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Sign Ups & Leads
            </Link>
            <Link
              href="/contracts"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/contracts' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Contracts
            </Link>
            <Link
              href="/invoices"
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                pathname === '/invoices' 
                  ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 scale-105 transition-all duration-200 border-none' 
                  : 'text-gray-600 bg-gray-50/50 hover:bg-white hover:text-green-600 hover:shadow-sm hover:scale-105 border border-transparent hover:border-gray-200 transition-all duration-200'
              }`}
            >
              Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Actions</h2>
              {selectedCustomers.length > 0 && (
                <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  {selectedCustomers.length} selected
                </span>
              )}
            </div>
            
            {/* Mobile-optimized button grid - 2 columns on mobile, flex wrap on larger screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-1.5 sm:gap-2 md:gap-3">
              {/* Pending Customers & Leads Notification */}
              {(customers.filter(c => c.status === 'pending').length > 0 || pendingLeadsCount > 0) && (
                <button
                  onClick={() => {
                    if (pendingLeadsCount > 0) {
                      setShowBookingRequests(true);
                      fetchAppointments();
                    } else {
                      setStatusFilter('pending');
                    }
                  }}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-800 hover:bg-yellow-200 relative"
                >
                  <span className="mr-2">🔔</span>
                  {customers.filter(c => c.status === 'pending').length + pendingLeadsCount} New
                  {pendingLeadsCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {pendingLeadsCount} Lead{pendingLeadsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              )}
              
              {/* New Lead Notification Toast */}
              {newLeadNotification && (
                <div 
                  className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm"
                  style={{
                    animation: 'slideInRight 0.3s ease-out'
                  }}
                >
                  <style jsx>{`
                    @keyframes slideInRight {
                      from {
                        transform: translateX(100%);
                        opacity: 0;
                      }
                      to {
                        transform: translateX(0);
                        opacity: 1;
                      }
                    }
                  `}</style>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🔔</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1">New Lead!</h3>
                      <p className="text-xs mb-1"><strong>{newLeadNotification.name}</strong></p>
                      <p className="text-xs mb-1">{newLeadNotification.service}</p>
                      <p className="text-xs opacity-75">{newLeadNotification.time}</p>
                    </div>
                    <button
                      onClick={() => setNewLeadNotification(null)}
                      className="flex-shrink-0 text-white hover:text-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowBulkImport(true)}
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={() => setShowEmailList(true)}
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <AtSymbolIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Email Lists</span>
                <span className="sm:hidden">Emails</span>
              </button>
              <Link
                href="/analytics"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-blue-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">📈 Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </Link>
              <Link
                href="/email-marketing"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-green-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">📧 Email Marketing</span>
                <span className="sm:hidden">Marketing</span>
              </Link>
              <Link
                href="/admin/signups-leads"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-orange-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <UserPlusIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">👥 Sign Ups & Leads</span>
                <span className="sm:hidden">Sign Ups</span>
              </Link>
              <Link
                href="/admin/referrals"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-pink-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors"
              >
                <GiftIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">🎁 Referrals & Rewards</span>
                <span className="sm:hidden">Referrals</span>
              </Link>
              <Link
                href="/admin/work-requests"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-indigo-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">⏰ Work Requests</span>
                <span className="sm:hidden">Work</span>
              </Link>
              <Link
                href="/admin/completed-jobs"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-teal-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">✅ Completed Jobs</span>
                <span className="sm:hidden">Jobs</span>
              </Link>
              <Link
                href="/admin/completion-history"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">📊 Completion History</span>
                <span className="sm:hidden">History</span>
              </Link>
              <Link
                href="/contracts"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">📄 Contracts</span>
                <span className="sm:hidden">Contracts</span>
              </Link>
              <button
                onClick={() => setShowMonthlyRevenue(true)}
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <BanknotesIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">📊 Monthly Revenue</span>
                <span className="sm:hidden">Revenue</span>
              </button>
              <button
                onClick={() => setShowExpenseTracker(true)}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="hidden sm:inline">Expenses</span>
                <span className="sm:hidden">$</span>
              </button>
              
              {/* Notes Link */}
              <Link
                href="/notes"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ClipboardDocumentListIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Notes</span>
                <span className="sm:hidden">📝</span>
              </Link>
              
              {/* Invoices Link */}
              <Link
                href="/invoices"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Invoices</span>
                <span className="sm:hidden">📄</span>
              </Link>
              
              {/* Booking Requests Button */}
              <button
                onClick={() => {
                  setShowBookingRequests(!showBookingRequests);
                  if (!showBookingRequests) {
                    fetchAppointments();
                  }
                }}
                className={`inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md shadow-sm text-xs sm:text-sm font-medium transition-colors ${
                  showBookingRequests
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">
                  Booking Requests ({appointments.filter(apt => 
                    apt.status === 'pending' && 
                    (apt.booking_type === 'Ready to Hire' || apt.booking_type === 'Contract Request')
                  ).length})
                </span>
                <span className="sm:hidden">📅</span>
              </button>
              
              {/* Customer Activity Button */}
              <button
                onClick={() => {
                  setShowActivity(!showActivity);
                  if (!showActivity) {
                    fetchSkippedServices();
                  }
                }}
                className={`inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md shadow-sm text-xs sm:text-sm font-medium transition-colors ${
                  showActivity
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Customer Activity</span>
                <span className="sm:hidden">📊</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Add Customer</span>
                <span className="sm:hidden">+ Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your customers, track services, and analyze performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 lg:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 text-white">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 lg:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-lg shadow-green-500/30 text-white">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 lg:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30 text-white">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Weekly Revenue</p>
                <ClickableNumber type="revenue" className="text-lg lg:text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.weeklyRevenue, 'revenue')}
                </ClickableNumber>
                <p className="text-xs text-gray-500">Projected Weekly</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 lg:p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Monthly Revenue</p>
                <ClickableNumber type="revenue" className="text-lg lg:text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRevenue, 'revenue')}
                </ClickableNumber>
                <p className="text-xs text-gray-500">Projected Monthly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Yearly Revenue - Full Width Card */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg p-4 lg:p-6 mb-8 text-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Projected Revenue */}
            <div className="text-center">
              <div className="p-2 lg:p-3 bg-white/20 rounded-lg mx-auto w-fit mb-2 lg:mb-3">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V9a2 2 0 012-2h2a2 2 0 00-2-2" />
                </svg>
              </div>
              <p className="text-sm lg:text-lg font-medium text-white/90 mb-1">📈 Projected Revenue</p>
              <ClickableNumber type="revenue" className="text-xl lg:text-3xl font-bold text-white">
                {formatCurrency(stats.adjustedYearlyRevenue, 'revenue')}
              </ClickableNumber>
              <p className="text-xs lg:text-sm text-white/80 mt-1">Based on {stats.workingMonthsCount} working months</p>
            </div>

            {/* Actual Revenue */}
            <div className="text-center">
              <div className="p-2 lg:p-3 bg-white/20 rounded-lg mx-auto w-fit mb-2 lg:mb-3">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-sm lg:text-lg font-medium text-white/90 mb-1">💰 Actual Revenue</p>
              <ClickableNumber type="revenue" className="text-xl lg:text-3xl font-bold text-white">
                {formatCurrency(stats.actualWorkingRevenue, 'revenue')}
              </ClickableNumber>
              <p className="text-xs lg:text-sm text-white/80 mt-1">From working months only</p>
            </div>

            {/* Total Expenses */}
            <div className="text-center">
              <div className="p-2 lg:p-3 bg-white/20 rounded-lg mx-auto w-fit mb-2 lg:mb-3">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm lg:text-lg font-medium text-white/90 mb-1">💸 Total Expenses</p>
              <p className="text-xl lg:text-3xl font-bold text-white">{formatCurrency(stats.totalWorkingExpenses, 'expenses')}</p>
              <p className="text-xs lg:text-sm text-white/80 mt-1">Gas, employees, equipment</p>
            </div>

            {/* Net Profit */}
            <div className="text-center">
              <div className="p-2 lg:p-3 bg-white/20 rounded-lg mx-auto w-fit mb-2 lg:mb-3">
                {stats.netWorkingProfit >= 0 ? (
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
              </div>
              <p className="text-sm lg:text-lg font-medium text-white/90 mb-1">
                {stats.netWorkingProfit >= 0 ? '🎯 Net Profit' : '📉 Net Loss'}
              </p>
              <p className={`text-xl lg:text-3xl ${stats.netWorkingProfit >= 0 ? 'text-white' : 'text-red-200'}`}>
                {formatCurrency(Math.abs(stats.netWorkingProfit), 'profit')}
              </p>
              <p className="text-xs lg:text-sm text-white/80 mt-1">
                {stats.actualWorkingRevenue > 0 ? 
                  `${formatPercentage(Math.round((stats.netWorkingProfit / stats.actualWorkingRevenue) * 100), 'profit')} profit margin` : 
                  'Revenue - Expenses'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Working Months Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">🗓️ Working Months</h3>
              <p className="text-sm text-gray-600">Select the months you actively work to get accurate yearly projections</p>
            </div>
            <div className="text-sm text-gray-500">
              {workingMonths.length} of 12 months selected
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map(month => (
              <label key={month} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={workingMonths.includes(month)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWorkingMonths(prev => [...prev, month]);
                    } else {
                      setWorkingMonths(prev => prev.filter(m => m !== month));
                    }
                  }}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className={`text-sm ${
                  workingMonths.includes(month) 
                    ? 'text-green-700 font-medium' 
                    : 'text-gray-600'
                }`}>
                  {month.slice(0, 3)}
                </span>
              </label>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setWorkingMonths([
                'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'
              ])}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              🌱 Spring-Fall (9 months)
            </button>
            <button
              onClick={() => setWorkingMonths([
                'April', 'May', 'June', 'July', 'August', 'September', 'October'
              ])}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              ☀️ Peak Season (7 months)
            </button>
            <button
              onClick={() => setWorkingMonths([
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ])}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              🗓️ All Year (12 months)
            </button>
            <button
              onClick={() => setWorkingMonths([])}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Booking Requests Section */}
        {showBookingRequests && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Booking Requests ({(() => {
                    const pendingLeads = appointments.filter(apt => 
                      apt.status === 'pending' && 
                      (apt.booking_type === 'Ready to Hire' || apt.booking_type === 'Contract Request')
                    );
                    return pendingLeads.length;
                  })()} pending)
                </h2>
                <button
                  onClick={() => fetchAppointments()}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(() => {
                  // Filter to only show pending leads from contact forms
                  const pendingLeads = appointments.filter(apt => 
                    apt.status === 'pending' && 
                    (apt.booking_type === 'Ready to Hire' || apt.booking_type === 'Contract Request')
                  );
                  
                  if (pendingLeads.length === 0) {
                    return <p className="text-sm text-gray-500 text-center py-4">No pending booking requests from contact forms</p>;
                  }
                  
                  return pendingLeads.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">{apt.customer_name}</p>
                            {apt.customer_id ? (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">Account</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">Guest</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              apt.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {apt.customer_email}
                            </p>
                            <p className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {apt.customer_phone}
                            </p>
                            <p className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {apt.city}{apt.street_address ? `, ${apt.street_address}` : ''}
                            </p>
                            <p className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(apt.date).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {apt.service_type}
                            </p>
                            {apt.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                Notes: {apt.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          {apt.status === 'pending' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    console.log('Confirming appointment:', apt);
                                    
                                    // First, update appointment status
                                    const { error: updateError } = await supabase
                                    .from('appointments')
                                    .update({ status: 'confirmed' })
                                    .eq('id', apt.id);
                                    
                                    if (updateError) {
                                      console.error('Error updating appointment:', updateError);
                                      throw updateError;
                                    }

                                    console.log('Appointment updated to confirmed');

                                    // Check if customer already exists by email or phone
                                    let existingCustomer = null;
                                    if (apt.customer_email || apt.customer_phone) {
                                      let query = supabase
                                        .from('customers')
                                        .select('id');
                                      
                                      if (apt.customer_email && apt.customer_phone) {
                                        query = query.or(`email.eq.${apt.customer_email},phone.eq.${apt.customer_phone}`);
                                      } else if (apt.customer_email) {
                                        query = query.eq('email', apt.customer_email);
                                      } else if (apt.customer_phone) {
                                        query = query.eq('phone', apt.customer_phone);
                                      }
                                      
                                      const { data, error: checkError } = await query.limit(1);
                                      
                                      console.log('Customer check result:', { data, checkError });
                                      
                                      if (!checkError && data && data.length > 0) {
                                        existingCustomer = data[0];
                                        console.log('Customer already exists:', existingCustomer);
                                      }
                                    }

                                    // ALWAYS create customer if they don't exist (even if no email/phone check was possible)
                                    if (!existingCustomer) {
                                      const address = apt.street_address 
                                        ? `${apt.street_address}, ${apt.city || ''}`.trim()
                                        : apt.city || '';
                                      
                                      // Map appointment service_type to valid customer service_type
                                      // Valid values: 'lawn_mowing', 'lawn_care', 'landscaping', 'mulch_installation', 'spring_cleanup', 'fall_cleanup'
                                      const validServiceTypes = ['lawn_mowing', 'lawn_care', 'landscaping', 'mulch_installation', 'spring_cleanup', 'fall_cleanup'];
                                      let mappedServiceType = 'lawn_mowing'; // Default
                                      
                                      if (apt.service_type) {
                                        const normalizedType = apt.service_type.toLowerCase().trim();
                                        // Check if it's already a valid type
                                        if (validServiceTypes.includes(normalizedType)) {
                                          mappedServiceType = normalizedType;
                                        } else {
                                          // Map common variations to valid types
                                          const serviceTypeMap = {
                                            'spring cleanup': 'spring_cleanup',
                                            'spring_cleanup': 'spring_cleanup',
                                            'fall cleanup': 'fall_cleanup',
                                            'fall_cleanup': 'fall_cleanup',
                                            'mulch': 'mulch_installation',
                                            'mulch installation': 'mulch_installation',
                                            'mulch_installation': 'mulch_installation',
                                            'lawn care': 'lawn_care',
                                            'lawn_care': 'lawn_care',
                                            'landscaping': 'landscaping',
                                            'lawn mowing': 'lawn_mowing',
                                            'lawn_mowing': 'lawn_mowing',
                                            'mowing': 'lawn_mowing'
                                          };
                                          
                                          mappedServiceType = serviceTypeMap[normalizedType] || 'lawn_mowing';
                                        }
                                      }
                                      
                                      const customerData = {
                                        name: apt.customer_name || 'Unknown Customer',
                                        email: apt.customer_email || null,
                                        phone: apt.customer_phone || 'No phone',
                                        address: address || null,
                                        service_type: mappedServiceType,
                                        frequency: 'weekly', // Default frequency
                                        price: 0, // Default price, can be updated later
                                        status: 'pending',
                                        notes: apt.notes ? `From contact form: ${apt.notes}` : 'From contact form',
                                        next_service: apt.date ? new Date(apt.date).toISOString().split('T')[0] : null
                                      };
                                      
                                      console.log('Creating customer with data:', customerData);
                                      
                                      const { data: newCustomer, error: insertError } = await supabase
                                        .from('customers')
                                        .insert([customerData])
                                        .select();

                                      if (insertError) {
                                        console.error('Error creating customer:', insertError);
                                        alert(`Appointment confirmed, but failed to create customer: ${insertError.message}`);
                                      } else {
                                        console.log('Customer created successfully:', newCustomer);
                                        alert(`Customer "${apt.customer_name}" has been added to your customer list!`);
                                        
                                        // Ensure status filter shows pending customers
                                        if (statusFilter !== 'all' && statusFilter !== 'pending') {
                                          setStatusFilter('all');
                                        }
                                        
                                        // Refresh customer list immediately and after delays to ensure it appears
                                        await fetchCustomers();
                                        setTimeout(async () => {
                                          await fetchCustomers();
                                          // Also refresh appointments
                                          fetchAppointments();
                                        }, 500);
                                        setTimeout(async () => {
                                          await fetchCustomers();
                                        }, 1500);
                                      }
                                    } else {
                                      console.log('Customer already exists, skipping creation');
                                      await fetchCustomers();
                                      fetchAppointments();
                                    }

                                    // Always refresh appointments
                                    fetchAppointments();
                                  } catch (error) {
                                    console.error('Error confirming appointment:', error);
                                    alert(`Error confirming appointment: ${error.message}`);
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('appointments')
                                    .update({ status: 'cancelled' })
                                    .eq('id', apt.id);
                                  if (!error) fetchAppointments();
                                }}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(apt.status === 'confirmed' || apt.status === 'pending') && (
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setCompletionMessage(`Your ${apt.service_type} service has been completed successfully! Thank you for choosing Flora Lawn and Landscaping.`);
                                setShowMarkDoneModal(true);
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            >
                              <CheckCircleIcon className="h-3 w-3" />
                              Mark Done
                            </button>
                          )}
                          {apt.status === 'completed' && (
                            <span className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded flex items-center gap-1">
                              <CheckCircleIcon className="h-3 w-3" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Customer Activity Section */}
        {showActivity && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Customer Activity</h2>
                <button
                  onClick={() => fetchSkippedServices()}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {/* Cancelled Services */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  Cancelled Services ({customers.filter(c => c.status === 'cancelled').length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customers.filter(c => c.status === 'cancelled').length === 0 ? (
                    <p className="text-sm text-gray-500">No cancelled services</p>
                  ) : (
                    customers
                      .filter(c => c.status === 'cancelled')
                      .map((customer) => (
                        <div key={customer.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.email || customer.phone}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {customer.service_type.replace('_', ' ')} • {customer.frequency.replace('_', '-')}
                              </p>
                              {customer.notes && customer.notes.includes('[Cancelled by customer') && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {customer.notes.split('[Cancelled by customer')[1]?.split(']')[0] || 'Cancelled'}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(customer.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Skipped Services */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Skipped Services ({skippedServices.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {skippedServices.length === 0 ? (
                    <p className="text-sm text-gray-500">No skipped services</p>
                  ) : (
                    skippedServices.map((skip) => (
                      <div key={skip.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {skip.customers?.name || 'Unknown Customer'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {skip.customers?.email || skip.customers?.phone || ''}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Skipped: {new Date(skip.service_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            {skip.reason && (
                              <p className="text-xs text-gray-500 mt-1 italic">Reason: {skip.reason}</p>
                            )}
                            {skip.customers && (
                              <p className="text-xs text-gray-400 mt-1">
                                {skip.customers.service_type.replace('_', ' ')} • {skip.customers.frequency.replace('_', '-')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(skip.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              {/* Search and View Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Search */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-l-md border ${
                      viewMode === 'table'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="hidden sm:inline">Table</span>
                    <span className="sm:hidden">📋</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                      viewMode === 'cards'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="hidden sm:inline">Cards</span>
                    <span className="sm:hidden">🗂️</span>
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="block w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                  >
                    <option value="all">All Services</option>
                    <option value="lawn_mowing">Lawn Mowing</option>
                    <option value="lawn_care">Lawn Care</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="mulch_installation">Mulch Installation</option>
                    <option value="spring_cleanup">Spring Cleanup</option>
                    <option value="fall_cleanup">Fall Cleanup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={frequencyFilter}
                    onChange={(e) => setFrequencyFilter(e.target.value)}
                    className="block w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                  >
                    <option value="all">All Frequencies</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="block w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="$999"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="block w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="block w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="price-desc">Price High-Low</option>
                    <option value="price-asc">Price Low-High</option>
                    <option value="next_service-asc">Next Service</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCustomers.length > 0 && (
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <span className="text-sm text-gray-700">
                  {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('active')}
                    className="px-2 sm:px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200"
                  >
                    Mark Active
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('completed')}
                    className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => handleBulkFrequencyUpdate('weekly')}
                    className="px-2 sm:px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200"
                  >
                    Set Weekly
                  </button>
                  <button
                    onClick={() => handleBulkFrequencyUpdate('bi_weekly')}
                    className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
                  >
                    Set Bi-Weekly
                  </button>
                  <button
                    onClick={() => setSelectedCustomers([])}
                    className="px-2 sm:px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer List */}
        {viewMode === 'table' ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Mobile-friendly table wrapper */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={selectAllCustomers}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Service
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-center mt-1 group">
                            <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span className="truncate flex-1">{customer.email}</span>
                            {customer.email && (
                              <button
                                onClick={async () => {
                                  const success = await safeCopyToClipboard(customer.email);
                                  if (success) {
                                    alert('Email copied to clipboard!');
                                  } else {
                                    alert('Failed to copy email. Please try selecting the text manually.');
                                  }
                                }}
                                className="ml-1 p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy email"
                              >
                                <ClipboardIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
                            <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {customer.phone}
                          </div>
                          {customer.address && (
                            <>
                              <div className="text-xs sm:text-sm text-gray-500 flex items-center mt-1 sm:hidden group">
                                <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate flex-1">{customer.address}</span>
                                <button
                                  onClick={async () => {
                                    const success = await safeCopyToClipboard(customer.address);
                                    if (success) {
                                      alert('Address copied to clipboard!');
                                    } else {
                                      alert('Failed to copy address. Please try selecting the text manually.');
                                    }
                                  }}
                                  className="ml-1 p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy address"
                                >
                                  <ClipboardIcon className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="hidden sm:flex items-center mt-1 group">
                                <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-500 truncate flex-1">{customer.address}</span>
                                <button
                                  onClick={async () => {
                                    const success = await safeCopyToClipboard(customer.address);
                                    if (success) {
                                      alert('Address copied to clipboard!');
                                    } else {
                                      alert('Failed to copy address. Please try selecting the text manually.');
                                    }
                                  }}
                                  className="ml-1 p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy address"
                                >
                                  <ClipboardIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </>
                          )}
                          {/* Show service info on mobile */}
                          <div className="sm:hidden mt-2">
                            <div className="text-xs text-gray-900">{formatServiceType(customer.service_type)}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">{formatFrequency(customer.frequency)}</span>
                              <button
                                onClick={() => toggleCustomerFrequency(customer.id, customer.frequency)}
                                className={`px-1 py-0.5 text-xs font-medium rounded-full transition-colors ${
                                  customer.frequency === 'weekly' 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                                title={`Switch to ${customer.frequency === 'weekly' ? 'bi-weekly' : 'weekly'}`}
                              >
                                ↔
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatServiceType(customer.service_type)}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">{formatFrequency(customer.frequency)}</span>
                          <button
                            onClick={() => toggleCustomerFrequency(customer.id, customer.frequency)}
                            className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                              customer.frequency === 'weekly' 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title={`Switch to ${customer.frequency === 'weekly' ? 'bi-weekly' : 'weekly'}`}
                          >
                            ↔ {customer.frequency === 'weekly' ? 'Bi-Weekly' : 'Weekly'}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${customer.price}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusIcon(customer.status)}
                          <span className="ml-1 hidden sm:inline">{customer.status}</span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.next_service ? new Date(customer.next_service).toLocaleDateString() : 'Not scheduled'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1 sm:space-x-2">
                          {customer.status === 'pending' && (
                            <button
                              onClick={() => convertPendingToActive(customer.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Convert to Active Customer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => setShowCustomerDetails(customer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Customer"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Customer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-black/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-3"
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {getStatusIcon(customer.status)}
                    <span className="ml-1">{customer.status}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 group">
                    <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate flex-1">{customer.email}</span>
                    {customer.email && (
                      <button
                        onClick={async () => {
                          const success = await safeCopyToClipboard(customer.email);
                          if (success) {
                            alert('Email copied to clipboard!');
                          } else {
                            alert('Failed to copy email. Please try selecting the text manually.');
                          }
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy email"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {customer.phone}
                  </div>
                  {customer.address && (
                    <div className="flex items-center text-sm text-gray-600 group">
                      <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate flex-1">{customer.address}</span>
                      <button
                        onClick={async () => {
                          const success = await safeCopyToClipboard(customer.address);
                          if (success) {
                            alert('Address copied to clipboard!');
                          } else {
                            alert('Failed to copy address. Please try selecting the text manually.');
                          }
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy address"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Service</span>
                    <span className="text-sm font-medium">{formatServiceType(customer.service_type)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Frequency</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{formatFrequency(customer.frequency)}</span>
                      <button
                        onClick={() => toggleCustomerFrequency(customer.id, customer.frequency)}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                          customer.frequency === 'weekly' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                        title={`Switch to ${customer.frequency === 'weekly' ? 'bi-weekly' : 'weekly'}`}
                      >
                        ↔ {customer.frequency === 'weekly' ? 'Bi-Weekly' : 'Weekly'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Price</span>
                    <span className="text-lg font-bold text-green-600">${customer.price}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowCustomerDetails(customer)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <div className="flex space-x-2">
                    {customer.status === 'pending' && (
                      <button
                        onClick={() => convertPendingToActive(customer.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        title="Convert to Active Customer"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Convert
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(customer)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && statusFilter === 'all' && serviceFilter === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Customer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => setShowCustomerDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{showCustomerDetails.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-gray-900">{showCustomerDetails.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-gray-900">{showCustomerDetails.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(showCustomerDetails.status)}`}>
                      {getStatusIcon(showCustomerDetails.status)}
                      <span className="ml-1">{showCustomerDetails.status}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Service Type</label>
                    <p className="mt-1 text-gray-900">{formatServiceType(showCustomerDetails.service_type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Frequency</label>
                    <p className="mt-1 text-gray-900">{formatFrequency(showCustomerDetails.frequency)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Price</label>
                    <p className="mt-1 text-2xl font-bold text-green-600">${showCustomerDetails.price}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Next Service</label>
                    <p className="mt-1 text-gray-900">
                      {showCustomerDetails.next_service 
                        ? new Date(showCustomerDetails.next_service).toLocaleDateString()
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>

              {showCustomerDetails.address && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-gray-900">{showCustomerDetails.address}</p>
                </div>
              )}

              {showCustomerDetails.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{showCustomerDetails.notes}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomerDetails(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                {showCustomerDetails.status === 'pending' && (
                  <button
                    onClick={() => {
                      convertPendingToActive(showCustomerDetails.id);
                      setShowCustomerDetails(null);
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Convert to Active
                  </button>
                )}
                <button
                  onClick={() => {
                    handleEdit(showCustomerDetails);
                    setShowCustomerDetails(null);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Edit Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="Customer name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="customer@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <select
                      value={formData.service_type}
                      onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="lawn_mowing">Lawn Mowing</option>
                      <option value="lawn_care">Lawn Care</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="mulch_installation">Mulch Installation</option>
                      <option value="spring_cleanup">Spring Cleanup</option>
                      <option value="fall_cleanup">Fall Cleanup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="one_time">One-time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Service Date</label>
                    <input
                      type="date"
                      value={formData.next_service}
                      onChange={(e) => setFormData({...formData, next_service: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={2}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Customer address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Additional notes about the customer"
                  />
                </div>

                {/* Link to Existing User Account */}
                {!editingCustomer && (
                  <div className="border-t pt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link to User Account (Optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        If this customer has an account, link them to ensure automatic customer creation worked correctly.
                      </p>
                      
                      <div className="relative user-selector-container">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={(e) => {
                              setUserSearchTerm(e.target.value);
                              setShowUserSelector(true);
                            }}
                            onFocus={() => setShowUserSelector(true)}
                            placeholder="Search by email or name..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          />
                          {formData.user_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({...formData, user_id: null});
                                setUserSearchTerm('');
                              }}
                              className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {showUserSelector && filteredUserAccounts.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredUserAccounts.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    user_id: user.id,
                                    email: formData.email || user.email,
                                    name: formData.name || user.name
                                  });
                                  setUserSearchTerm(user.email);
                                  setShowUserSelector(false);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 ${
                                  formData.user_id === user.id ? 'bg-green-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                  {user.hasCustomer && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Has Customer
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {showUserSelector && userSearchTerm && filteredUserAccounts.length === 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
                            No users found matching "{userSearchTerm}"
                          </div>
                        )}
                      </div>

                      {formData.user_id && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            ✓ Linked to: {userAccounts.find(u => u.id === formData.user_id)?.email || 'User account'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Form */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Import Customers</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Option 1: AI-Powered Import</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Paste any text with customer information (emails, addresses, notes, etc.) and Claude AI will automatically extract and organize the data.
                </p>
                
                <h3 className="text-lg font-semibold mb-2">Option 2: Manual Format</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Use this format (one customer per line):
                </p>
                <code className="block bg-gray-100 p-2 rounded text-sm mb-4">
                  Name, Address, Phone, Email, Price, Notes<br/>
                  John Smith, 123 Main St Providence RI, (401) 555-0101, john@email.com, 45.00, Weekly service<br/>
                  Sarah Johnson, 456 Oak Ave Warwick RI, (401) 555-0102, sarah@email.com, 60.00, Bi-weekly
                </code>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Information
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Paste customer information here..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkText('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={processBulkManual}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Import (Manual Format)
                </button>
                <button
                  type="button"
                  onClick={processBulkImport}
                  disabled={processingAI}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {processingAI ? 'Processing with AI...' : 'Import with AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email List Management Modal */}
      {showEmailList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Email Marketing Lists</h2>
                  <p className="text-gray-600">Segment your customers for targeted email campaigns</p>
                </div>
                <button
                  onClick={() => setShowEmailList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  { key: 'all', name: 'All Customers', icon: UserGroupIcon, color: 'blue', desc: 'Everyone with valid email' },
                  { key: 'active', name: 'Active Customers', icon: CheckCircleIcon, color: 'green', desc: 'Currently active services' },
                  { key: 'highValue', name: 'High Value', icon: StarIcon, color: 'yellow', desc: 'Above average pricing' },
                  { key: 'weekly', name: 'Weekly Service', icon: CalendarIcon, color: 'green', desc: 'Weekly frequency customers' },
                  { key: 'biWeekly', name: 'Bi-Weekly Service', icon: CalendarIcon, color: 'blue', desc: 'Bi-weekly frequency customers' },
                  { key: 'recent', name: 'New Customers', icon: UserIcon, color: 'purple', desc: 'Added in last 30 days' },
                  { key: 'inactive', name: 'Inactive/Pending', icon: ClockIcon, color: 'orange', desc: 'Need reactivation' }
                ].map(segment => {
                  const count = emailSegments[segment.key]?.length || 0;
                  const IconComponent = segment.icon;
                  
                  return (
                    <div key={segment.key} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg bg-${segment.color}-100`}>
                            <IconComponent className={`h-6 w-6 text-${segment.color}-600`} />
                          </div>
                          <div className="ml-3">
                            <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                            <p className="text-sm text-gray-500">{segment.desc}</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{count}</span>
                      </div>
                      
                      {count > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() => copyEmailsToClipboard(emailSegments[segment.key])}
                            className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            📋 Copy Emails
                          </button>
                          <button
                            onClick={() => exportEmailList(emailSegments[segment.key], segment.name)}
                            className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            📊 Export CSV
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Email Templates Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { type: 'coupon', name: '🎫 Discount Coupon', desc: 'Send special offers and discounts' },
                    { type: 'upsell', name: '⬆️ Service Upsell', desc: 'Promote premium services' },
                    { type: 'seasonal', name: '🍂 Seasonal Reminder', desc: 'Seasonal service notifications' },
                    { type: 'reactivation', name: '🔄 Win Back', desc: 'Reactivate inactive customers' }
                  ].map(template => (
                    <div key={template.type} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{template.desc}</p>
                      <button
                        onClick={async () => {
                          const templateText = generateEmailTemplate(template.type, emailSegments.active);
                          const success = await safeCopyToClipboard(templateText);
                          if (success) {
                            alert(`${template.name} template copied to clipboard!`);
                          } else {
                            alert('Failed to copy template. Please try selecting the text manually.');
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Copy Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email List Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{emailSegments.all?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Emails</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{emailSegments.active?.length || 0}</div>
                    <div className="text-sm text-gray-600">Active Customers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{emailSegments.highValue?.length || 0}</div>
                    <div className="text-sm text-gray-600">High Value</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{emailSegments.inactive?.length || 0}</div>
                    <div className="text-sm text-gray-600">Need Reactivation</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowEmailList(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Monthly Revenue Tracker Modal */}
      {showMonthlyRevenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Monthly Revenue Tracker</h2>
                  <p className="text-gray-600">Track your actual monthly earnings vs projections</p>
                </div>
                <button
                  onClick={() => setShowMonthlyRevenue(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Monthly Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {Object.keys(monthlyActualRevenue).map(month => {
                  const isWorkingMonth = workingMonths.includes(month);
                  const projectedMonthly = Math.round(stats.monthlyRevenue);
                  const actual = monthlyActualRevenue[month];
                  const difference = actual - projectedMonthly;
                  
                  return (
                    <div key={month} className={`border rounded-lg p-4 ${isWorkingMonth ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{month}</h3>
                        {isWorkingMonth && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Working</span>}
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="text-sm">
                          <span className="text-gray-500">Target: </span>
                          <span className="font-medium">${projectedMonthly.toLocaleString()}</span>
                        </div>
                        {actual > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Difference: </span>
                            <span className={`font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {difference >= 0 ? '+' : ''}${difference.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={monthlyActualRevenue[month] || ''}
                          onChange={(e) => setMonthlyActualRevenue(prev => ({
                            ...prev,
                            [month]: parseFloat(e.target.value) || 0
                          }))}
                          className={`w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                            isWorkingMonth ? 'border-green-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      
                      {actual > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${actual >= projectedMonthly ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min((actual / projectedMonthly) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round((actual / projectedMonthly) * 100)}% of target
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Year Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">${stats.yearlyRevenue.toLocaleString()}</div>
                    <div className="text-sm text-blue-600">Projected ({stats.workingMonthsCount} months)</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${stats.actualWorkingRevenue.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Actual (Working months)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">${stats.actualYearlyRevenue.toLocaleString()}</div>
                    <div className="text-sm text-purple-600">Total Actual (All months)</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${stats.actualWorkingRevenue >= stats.yearlyRevenue ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div className={`text-2xl font-bold ${stats.actualWorkingRevenue >= stats.yearlyRevenue ? 'text-green-600' : 'text-orange-600'}`}>
                      {stats.yearlyRevenue > 0 ? `${Math.round(((stats.actualWorkingRevenue / stats.yearlyRevenue) * 100))}%` : '0%'}
                    </div>
                    <div className={`text-sm ${stats.actualWorkingRevenue >= stats.yearlyRevenue ? 'text-green-600' : 'text-orange-600'}`}>
                      Performance vs Target
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Fill Buttons */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const projectedMonthly = Math.round(stats.monthlyRevenue);
                      const newRevenue = { ...monthlyActualRevenue };
                      workingMonths.forEach(month => {
                        newRevenue[month] = projectedMonthly;
                      });
                      setMonthlyActualRevenue(newRevenue);
                    }}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    📊 Fill Working Months with Projected (${Math.round(stats.monthlyRevenue).toLocaleString()})
                  </button>
                  <button
                    onClick={() => {
                      const newRevenue = {};
                      Object.keys(monthlyActualRevenue).forEach(month => {
                        newRevenue[month] = 0;
                      });
                      setMonthlyActualRevenue(newRevenue);
                    }}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    🗑️ Clear All
                  </button>
                  <button
                    onClick={() => {
                      const newRevenue = { ...monthlyActualRevenue };
                      workingMonths.forEach(month => {
                        newRevenue[month] = 0;
                      });
                      setMonthlyActualRevenue(newRevenue);
                    }}
                    className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    🔄 Clear Working Months Only
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowMonthlyRevenue(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Expense Tracker Modal */}
      {showExpenseTracker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Monthly Expense Tracker</h2>
                  <p className="text-gray-600">Track your business expenses to calculate net profit</p>
                </div>
                <button
                  onClick={() => setShowExpenseTracker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Monthly Expense Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {Object.keys(monthlyExpenses).map(month => {
                  const isWorkingMonth = workingMonths.includes(month);
                  const monthExpenses = monthlyExpenses[month];
                  const totalMonthExpenses = Object.values(monthExpenses).reduce((sum, expense) => sum + (parseFloat(expense) || 0), 0);
                  const monthRevenue = monthlyActualRevenue[month] || 0;
                  const monthProfit = monthRevenue - totalMonthExpenses;
                  
                  return (
                    <div key={month} className={`border rounded-lg p-4 ${isWorkingMonth ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{month}</h3>
                        {isWorkingMonth && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Working</span>}
                      </div>
                      
                      <div className="space-y-3">
                        {/* Gas */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">⛽ Gas</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={monthlyExpenses[month].gas || ''}
                              onChange={(e) => setMonthlyExpenses(prev => ({
                                ...prev,
                                [month]: { ...prev[month], gas: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full pl-6 pr-2 py-1 border rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>

                        {/* Employee */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span>👨‍💼</span>
                            <span className="text-xs font-medium">Employee</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-600">Hourly Rate ($)</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                step="0.01"
                                placeholder="25.00"
                                value={monthlyExpenses[month].employeeRate || ''}
                                onChange={(e) => {
                                  const rate = parseFloat(e.target.value) || 0;
                                  const hours = monthlyExpenses[month].employeeHours || 0;
                                  setMonthlyExpenses(prev => ({
                                    ...prev,
                                    [month]: { 
                                      ...prev[month], 
                                      employeeRate: rate,
                                      employee: rate * hours
                                    }
                                  }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Hours Worked</label>
                              <input
                                type="number"
                                className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                step="0.5"
                                placeholder="0"
                                value={monthlyExpenses[month].employeeHours || ''}
                                onChange={(e) => {
                                  const hours = parseFloat(e.target.value) || 0;
                                  const rate = monthlyExpenses[month].employeeRate || 0;
                                  setMonthlyExpenses(prev => ({
                                    ...prev,
                                    [month]: { 
                                      ...prev[month], 
                                      employeeHours: hours,
                                      employee: rate * hours
                                    }
                                  }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Total Cost</label>
                              <div className="w-full px-2 py-1 text-xs bg-gray-50 border rounded text-gray-700 font-medium">
                                ${(monthlyExpenses[month].employee || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Equipment */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">🔧 Equipment</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={monthlyExpenses[month].equipment || ''}
                              onChange={(e) => setMonthlyExpenses(prev => ({
                                ...prev,
                                [month]: { ...prev[month], equipment: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full pl-6 pr-2 py-1 border rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>

                        {/* Maintenance */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">🔨 Maintenance</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={monthlyExpenses[month].maintenance || ''}
                              onChange={(e) => setMonthlyExpenses(prev => ({
                                ...prev,
                                [month]: { ...prev[month], maintenance: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full pl-6 pr-2 py-1 border rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>

                        {/* Other */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">📋 Other</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={monthlyExpenses[month].other || ''}
                              onChange={(e) => setMonthlyExpenses(prev => ({
                                ...prev,
                                [month]: { ...prev[month], other: parseFloat(e.target.value) || 0 }
                              }))}
                              className="w-full pl-6 pr-2 py-1 border rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Month Summary */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Revenue:</span>
                            <span className="font-medium text-green-600">${monthRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expenses:</span>
                            <span className="font-medium text-red-600">${totalMonthExpenses.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-900">Net:</span>
                            <span className={monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${Math.abs(monthProfit).toLocaleString()}
                            </span>
                          </div>
        </div>
      </div>

      {/* Mark as Done Modal */}
      {showMarkDoneModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mark Service as Done</h3>
              <button
                onClick={() => {
                  setShowMarkDoneModal(false);
                  setSelectedAppointment(null);
                  setCompletionMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{selectedAppointment.customer_name}</p>
              <p className="text-xs text-gray-600">{selectedAppointment.service_type}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message to Customer
              </label>
              <textarea
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Enter a message to send to the customer..."
              />
            </div>

            <div className="mb-4 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  Send Email to {selectedAppointment.customer_email}
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  Send SMS to {selectedAppointment.customer_phone}
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMarkAsDone}
                disabled={markingDone}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingDone ? 'Processing...' : 'Mark as Done & Send'}
              </button>
              <button
                onClick={() => {
                  setShowMarkDoneModal(false);
                  setSelectedAppointment(null);
                  setCompletionMessage('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
})}
              </div>

              {/* Summary Stats */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {['gas', 'employee', 'equipment', 'maintenance', 'other'].map(expenseType => {
                    const total = Object.values(monthlyExpenses).reduce((sum, monthExpenses) => 
                      sum + (parseFloat(monthExpenses[expenseType]) || 0), 0
                    );
                    const workingTotal = workingMonths.reduce((sum, month) => 
                      sum + (parseFloat(monthlyExpenses[month][expenseType]) || 0), 0
                    );
                    
                    const icons = {
                      gas: '⛽',
                      employee: '👨‍💼',
                      equipment: '🔧',
                      maintenance: '🔨',
                      other: '📋'
                    };
                    
                    return (
                      <div key={expenseType} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-2">{icons[expenseType]}</div>
                        <ClickableNumber type="expenses" className="text-lg font-bold text-gray-900">
                          {formatCurrency(workingTotal, 'expenses')}
                        </ClickableNumber>
                        <div className="text-sm text-gray-600 capitalize">{expenseType}</div>
                        <div className="text-xs text-gray-500">(Working months)</div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <ClickableNumber type="expenses" className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats.totalWorkingExpenses, 'expenses')}
                    </ClickableNumber>
                    <div className="text-sm text-red-600">Total Expenses (Working)</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <ClickableNumber type="revenue" className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.actualWorkingRevenue, 'revenue')}
                    </ClickableNumber>
                    <div className="text-sm text-green-600">Total Revenue (Working)</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${stats.netWorkingProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <ClickableNumber type="profit" className={`text-2xl font-bold ${stats.netWorkingProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatCurrency(Math.abs(stats.netWorkingProfit), 'profit')}
                    </ClickableNumber>
                    <div className={`text-sm ${stats.netWorkingProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      Net {stats.netWorkingProfit >= 0 ? 'Profit' : 'Loss'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <ClickableNumber type="profit" className="text-2xl font-bold text-purple-600">
                      {stats.actualWorkingRevenue > 0 ? 
                        formatPercentage(Math.round((stats.netWorkingProfit / stats.actualWorkingRevenue) * 100), 'profit') : 
                        '0%'
                      }
                    </ClickableNumber>
                    <div className="text-sm text-purple-600">Profit Margin</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const newExpenses = { ...monthlyExpenses };
                      Object.keys(newExpenses).forEach(month => {
                        Object.keys(newExpenses[month]).forEach(expenseType => {
                          newExpenses[month][expenseType] = 0;
                        });
                      });
                      setMonthlyExpenses(newExpenses);
                    }}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    🗑️ Clear All Expenses
                  </button>
                  <button
                    onClick={() => {
                      const avgGas = 200; // Example average
                      const newExpenses = { ...monthlyExpenses };
                      workingMonths.forEach(month => {
                        newExpenses[month].gas = avgGas;
                      });
                      setMonthlyExpenses(newExpenses);
                    }}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    ⛽ Fill Gas ($200/month)
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowExpenseTracker(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
} 