"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import CustomerMap from '@/app/components/CustomerMap';
import { sendNotification } from '@/lib/notifications';
import {
  CalendarDaysIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  MapIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  ArrowPathIcon,
  UserPlusIcon,
  TrashIcon,
  PlayIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = [
  'Monday Week 1',
  'Monday Week 2',
  'Tuesday Week 1', 
  'Tuesday Week 2',
  'Wednesday Week 1',
  'Wednesday Week 2',
  'Thursday Week 1',
  'Thursday Week 2',
  'Friday Week 1',
  'Friday Week 2',
  'Saturday Week 1',
  'Saturday Week 2',
  'Sunday Week 1',
  'Sunday Week 2'
];

export default function SchedulePage() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [daySearchTerms, setDaySearchTerms] = useState({});
  const [draggedCustomer, setDraggedCustomer] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('Week 1'); // New state for week selection
  const [selectedDay, setSelectedDay] = useState(null); // New state for single day selection
  const [schedule, setSchedule] = useState({});
  const [unassignedCustomers, setUnassignedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedDayCustomers, setSelectedDayCustomers] = useState({}); // Track selected customers per day
  const [completedCustomers, setCompletedCustomers] = useState({}); // Track completed customers per day
  const [movedCustomers, setMovedCustomers] = useState({}); // Track customers moved to next day
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' or 'map'
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showSmartAssignModal, setShowSmartAssignModal] = useState(false);
  const [smartAssignLoading, setSmartAssignLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState({});
  const [editingAddress, setEditingAddress] = useState({}); // { [customerId]: currentAddressString }
  const addressInputRefs = useRef({});
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '', email: '', phone: '', address: '', price: '', frequency: 'weekly',
    service_type: 'lawn_mowing', status: 'active', notes: '', scheduled_day: '',
    latitude: null, longitude: null
  });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const newCustomerAddressRef = useRef(null);
  const [homeBase, setHomeBase] = useState(''); // Home base address
  const [homeBaseCoords, setHomeBaseCoords] = useState(null); // Home base coordinates
  const [proximityData, setProximityData] = useState({}); // Store proximity calculations
  const [loadingProximity, setLoadingProximity] = useState(false);
  const [loadingHomeBase, setLoadingHomeBase] = useState(false);
  const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
  const [selectedCustomerForDone, setSelectedCustomerForDone] = useState(null);
  const [completionMessage, setCompletionMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  // Email Preview Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmailLead, setSelectedEmailLead] = useState(null);
  const [emailTemplate, setEmailTemplate] = useState('fully_booked');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const EMAIL_TEMPLATES = {
    fully_booked: {
      name: 'Fully Booked (Wait Next Week)',
      subject: (name) => `Update regarding your Spring Cleanup request - Flora Lawn`,
      body: (name) => `Hi ${name || 'there'},\n\nThank you for reaching out to us for your spring cleanup! We really appreciate the opportunity to work with you.\n\nWe wanted to let you know that we are fully booked for this week. However, if you are able to wait until next week, we would love to take care of your property!\n\nI can stop by tomorrow or Wednesday to give you an exact price for the cleanup so we are ready to go for next week.\n\nPlease let me know if this works for you, and we'll get you on the schedule!\n\nBest regards,\nFlora Lawn & Landscaping`
    },
    spring_cleanup: {
      name: 'Spring Cleanup Estimate',
      subject: (name) => `Spring Cleanup Estimate for ${name} - Flora Lawn`,
      body: (name) => `Hi ${name || 'there'},\n\nThanks for your interest in a Spring Cleanup! I'm looking at your request now.\n\nI can stop by tomorrow or Wednesday to take a quick look at the property and give you an exact price for the cleanup. You don't need to be home!\n\nOnce I give you the price, we can get you on the schedule for next week.\n\nTalk soon,\nFlora Lawn & Landscaping`
    },
    fall_cleanup: {
      name: 'Fall Cleanup Estimate',
      subject: (name) => `Fall Cleanup Estimate for ${name} - Flora Lawn`,
      body: (name) => `Hi ${name || 'there'},\n\nThanks for reaching out about a Fall Cleanup estimate!\n\nI can head over tomorrow or Wednesday to check out the yard and give you a price for the leaf removal and cleanup. \n\nI'll send the quote over as soon as I've looked at the property.\n\nBest regards,\nFlora Lawn & Landscaping`
    },
    mowing: {
      name: 'Weekly Mowing Quote',
      subject: (name) => `Lawn Mowing Quote Request - Flora Lawn`,
      body: (name) => `Hi ${name || 'there'},\n\nThanks for the request for weekly mowing! \n\nI'll be in your area this week and can stop by to take a look at the lawn. I'll provide you with a weekly price and let you know which day of the week we'd be able to service your property.\n\nLooking forward to helping you with your lawn!\n\nBest,\nFlora Lawn & Landscaping`
    }
  };
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedCustomerForDelay, setSelectedCustomerForDelay] = useState(null);
  const [delayMessage, setDelayMessage] = useState('');
  const [dailyGoal, setDailyGoal] = useState(1000); 
  const [editingSafetyNotes, setEditingSafetyNotes] = useState({});
  const [earnings, setEarnings] = useState({
    daily: {},
    weekly: 0,
    biWeekly: 0,
    totalWeekly: 0,
    totalBiWeekly: 0,
    grandTotal: 0,
    week1: 0,
    week2: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisitApt, setSelectedVisitApt] = useState(null);
  const [visitForm, setVisitForm] = useState({ date: '', time: '' });
  const [schedulingVisit, setSchedulingVisit] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedConfirmApt, setSelectedConfirmApt] = useState(null);
  const [confirmForm, setConfirmForm] = useState({ date: '' });
  const [confirmingJob, setConfirmingJob] = useState(false);
  const [optimizingDays, setOptimizingDays] = useState(new Set());
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [isEditingHomeBase, setIsEditingHomeBase] = useState(false);
  const [activeJobTimers, setActiveJobTimers] = useState({});
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [selectedCustomerForNavigation, setSelectedCustomerForNavigation] = useState(null);
  const [manualTravelMins, setManualTravelMins] = useState(15);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomerData, setEditingCustomerData] = useState(null);
  const homeBaseAddressRef = useRef(null);
  const [inquiryTab, setInquiryTab] = useState('pending'); // 'pending', 'confirmed', or 'waitlist'
  const [remindersSent, setRemindersSent] = useState(new Set()); // Track sent reminders in session
  const [showManualJobModal, setShowManualJobModal] = useState(false);
  const [manualJobForm, setManualJobForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    services: [],
    notes: '',
    date: new Date().toISOString().split('T')[0],
    status: 'confirmed'
  });
  const [savingManualJob, setSavingManualJob] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const manualJobAddressRef = useRef(null);
  const editCustomerAddressRef = useRef(null);
  const router = useRouter();

  // Helper functions for localStorage persistence
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const saveCompletedCustomersToStorage = (completedData) => {
    if (typeof window !== 'undefined') {
      const todayKey = getTodayKey();
      localStorage.setItem(`completedCustomers_${todayKey}`, JSON.stringify(completedData));
    }
  };

  const loadCompletedCustomersFromStorage = () => {
    if (typeof window !== 'undefined') {
      const todayKey = getTodayKey();
      const saved = localStorage.getItem(`completedCustomers_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  };

  const saveMovedCustomersToStorage = (movedData) => {
    if (typeof window !== 'undefined') {
      const todayKey = getTodayKey();
      localStorage.setItem(`movedCustomers_${todayKey}`, JSON.stringify(movedData));
    }
  };

  const loadMovedCustomersFromStorage = () => {
    if (typeof window !== 'undefined') {
      const todayKey = getTodayKey();
      const saved = localStorage.getItem(`movedCustomers_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  };

  const saveScheduleToStorage = (scheduleData) => {
    if (typeof window !== 'undefined') {
      const todayKey = getTodayKey();
      localStorage.setItem(`schedule_${todayKey}`, JSON.stringify(scheduleData));
    }
  };

  const loadScheduleFromStorage = () => {
    if (typeof window !== 'undefined') {
      const todayKey = getTodayKey();
      const saved = localStorage.getItem(`schedule_${todayKey}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };

  // Initialize Home Base Autocomplete
  useEffect(() => {
    if (isEditingHomeBase && homeBaseAddressRef.current && typeof google !== 'undefined') {
      const autocomplete = new google.maps.places.Autocomplete(homeBaseAddressRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          // Note: we'll handle the save in the UI button
        }
      });
    }
  }, [isEditingHomeBase]);

  // Initialize Edit Customer Address Autocomplete
  useEffect(() => {
    if (showEditCustomerModal && editCustomerAddressRef.current && typeof google !== 'undefined') {
      const autocomplete = new google.maps.places.Autocomplete(editCustomerAddressRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          handleEditCustomerChange('address', place.formatted_address);
        }
      });
    }
  }, [showEditCustomerModal]);

  // Live timer update effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const updatedTimers = {};
      
      customers.forEach(customer => {
        if (customer.job_started_at) {
          const start = new Date(customer.job_started_at);
          const diffInSeconds = Math.floor((now - start) / 1000);
          if (diffInSeconds >= 0) {
            const h = Math.floor(diffInSeconds / 3600);
            const m = Math.floor((diffInSeconds % 3600) / 60);
            const s = diffInSeconds % 60;
            updatedTimers[customer.id] = `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }
        }
      });
      
      setActiveJobTimers(updatedTimers);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [customers]);

  const formatLocalDate = (dateStr) => {
    if (!dateStr) return '';
    // If it's already a Date-like object or has T, handle it carefully
    if (dateStr.includes('T')) {
      return new Date(dateStr).toLocaleDateString();
    }
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString();
  };

  const formatLongLocalDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Function to get current week based on date
  const getCurrentWeek = () => {
    const now = new Date();
    const weekNumber = Math.ceil(now.getDate() / 7);
    return weekNumber % 2 === 0 ? 'Week 1' : 'Week 2';
  };

  // Function to get date for a day string (e.g., "Tuesday Week 2")
  const getDateForDay = (dayString) => {
    if (!dayString) return new Date().toISOString();
    
    const parts = dayString.split(' ');
    const dayName = parts[0]; // "Tuesday"
    const week = parts[1] + ' ' + parts[2]; // "Week 2"
    
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = dayOrder.indexOf(dayName);
    
    if (dayIndex === -1) return new Date().toISOString();
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentWeek = getCurrentWeek();
    
    // Calculate days difference
    let daysDiff = dayIndex - currentDay;
    
    // Adjust for week difference
    if (week !== currentWeek) {
      daysDiff += week === 'Week 1' ? -7 : 7;
    }
    
    // If day is in the past, move to next occurrence
    if (daysDiff < 0) {
      daysDiff += 14; // Move to next bi-weekly cycle
    }
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysDiff);
    
    return targetDate.toISOString();
  };

  // Function to get current day name
  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Set initial week based on current date
  useEffect(() => {
    const currentWeek = getCurrentWeek();
    setSelectedWeek(currentWeek);
  }, []);

  // Load completed customers from appointments table
  const loadCompletedCustomersFromDB = async () => {
    try {
      const { data: completedAppointments, error } = await supabase
        .from('appointments')
        .select('customer_id, date, status')
        .eq('status', 'completed')
        .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 14 days

      if (error) {
        console.error('Error loading completed customers:', error);
        return;
      }

      // Get customer IDs and fetch their scheduled_day
      if (completedAppointments && completedAppointments.length > 0) {
        const customerIds = [...new Set(completedAppointments.map(apt => apt.customer_id).filter(Boolean))];
        
        if (customerIds.length > 0) {
          const { data: customersData } = await supabase
            .from('customers')
            .select('id, scheduled_day')
            .in('id', customerIds);

          // Group by scheduled_day
          const completedByDay = {};
          
          completedAppointments.forEach(apt => {
            const customer = customersData?.find(c => c.id === apt.customer_id);
            if (customer && customer.scheduled_day) {
              const dayKey = customer.scheduled_day;
              if (!completedByDay[dayKey]) {
                completedByDay[dayKey] = [];
              }
              if (!completedByDay[dayKey].includes(apt.customer_id)) {
                completedByDay[dayKey].push(apt.customer_id);
              }
            }
          });

          // Merge with existing localStorage data
          setCompletedCustomers(prev => {
            const merged = { ...prev };
            Object.keys(completedByDay).forEach(day => {
              merged[day] = [...new Set([...(merged[day] || []), ...completedByDay[day]])];
            });
            return merged;
          });
        }
      }
    } catch (error) {
      console.error('Error loading completed customers from DB:', error);
    }
  };

  // Load persisted states on component mount
  useEffect(() => {
    const savedCompleted = loadCompletedCustomersFromStorage();
    const savedMoved = loadMovedCustomersFromStorage();
    
    setCompletedCustomers(savedCompleted);
    setMovedCustomers(savedMoved);
    
    // Also load from database
    loadCompletedCustomersFromDB();

    // Global function for Map to call when reassigning a customer
    window.handleMapReassign = async (customerId, newDay) => {
      try {
        const { error } = await supabase
          .from('customers')
          .update({ scheduled_day: newDay })
          .eq('id', customerId);
        
        if (error) throw error;
        
        // Update local state
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { ...c, scheduled_day: newDay } : c
        ));
        
        // Save to localStorage too
        const savedMovedLocal = loadMovedCustomersFromStorage();
        // Remove from moved if it was there
        Object.keys(savedMovedLocal).forEach(day => {
          savedMovedLocal[day] = savedMovedLocal[day].filter(id => id !== customerId);
        });
        saveMovedCustomersToStorage(savedMovedLocal);
        
        alert(`✅ Reassigned to ${newDay}`);
      } catch (error) {
        console.error('Error reassigning from map:', error);
        alert('Failed to reassign: ' + error.message);
      }
    };
    
    return () => {
      delete window.handleMapReassign;
    };
  }, []);

  // Save completed customers to localStorage whenever it changes
  useEffect(() => {
    saveCompletedCustomersToStorage(completedCustomers);
  }, [completedCustomers]);

  // Save moved customers to localStorage whenever it changes
  useEffect(() => {
    saveMovedCustomersToStorage(movedCustomers);
  }, [movedCustomers]);

  // Apply saved schedule changes when customers or moved customers change
  useEffect(() => {
    if (customers.length > 0 && Object.keys(movedCustomers).length > 0) {
      organizeSchedule();
    }
  }, [customers, movedCustomers]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchAppointments();
      loadHomeBaseAddress();
    }
  }, [user]);

  // Background geocoding logic deleted to eliminate costs.

  useEffect(() => {
    if (customers.length > 0) {
      organizeSchedule();
    }
  }, [customers]);

  // New useEffect for search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      organizeSchedule();
      } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.notes && customer.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
      organizeScheduleWithFiltered(filtered);
    }
  }, [searchTerm, customers]);

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

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .in('status', ['active', 'pending'])
        .in('frequency', ['weekly', 'bi_weekly'])
        .order('name');

      if (error) throw error;
      
      // Set customers with proximity data
      const customersWithProximity = data || [];
      setCustomers(customersWithProximity);
      
      // Update proximity data state from database fields
      const proximityFromDB = {};
      customersWithProximity.forEach(customer => {
        if (customer.distance_miles || customer.travel_time) {
          proximityFromDB[customer.id] = {
            distanceText: customer.distance_miles ? `${customer.distance_miles} mi` : null,
            durationText: customer.travel_time || null,
            distance: customer.distance_miles ? parseFloat(customer.distance_miles) * 1609.34 : null // Convert to meters
          };
        }
      });
      setProximityData(proximityFromDB);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
        setLoading(false);
      }
  };

  const organizeSchedule = () => {
    const scheduleByDay = {};
    const unassigned = [];

    // Initialize schedule for each day
    DAYS_OF_WEEK.forEach(day => {
      scheduleByDay[day] = [];
    });

    customers.forEach(customer => {
      if (customer.scheduled_day && DAYS_OF_WEEK.includes(customer.scheduled_day)) {
        scheduleByDay[customer.scheduled_day].push(customer);
      } else {
        unassigned.push(customer);
      }
    });

    // Apply moved customers from localStorage
    const savedMoved = loadMovedCustomersFromStorage();
    
    // Create a map of customer IDs to customer objects for quick lookup
    const customerMap = {};
    customers.forEach(customer => {
      customerMap[customer.id] = customer;
    });

    // Apply moved customers to their new days
    Object.entries(savedMoved).forEach(([day, movedCustomerIds]) => {
      if (movedCustomerIds && movedCustomerIds.length > 0) {
        movedCustomerIds.forEach(customerId => {
          const customer = customerMap[customerId];
          if (customer) {
            // Remove from original day
            const originalDay = customer.scheduled_day;
            if (originalDay && scheduleByDay[originalDay]) {
              scheduleByDay[originalDay] = scheduleByDay[originalDay].filter(c => c.id !== customerId);
            }
            
            // Add to new day
            if (scheduleByDay[day]) {
              // Check if customer is not already in the day to avoid duplicates
              const existsInDay = scheduleByDay[day].some(c => c.id === customerId);
              if (!existsInDay) {
                scheduleByDay[day].push(customer);
              }
            }
          }
        });
      }
    });

    // Sort each day by optimized route_order
    Object.keys(scheduleByDay).forEach(day => {
      scheduleByDay[day].sort((a, b) => {
        const orderA = a.route_order !== null && a.route_order !== undefined ? a.route_order : 9999;
        const orderB = b.route_order !== null && b.route_order !== undefined ? b.route_order : 9999;
        
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
    });

    setSchedule(scheduleByDay);
    setUnassignedCustomers(unassigned);
    calculateEarnings(scheduleByDay, customers);
    
    // Save the modified schedule to localStorage
    saveScheduleToStorage(scheduleByDay);
  };

  const organizeScheduleWithFiltered = (filteredCustomerList) => {
    const scheduleByDay = {};
    const unassigned = [];

    // Initialize schedule for each day
    DAYS_OF_WEEK.forEach(day => {
      scheduleByDay[day] = [];
    });

    filteredCustomerList.forEach(customer => {
      if (customer.scheduled_day && DAYS_OF_WEEK.includes(customer.scheduled_day)) {
        scheduleByDay[customer.scheduled_day].push(customer);
      } else {
        unassigned.push(customer);
      }
    });

    // Apply moved customers from localStorage
    const savedMoved = loadMovedCustomersFromStorage();
    
    // Create a map of customer IDs to customer objects for quick lookup
    const customerMap = {};
    filteredCustomerList.forEach(customer => {
      customerMap[customer.id] = customer;
    });

    // Apply moved customers to their new days
    Object.entries(savedMoved).forEach(([day, movedCustomerIds]) => {
      if (movedCustomerIds && movedCustomerIds.length > 0) {
        movedCustomerIds.forEach(customerId => {
          const customer = customerMap[customerId];
          if (customer) {
            // Remove from original day
            const originalDay = customer.scheduled_day;
            if (originalDay && scheduleByDay[originalDay]) {
              scheduleByDay[originalDay] = scheduleByDay[originalDay].filter(c => c.id !== customerId);
            }
            
            // Add to new day
            if (scheduleByDay[day]) {
              // Check if customer is not already in the day to avoid duplicates
              const existsInDay = scheduleByDay[day].some(c => c.id === customerId);
              if (!existsInDay) {
                scheduleByDay[day].push(customer);
              }
            }
          }
        });
      }
    });

    setSchedule(scheduleByDay);
    setUnassignedCustomers(unassigned);
    calculateEarnings(scheduleByDay, filteredCustomerList);
    
    // Save the modified schedule to localStorage
    saveScheduleToStorage(scheduleByDay);
  };

  // Calculate earnings for weekly and bi-weekly customers
  const calculateEarnings = (scheduleByDay, allCustomers) => {
    const dailyEarnings = {};
    let weeklyTotal = 0;
    let biWeeklyTotal = 0;
    let weeklyCustomers = 0;
    let biWeeklyCustomers = 0;
    
    // Week-specific earnings
    let week1Earnings = 0;
    let week2Earnings = 0;

    // Calculate earnings for each specific day (including week)
    DAYS_OF_WEEK.forEach(day => {
      const dayCustomers = scheduleByDay[day] || [];
      
      const weeklyEarnings = dayCustomers
        .filter(c => c.frequency === 'weekly')
        .reduce((sum, c) => sum + parseFloat(c.price || 0), 0);
      
      const biWeeklyEarnings = dayCustomers
        .filter(c => c.frequency === 'bi_weekly')
        .reduce((sum, c) => sum + parseFloat(c.price || 0), 0);

      dailyEarnings[day] = {
        weekly: weeklyEarnings,
        biWeekly: biWeeklyEarnings,
        total: weeklyEarnings + biWeeklyEarnings,
        weeklyCount: dayCustomers.filter(c => c.frequency === 'weekly').length,
        biWeeklyCount: dayCustomers.filter(c => c.frequency === 'bi_weekly').length,
        totalCount: dayCustomers.length
      };

      weeklyTotal += weeklyEarnings;
      biWeeklyTotal += biWeeklyEarnings;
      
      // Calculate week-specific earnings
      if (day.includes('Week 1')) {
        week1Earnings += weeklyEarnings + biWeeklyEarnings;
      } else if (day.includes('Week 2')) {
        week2Earnings += weeklyEarnings + biWeeklyEarnings;
      }
    });

    // Count total customers by frequency
    allCustomers.forEach(customer => {
      if (customer.frequency === 'weekly') weeklyCustomers++;
      if (customer.frequency === 'bi_weekly') biWeeklyCustomers++;
    });

    // Calculate monthly projections
    const totalWeeklyMonthly = weeklyTotal * 4; // 4 weeks per month
    const totalBiWeeklyMonthly = biWeeklyTotal * 2; // 2 times per month
    const grandTotalMonthly = totalWeeklyMonthly + totalBiWeeklyMonthly;

    setEarnings({
      daily: dailyEarnings,
      weekly: weeklyTotal,
      biWeekly: biWeeklyTotal,
      totalWeekly: totalWeeklyMonthly,
      totalBiWeekly: totalBiWeeklyMonthly,
      grandTotal: grandTotalMonthly,
      weeklyCustomers,
      biWeeklyCustomers,
      week1: week1Earnings,
      week2: week2Earnings
    });
  };

  const assignCustomerToDay = async (customerId, day) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ scheduled_day: day })
        .eq('id', customerId);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, scheduled_day: day }
          : customer
      ));
      
      setShowAssignModal(false);
      setSelectedCustomer(null);

      // Recalculate earnings
      const updatedCustomers = customers.map(customer => 
        customer.id === customerId 
          ? { ...customer, scheduled_day: day }
          : customer
      );
      organizeScheduleWithFiltered(updatedCustomers);

      // Recalculate route for the day if home base is set
      if (homeBase.trim()) {
        await calculateDayRoute(day);
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      alert('Error assigning customer to day');
    }
  };

  // New bulk assignment function
  const assignMultipleCustomersToDay = async (customerIds, day) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ scheduled_day: day })
        .in('id', customerIds);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map(customer => 
        customerIds.includes(customer.id)
          ? { ...customer, scheduled_day: day }
          : customer
      ));
      
      setShowBulkAssignModal(false);
      setSelectedCustomers([]);
      
      alert(`Successfully assigned ${customerIds.length} customers to ${day}`);

      // Recalculate earnings
      const updatedCustomers = customers.map(customer => 
        customerIds.includes(customer.id)
          ? { ...customer, scheduled_day: day }
          : customer
      );
      organizeScheduleWithFiltered(updatedCustomers);

      // Recalculate route for the day if home base is set
      if (homeBase.trim()) {
        await calculateDayRoute(day);
      }
    } catch (error) {
      console.error('Error assigning customers:', error);
      alert('Error assigning customers to day');
    }
  };

  const unassignCustomer = async (customerId) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ scheduled_day: null })
        .eq('id', customerId);

      if (error) throw error;
      
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, scheduled_day: null }
          : customer
      ));

      // Recalculate earnings
      const updatedCustomers = customers.map(customer => 
        customer.id === customerId 
          ? { ...customer, scheduled_day: null }
          : customer
      );
      organizeScheduleWithFiltered(updatedCustomers);
    } catch (error) {
      console.error('Error unassigning customer:', error);
      alert('Error unassigning customer');
    }
  };

  const removeCustomer = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to permanently remove ${customerName} from your customers? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      
      // Remove from local state
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    } catch (error) {
      console.error('Error removing customer:', error);
      alert('Error removing customer');
    }
  };

  const scratchCustomer = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to scratch ${customerName} from this year's schedule? They will be marked as cancelled and removed from the active schedule.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: 'cancelled', scheduled_day: null })
        .eq('id', customerId);

      if (error) throw error;
      
      // Remove from local state because schedule only shows active/pending
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      
      alert(`${customerName} has been scratched for this year.`);
    } catch (error) {
      console.error('Error scratching customer:', error);
      alert('Error scratching customer');
    }
  };

  const handleBulkDeleteCustomers = async () => {
    if (!selectedCustomers.length) return;
    if (!confirm(`Are you sure you want to permanently delete these ${selectedCustomers.length} customers? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .in('id', selectedCustomers);

      if (error) throw error;

      alert(`Successfully deleted ${selectedCustomers.length} customers.`);
      setSelectedCustomers([]);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customers:', error);
      alert('Error deleting customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkScratchCustomers = async () => {
    if (!selectedCustomers.length) return;
    if (!confirm(`Are you sure you want to scratch ${selectedCustomers.length} customers from this year's schedule? This marks them as cancelled.`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: 'cancelled', scheduled_day: null })
        .in('id', selectedCustomers);

      if (error) throw error;

      alert(`Successfully scratched ${selectedCustomers.length} customers.`);
      setSelectedCustomers([]);
      fetchCustomers();
    } catch (error) {
      console.error('Error scratching customers:', error);
      alert('Error scratching customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Multi-select functions
  const toggleCustomerSelection = (customerId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllUnassigned = () => {
    if (selectedCustomers.length === unassignedCustomers.length) {
      setSelectedCustomers([]);
      } else {
      setSelectedCustomers(unassignedCustomers.map(c => c.id));
    }
  };

  const clearSelection = () => {
    setSelectedCustomers([]);
  };

  // Functions for day-specific bulk operations
  const toggleDayCustomerSelection = (day, customerId) => {
    setSelectedDayCustomers(prev => ({
      ...prev,
      [day]: prev[day]?.includes(customerId) 
        ? prev[day].filter(id => id !== customerId)
        : [...(prev[day] || []), customerId]
    }));
  };

  const selectAllDayCustomers = (day) => {
    const dayCustomers = schedule[day] || [];
    const allSelected = selectedDayCustomers[day]?.length === dayCustomers.length;
    
    setSelectedDayCustomers(prev => ({
      ...prev,
      [day]: allSelected ? [] : dayCustomers.map(c => c.id)
    }));
  };

  const clearDaySelection = (day) => {
    setSelectedDayCustomers(prev => ({
      ...prev,
      [day]: []
    }));
  };

  // Toggle customer completion status
  const toggleCustomerCompletion = (day, customerId) => {
    setCompletedCustomers(prev => ({
      ...prev,
      [day]: prev[day]?.includes(customerId) 
        ? prev[day].filter(id => id !== customerId)
        : [...(prev[day] || []), customerId]
    }));
  };

  const startJob = async (customerId) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('customers')
        .update({ job_started_at: now })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, job_started_at: now } : c
      ));
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Failed to start job timer');
    }
  };

  const startNavigationAndTracking = async (customer) => {
    if (!customer) return;
    
    const travelMins = manualTravelMins;
    const jobStartTime = new Date();
    jobStartTime.setMinutes(jobStartTime.getMinutes() + travelMins);
    const nowISO = jobStartTime.toISOString();
    
    try {
      const { error } = await supabase
        .from('customers')
        .update({ job_started_at: nowISO })
        .eq('id', customer.id);

      if (error) throw error;

      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? { ...c, job_started_at: nowISO } : c
      ));
      
      // Open maps
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`, '_blank');
      
      setShowNavigationModal(false);
      setSelectedCustomerForNavigation(null);
    } catch (err) {
      console.error("Error saving tracking info:", err);
      alert('Failed to start tracking');
    }
  };

  const handleAddressClick = (customer) => {
    setSelectedCustomerForNavigation(customer);
    
    let travelMins = 15; // Default if unknown
    // Prioritize optimized travel_time_to_next, then travel_time, then proximity
    const timeText = customer.travel_time_to_next || customer.travel_time || proximityData[customer.id]?.durationText || "";
    const match = timeText.match(/(\d+)\s*min/);
    if (match) {
      travelMins = parseInt(match[1], 10);
    }
    setManualTravelMins(travelMins);
    setShowNavigationModal(true);
    
    // Fetch live driving time from current location
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch('/api/get-driving-time', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                origin: { lat: position.coords.latitude, lng: position.coords.longitude },
                destination: customer.address
              })
            });
            const data = await res.json();
            if (data.success && data.minutes) {
              setManualTravelMins(data.minutes);
            }
          } catch (e) {
            console.error("Error fetching live driving time", e);
          } finally {
            setIsFetchingLocation(false);
          }
        },
        (err) => {
          console.warn("Geolocation denied or failed", err);
          setIsFetchingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  };

  const cancelJobTimer = async (customerId) => {
    if (!confirm('Are you sure you want to cancel this timer? The record will be lost.')) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({ job_started_at: null })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, job_started_at: null } : c
      ));
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Mark customer as done and send message
  const handleMarkCustomerAsDone = async () => {
    if (!selectedCustomerForDone) return;

    try {
      setMarkingDone(true);
      const customer = selectedCustomerForDone;
      
      // Calculate duration if timer was active
      let durationMinutes = null;
      if (customer.job_started_at) {
        const start = new Date(customer.job_started_at);
        const end = new Date();
        durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));
      }

      // Update customer's last_service date, increment service_count, and reset timer
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          last_service: new Date().toISOString().split('T')[0],
          job_started_at: null,
          last_job_duration_minutes: durationMinutes,
          service_count: (customer.service_count || 0) + 1
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      // Update local state to reflect the database changes
      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? { 
          ...c, 
          job_started_at: null, 
          last_job_duration_minutes: durationMinutes, 
          last_service: new Date().toISOString().split('T')[0],
          service_count: (c.service_count || 0) + 1
        } : c
      ));

      // Create or update appointment record with completed status
      const today = new Date().toISOString().split('T')[0];
      const serviceDate = customer.day ? getDateForDay(customer.day) : new Date().toISOString();
      
      // Check if appointment exists
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('date', serviceDate.split('T')[0])
        .single();

      if (existingAppointment) {
        // Update existing appointment
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString(),
            duration_minutes: durationMinutes
          })
          .eq('id', existingAppointment.id);
        
        if (appointmentError) {
          console.error('Error updating appointment:', appointmentError);
        }
      } else {
        // Create new appointment record
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            customer_id: customer.id,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            service_type: customer.service_type || 'lawn_mowing',
            date: serviceDate,
            status: 'completed',
            city: customer.address?.split(',')[1]?.trim() || '',
            street_address: customer.address?.split(',')[0] || '',
            notes: `Completed on ${customer.day || 'schedule'}. Duration: ${durationMinutes || 'N/A'} mins`,
            duration_minutes: durationMinutes
          });
        
        if (appointmentError) {
          console.error('Error creating appointment:', appointmentError);
        }
      }

      // Create completed_job record
      try {
        const appointmentId = existingAppointment?.id || null;
        const amountDue = customer.price || 0;
        
        // Check if completed_job already exists for this appointment
        if (appointmentId) {
          const { data: existingJob } = await supabaseAdmin
            .from('completed_jobs')
            .select('id')
            .eq('appointment_id', appointmentId)
            .single();
          
          if (!existingJob) {
            // Create completed_job record
            const { error: jobError } = await supabaseAdmin
              .from('completed_jobs')
              .insert({
                appointment_id: appointmentId,
                customer_id: customer.user_id || null,
                customer_name: customer.name,
                customer_email: customer.email || '',
                customer_phone: customer.phone || null,
                customer_address: customer.address || null,
                service_type: customer.service_type || 'lawn_mowing',
                service_description: customer.notes || `Completed on ${customer.day || 'schedule'}`,
                job_date: serviceDate,
                completed_date: new Date().toISOString(),
                amount_due: amountDue,
                amount_paid: 0,
                payment_status: 'unpaid',
                duration_minutes: durationMinutes
              });
            
            if (jobError) {
              console.error('Error creating completed job:', jobError);
            }
          }
        } else {
          // No appointment exists, create completed_job directly
          const { error: jobError } = await supabaseAdmin
            .from('completed_jobs')
            .insert({
              appointment_id: null,
              customer_id: customer.user_id || null,
              customer_name: customer.name,
              customer_email: customer.email || '',
              customer_phone: customer.phone || null,
              customer_address: customer.address || null,
              service_type: customer.service_type || 'lawn_mowing',
              service_description: customer.notes || `Completed on ${customer.day || 'schedule'}`,
              job_date: serviceDate,
              completed_date: new Date().toISOString(),
              amount_due: amountDue,
              amount_paid: 0,
              payment_status: 'unpaid',
              duration_minutes: durationMinutes
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
        if (customer.id && customer.price) {
          const pointsToAward = Math.max(10, Math.floor(customer.price));
          
          const loyaltyResponse = await fetch('/api/loyalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'earn',
              userId: customer.user_id,
              customerId: customer.id,
              points: pointsToAward,
              serviceId: existingAppointment?.id,
              serviceType: customer.service_type || 'Service',
              serviceDate: serviceDate,
              description: `Completed ${customer.service_type || 'service'}`
            })
          });
          
          if (!loyaltyResponse.ok) {
            console.error('Failed to award loyalty points:', await loyaltyResponse.text());
          }
        }
      } catch (loyaltyError) {
        console.error('Error awarding loyalty points:', loyaltyError);
      }

      // Mark as completed in local state
      toggleCustomerCompletion(customer.day, customer.id);

      // Send message if requested
      if (sendEmail || sendSMS) {
        // Create a temporary appointment-like object for the API
        const appointmentData = {
          id: `customer-${customer.id}`,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          service_type: customer.service_type || 'lawn_mowing',
          date: new Date().toISOString(),
          city: customer.address?.split(',')[1]?.trim() || '',
          street_address: customer.address?.split(',')[0] || ''
        };

        // Use the same API endpoint but with customer data
        const response = await fetch('/api/customers/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointmentData.id,
            message: completionMessage,
            sendEmail: sendEmail,
            sendSMS: sendSMS,
            customerData: appointmentData // Pass customer data directly
          })
        });

        const result = await response.json();
        if (!result.success) {
          console.error('Error sending message:', result.error);
          alert('Customer marked as done, but failed to send message. You can send it manually.');
        } else {
          // If SMS link is provided, open it
          if (result.smsLink && sendSMS) {
            window.open(result.smsLink, '_blank');
          }
        }
      }

      // Archive completion record for today
      try {
        const today = new Date().toISOString().split('T')[0];
        await fetch('/api/archive-daily-completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today })
        });
      } catch (archiveError) {
        console.error('Error archiving completion:', archiveError);
        // Don't fail the whole operation
      }

      // Close modal and reset
      setShowMarkDoneModal(false);
      setSelectedCustomerForDone(null);
      setCompletionMessage('');
      setSendEmail(true);
      setSendSMS(false);

      setSuccessMessage('Customer marked as done' + (sendEmail || sendSMS ? ' and message sent!' : '!'));
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error marking customer as done:', error);
      alert('Failed to mark customer as done. Please try again.');
    } finally {
      setMarkingDone(false);
    }
  };

  // Move incomplete customers to next day (temporary for current session)
  const moveIncompleteToNextDay = (currentDay) => {
    const dayCustomers = schedule[currentDay] || [];
    const completedIds = completedCustomers[currentDay] || [];
    const incompleteCustomers = dayCustomers.filter(customer => !completedIds.includes(customer.id));
    
    if (incompleteCustomers.length === 0) {
      alert('All customers are marked as complete!');
      return;
    }

    // Find next day in the same week
    const currentWeek = currentDay.includes('Week 1') ? 'Week 1' : 'Week 2';
    const baseDay = currentDay.replace(' Week 1', '').replace(' Week 2', '');
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayIndex = dayOrder.indexOf(baseDay);
    
    let nextDay = null;
    // Find next day in the same week
    for (let i = currentDayIndex + 1; i < dayOrder.length; i++) {
      nextDay = `${dayOrder[i]} ${currentWeek}`;
      break;
    }
    
    // If no next day in same week, use Monday of next week
    if (!nextDay) {
      const nextWeek = currentWeek === 'Week 1' ? 'Week 2' : 'Week 1';
      nextDay = `Monday ${nextWeek}`;
    }

    // Track moved customers
    const movedCustomerIds = incompleteCustomers.map(c => c.id);
    setMovedCustomers(prev => ({
      ...prev,
      [nextDay]: [...(prev[nextDay] || []), ...movedCustomerIds]
    }));

    // Update schedule temporarily (not database)
    const updatedSchedule = {
      ...schedule,
      [currentDay]: dayCustomers.filter(customer => completedIds.includes(customer.id)),
      [nextDay]: [...(schedule[nextDay] || []), ...incompleteCustomers]
    };
    
    setSchedule(updatedSchedule);
    
    // Save the updated schedule to localStorage
    saveScheduleToStorage(updatedSchedule);

    alert(`✅ ${incompleteCustomers.length} incomplete customers moved to ${nextDay} for today's session`);
  };

  // Move single customer to next day (temporary for current session)
  const moveSingleCustomerToNextDay = (currentDay, customerId) => {
    const customer = schedule[currentDay]?.find(c => c.id === customerId);
    if (!customer) return;

    // Find next day using same logic as moveIncompleteToNextDay
    const currentWeek = currentDay.includes('Week 1') ? 'Week 1' : 'Week 2';
    const baseDay = currentDay.replace(' Week 1', '').replace(' Week 2', '');
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayIndex = dayOrder.indexOf(baseDay);
    
    let nextDay = null;
    // Find next day in the same week
    for (let i = currentDayIndex + 1; i < dayOrder.length; i++) {
      nextDay = `${dayOrder[i]} ${currentWeek}`;
      break;
    }
    
    // If no next day in same week, use Monday of next week
    if (!nextDay) {
      const nextWeek = currentWeek === 'Week 1' ? 'Week 2' : 'Week 1';
      nextDay = `Monday ${nextWeek}`;
    }

    // Track moved customer
    setMovedCustomers(prev => ({
      ...prev,
      [nextDay]: [...(prev[nextDay] || []), customerId]
    }));

    // Update schedule temporarily (not database)
    const updatedSchedule = {
      ...schedule,
      [currentDay]: schedule[currentDay].filter(c => c.id !== customerId),
      [nextDay]: [...(schedule[nextDay] || []), customer]
    };
    
    setSchedule(updatedSchedule);
    
    // Save the updated schedule to localStorage
    saveScheduleToStorage(updatedSchedule);

    alert(`✅ ${customer.name} moved to ${nextDay} for today's session`);
  };

  const DELAY_TEMPLATES = {
    rain: (name) => `Hi ${name}, due to the heavy rain today, we unfortunately have to reschedule your service. We will aim to be there as soon as the weather clears. Thank you for your patience!`,
    truck: (name) => `Hi ${name}, we're having some unexpected truck trouble this morning. We're working on getting it fixed and will update you on your service time as soon as possible. Sorry for the inconvenience!`,
    equipment: (name) => `Hi ${name}, we've encountered some equipment issues that are delaying our route today. We'll be in touch shortly with an updated arrival time. Thank you for understanding!`,
    late: (name) => `Hi ${name}, we're running a bit behind schedule today due to some complex jobs earlier on the route. We should be arriving at your property shortly. See you soon!`,
    nextDay: (name) => `Hi ${name}, we're running quite behind today and won't be able to make it to your property. We've moved your service to first thing tomorrow morning. Sorry for the delay and thank you for your patience!`,
    emergency: (name) => `Hi ${name}, due to a personal emergency, I unfortunately won't be able to make it to your property today. I will reach out as soon as possible to reschedule. Sorry for the sudden change!`,
    skip: (name) => `Hi ${name}, your lawn is looking good and growing a bit slower this week, so we're going to skip your service to save you some money. We'll see you next week on our regular schedule!`,
    holiday: (name) => `Hi ${name}, just a reminder that we are off today for the holiday. We will be back on our regular schedule starting tomorrow. See you then!`,
    daylight: (name) => `Hi ${name}, we've had an unusually busy day and unfortunately won't be able to reach your property before dark. We will prioritize your service first thing tomorrow/next visit. Thanks for your understanding!`,
    review: (name) => `Hi ${name}, will you help us with a review in our google profile? Flora Lawn & Landscaping Inc would love your feedback. Post a review to our profile: https://g.page/r/CQjJ-AbEL4N2EBE/review - Thank you very much!`
  };

  const handleSendDelayNotification = async () => {
    if (!selectedCustomerForDelay) return;
    
    try {
      setMarkingDone(true); // Re-use loading state
      const customer = selectedCustomerForDelay;
      
      const response = await fetch('/api/customers/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: `delay-${customer.id}`,
          message: delayMessage,
          sendEmail: true,
          sendSMS: false, // Default to email, can be expanded
          type: delayMessage.includes('review') ? 'review' : 'delay',
          subject: delayMessage.includes('review') ? 'Help us grow! 🌿 - Flora Lawn & Landscaping' : null,
          customerData: {
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            service_type: customer.service_type || 'service'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowDelayModal(false);
        setSuccessMessage(`Delay notification sent to ${customer.name}!`);
        setShowSuccessModal(true);
      } else {
        alert('Failed to send notification: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending delay notification:', error);
      alert('Error sending notification');
    } finally {
      setMarkingDone(false);
    }
  };

  const bulkRemoveFromDay = async (day, customerIds) => {
    if (customerIds.length === 0) return;
    
    const customerNames = customerIds.map(id => {
      const customer = schedule[day]?.find(c => c.id === id);
      return customer?.name || 'Unknown';
    }).join(', ');
    
    if (!confirm(`Remove ${customerIds.length} customers from ${day}?\n\nCustomers: ${customerNames}\n\nThey will be moved to unassigned.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({ scheduled_day: null })
        .in('id', customerIds);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map(customer => 
        customerIds.includes(customer.id)
          ? { ...customer, scheduled_day: null }
          : customer
      ));
      
      // Recalculate earnings
      const updatedCustomers = customers.map(customer => 
        customerIds.includes(customer.id)
          ? { ...customer, scheduled_day: null }
          : customer
      );
      organizeScheduleWithFiltered(updatedCustomers);
      
      // Clear selection for this day
      clearDaySelection(day);
      
      alert(`✅ Successfully removed ${customerIds.length} customers from ${day}`);
    } catch (error) {
      console.error('Error removing customers from day:', error);
      alert('❌ Error removing customers from day');
    }
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'weekly':
        return 'bg-green-100 text-green-800';
      case 'bi_weekly':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateCustomerNotes = async (customerId, notes) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ notes: notes })
        .eq('id', customerId);

      if (error) throw error;

      // Update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? { ...customer, notes } : customer
      ));
      
      // Clear editing state for this customer
      setEditingNotes(prev => {
        const newState = { ...prev };
        delete newState[customerId];
        return newState;
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes');
    }
  };

  const startEditingSafetyNotes = (customer) => {
    setEditingSafetyNotes({ [customer.id]: customer.safety_notes || '' });
  };

  const cancelEditingSafetyNotes = (customerId) => {
    setEditingSafetyNotes(prev => {
      const { [customerId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateCustomerSafetyNotes = async (customerId, safetyNotes) => {
    try {
      const { error } = await supabase.from('customers').update({ safety_notes: safetyNotes }).eq('id', customerId);
      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, safety_notes: safetyNotes } : c));
      cancelEditingSafetyNotes(customerId);
    } catch (error) {
      console.error('Error updating safety notes:', error);
      alert('Failed to update safety notes');
    }
  };

  const startEditingNotes = (customer) => {
    setEditingNotes(prev => ({
      ...prev,
      [customer.id]: customer.notes || ''
    }));
  };

  const cancelEditingNotes = (customerId) => {
    setEditingNotes(prev => {
      const newState = { ...prev };
      delete newState[customerId];
      return newState;
    });
  };

  const handleNoteTextChange = (customerId, value) => {
    setEditingNotes(prev => ({
      ...prev,
      [customerId]: value
    }));
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // ---------- Address editing with Google Places ----------
  const startEditingAddress = (customer) => {
    setEditingAddress(prev => ({ ...prev, [customer.id]: customer.address || '' }));
    // Init autocomplete after the input renders
    setTimeout(() => initAddressAutocomplete(customer.id), 150);
  };

  const cancelEditingAddress = (customerId) => {
    setEditingAddress(prev => { const s = { ...prev }; delete s[customerId]; return s; });
  };

  const initAddressAutocomplete = (customerId) => {
    const inputEl = addressInputRefs.current[customerId];
    if (!inputEl || !window.google?.maps) return;
    try {
      const ac = new window.google.maps.places.Autocomplete(inputEl, {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address'],
        types: ['address']
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place.formatted_address) {
          setEditingAddress(prev => ({ ...prev, [customerId]: place.formatted_address }));
          inputEl.value = place.formatted_address;
        }
      });
    } catch (err) {
      console.error('Autocomplete init error:', err);
    }
  };

  const handleEditCustomerChange = (field, value) => {
    setEditingCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCustomerEdit = async () => {
    if (!editingCustomerData) return;
    try {
      const lat = editingCustomerData.latitude;
      const lng = editingCustomerData.longitude;

      const { error } = await supabase
        .from('customers')
        .update({
          name: editingCustomerData.name,
          phone: editingCustomerData.phone,
          email: editingCustomerData.email,
          address: editingCustomerData.address,
          latitude: lat,
          longitude: lng,
          price: editingCustomerData.price,
          frequency: editingCustomerData.frequency,
          service_type: editingCustomerData.service_type,
          service_count: parseInt(editingCustomerData.service_count || 0, 10)
        })
        .eq('id', editingCustomerData.id);

      if (error) throw error;

      setCustomers(prev => prev.map(c => 
        c.id === editingCustomerData.id ? { ...c, ...editingCustomerData, latitude: lat, longitude: lng } : c
      ));
      
      setShowEditCustomerModal(false);
      setEditingCustomerData(null);
    } catch (err) {
      console.error('Error updating customer:', err);
      alert('Failed to update customer');
    }
  };

  const openEditCustomerModal = (customer) => {
    setEditingCustomerData({ ...customer });
    setShowEditCustomerModal(true);
  };

  const updateCustomerAddress = async (customerId, address) => {
    if (!address.trim()) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({ address: address.trim() })
        .eq('id', customerId);
      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, address: address.trim() } : c));
      setEditingAddress(prev => { const s = { ...prev }; delete s[customerId]; return s; });
    } catch (err) {
      console.error('Error updating address:', err);
      alert('Failed to update address');
    }
  };

  // ---------- Add New Customer ----------
  const openAddCustomerModal = () => {
    setNewCustomerForm({ name: '', email: '', phone: '', address: '', price: '', frequency: 'weekly', service_type: 'lawn_mowing', status: 'active', notes: '', scheduled_day: '', service_count: 0, latitude: null, longitude: null });
    setShowAddCustomerModal(true);
    // Init Google Places after modal renders
    setTimeout(() => {
      const el = newCustomerAddressRef.current;
      if (!el || !window.google?.maps) return;
      try {
        const ac = new window.google.maps.places.Autocomplete(el, {
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address'],
          types: ['address']
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place.formatted_address) {
            setNewCustomerForm(prev => ({ ...prev, address: place.formatted_address }));
            el.value = place.formatted_address;
          }
        });
      } catch (e) { console.error('Autocomplete init error', e); }
    }, 200);
  };

  const addNewCustomer = async () => {
    if (!newCustomerForm.name.trim()) { alert('Name is required'); return; }
    if (!newCustomerForm.price) { alert('Price is required'); return; }
    setAddingCustomer(true);
    try {
      const addressVal = newCustomerAddressRef.current?.value || newCustomerForm.address;
      
      // Geocoding removed entirely to eliminate costs. New customers will only have coordinates if manually added to DB.
      const lat = null;
      const lng = null;
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: newCustomerForm.name.trim(),
          email: newCustomerForm.email?.trim() || null,
          phone: newCustomerForm.phone?.trim(),
          address: addressVal?.trim() || null,
          latitude: lat,
          longitude: lng,
          price: parseFloat(newCustomerForm.price),
          frequency: newCustomerForm.frequency,
          service_type: newCustomerForm.service_type,
          status: newCustomerForm.status,
          notes: newCustomerForm.notes?.trim() || null,
          scheduled_day: newCustomerForm.scheduled_day || null,
          service_count: parseInt(newCustomerForm.service_count || 0, 10)
        }])
        .select()
        .single();
      if (error) throw error;
      setCustomers(prev => [...prev, data]);
      setNewlyAddedIds(prev => new Set([...prev, data.id]));
      setShowAddCustomerModal(false);
      
      // If this came from an appointment, we might want to mark it as finalized
      // But for now, just adding the customer is enough
      
      alert(`✅ ${data.name} added successfully!`);
    } catch (err) {
      console.error('Error adding customer:', err);
      alert('Failed to add customer: ' + err.message);
    } finally {
      setAddingCustomer(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const { data, error } = await supabase
        .from('contact_leads')
        .select('*')
        .in('status', ['pending', 'confirmed', 'waitlist'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const moveToWaitlist = async (id) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'waitlist' })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to move to waitlist');
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'waitlist' } : a));
      alert('✅ Job moved to Waitlist for future follow-up!');
    } catch (error) {
      console.error('Error moving to waitlist:', error);
      alert('Failed to move to waitlist: ' + error.message);
    }
  };

  const deleteAppointment = async (id) => {
    if (!confirm('Are you sure you want to remove this lead?')) return;
    try {
      const response = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead: ' + error.message);
    }
  };

  const editLead = (apt) => {
    setManualJobForm({
      name: apt.customer_name || '',
      phone: apt.customer_phone || '',
      email: apt.customer_email || '',
      address: apt.address || '',
      services: apt.service_type ? apt.service_type.split(', ') : [],
      notes: apt.notes || '',
      date: apt.visit_date || new Date().toISOString().split('T')[0],
      status: apt.status || 'confirmed',
      id: apt.id
    });
    setIsEditingLead(true);
    setShowManualJobModal(true);
  };

  const confirmLead = (apt) => {
    setSelectedConfirmApt(apt);
    setConfirmForm({
      date: new Date().toISOString().split('T')[0]
    });
    setShowConfirmModal(true);
  };

  const openEmailModal = (apt) => {
    setSelectedEmailLead(apt);
    setEmailTemplate('fully_booked');
    setEmailSubject(EMAIL_TEMPLATES.fully_booked.subject(apt.customer_name));
    setEmailBody(EMAIL_TEMPLATES.fully_booked.body(apt.customer_name));
    setShowEmailModal(true);
  };

  const handleTemplateChange = (templateKey) => {
    setEmailTemplate(templateKey);
    const template = EMAIL_TEMPLATES[templateKey];
    setEmailSubject(template.subject(selectedEmailLead.customer_name));
    setEmailBody(template.body(selectedEmailLead.customer_name));
  };

  const sendCustomEmail = async () => {
    if (!selectedEmailLead || sendingEmail) return;
    
    try {
      setSendingEmail(true);
      const response = await fetch('/api/leads/send-booked-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: selectedEmailLead.customer_email,
          customer_name: selectedEmailLead.customer_name,
          lead_id: selectedEmailLead.id,
          subject: emailSubject,
          body: emailBody
        })
      });
      
      if (response.ok) {
        alert('Email sent successfully!');
        setShowEmailModal(false);
        fetchAppointments(); 
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveConfirmJob = async () => {
    if (!selectedConfirmApt || !confirmForm.date) return;
    
    try {
      setConfirmingJob(true);
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedConfirmApt.id,
          status: 'confirmed',
          visit_date: confirmForm.date
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to confirm');
      
      setAppointments(prev => prev.map(a => 
        a.id === selectedConfirmApt.id 
          ? { ...a, status: 'confirmed', visit_date: confirmForm.date } 
          : a
      ));
      
      setShowConfirmModal(false);
      alert('✅ Job confirmed and dated successfully!');
    } catch (error) {
      console.error('Error confirming lead:', error);
      alert('Failed to confirm job: ' + error.message);
    } finally {
      setConfirmingJob(false);
    }
  };

  const revertToPending = async (id) => {
    if (!confirm('Revert this job back to pending status?')) return;
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending' })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to revert');
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a));
    } catch (error) {
      console.error('Error reverting lead:', error);
      alert('Failed to revert lead: ' + error.message);
    }
  };

  const handleSaveManualJob = async () => {
    if (!manualJobForm.name || !manualJobForm.date) {
      alert('Name and Date are required');
      return;
    }
    
    try {
      setSavingManualJob(true);
      
      if (isEditingLead && manualJobForm.id) {
        const response = await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: manualJobForm.id,
            customer_name: manualJobForm.name,
            customer_phone: manualJobForm.phone,
            customer_email: manualJobForm.email,
            address: manualJobForm.address,
            service_type: manualJobForm.services.join(', '),
            notes: manualJobForm.notes,
            visit_date: manualJobForm.date,
            status: manualJobForm.status
          })
        });
        
        if (!response.ok) throw new Error('Failed to update lead');
        
        setAppointments(prev => prev.map(a => a.id === manualJobForm.id ? { 
          ...a, 
          customer_name: manualJobForm.name,
          customer_phone: manualJobForm.phone,
          customer_email: manualJobForm.email,
          address: manualJobForm.address,
          service_type: manualJobForm.services.join(', '),
          notes: manualJobForm.notes,
          visit_date: manualJobForm.date,
          status: manualJobForm.status
        } : a));
        
        alert('✅ Lead updated successfully!');
      } else {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: manualJobForm.name,
            customer_phone: manualJobForm.phone,
            customer_email: manualJobForm.email,
            address: manualJobForm.address,
            service_type: manualJobForm.services.join(', '),
            notes: manualJobForm.notes,
            visit_date: manualJobForm.date,
            status: manualJobForm.status
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to save job');
        
        setAppointments(prev => [data, ...prev]);
        alert('✅ Manual job added successfully!');
      }
      
      setShowManualJobModal(false);
      setIsEditingLead(false);
      setManualJobForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        services: [],
        notes: '',
        date: new Date().toISOString().split('T')[0],
        status: 'confirmed'
      });
    } catch (error) {
      console.error('Error saving/updating lead:', error);
      alert('Failed to save: ' + error.message);
    } finally {
      setSavingManualJob(false);
    }
  };

  // Google Places Autocomplete for Manual Job
  useEffect(() => {
    if (!showManualJobModal || !manualJobAddressRef.current) return;

    let autocomplete;
    const initAutocomplete = async () => {
      if (!window.google || !window.google.maps) {
        // If google maps is not yet loaded, wait a bit
        setTimeout(initAutocomplete, 1000);
        return;
      }
      
      try {
        const { Autocomplete } = await window.google.maps.importLibrary("places");
        autocomplete = new Autocomplete(manualJobAddressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setManualJobForm(prev => ({ ...prev, address: place.formatted_address }));
          }
        });
      } catch (err) {
        console.error("Google Places initialization error:", err);
      }
    };

    initAutocomplete();
  }, [showManualJobModal]);

  const checkPendingReminders = async () => {
    const confirmedJobs = appointments.filter(a => a.status === 'confirmed' && a.visit_date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const job of confirmedJobs) {
      const jobDate = new Date(job.visit_date + 'T12:00:00');
      const diffTime = jobDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const reminderId = `${job.id}-${diffDays}`;
      const alreadySentInDB = diffDays === 7 ? job.reminder_sent_7d : job.reminder_sent_3d;
      if (remindersSent.has(reminderId) || alreadySentInDB) continue;

      if (diffDays === 7 || diffDays === 3) {
        try {
          const response = await fetch('/api/send-reminder-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job, diffDays })
          });
          
          const data = await response.json();
          if (data.success) {
            setRemindersSent(prev => new Set(prev).add(reminderId));
            console.log(`Email reminder sent for ${job.customer_name} (${diffDays} days)`);
            
            // Attempt to persist in Supabase if columns exist
            const updateField = diffDays === 7 ? 'reminder_sent_7d' : 'reminder_sent_3d';
            await supabase
              .from('contact_leads')
              .update({ [updateField]: true })
              .eq('id', job.id);
          }
        } catch (err) {
          console.error('Failed to send auto-reminder email:', err);
        }
      }
    }
  };

  useEffect(() => {
    if (appointments.length > 0) {
      checkPendingReminders();
    }
  }, [appointments]);

  const handleConvertToCustomer = (apt) => {
    const serviceMap = {
      'Lawn Mowing': 'lawn_mowing',
      'Spring Cleanup': 'spring_cleanup',
      'Fall Cleanup': 'fall_cleanup',
      'Mulching': 'mulching'
    };
    
    setNewCustomerForm({
      name: apt.customer_name || '',
      email: apt.customer_email || '',
      phone: apt.customer_phone || '',
      address: apt.address || '',
      price: '', // Still need to set a price
      frequency: 'weekly',
      service_type: serviceMap[apt.service_type] || 'lawn_mowing',
      status: 'active',
      notes: apt.notes || '',
      scheduled_day: ''
    });
    setShowAddCustomerModal(true);
    
    // Set ref value for autocomplete if needed
    setTimeout(() => {
      if (newCustomerAddressRef.current) {
        newCustomerAddressRef.current.value = apt.address || '';
      }
    }, 200);
  };

  const scheduleVisit = (apt) => {
    setSelectedVisitApt(apt);
    setVisitForm({
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM'
    });
    setShowVisitModal(true);
  };

  const handleConfirmVisit = async () => {
    if (!selectedVisitApt || !visitForm.date) return;
    
    try {
      setSchedulingVisit(true);
      const { error } = await supabase
        .from('contact_leads')
        .update({ 
          visit_date: visitForm.date, 
          visit_time: visitForm.time 
        })
        .eq('id', selectedVisitApt.id);
      
      if (error) throw error;
      
      await fetchAppointments();
      setShowVisitModal(false);
    } catch (error) {
      console.error('Error scheduling visit:', error);
      alert('Failed to schedule visit');
    } finally {
      setSchedulingVisit(false);
    }
  };

  // Load home base address from Supabase
  const loadHomeBaseAddress = async () => {
    try {
      setLoadingHomeBase(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('home_base_address')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data?.home_base_address) {
        setHomeBase(data.home_base_address);
        if (data.home_base_lat && data.home_base_lng) {
          setHomeBaseCoords({ lat: data.home_base_lat, lng: data.home_base_lng });
        }
      }
    } catch (error) {
      console.error('Error loading home base address:', error);
    } finally {
      setLoadingHomeBase(false);
    }
  };

  // Save home base address to Supabase
  const saveHomeBaseAddress = async (address) => {
    try {
      let lat = null;
      let lng = null;

      // Geocode it once now so we never have to do it again
      if (typeof google !== 'undefined') {
        const geocoder = new google.maps.Geocoder();
        const results = await new Promise(resolve => geocoder.geocode({ address }, resolve));
        if (results && results[0]) {
          lat = results[0].geometry.location.lat();
          lng = results[0].geometry.location.lng();
          setHomeBaseCoords({ lat, lng });
        }
      }

      const { error } = await supabase
        .from('business_settings')
        .upsert({
          user_id: user.id,
          home_base_address: address,
          home_base_lat: lat,
          home_base_lng: lng,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving home base address:', error);
    }
  };

  // Calculate proximity from home base
  const calculateProximityFromHomeBase = async (homeAddress) => {
    if (!homeAddress.trim()) {
      alert('Please enter a home base address first');
      return;
    }

    setLoadingProximity(true);
    
    try {
      // Save home base address to Supabase
      await saveHomeBaseAddress(homeAddress);
      
      const customersWithAddresses = customers.filter(c => c.address && c.address.trim());
      
      if (customersWithAddresses.length === 0) {
        alert('No customers with addresses found');
        setLoadingProximity(false);
        return;
      }

      console.log('Calculating proximity for:', homeAddress);
      console.log('Customers with addresses:', customersWithAddresses.length);

      const response = await fetch('/api/calculate-proximity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeBase: homeAddress,
          customers: customersWithAddresses
        })
      });

      const data = await response.json();
      console.log('Proximity calculation response:', data);

      if (data.success) {
        // Save proximity data to database
        const proximityUpdates = [];
        for (const [customerId, proximityInfo] of Object.entries(data.proximityData)) {
          proximityUpdates.push({
            id: customerId,
            distance_miles: proximityInfo.distance ? (proximityInfo.distance / 1609.34).toFixed(1) : null,
            travel_time: proximityInfo.durationText || null,
            proximity_updated_at: new Date().toISOString()
          });
        }

        // Update customers in database with proximity data
        for (const update of proximityUpdates) {
          const { error } = await supabase
            .from('customers')
            .update({
              distance_miles: update.distance_miles,
              travel_time: update.travel_time,
              proximity_updated_at: update.proximity_updated_at
            })
            .eq('id', update.id);

          if (error) {
            console.error('Error updating customer proximity:', error);
          }
        }

        // Refresh customer data to show updated proximity
        await fetchCustomers();
        
        setProximityData(data.proximityData);
        alert(`✅ Successfully calculated proximity for ${Object.keys(data.proximityData).length} customers!\n\nHome base: ${data.homeBaseCoords?.formatted_address || homeAddress}\n\nProximity data has been saved to customer records.`);
      } else {
        console.error('Proximity calculation failed:', data.error);
        alert(`❌ ${data.error}\n\nTips:\n• Use full address format: "123 Main St, City, State ZIP"\n• Check spelling and try again\n• Make sure the address exists`);
      }
    } catch (error) {
      console.error('Error calculating proximity:', error);
      alert('❌ Network error. Please check your connection and try again.');
    } finally {
      setLoadingProximity(false);
    }
  };

  // Smart assignment function using Google Distance Matrix API
  const smartAssignCustomers = async () => {
    if (unassignedCustomers.length === 0) {
      alert('No unassigned customers to organize');
      return;
    }

    setSmartAssignLoading(true);
    setShowSmartAssignModal(true);

    try {
      // Get customers with addresses
      const customersWithAddresses = unassignedCustomers.filter(c => c.address && c.address.trim());
      
      if (customersWithAddresses.length === 0) {
        alert('No customers with addresses found. Please add addresses to customers first.');
        setSmartAssignLoading(false);
        setShowSmartAssignModal(false);
        return;
      }

      // Call our API to calculate distances and group customers
      const response = await fetch('/api/smart-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customersWithAddresses,
          currentSchedule: schedule,
          maxCustomersPerDay: 8 // Configurable limit
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Smart assignment results:', data);
        
        // Apply the smart assignments
        const assignments = data.assignments;
        let totalAssigned = 0;
        
        // Update customers in database for each day
        for (const [day, customerIds] of Object.entries(assignments)) {
          if (customerIds.length > 0) {
            console.log(`Assigning ${customerIds.length} customers to ${day}`);
            
            const { error } = await supabase
              .from('customers')
              .update({ scheduled_day: day })
              .in('id', customerIds);

            if (error) {
              console.error(`Error assigning customers to ${day}:`, error);
              throw error;
            }
            
            totalAssigned += customerIds.length;
          }
        }

        // Update local state
        setCustomers(prev => prev.map(customer => {
          for (const [day, customerIds] of Object.entries(assignments)) {
            if (customerIds.includes(customer.id)) {
              return { ...customer, scheduled_day: day };
            }
          }
          return customer;
        }));

        // Show success message with cluster info
        let successMessage = `Successfully organized ${totalAssigned} customers by proximity!\n\n`;
        if (data.clustersInfo) {
          successMessage += 'Clusters created:\n';
          data.clustersInfo.forEach((cluster, index) => {
            successMessage += `• Group ${index + 1}: ${cluster.totalCustomers} customers (avg distance: ${cluster.averageDistance} miles)\n`;
          });
        }
        
        alert(successMessage);
        setShowSmartAssignModal(false);
      } else {
        console.error('Smart assignment failed:', data.error);
        alert(data.error || 'Failed to organize customers');
      }
    } catch (error) {
      console.error('Error in smart assignment:', error);
      alert('Failed to organize customers. Please try again.');
    } finally {
      setSmartAssignLoading(false);
    }
  };

  // Calculate route for customers on a specific day
  const calculateDayRoute = async (day) => {
    if (optimizingDays.has(day)) return;
    
    try {
      setOptimizingDays(prev => new Set(prev).add(day));
      const dayCustomers = customers.filter(c => c.scheduled_day === day && c.address);
      
      if (dayCustomers.length === 0) {
        console.log(`No customers with addresses found for ${day}`);
        return;
      }

      console.log(`Calculating optimized route for ${day} with ${dayCustomers.length} customers`);

      const response = await fetch('/api/calculate-day-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeBase: homeBase,
          customers: dayCustomers,
          day: day
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Optimized route calculated for ${day}:`, data);
        
        // Update customers with route information and optimized order
        const routeUpdates = [];
        data.routeData.forEach((routeInfo, index) => {
          routeUpdates.push({
            id: routeInfo.id,
            route_order: routeInfo.order,
            travel_time_to_next: routeInfo.travelTimeToNext,
            distance_to_next: routeInfo.distanceToNext,
            route_updated_at: new Date().toISOString()
          });
        });

        // Update database with route information
        for (const update of routeUpdates) {
          const { error } = await supabase
            .from('customers')
            .update({
              route_order: update.route_order,
              travel_time_to_next: update.travel_time_to_next,
              distance_to_next: update.distance_to_next,
              route_updated_at: update.route_updated_at
            })
            .eq('id', update.id);

          if (error) {
            console.error('Error updating customer route:', error);
          }
        }

        // Refresh customer data to show updated route order
        await fetchCustomers();
        
        setOptimizationData({
          day,
          customerCount: dayCustomers.length,
          totalDistance: data.totalDistance,
          totalTime: data.totalTime
        });
      } else {
        console.error('Route calculation failed:', data.error);
        alert(`❌ Route optimization failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error calculating day route:', error);
      
      // More specific error messages
      if (error.message.includes('Failed to fetch')) {
        alert('❌ Network error: Unable to connect to route calculation service.\n\nPlease check your internet connection and try again.');
      } else if (error.message.includes('HTTP error')) {
        alert('❌ Server error: Route calculation service is temporarily unavailable.\n\nPlease try again in a moment.');
      } else {
        alert('❌ Error optimizing route: ' + error.message + '\n\nPlease try again or contact support if the problem persists.');
      }
    } finally {
      setOptimizingDays(prev => {
        const next = new Set(prev);
        next.delete(day);
        return next;
      });
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('customer-search')?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchTerm) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  // Function to highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">{part}</span>
      ) : part
    );
  };

  // Handle day-specific search
  const handleDaySearch = (day, searchTerm) => {
    setDaySearchTerms(prev => ({
      ...prev,
      [day]: searchTerm
    }));
  };

  // Get customers from other days that match search term
  const getSearchableCustomers = (currentDay, searchTerm) => {
    if (!searchTerm.trim()) return [];
    
    const otherDayCustomers = [];
    DAYS_OF_WEEK.forEach(day => {
      if (day !== currentDay && schedule[day]) {
        schedule[day].forEach(customer => {
          if (customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))) {
            otherDayCustomers.push({ ...customer, currentDay: day });
          }
        });
      }
    });
    
    // Also search unassigned customers
    unassignedCustomers.forEach(customer => {
      if (customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))) {
        otherDayCustomers.push({ ...customer, currentDay: 'Unassigned' });
      }
    });
    
    return otherDayCustomers;
  };

  // Reassign customer to new day
  const reassignCustomerToDay = async (customerId, newDay, fromDay) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ scheduled_day: newDay })
        .eq('id', customerId);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, scheduled_day: newDay }
          : customer
      ));
      
      // Clear search term for this day
      setDaySearchTerms(prev => ({
        ...prev,
        [newDay]: ''
      }));

      // Recalculate route for both days if home base is set
      if (homeBase.trim()) {
        if (fromDay !== 'Unassigned') {
          await calculateDayRoute(fromDay);
        }
        await calculateDayRoute(newDay);
      }
    } catch (error) {
      console.error('Error reassigning customer:', error);
      alert('Error reassigning customer');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, customer) => {
    setDraggedCustomer(customer);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDay(null);
    }
  };

  const handleDrop = async (e, newDay) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (!draggedCustomer) return;
    
    const fromDay = draggedCustomer.scheduled_day || 'Unassigned';
    
    // Don't do anything if dropping on the same day
    if (fromDay === newDay) {
      setDraggedCustomer(null);
      return;
    }
    
    try {
      await reassignCustomerToDay(draggedCustomer.id, newDay, fromDay);
      setDraggedCustomer(null);
    } catch (error) {
      console.error('Error in drag and drop:', error);
      setDraggedCustomer(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedCustomer(null);
    setDragOverDay(null);
  };

  // Reorder customers within the same day
  const reorderCustomersInDay = async (day, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const dayCustomers = [...schedule[day]];
    const [movedCustomer] = dayCustomers.splice(fromIndex, 1);
    dayCustomers.splice(toIndex, 0, movedCustomer);
    
    // Update route orders in database
    try {
      for (let i = 0; i < dayCustomers.length; i++) {
        const customer = dayCustomers[i];
        await supabase
          .from('customers')
          .update({ 
            route_order: i + 1,
            route_updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);
      }
      
      // Refresh customer data
      await fetchCustomers();
    } catch (error) {
      console.error('Error reordering customers:', error);
      alert('Error reordering customers');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-green-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg">🌿</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* === HEADER === */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">Schedule</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {getCurrentDayName()}, {getCurrentWeek()} &bull; {customers.length} active customers
            </p>
          </div>
          
          {/* Mobile View Toggle - Fixed Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#161922]/95 backdrop-blur-2xl border-t border-white/10 p-2.5 px-6 flex items-center justify-around z-[100] sm:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex flex-col items-center gap-1.5 p-1 transition-all ${viewMode === 'schedule' ? 'text-green-400 scale-110' : 'text-gray-500'}`}
            >
              <CalendarDaysIcon className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Jobs</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex flex-col items-center gap-1.5 p-1 transition-all ${viewMode === 'map' ? 'text-blue-400 scale-110' : 'text-gray-500'}`}
            >
              <MapIcon className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Map</span>
            </button>
            <button
              onClick={() => setViewMode('appointments')}
              className={`flex flex-col items-center gap-1.5 p-1 transition-all ${viewMode === 'appointments' ? 'text-purple-400 scale-110' : 'text-gray-500'}`}
            >
              <EnvelopeIcon className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Leads</span>
            </button>
            <button
              onClick={() => setViewMode('visits')}
              className={`flex flex-col items-center gap-1.5 p-1 transition-all ${viewMode === 'visits' ? 'text-orange-400 scale-110' : 'text-gray-500'}`}
            >
              <ClockIcon className="h-6 w-6" />
              <span className="text-[9px] font-black uppercase tracking-widest">Visits</span>
            </button>
          </div>

          {/* Desktop View Toggle - Hidden on Mobile */}
          <div className="hidden sm:flex items-center bg-white/5 backdrop-blur-xl rounded-2xl p-1 border border-white/10">
            {/* ... (buttons remain as they were in the desktop view) ... */}
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'schedule'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Schedule
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                viewMode === 'schedule' ? 'bg-white text-green-600' : 'bg-white/10 text-gray-400'
              }`}>
                {customers.length}
              </span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Map
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                viewMode === 'map' ? 'bg-white text-blue-600' : 'bg-white/10 text-gray-400'
              }`}>
                {customers.filter(c => c.address).length}
              </span>
            </button>
            <button
              onClick={() => setViewMode('appointments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'appointments'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <EnvelopeIcon className="h-4 w-4" />
              Inquiries
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                viewMode === 'appointments' ? 'bg-white text-purple-600' : 'bg-white/10 text-gray-400'
              }`}>
                {appointments.filter(a => !a.visit_date).length}
              </span>
            </button>
            <button
              onClick={() => setViewMode('visits')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                viewMode === 'visits'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ClockIcon className="h-4 w-4" />
              Visits
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                viewMode === 'visits' ? 'bg-white text-orange-600' : 'bg-white/10 text-gray-400'
              }`}>
                {appointments.filter(a => a.visit_date).length}
              </span>
            </button>
          </div>

          {/* Add Customer Button - Floats on Mobile */}
          <button
            onClick={openAddCustomerModal}
            className="fixed bottom-24 right-6 sm:static flex items-center gap-2 px-6 py-5 sm:px-4 sm:py-2.5 rounded-full sm:rounded-2xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/40 sm:shadow-green-500/25 hover:scale-105 transition-all duration-200 active:scale-95 z-[90]"
          >
            <PlusIcon className="h-6 w-6 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">New Customer</span>
          </button>
        </div>

        {/* === COMMAND CENTER === */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.08] overflow-hidden mb-6">
          
          {/* Top bar: Big earnings + week toggle */}
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Monthly hero number */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Monthly Revenue</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                    ${earnings.grandTotal.toFixed(0)}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-500">
                      <span className="text-green-400 font-bold">${(selectedWeek === 'Week 1' ? earnings.week1 : earnings.week2).toFixed(0)}</span> this week
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">
                      <span className="text-white font-semibold">{DAYS_OF_WEEK.filter(d => d.includes(selectedWeek)).reduce((t, d) => t + (schedule[d]?.length || 0), 0)}</span> customers
                    </span>
                  </div>
                </div>
                {/* Inline breakdown */}
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[11px] text-gray-400">
                      Weekly <span className="text-white font-semibold">${DAYS_OF_WEEK.filter(d => d.includes(selectedWeek)).reduce((t, d) => t + (schedule[d] || []).filter(c => c.frequency === 'weekly').reduce((s, c) => s + parseFloat(c.price || 0), 0), 0).toFixed(0)}</span>
                      <span className="text-gray-600 ml-1">({DAYS_OF_WEEK.filter(d => d.includes(selectedWeek)).reduce((t, d) => t + (schedule[d] || []).filter(c => c.frequency === 'weekly').length, 0)})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[11px] text-gray-400">
                      Bi-Weekly <span className="text-white font-semibold">${DAYS_OF_WEEK.filter(d => d.includes(selectedWeek)).reduce((t, d) => t + (schedule[d] || []).filter(c => c.frequency === 'bi_weekly').reduce((s, c) => s + parseFloat(c.price || 0), 0), 0).toFixed(0)}</span>
                      <span className="text-gray-600 ml-1">({DAYS_OF_WEEK.filter(d => d.includes(selectedWeek)).reduce((t, d) => t + (schedule[d] || []).filter(c => c.frequency === 'bi_weekly').length, 0)})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Week Toggle - compact */}
              <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/10 shrink-0">
                {['Week 1', 'Week 2'].map(week => (
                  <button
                    key={week}
                    onClick={() => { setSelectedWeek(week); setSelectedDay(null); }}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      selectedWeek === week
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    W{week.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day bar - full width strip */}
          <div className="border-t border-white/[0.05] px-2 py-2.5 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setSelectedDay(null)}
              className={`shrink-0 px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                selectedDay === null
                  ? 'bg-white/15 text-white'
                  : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              ALL
            </button>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(baseDay => {
              const fullDay = `${baseDay} ${selectedWeek}`;
              const count = schedule[fullDay]?.length || 0;
              const completedCount = completedCustomers[fullDay]?.length || 0;
              const isToday = fullDay === `${getCurrentDayName()} ${getCurrentWeek()}`;
              const isSelected = selectedDay === fullDay;
              const progress = count > 0 ? (completedCount / count) * 100 : 0;
              const dayEarnings = earnings.daily[fullDay];

              return (
                <button
                  key={baseDay}
                  onClick={() => {
                    setSelectedDay(fullDay);
                    setTimeout(() => {
                      document.getElementById(`day-${fullDay.replace(/ /g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`shrink-0 flex-1 min-w-[70px] py-2 px-2 rounded-xl transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-green-500/20 to-green-500/5 border border-green-500/30'
                      : isToday
                      ? 'bg-white/[0.06] border border-green-500/20'
                      : count > 0
                      ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-transparent'
                      : 'border border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-green-400' : isToday ? 'text-green-400' : count > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                    {baseDay.slice(0, 3)}
                  </div>
                  <div className={`text-sm font-black mt-0.5 ${isSelected ? 'text-white' : count > 0 ? 'text-gray-200' : 'text-gray-700'}`}>
                    {count}
                  </div>
                  {dayEarnings && dayEarnings.total > 0 && (
                    <div className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-green-300' : 'text-gray-600'}`}>
                      ${dayEarnings.total.toFixed(0)}
                    </div>
                  )}
                  {/* Mini progress bar */}
                  {count > 0 && (
                    <div className="w-full h-0.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}
                  {isToday && !isSelected && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>}
                </button>
              );
            })}
          </div>

          {/* Search + Home Base row */}
          <div className="border-t border-white/[0.05] px-4 py-2.5 flex items-center gap-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-600 shrink-0" />
            <input
              id="customer-search"
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-300 placeholder-gray-700 min-w-0"
            />
            {searchTerm && (
              <>
                <span className="text-[10px] text-gray-500 shrink-0">{filteredCustomers.length} found</span>
                <button onClick={clearSearch} className="p-0.5 text-gray-600 hover:text-white"><XMarkIcon className="h-3.5 w-3.5" /></button>
              </>
            )}
            <div className="w-px h-5 bg-white/10 shrink-0"></div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPinIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
              {isEditingHomeBase ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    ref={homeBaseAddressRef}
                    type="text"
                    defaultValue={homeBase}
                    placeholder="Enter business address..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-green-500/50"
                  />
                  <button
                    onClick={() => {
                      const newAddr = homeBaseAddressRef.current.value;
                      if (newAddr.trim()) {
                        setHomeBase(newAddr);
                        calculateProximityFromHomeBase(newAddr);
                      }
                      setIsEditingHomeBase(false);
                    }}
                    className="text-[10px] text-green-400 font-bold hover:text-green-300 shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingHomeBase(false)}
                    className="text-[10px] text-gray-500 hover:text-gray-400 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {homeBase ? (
                    <span className="text-[11px] text-gray-500 truncate flex-1">{homeBase}</span>
                  ) : (
                    <span className="text-[11px] text-gray-700 italic flex-1">No base set</span>
                  )}
                  <button
                    onClick={() => setIsEditingHomeBase(true)}
                    className="text-[10px] text-green-500 hover:text-green-400 font-semibold transition-colors shrink-0"
                  >
                    {homeBase ? 'Edit' : 'Set Base'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* === MAP VIEW === */}
        {viewMode === 'map' && (
          <div className="mb-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <MapIcon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Customer Map</h2>
                </div>
                <span className="text-xs text-gray-500">{customers.filter(c => c.address).length} with addresses</span>
              </div>
              <CustomerMap
                customers={customers.filter(c => c.address)}
                homeBase={homeBase}
                selectedWeek={selectedWeek}
                completedCustomers={completedCustomers}
                movedCustomers={movedCustomers}
                onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
              />
            </div>
          </div>
        )}

        {/* === APPOINTMENTS / INQUIRIES VIEW === */}
        {viewMode === 'appointments' && (
          <div className="mb-6 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl shadow-purple-500/20">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{inquiryTab === 'pending' ? 'Pending Inquiries' : 'Confirmed Jobs'}</h2>
                    <p className="text-sm text-gray-500">
                      {inquiryTab === 'pending' 
                        ? `${appointments.filter(a => !a.visit_date && a.status === 'pending').length} leads waiting for response`
                        : `${appointments.filter(a => a.status === 'confirmed').length} jobs ready for scheduling`}
                    </p>
                  </div>
                </div>
                
                {/* Sub-tabs */}
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                  <button
                    onClick={() => setInquiryTab('pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      inquiryTab === 'pending' 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Pending ({appointments.filter(a => !a.visit_date && a.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setInquiryTab('confirmed')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      inquiryTab === 'confirmed' 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
                  </button>
                  <button
                    onClick={() => setInquiryTab('waitlist')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      inquiryTab === 'waitlist' 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Waitlist ({appointments.filter(a => a.status === 'waitlist').length})
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsEditingLead(false);
                      setManualJobForm({
                        name: '',
                        phone: '',
                        email: '',
                        address: '',
                        services: [],
                        notes: '',
                        date: new Date().toISOString().split('T')[0],
                        status: 'confirmed'
                      });
                      setShowManualJobModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Manual Job
                  </button>
                  <button 
                    onClick={fetchAppointments}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/5"
                  >
                    <ArrowPathIcon className={`h-3.5 w-3.5 ${loadingAppointments ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {loadingAppointments && appointments.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 font-medium">Scanning for new leads...</p>
                </div>
              ) : (inquiryTab === 'pending' ? appointments.filter(a => !a.visit_date && a.status === 'pending') : appointments.filter(a => a.status === 'confirmed')).length === 0 ? (
                <div className="py-20 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EnvelopeOpenIcon className="h-8 w-8 text-gray-700" />
                  </div>
                  <h3 className="text-white font-bold mb-1 text-lg">{inquiryTab === 'pending' ? 'Inbox is Empty' : 'No Confirmed Jobs'}</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    {inquiryTab === 'pending' 
                      ? 'New leads from your contact form will appear here automatically.'
                      : inquiryTab === 'confirmed'
                        ? 'Confirmed jobs that are ready to be added to the schedule will appear here.'
                        : 'Completed one-time jobs and future seasonal work targets.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {(inquiryTab === 'pending' 
                    ? appointments.filter(a => !a.visit_date && a.status === 'pending') 
                    : inquiryTab === 'confirmed'
                      ? appointments.filter(a => a.status === 'confirmed')
                      : appointments.filter(a => a.status === 'waitlist')
                  ).map(apt => (
                    <div 
                      key={apt.id} 
                      className={`bg-white/[0.03] border rounded-3xl p-5 hover:bg-white/[0.06] transition-all group relative overflow-hidden ${
                        apt.status === 'confirmed' 
                          ? (() => {
                              const jobDate = new Date(apt.visit_date + 'T12:00:00');
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              jobDate.setHours(0, 0, 0, 0);
                              
                              if (jobDate.getTime() === today.getTime()) return 'border-green-500/50 shadow-lg shadow-green-500/10';
                              
                              const diffDays = Math.ceil((jobDate - today) / (1000 * 60 * 60 * 24));
                              if (diffDays > 0 && diffDays <= 7) return 'border-amber-500/40 shadow-lg shadow-amber-500/5';
                              
                              return 'border-blue-500/30 shadow-lg shadow-blue-500/5';
                            })()
                          : 'border-white/10'
                      }`}
                    >
                      {/* Accent glow */}
                      <div className={`absolute -top-10 -right-10 w-24 h-24 blur-2xl rounded-full ${
                        apt.status === 'confirmed' 
                          ? (() => {
                              const jobDate = new Date(apt.visit_date + 'T12:00:00');
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              jobDate.setHours(0, 0, 0, 0);
                              
                              if (jobDate.getTime() === today.getTime()) return 'bg-green-500/15';
                              
                              const diffDays = Math.ceil((jobDate - today) / (1000 * 60 * 60 * 24));
                              if (diffDays > 0 && diffDays <= 7) return 'bg-amber-500/10';
                              
                              return 'bg-blue-500/10';
                            })()
                          : 'bg-purple-500/5'
                      }`}></div>
                      
                      <div className="flex flex-col h-full">
                        {/* Header: Name and Quick Actions cluster */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-black text-white leading-tight mb-2 truncate">
                              {highlightSearchTerm(apt.customer_name, searchTerm)}
                            </h3>
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap gap-2">
                                {(apt.service_type || 'Inquiry').split(', ').map((service, idx) => (
                                  <span key={idx} className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border whitespace-nowrap ${
                                    apt.status === 'confirmed' 
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  }`}>
                                    {service}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-600" />
                                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                                  {new Date(apt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* The Icon Cluster - Far Right */}
                          <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[140px]">
                            {apt.status === 'pending' && (
                              <button onClick={() => openEmailModal(apt)} className="p-2 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all border border-purple-500/20" title="Send Email">
                                <EnvelopeIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => editLead(apt)} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all border border-indigo-500/20" title="Edit Lead">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => scheduleVisit(apt)} className="p-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all border border-orange-500/20" title="Schedule Visit">
                              <ClockIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => router.push(`/invoices?leadId=${apt.id}`)} className="p-2 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all border border-purple-500/20" title="Create Invoice">
                              <DocumentTextIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteAppointment(apt.id)} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20" title="Delete">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <PhoneIcon className="h-3.5 w-3.5 text-gray-600" />
                            <a href={`tel:${apt.customer_phone}`} className="hover:text-white transition-colors">{apt.customer_phone || 'No phone'}</a>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <EnvelopeIcon className="h-3.5 w-3.5 text-gray-600" />
                            <a href={`mailto:${apt.customer_email}`} className="hover:text-white transition-colors truncate">{apt.customer_email || 'No email'}</a>
                          </div>
                          <div className="flex items-start gap-3 text-xs text-gray-400">
                            <MapPinIcon className="h-3.5 w-3.5 text-gray-600 mt-0.5" />
                            <span className="line-clamp-1">{apt.address || apt.city || 'No address provided'}</span>
                          </div>
                        </div>

                        {/* Bottom Action Row */}
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          {apt.status === 'pending' ? (
                            <button 
                              onClick={() => confirmLead(apt)}
                              className="py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20 flex items-center justify-center gap-2"
                            >
                              <CheckBadgeIcon className="h-3.5 w-3.5" />
                              Confirm Lead
                            </button>
                          ) : (
                            <button 
                              onClick={() => confirmLead(apt)}
                              className="py-3 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all"
                            >
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Scheduled For</span>
                              <span className="text-[11px] font-black">{formatLocalDate(apt.visit_date)}</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleConvertToCustomer(apt)}
                            className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                              apt.status === 'confirmed'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent shadow-lg shadow-green-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            <UserPlusIcon className="h-3.5 w-3.5 text-inherit" />
                            Finalize
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === VISITS VIEW === */}
        {viewMode === 'visits' && (
          <div className="mb-6 space-y-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl shadow-orange-500/20">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Walkthrough Schedule</h2>
                    <p className="text-sm text-gray-500 font-medium">{appointments.filter(a => a.visit_date).length} site visits confirmed</p>
                  </div>
                </div>
              </div>

              {appointments.filter(a => a.visit_date).length === 0 ? (
                <div className="py-24 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarDaysIcon className="h-10 w-10 text-gray-700" />
                  </div>
                  <h3 className="text-white font-black mb-2 text-xl">No Visits Scheduled</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto font-medium">Your upcoming estimate visits and walkthroughs will appear here in a chronological timeline.</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Grouping logic for the timeline */}
                  {Object.entries(
                    appointments
                      .filter(a => a.visit_date)
                      .reduce((groups, apt) => {
                        const date = apt.visit_date;
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(apt);
                        return groups;
                      }, {})
                  )
                  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                  .map(([date, dateVisits]) => (
                    <div key={date} className="relative pl-8 sm:pl-12">
                      {/* Vertical Timeline Line */}
                      <div className="absolute left-0 top-2 bottom-0 w-px bg-gradient-to-b from-orange-500/50 via-orange-500/10 to-transparent"></div>
                      
                      {/* Date Header */}
                      <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                      <div className="mb-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 mb-1">
                          {formatLongLocalDate(date)}
                        </h3>
                        <div className="h-px w-24 bg-gradient-to-r from-orange-500/30 to-transparent"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {dateVisits.map(apt => (
                          <div 
                            key={apt.id} 
                            className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.06] transition-all group relative overflow-hidden flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 bg-white/5 text-orange-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/5">
                                      {apt.visit_time || 'TBD'}
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-black text-white truncate group-hover:text-orange-400 transition-colors">{apt.customer_name}</h4>
                                </div>
                              </div>

                              <div className="space-y-3 mb-6 text-sm text-gray-400 font-medium">
                                <div className="flex items-start gap-3">
                                  <MapPinIcon className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
                                  <span className="line-clamp-2 leading-relaxed">{apt.address || apt.city}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <DocumentTextIcon className="h-4 w-4 text-gray-600 shrink-0" />
                                  <span className="italic truncate">Target: {apt.service_type}</span>
                                </div>
                                {apt.customer_phone && (
                                  <div className="flex items-center gap-3">
                                    <PhoneIcon className="h-4 w-4 text-gray-600 shrink-0" />
                                    <span>{apt.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-white/5">
                              <button 
                                onClick={() => handleConvertToCustomer(apt)}
                                className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95 flex items-center justify-center gap-2"
                              >
                                <UserPlusIcon className="h-4 w-4" />
                                Convert to Client
                              </button>
                              <button 
                                onClick={() => deleteAppointment(apt.id)}
                                className="p-3.5 bg-white/5 text-gray-500 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === DAILY EARNINGS GOAL BAR === */}
        <div className="mb-8 p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Daily Progress <span className="text-gray-600 text-sm font-medium">— {selectedDay || 'Today'}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Keep it up! You're almost at your goal.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-green-400">
                ${earnings.daily[selectedDay]?.total || 0}
              </span>
              <span className="text-gray-600 text-sm font-bold ml-1">/ ${dailyGoal}</span>
            </div>
          </div>
          
          <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              style={{ width: `${Math.min(100, (((earnings.daily[selectedDay]?.total || 0) / dailyGoal) * 100))}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move-bg_1s_linear_infinite]"></div>
            </div>
          </div>
          
          <div className="flex justify-between mt-3 px-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {Math.round(((earnings.daily[selectedDay] || 0) / dailyGoal) * 100)}% Complete
                </span>
              </div>
              <div className="h-3 w-[1px] bg-white/10"></div>
              <div className="flex items-center gap-1.5">
                <BanknotesIcon className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  ${Math.max(0, dailyGoal - (earnings.daily[selectedDay] || 0))} Remaining
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                const newGoal = prompt("Set your daily earnings goal:", dailyGoal);
                if (newGoal && !isNaN(newGoal)) setDailyGoal(Number(newGoal));
              }}
              className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
            >
              Set Goal
            </button>
          </div>
        </div>

        {/* === UNASSIGNED CUSTOMERS === */}
        {unassignedCustomers.length > 0 && viewMode === 'schedule' && (
          <div className="mb-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-orange-500/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
                    <ClockIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Unassigned</h2>
                    <p className="text-xs text-gray-400">{unassignedCustomers.length} waiting to be scheduled</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(proximityData).length > 0 && (
                    <button
                      onClick={() => {
                        const sorted = [...unassignedCustomers].sort((a, b) => {
                          const aP = proximityData[a.id]; const bP = proximityData[b.id];
                          if (!aP && !bP) return 0; if (!aP) return 1; if (!bP) return -1;
                          return aP.distance - bP.distance;
                        });
                        setUnassignedCustomers(sorted);
                      }}
                      className="px-3 py-2 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center gap-1"
                    >
                      <MapPinIcon className="h-3.5 w-3.5" />Sort by Distance
                    </button>
                  )}
                  <button onClick={selectAllUnassigned} className="px-3 py-2 text-xs font-semibold text-gray-400 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10 transition-all">
                    {selectedCustomers.length === unassignedCustomers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={smartAssignCustomers}
                    disabled={smartAssignLoading || unassignedCustomers.filter(c => c.address).length === 0}
                    className="px-3 py-2 text-xs font-semibold text-purple-300 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 border border-purple-500/20 disabled:opacity-40 transition-all flex items-center gap-1"
                  >
                    {smartAssignLoading ? <><div className="animate-spin h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full"></div>Working...</> : <>🎯 Smart Assign</>}
                  </button>
                  {selectedCustomers.length > 0 && (
                    <button
                      onClick={() => setShowBulkAssignModal(true)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center gap-1"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />Assign {selectedCustomers.length}
                    </button>
                  )}
                </div>
              </div>

              {selectedCustomers.length > 0 && (
                <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-400 font-medium">
                      <CheckIcon className="h-4 w-4 inline mr-1" />{selectedCustomers.length} selected
                    </span>
                    <span className="text-sm text-green-300 font-bold">
                      ${selectedCustomers.reduce((s, id) => s + parseFloat(unassignedCustomers.find(c => c.id === id)?.price || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkScratchCustomers}
                      className="px-3 py-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                    >
                      ✕ Bulk Scratch
                    </button>
                    <button
                      onClick={handleBulkDeleteCustomers}
                      className="px-3 py-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      🗑 Bulk Delete
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-[11px] font-bold text-gray-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {unassignedCustomers.map(customer => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    showAssignButton={true}
                    showCheckbox={true}
                    day={selectedDay}
                    daySelectionHandler={toggleDayCustomerSelection}
                    // Props from parent state
                    proximityData={proximityData}
                    activeJobTimers={activeJobTimers}
                    completedCustomers={completedCustomers}
                    movedCustomers={movedCustomers}
                    selectedDayCustomers={selectedDayCustomers}
                    selectedCustomers={selectedCustomers}
                    draggedCustomer={draggedCustomer}
                    newlyAddedIds={newlyAddedIds}
                    handleAddressClick={handleAddressClick}
                    openEditCustomerModal={openEditCustomerModal}
                    searchTerm={searchTerm}
                    editingAddress={editingAddress}
                    editingNotes={editingNotes}
                    schedule={schedule}
                    // Functions from parent
                    highlightSearchTerm={highlightSearchTerm}
                    toggleCustomerSelection={toggleCustomerSelection}
                    toggleCustomerCompletion={toggleCustomerCompletion}
                    moveSingleCustomerToNextDay={moveSingleCustomerToNextDay}
                    startJob={startJob}
                    cancelJobTimer={cancelJobTimer}
                    setSelectedCustomerForDone={setSelectedCustomerForDone}
                    setShowMarkDoneModal={setShowMarkDoneModal}
                    setCompletionMessage={setCompletionMessage}
                    setSelectedCustomer={setSelectedCustomer}
                    setShowAssignModal={setShowAssignModal}
                    unassignCustomer={unassignCustomer}
                    scratchCustomer={scratchCustomer}
                    removeCustomer={removeCustomer}
                    startEditingAddress={startEditingAddress}
                    cancelEditingAddress={cancelEditingAddress}
                    updateCustomerAddress={updateCustomerAddress}
                    addressInputRefs={addressInputRefs}
                    setEditingAddress={setEditingAddress}
                    startEditingNotes={startEditingNotes}
                    cancelEditingNotes={cancelEditingNotes}
                    handleNoteTextChange={handleNoteTextChange}
                    updateCustomerNotes={updateCustomerNotes}
                    startEditingSafetyNotes={startEditingSafetyNotes}
                    cancelEditingSafetyNotes={cancelEditingSafetyNotes}
                    updateCustomerSafetyNotes={updateCustomerSafetyNotes}
                    editingSafetyNotes={editingSafetyNotes}
                    // Delay props
                    setShowDelayModal={setShowDelayModal}
                    setSelectedCustomerForDelay={setSelectedCustomerForDelay}
                    setDelayMessage={setDelayMessage}
                    DELAY_TEMPLATES={DELAY_TEMPLATES}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === DAILY SCHEDULE GRID === */}
        {viewMode === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(selectedDay ? [selectedDay] : DAYS_OF_WEEK.filter(day => day.includes(selectedWeek))).map(day => {
              const daySearchTerm = daySearchTerms[day] || '';
              const searchResults = getSearchableCustomers(day, daySearchTerm);
              const isToday = day === `${getCurrentDayName()} ${getCurrentWeek()}` && selectedWeek === getCurrentWeek();
              const dayCustomers = schedule[day] || [];
              const completedCount = completedCustomers[day]?.length || 0;
              const earningsData = earnings.daily[day];
              const progress = dayCustomers.length > 0 ? (completedCount / dayCustomers.length) * 100 : 0;
              
              const completedCustomersOnDay = dayCustomers.filter(c => completedCustomers[day]?.includes(c.id));
              const totalTrackedTime = completedCustomersOnDay.reduce((sum, c) => sum + (c.last_job_duration_minutes || 0), 0);

              return (
                <div
                  key={day}
                  id={`day-${day.replace(/ /g, '-')}`}
                  className={`bg-white/5 backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-300 hover:bg-white/[0.07] ${selectedDay ? 'lg:col-span-2' : ''} ${
                    isToday ? 'border-green-500/30 shadow-lg shadow-green-500/10' : 'border-white/10'
                  }`}
                >
                  {/* Day Header */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{day.split(' ')[0]}</span>
                        <span className="text-xs text-gray-500 font-medium">{day.split(' ').slice(1).join(' ')}</span>
                        <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{dayCustomers.length}</span>
                        {isToday && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>Today
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {totalTrackedTime > 0 && (
                          <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                            ⏳ {totalTrackedTime >= 60 ? `${Math.floor(totalTrackedTime / 60)}h ${totalTrackedTime % 60}m` : `${totalTrackedTime}m`}
                          </span>
                        )}
                        {earningsData && earningsData.total > 0 && (
                          <span className="text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            ${earningsData.total.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {dayCustomers.length > 0 && (
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {dayCustomers.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <button onClick={() => moveIncompleteToNextDay(day)} className="text-[10px] px-2.5 py-1.5 text-orange-400 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 border border-orange-500/20 transition-all font-medium">
                          ⏭️ Move Incomplete
                        </button>
                        <button onClick={() => selectAllDayCustomers(day)} className="text-[10px] px-2.5 py-1.5 text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 border border-white/10 transition-all font-medium">
                          {selectedDayCustomers[day]?.length === dayCustomers.length ? '✕ Deselect' : '☑ Select All'}
                        </button>
                        {selectedDayCustomers[day]?.length > 0 && (
                          <button onClick={() => bulkRemoveFromDay(day, selectedDayCustomers[day])} className="text-[10px] px-2.5 py-1.5 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all font-medium">
                            ✕ Remove ({selectedDayCustomers[day].length})
                          </button>
                        )}
                        {dayCustomers.length > 1 && homeBase.trim() && (
                          <button 
                            onClick={() => calculateDayRoute(day)} 
                            disabled={optimizingDays.has(day)}
                            className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all font-black uppercase tracking-widest flex items-center gap-2 ${
                              optimizingDays.has(day)
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-transparent shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95'
                            }`}
                          >
                            {optimizingDays.has(day) ? (
                              <>
                                <div className="animate-spin h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                                Optimizing...
                              </>
                            ) : (
                              <>🎯 Optimize Order</>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Day search */}
                    <div className="mt-3 flex items-center bg-white/5 rounded-xl border border-white/5 px-3 py-2">
                      <MagnifyingGlassIcon className="h-3.5 w-3.5 text-gray-600 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search to reassign here..."
                        value={daySearchTerm}
                        onChange={(e) => handleDaySearch(day, e.target.value)}
                        className="flex-1 bg-transparent outline-none text-xs text-gray-300 placeholder-gray-600"
                      />
                      {daySearchTerm && (
                        <button onClick={() => handleDaySearch(day, '')} className="p-0.5 text-gray-600 hover:text-white">
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-400 font-semibold mb-2">Found {searchResults.length}:</p>
                        <div className="space-y-1.5">
                          {searchResults.map(customer => (
                            <div key={customer.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{highlightSearchTerm(customer.name, daySearchTerm)}</p>
                                <p className="text-[10px] text-gray-500">From: {customer.currentDay} &bull; ${customer.price}</p>
                              </div>
                              <button
                                onClick={() => reassignCustomerToDay(customer.id, day, customer.currentDay)}
                                className="ml-2 px-2.5 py-1 bg-green-500/20 text-green-400 text-[10px] rounded-lg hover:bg-green-500/30 font-semibold transition-all"
                              >
                                + Move
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Earnings breakdown */}
                    {earningsData && earningsData.total > 0 && (
                      <div className="mt-2 flex gap-2 text-[10px]">
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg font-medium">
                          W: ${earningsData.weekly.toFixed(0)} ({earningsData.weeklyCount})
                        </span>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-medium">
                          BW: ${earningsData.biWeekly.toFixed(0)} ({earningsData.biWeeklyCount})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Customer List */}
                  <div className="p-3">
                    {selectedDayCustomers[day]?.length > 0 && (
                      <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-red-400 font-medium">{selectedDayCustomers[day].length} selected for removal</span>
                        <span className="text-xs text-red-300 font-bold">${selectedDayCustomers[day].reduce((s, id) => s + parseFloat(schedule[day]?.find(c => c.id === id)?.price || 0), 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {dayCustomers.length > 0 ? (
                      <div
                        className={`space-y-2.5 min-h-[80px] p-1 rounded-xl transition-colors ${
                          dragOverDay === day ? 'bg-blue-500/10 border-2 border-dashed border-blue-500/30' : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, day)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day)}
                      >
                        {dayCustomers.map((customer, index) => (
                          <CustomerCard
                            key={customer.id}
                            customer={customer}
                            showUnassignButton={true}
                            showCheckbox={true}
                            onDragStart={(e) => handleDragStart(e, customer)}
                            onDragEnd={handleDragEnd}
                            reorderCustomersInDay={reorderCustomersInDay}
                            index={index}
                            day={day}
                            daySelectionHandler={toggleDayCustomerSelection}
                            // Props from parent state
                            proximityData={proximityData}
                            activeJobTimers={activeJobTimers}
                            completedCustomers={completedCustomers}
                            movedCustomers={movedCustomers}
                            selectedDayCustomers={selectedDayCustomers}
                            selectedCustomers={selectedCustomers}
                            draggedCustomer={draggedCustomer}
                            newlyAddedIds={newlyAddedIds}
                            handleAddressClick={handleAddressClick}
                            openEditCustomerModal={openEditCustomerModal}
                            searchTerm={searchTerm}
                            editingAddress={editingAddress}
                            editingNotes={editingNotes}
                            schedule={schedule}
                            // Functions from parent
                            highlightSearchTerm={highlightSearchTerm}
                            toggleCustomerSelection={toggleCustomerSelection}
                            toggleCustomerCompletion={toggleCustomerCompletion}
                            moveSingleCustomerToNextDay={moveSingleCustomerToNextDay}
                            startJob={startJob}
                            cancelJobTimer={cancelJobTimer}
                            setSelectedCustomerForDone={setSelectedCustomerForDone}
                            setShowMarkDoneModal={setShowMarkDoneModal}
                            setCompletionMessage={setCompletionMessage}
                            setSelectedCustomer={setSelectedCustomer}
                            setShowAssignModal={setShowAssignModal}
                            unassignCustomer={unassignCustomer}
                            scratchCustomer={scratchCustomer}
                            removeCustomer={removeCustomer}
                            startEditingAddress={startEditingAddress}
                            cancelEditingAddress={cancelEditingAddress}
                            updateCustomerAddress={updateCustomerAddress}
                            addressInputRefs={addressInputRefs}
                            setEditingAddress={setEditingAddress}
                            startEditingNotes={startEditingNotes}
                            cancelEditingNotes={cancelEditingNotes}
                            handleNoteTextChange={handleNoteTextChange}
                            updateCustomerNotes={updateCustomerNotes}
                            startEditingSafetyNotes={startEditingSafetyNotes}
                            cancelEditingSafetyNotes={cancelEditingSafetyNotes}
                            updateCustomerSafetyNotes={updateCustomerSafetyNotes}
                            editingSafetyNotes={editingSafetyNotes}
                            // Delay props
                            setShowDelayModal={setShowDelayModal}
                            setSelectedCustomerForDelay={setSelectedCustomerForDelay}
                            setDelayMessage={setDelayMessage}
                            DELAY_TEMPLATES={DELAY_TEMPLATES}
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`text-center py-8 rounded-xl border-2 border-dashed transition-all ${
                          dragOverDay === day ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5'
                        }`}
                        onDragOver={(e) => handleDragOver(e, day)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day)}
                      >
                        <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                        <p className="text-xs text-gray-600">
                          {dragOverDay === day ? 'Drop customer here' : 'No customers scheduled'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* === MODALS === */}

        {/* Bulk Assign Modal */}
        {showBulkAssignModal && selectedCustomers.length > 0 && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1b23] rounded-2xl border border-white/10 max-w-lg w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">
                Assign {selectedCustomers.length} customers
              </h3>
              <div className="mb-4 p-3 bg-white/5 rounded-xl max-h-32 overflow-y-auto">
                {selectedCustomers.map(id => {
                  const c = unassignedCustomers.find(x => x.id === id);
                  return c ? (
                    <div key={id} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-300">{c.name}</span>
                      <span className="text-green-400 font-medium">${c.price}</span>
                    </div>
                  ) : null;
                })}
                <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-sm font-bold text-green-400">${selectedCustomers.reduce((s, id) => s + parseFloat(unassignedCustomers.find(c => c.id === id)?.price || 0), 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => assignMultipleCustomersToDay(selectedCustomers, day)}
                    className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-green-500/10 hover:border-green-500/30 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-white">{day}</span>
                      <span className="text-xs text-gray-500">{schedule[day]?.length || 0} → <span className="text-green-400 font-medium">{(schedule[day]?.length || 0) + selectedCustomers.length}</span></span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setShowBulkAssignModal(false); setSelectedCustomers([]); }}
                className="mt-4 w-full py-2.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Single Customer Assign Modal */}
        {showAssignModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1b23] rounded-2xl border border-white/10 max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">
                Assign {selectedCustomer.name}
              </h3>
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => assignCustomerToDay(selectedCustomer.id, day)}
                    className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-green-500/10 hover:border-green-500/30 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-white">{day}</span>
                      <span className="text-xs text-gray-500">{schedule[day]?.length || 0} customers</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedCustomer(null); }}
                className="mt-4 w-full py-2.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Smart Assignment Modal */}
        {showSmartAssignModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1b23] rounded-2xl border border-white/10 max-w-md w-full p-6 shadow-2xl text-center">
              <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-2xl bg-purple-500/20 text-2xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Assignment</h3>
              <p className="text-sm text-gray-400 mb-6">Optimizing schedule using Google Maps...</p>
              {smartAssignLoading && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                  <span className="text-sm text-gray-400">Calculating routes...</span>
                </div>
              )}
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Grouping customers by proximity</p>
                <p>• Minimizing travel distances</p>
                <p>• Balancing workload across days</p>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Done Modal */}
        {showMarkDoneModal && selectedCustomerForDone && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1b23] rounded-2xl border border-white/10 max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Mark as Done</h3>
                <button
                  onClick={() => { setShowMarkDoneModal(false); setSelectedCustomerForDone(null); setCompletionMessage(''); }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-white/5 rounded-xl">
                <p className="text-sm font-semibold text-white">{selectedCustomerForDone.name}</p>
                <p className="text-xs text-gray-400">{selectedCustomerForDone.service_type?.replace('_', ' ') || 'Service'} &bull; {selectedCustomerForDone.day}</p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Message to Customer</label>
                <textarea
                  value={completionMessage}
                  onChange={(e) => setCompletionMessage(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 placeholder-gray-600 resize-none"
                  placeholder="Enter a message..."
                />
              </div>

              <div className="mb-5 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="w-4 h-4 text-green-500 bg-white/5 border-white/20 rounded focus:ring-green-500/30" />
                  <span className="text-sm text-gray-400">Send Email to {selectedCustomerForDone.email || 'N/A'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendSMS} onChange={(e) => setSendSMS(e.target.checked)} className="w-4 h-4 text-green-500 bg-white/5 border-white/20 rounded focus:ring-green-500/30" />
                  <span className="text-sm text-gray-400">Send SMS to {selectedCustomerForDone.phone || 'N/A'}</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMarkCustomerAsDone}
                  disabled={markingDone}
                  className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {markingDone ? 'Processing...' : 'Mark Done & Send'}
                </button>
                <button
                  onClick={() => { setShowMarkDoneModal(false); setSelectedCustomerForDone(null); setCompletionMessage(''); }}
                  className="px-4 py-2.5 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === ADD NEW CUSTOMER MODAL === */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddCustomerModal(false)}>
            <div className="bg-[#0f1117] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white">Add New Customer</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Customer will appear on the schedule immediately</p>
                </div>
                <button onClick={() => setShowAddCustomerModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={newCustomerForm.name}
                    onChange={e => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50 placeholder-gray-600"
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={newCustomerForm.phone}
                      onChange={e => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(401) 000-0000"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      value={newCustomerForm.email}
                      onChange={e => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Address with Google Places */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    <MapPinIcon className="inline h-3 w-3 mr-1" />Address (Google Autocomplete)
                  </label>
                  <input
                    ref={newCustomerAddressRef}
                    type="text"
                    defaultValue={newCustomerForm.address}
                    onChange={e => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Start typing address..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50 placeholder-gray-600"
                  />
                </div>

                {/* Price + Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Price <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={newCustomerForm.price}
                        onChange={e => setNewCustomerForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50 placeholder-gray-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Frequency</label>
                    <select
                      value={newCustomerForm.frequency}
                      onChange={e => setNewCustomerForm(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Service Type + Scheduled Day */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Service Type</label>
                    <select
                      value={newCustomerForm.service_type}
                      onChange={e => setNewCustomerForm(prev => ({ ...prev, service_type: e.target.value }))}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50"
                    >
                      <option value="lawn_mowing">Lawn Mowing</option>
                      <option value="spring_cleanup">Spring Cleanup</option>
                      <option value="fall_cleanup">Fall Cleanup</option>
                      <option value="mulching">Mulching</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Assign to Day</label>
                    <select
                      value={newCustomerForm.scheduled_day}
                      onChange={e => setNewCustomerForm(prev => ({ ...prev, scheduled_day: e.target.value }))}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50"
                    >
                      <option value="">— Unassigned —</option>
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Visit Count */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Initial Visit Count</label>
                  <input
                    type="number"
                    value={newCustomerForm.service_count}
                    onChange={e => setNewCustomerForm(prev => ({ ...prev, service_count: e.target.value }))}
                    placeholder="0"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    value={newCustomerForm.notes}
                    onChange={e => setNewCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions..."
                    rows={2}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-green-500/50 placeholder-gray-600 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 border-t border-white/10">
                <button
                  onClick={addNewCustomer}
                  disabled={addingCustomer}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {addingCustomer ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span> Adding...</>
                  ) : (
                    <><PlusIcon className="h-4 w-4" /> Add Customer</>
                  )}
                </button>
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-5 py-3 bg-white/5 text-gray-400 rounded-2xl hover:bg-white/10 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* === VISIT SCHEDULING MODAL === */}
        {showVisitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl shadow-orange-500/10 overflow-hidden transform transition-all">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-2xl">
                      <ClockIcon className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Schedule Visit</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{selectedVisitApt?.customer_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowVisitModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Visit Date</label>
                    <input 
                      type="date" 
                      value={visitForm.date}
                      onChange={(e) => setVisitForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Visit Time</label>
                    <select 
                      value={visitForm.time}
                      onChange={(e) => setVisitForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {[
                        '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
                        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
                        '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
                        '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'
                      ].map(t => (
                        <option key={t} value={t} className="bg-[#1e293b] text-white">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                  <button
                    onClick={handleConfirmVisit}
                    disabled={schedulingVisit || !visitForm.date}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {schedulingVisit ? 'Processing...' : 'Confirm Schedule'}
                  </button>
                  <button
                    onClick={() => setShowVisitModal(false)}
                    className="w-full py-4 bg-white/5 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === MANUAL JOB MODAL === */}
        {showManualJobModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl shadow-blue-500/10 overflow-hidden transform transition-all">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                      {isEditingLead ? <PencilIcon className="h-6 w-6 text-blue-500" /> : <PlusIcon className="h-6 w-6 text-blue-500" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{isEditingLead ? 'Edit Job Details' : 'New Confirmed Job'}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{isEditingLead ? 'Update information for this project' : 'Add work directly to your pipeline'}</p>
                    </div>
                  </div>
                  <button onClick={() => {
                    setShowManualJobModal(false);
                    setIsEditingLead(false);
                  }} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Customer Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={manualJobForm.name}
                      onChange={(e) => setManualJobForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="(401) 000-0000"
                      value={manualJobForm.phone}
                      onChange={(e) => setManualJobForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      value={manualJobForm.email}
                      onChange={(e) => setManualJobForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Target Date</label>
                    <input 
                      type="date" 
                      value={manualJobForm.date}
                      onChange={(e) => setManualJobForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Job Status</label>
                    <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/10">
                      <button
                        onClick={() => setManualJobForm(prev => ({ ...prev, status: 'pending' }))}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          manualJobForm.status === 'pending'
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                            : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setManualJobForm(prev => ({ ...prev, status: 'confirmed' }))}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          manualJobForm.status === 'confirmed'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        Confirmed
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Service Address (Google Suggested)</label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input 
                        ref={manualJobAddressRef}
                        type="text" 
                        placeholder="Start typing address..."
                        value={manualJobForm.address}
                        onChange={(e) => setManualJobForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Job Notes / Instructions</label>
                    <textarea 
                      placeholder="Enter specific instructions for the crew..."
                      value={manualJobForm.notes}
                      onChange={(e) => setManualJobForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 ml-1">Select Services</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        'Lawn Mowing',
                        'Spring Cleanup',
                        'Mulch Installation',
                        'Fall Cleanup',
                        'Bush Trimming',
                        'Dethatching',
                        'Aeration',
                        'Fertilization',
                        'Pruning',
                        'Other'
                      ].map(service => (
                        <label 
                          key={service}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                            manualJobForm.services.includes(service)
                              ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-lg shadow-blue-500/5'
                              : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            manualJobForm.services.includes(service)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-white/20'
                          }`}>
                            {manualJobForm.services.includes(service) && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={manualJobForm.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setManualJobForm(prev => ({ ...prev, services: [...prev.services, service] }));
                              } else {
                                setManualJobForm(prev => ({ ...prev, services: prev.services.filter(s => s !== service) }));
                              }
                            }}
                          />
                          <span className="text-[11px] font-black uppercase tracking-wider">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                  <button
                    onClick={handleSaveManualJob}
                    disabled={savingManualJob}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {savingManualJob ? (isEditingLead ? 'Updating...' : 'Adding...') : (isEditingLead ? 'Save Changes' : 'Create Confirmed Job')}
                  </button>
                  <button
                    onClick={() => {
                      setShowManualJobModal(false);
                      setIsEditingLead(false);
                    }}
                    className="w-full py-4 bg-white/5 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === CONFIRM JOB MODAL === */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl shadow-blue-500/10 overflow-hidden transform transition-all">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                      <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Confirm Job</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{selectedConfirmApt?.customer_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowConfirmModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Work Date</label>
                    <input 
                      type="date" 
                      value={confirmForm.date}
                      onChange={(e) => setConfirmForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                    <p className="text-[10px] text-gray-600 mt-2 ml-1 italic">This will move the lead to the "Confirmed" tab with this date.</p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                  <button
                    onClick={handleSaveConfirmJob}
                    disabled={confirmingJob || !confirmForm.date}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {confirmingJob ? 'Confirming...' : 'Confirm & Set Date'}
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full py-4 bg-white/5 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* === SUCCESS MODAL === */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#1e293b] w-full max-w-sm rounded-[3rem] border border-white/10 shadow-2xl shadow-green-500/20 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/30">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Success!</h3>
                <p className="text-gray-400 text-sm font-medium mb-8">{successMessage}</p>
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 hover:shadow-green-500/40 active:scale-95 transition-all"
                >
                  Great!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === DELAY NOTIFICATION MODAL === */}
        {showDelayModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden transform transition-all">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Notify Delay</h3>
                    <p className="text-xs text-gray-500 mt-1">Select a reason to update {selectedCustomerForDelay?.name}</p>
                  </div>
                  <button onClick={() => setShowDelayModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Template Chips */}
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Delaying (Still coming)</label>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.rain(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('rain') ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        🌧️ RAIN
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.truck(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('truck') ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        🚛 TRUCK
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.equipment(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('equipment') ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        ⚙️ GEAR
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.late(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('behind') && !delayMessage.includes('tomorrow') && !delayMessage.includes('dark') ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        ⏱️ LATE
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Rescheduling / Skipping</label>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.nextDay(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('tomorrow') ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        📅 TOMORROW
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.daylight(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('dark') ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        🌑 DARK
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.skip(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('skip') ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        ⏭️ SKIP WEEK
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.emergency(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('emergency') ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        🚨 URGENT
                      </button>
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.holiday(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('holiday') ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        🎉 HOLIDAY
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Follow-up / Marketing</label>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDelayMessage(DELAY_TEMPLATES.review(selectedCustomerForDelay?.name))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${delayMessage.includes('review') ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        ⭐ REVIEW REQUEST
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Editor */}
                <div className="mb-8">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Message Preview</label>
                  <textarea
                    value={delayMessage}
                    onChange={(e) => setDelayMessage(e.target.value)}
                    className="w-full p-5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-gray-300 outline-none focus:border-orange-500/40 min-h-[150px] resize-none leading-relaxed"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDelayModal(false)}
                    className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendDelayNotification}
                    disabled={markingDone}
                    className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {markingDone ? 'Sending...' : 'Send Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Tracking Modal */}
        {showNavigationModal && selectedCustomerForNavigation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNavigationModal(false)}></div>
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-blue-900/20 p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <MapPinIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Start Route</h3>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Navigation & Tracking</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-center relative overflow-hidden">
                  {isFetchingLocation && (
                    <div className="absolute inset-0 bg-[#111]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Locating You...</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-400 mb-3">Estimated Driving Time</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <input 
                      type="number" 
                      value={manualTravelMins} 
                      onChange={(e) => setManualTravelMins(parseInt(e.target.value) || 0)}
                      className="w-24 bg-black/40 border border-blue-500/50 rounded-xl text-4xl font-black text-white text-center py-2 outline-none focus:border-blue-400 transition-colors"
                      min="0"
                    />
                    <span className="text-xl text-gray-400 font-bold">mins</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mt-4">Job timer will start automatically after arrival.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowNavigationModal(false)}
                    className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => startNavigationAndTracking(selectedCustomerForNavigation)}
                    className="flex-[2] py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Start Driving <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Preview Modal */}
      {showEmailModal && selectedEmailLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-8 border-b border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-2xl">
                    <EnvelopeIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Email Preview</h2>
                    <p className="text-sm text-gray-500">Sending to {selectedEmailLead.customer_name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Template Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      emailTemplate === key 
                        ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' 
                        : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {template.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Subject Line</label>
                <input 
                  type="text" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Email Body (Edit as needed)</label>
                <textarea 
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/10 bg-white/[0.02] flex gap-3">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={sendCustomEmail}
                disabled={sendingEmail}
                className="flex-[2] py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <EnvelopeIcon className="h-4 w-4" />
                )}
                {sendingEmail ? 'Sending...' : 'Send Email Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
        {showEditCustomerModal && editingCustomerData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditCustomerModal(false)}></div>
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-900/20 p-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Edit Customer</h3>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Update Profile</p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Name</label>
                    <input type="text" value={editingCustomerData.name} onChange={(e) => handleEditCustomerChange('name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Phone</label>
                      <input type="text" value={editingCustomerData.phone || ''} onChange={(e) => handleEditCustomerChange('phone', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Email</label>
                      <input type="email" value={editingCustomerData.email || ''} onChange={(e) => handleEditCustomerChange('email', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Price ($)</label>
                      <input type="number" value={editingCustomerData.price || ''} onChange={(e) => handleEditCustomerChange('price', parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Frequency</label>
                      <select value={editingCustomerData.frequency} onChange={(e) => handleEditCustomerChange('frequency', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none">
                        <option value="weekly" className="bg-gray-900">Weekly</option>
                        <option value="bi_weekly" className="bg-gray-900">Bi-Weekly</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Service Address</label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input 
                        ref={editCustomerAddressRef}
                        type="text" 
                        defaultValue={editingCustomerData.address || ''} 
                        onChange={(e) => handleEditCustomerChange('address', e.target.value)} 
                        placeholder="Start typing address..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Service Type</label>
                      <input type="text" value={editingCustomerData.service_type || ''} onChange={(e) => handleEditCustomerChange('service_type', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Visit Count</label>
                      <input type="number" value={editingCustomerData.service_count || 0} onChange={(e) => handleEditCustomerChange('service_count', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowEditCustomerModal(false)} className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSaveCustomerEdit} className="flex-[2] py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function CustomerCard({ 
  customer, 
  showAssignButton, 
  showUnassignButton, 
  showCheckbox, 
  onDragStart, 
  onDragEnd, 
  reorderCustomersInDay, 
  index, 
  day, 
  daySelectionHandler,
  // Props from parent state
  proximityData,
  activeJobTimers,
  completedCustomers,
  movedCustomers,
  selectedDayCustomers,
  selectedCustomers,
  draggedCustomer,
  newlyAddedIds,
  handleAddressClick,
  openEditCustomerModal,
  searchTerm,
  editingAddress,
  editingNotes,
  editingSafetyNotes, // New
  schedule,
  // Functions from parent
  highlightSearchTerm,
  toggleCustomerSelection,
  toggleCustomerCompletion,
  moveSingleCustomerToNextDay,
  startJob,
  cancelJobTimer,
  setSelectedCustomerForDone,
  setShowMarkDoneModal,
  setCompletionMessage,
  setSelectedCustomer,
  setShowAssignModal,
  unassignCustomer,
  scratchCustomer,
  removeCustomer,
  startEditingAddress,
  cancelEditingAddress,
  updateCustomerAddress,
  addressInputRefs,
  setEditingAddress,
  startEditingNotes,
  cancelEditingNotes,
  handleNoteTextChange,
  updateCustomerNotes,
  startEditingSafetyNotes, // New
  cancelEditingSafetyNotes, // New
  updateCustomerSafetyNotes, // New
  // Delay props
  setShowDelayModal,
  setSelectedCustomerForDelay,
  setDelayMessage,
  DELAY_TEMPLATES
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const proximity = proximityData[customer.id];
  // Determine distance and travel time - prioritize optimized route fields
  const distanceDisplay = customer.distance_to_next || (customer.distance_miles ? `${customer.distance_miles} mi` : proximity?.distanceText);
  const travelTimeDisplay = customer.travel_time_to_next || customer.travel_time || proximity?.durationText;
  const hasProximityData = !!(distanceDisplay || travelTimeDisplay);

  const handleDragOverCard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    
    // If we have a dragged customer and it's from the same day, handle reordering
    if (draggedCustomer && draggedCustomer.scheduled_day === customer.scheduled_day && reorderCustomersInDay && index !== undefined) {
      const draggedIndex = schedule[customer.scheduled_day]?.findIndex(c => c.id === draggedCustomer.id);
      if (draggedIndex !== -1 && draggedIndex !== index) {
        // Visual feedback for reordering
        e.dataTransfer.dropEffect = 'move';
      }
    }
  };

  const handleDragLeaveCard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDropOnCard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Handle reordering within the same day
    if (draggedCustomer && draggedCustomer.scheduled_day === customer.scheduled_day && reorderCustomersInDay && index !== undefined) {
      const draggedIndex = schedule[customer.scheduled_day]?.findIndex(c => c.id === draggedCustomer.id);
      if (draggedIndex !== -1 && draggedIndex !== index) {
        reorderCustomersInDay(customer.scheduled_day, draggedIndex, index);
      }
    }
  };

  const handleDragStartCard = (e) => {
    if (onDragStart) onDragStart(e, customer);
  };
  
  const isCompleted = day && completedCustomers[day]?.includes(customer.id);
  const isMoved = day && movedCustomers[day]?.includes(customer.id);
  const isSelected = day && daySelectionHandler ? selectedDayCustomers[day]?.includes(customer.id) : selectedCustomers.includes(customer.id);
  
  return (
    <div 
      className={`relative group rounded-2xl overflow-hidden transition-all duration-500 ${
        isCompleted ? 'bg-green-500/5 border border-green-500/20 shadow-lg shadow-green-500/5' 
        : isMoved ? 'bg-orange-500/5 border border-orange-500/20'
        : isSelected ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-500/20'
        : isDragOver ? 'bg-blue-500/15 border border-blue-500/40 scale-[1.02] shadow-2xl shadow-blue-500/20'
        : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/20'
      } ${draggedCustomer?.id === customer.id ? 'opacity-40 scale-95' : ''}`}
      draggable={true}
      onDragStart={handleDragStartCard}
      onDragOver={handleDragOverCard}
      onDragLeave={handleDragLeaveCard}
      onDrop={handleDropOnCard}
      onDragEnd={onDragEnd}
    >
      {/* Reorder indicator */}
      {isDragOver && draggedCustomer && draggedCustomer.scheduled_day === customer.scheduled_day && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
      )}

      {/* Floating Status Badges - Top Right */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {newlyAddedIds.has(customer.id) && (
          <span className="px-2 py-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black rounded-lg tracking-wider uppercase animate-bounce shadow-lg shadow-indigo-500/40">✦ New</span>
        )}
        {isCompleted && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-[9px] font-black rounded-lg tracking-wider uppercase shadow-lg shadow-green-500/30">
            <CheckBadgeIcon className="h-3 w-3" />
            <span>Done</span>
          </div>
        )}
        {isMoved && (
          <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-lg shadow-orange-500/30">→ Moved</span>
        )}
        {customer.job_started_at && activeJobTimers[customer.id] && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[9px] font-black rounded-lg shadow-lg shadow-purple-500/40 animate-pulse">
            <ClockIcon className="h-3 w-3" />
            <span>{activeJobTimers[customer.id]}</span>
          </div>
        )}
      </div>

      {/* Visit & Route Counter - Top Left Floating */}
      <div className="absolute top-3 left-3 flex gap-1 z-10 pointer-events-none">
        {customer.route_order && (
          <div className="w-5 h-5 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black rounded-lg shadow-sm">
            {customer.route_order}
          </div>
        )}
        <div className="px-1.5 py-0.5 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 text-[9px] font-black rounded-lg">
          V: {customer.service_count || 0}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="pt-9 pb-3.5 px-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start gap-4">
          {/* Checkbox Side */}
          {showCheckbox && (
            <div 
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                if (day && daySelectionHandler) daySelectionHandler(day, customer.id);
                else toggleCustomerSelection(customer.id, e);
              }}
              className="mt-1"
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30' : 'border-white/10 hover:border-white/30'
              }`}>
                {isSelected && <CheckIcon className="h-4 w-4 text-white font-black" />}
              </div>
            </div>
          )}

          {/* Core Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <h3 className={`text-base font-black tracking-tight truncate ${isCompleted ? 'text-gray-500' : 'text-white'}`}>
                {highlightSearchTerm(customer.name, searchTerm)}
              </h3>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">${customer.price}</span>
                {customer.last_job_duration_minutes && isCompleted && (
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{customer.last_job_duration_minutes}m</span>
                )}
              </div>
            </div>
            
            {/* Metadata Row - Organized Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {customer.address && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddressClick(customer);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg text-[10px] text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-500/20 group/addr"
                >
                  <MapPinIcon className="h-3 w-3 text-gray-600 group-hover/addr:text-blue-400" />
                  <span className="truncate max-w-[150px]">{customer.address.split(',')[0]}</span>
                </button>
              )}

              <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                customer.frequency === 'weekly' 
                  ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                  : 'bg-cyan-500/5 text-cyan-400 border-cyan-500/20'
              }`}>
                {customer.frequency === 'bi_weekly' ? 'Bi-Weekly' : 'Weekly'}
              </div>

              {hasProximityData && (distanceDisplay || travelTimeDisplay) && (
                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-gray-500">
                  {distanceDisplay && <span>{distanceDisplay}</span>}
                  {travelTimeDisplay && (
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                      {travelTimeDisplay}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {day && !isCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleCustomerCompletion(day, customer.id); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/20 shadow-lg shadow-green-500/5"
                title="Complete"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </button>
            )}
            <div className={`p-1.5 rounded-lg bg-white/5 text-gray-600 transition-all group-hover:text-gray-400 ${isExpanded ? 'rotate-180 bg-blue-500/10 text-blue-400' : ''}`}>
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-white/5 px-3.5 py-3 space-y-3">
          {/* Contact row */}
          <div className="flex items-center gap-4 text-xs">
            <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition-colors" onClick={(e) => e.stopPropagation()}>
              <PhoneIcon className="h-3.5 w-3.5" />{customer.phone}
            </a>
            {customer.email && (
              <span className="text-gray-600 truncate">{customer.email}</span>
            )}
          </div>

          {/* Full address — click to edit with Google Places */}
          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
            {editingAddress[customer.id] !== undefined ? (
              <div className="space-y-2">
                <input
                  ref={el => addressInputRefs.current[customer.id] = el}
                  type="text"
                  defaultValue={editingAddress[customer.id]}
                  onChange={(e) => setEditingAddress(prev => ({ ...prev, [customer.id]: e.target.value }))}
                  placeholder="Start typing address..."
                  className="w-full p-2 bg-white/5 border border-blue-500/30 rounded-xl text-xs text-gray-300 outline-none focus:border-blue-400/60 placeholder-gray-600"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => cancelEditingAddress(customer.id)} className="px-3 py-1 text-xs text-gray-500 hover:text-white transition-colors">Cancel</button>
                  <button
                    onClick={() => updateCustomerAddress(customer.id, addressInputRefs.current[customer.id]?.value || editingAddress[customer.id])}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-all"
                  >Save</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => startEditingAddress(customer)}
                className="flex items-center gap-1.5 cursor-pointer group/addr"
              >
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-600 group-hover/addr:text-blue-400 transition-colors" />
                <span className="text-xs text-gray-500 group-hover/addr:text-blue-400 transition-colors">
                  {customer.address || <span className="italic text-gray-700">Click to add address...</span>}
                </span>
                <PencilIcon className="h-3 w-3 text-gray-700 opacity-0 group-hover/addr:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>

          {/* Safety Alert Section */}
          {editingSafetyNotes[customer.id] !== undefined ? (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Editing Safety Alert</span>
              </div>
              <textarea
                value={editingSafetyNotes[customer.id]}
                onChange={(e) => startEditingSafetyNotes(customer.id, e.target.value)}
                placeholder="E.g., Watch out for the dog, Gate code 1234..."
                className="w-full p-2.5 bg-white/5 border border-red-500/30 rounded-xl text-xs text-white outline-none focus:border-red-400 placeholder-red-900/50 resize-none"
                rows="2"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => cancelEditingSafetyNotes(customer.id)} className="px-3 py-1 text-xs text-gray-500 hover:text-white transition-colors">Cancel</button>
                <button onClick={() => updateCustomerSafetyNotes(customer.id, editingSafetyNotes[customer.id])} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all">Save Alert</button>
              </div>
            </div>
          ) : (
            <div 
              onClick={(e) => { e.stopPropagation(); startEditingSafetyNotes(customer); }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                customer.safety_notes 
                  ? 'bg-red-500/10 border-red-500/30 animate-pulse-subtle' 
                  : 'bg-white/[0.02] border-white/5 border-dashed hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircleIcon className={`h-4 w-4 ${customer.safety_notes ? 'text-red-500' : 'text-gray-600'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${customer.safety_notes ? 'text-red-500' : 'text-gray-600'}`}>
                  Safety Alerts
                </span>
              </div>
              {customer.safety_notes ? (
                <p className="text-xs text-white font-bold">{customer.safety_notes}</p>
              ) : (
                <p className="text-[10px] text-gray-600 italic">No safety alerts. Tap to add (dogs, codes, etc)...</p>
              )}
            </div>
          )}

          {/* Route details */}
          {customer.route_order && customer.travel_time_to_next && (
            <div className="text-xs text-purple-400 flex items-center gap-2">
              <span>→ {customer.travel_time_to_next} to next</span>
              {customer.distance_to_next && <span className="text-gray-600">({customer.distance_to_next})</span>}
            </div>
          )}

          {/* Notes */}
          <div className="pt-1">
            {editingNotes[customer.id] !== undefined ? (
              <div className="space-y-2">
                <textarea
                  value={editingNotes[customer.id]}
                  onChange={(e) => handleNoteTextChange(customer.id, e.target.value)}
                  placeholder="Add notes..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 outline-none focus:border-green-500/40 placeholder-gray-600 resize-none"
                  rows="2"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => cancelEditingNotes(customer.id)} className="px-3 py-1 text-xs text-gray-500 hover:text-white transition-colors">Cancel</button>
                  <button onClick={() => updateCustomerNotes(customer.id, editingNotes[customer.id])} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-all">Save</button>
                </div>
              </div>
            ) : (
              <div 
                onClick={(e) => { e.stopPropagation(); startEditingNotes(customer); }}
                className="cursor-pointer p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all"
              >
                {customer.notes ? (
                  <p className="text-xs text-gray-400">{highlightSearchTerm(customer.notes, searchTerm)}</p>
                ) : (
                  <p className="text-xs text-gray-600 italic">Tap to add notes...</p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {day && !isCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); moveSingleCustomerToNextDay(day, customer.id); }}
                className="px-3 py-1.5 text-[11px] font-medium text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-all flex items-center gap-1"
                title="Move to next day"
              >
                <span>Move to Next Day →</span>
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); openEditCustomerModal(customer); }} className="px-3 py-1.5 text-[11px] font-medium text-gray-300 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
              ✏️ Edit Customer
            </button>
            {day && isCompleted && (
              <button onClick={(e) => { e.stopPropagation(); toggleCustomerCompletion(day, customer.id); }} className="px-3 py-1.5 text-[11px] font-medium text-green-400 bg-green-500/10 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-all">
                ↩ Undo Complete
              </button>
            )}
            {day && !isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCustomerForDone({ ...customer, day });
                  setCompletionMessage(`Your ${customer.service_type?.replace('_', ' ') || 'service'} has been completed successfully! Thank you for choosing Flora Lawn and Landscaping.`);
                  setShowMarkDoneModal(true);
                }}
                className="px-3 py-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1"
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Mark Done {activeJobTimers[customer.id] ? `(${activeJobTimers[customer.id]})` : ''}
              </button>
            )}
            {day && !isCompleted && !customer.job_started_at && (
              <button
                onClick={(e) => { e.stopPropagation(); startJob(customer.id); }}
                className="px-3 py-1.5 text-[11px] font-medium text-purple-400 bg-purple-500/10 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1"
              >
                <PlayIcon className="h-3.5 w-3.5" />Start Job
              </button>
            )}
            {customer.job_started_at && (
              <button
                onClick={(e) => { e.stopPropagation(); cancelJobTimer(customer.id); }}
                className="px-3 py-1.5 text-[11px] font-medium text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1"
              >
                <XMarkIcon className="h-3.5 w-3.5" />Cancel Timer
              </button>
            )}
            {showAssignButton && (
              <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setShowAssignModal(true); }}
                className="px-3 py-1.5 text-[11px] font-medium text-green-400 bg-green-500/10 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-all flex items-center gap-1">
                <PlusIcon className="h-3.5 w-3.5" />Assign
              </button>
            )}
            {showUnassignButton && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setShowAssignModal(true); }}
                  className="px-3 py-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1">
                  <PencilIcon className="h-3.5 w-3.5" />Reassign
                </button>
                <button onClick={(e) => { e.stopPropagation(); unassignCustomer(customer.id); }}
                  className="px-3 py-1.5 text-[11px] font-medium text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                  Remove
                </button>
              </>
            )}
            {(showAssignButton || showUnassignButton) && (
              <>
                <button onClick={(e) => { e.stopPropagation(); scratchCustomer(customer.id, customer.name); }}
                  className="px-3 py-1.5 text-[11px] font-medium text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1">
                  ✕ Scratch
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeCustomer(customer.id, customer.name); }}
                  className="px-3 py-1.5 text-[11px] font-medium text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1">
                  🗑 Delete
                </button>
                <button onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedCustomerForDelay(customer);
                  setDelayMessage(DELAY_TEMPLATES.rain(customer.name));
                  setShowDelayModal(true);
                }}
                  className="px-3 py-1.5 text-[11px] font-medium text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-all flex items-center gap-1">
                  ⚠️ Notify Delay
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
