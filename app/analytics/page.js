'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays } from 'date-fns';

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [analytics, setAnalytics] = useState({
    error: null,
    leads: {
      currentMonth: 0,
      previousMonth: 0,
      total: 0,
      byMonth: [],
      bestMonth: null,
      worstMonth: null,
      byCity: [],
      pendingFollowUp: []
    },
    revenue: {
      total: 0,
      monthly: 0,
      averageCustomerValue: 0,
      byServiceType: [],
      growthRate: 0
    },
    customers: {
      total: 0,
      active: 0,
      pending: 0,
      cancelled: 0,
      byMonth: [],
      byCity: [],
      retentionRate: 0,
      churnRate: 0,
      averageLifetime: 0,
      repeatRate: 0,
      pendingToConvert: []
    },
    phoneNumbers: {
      total: 0,
      withSmsConsent: 0,
      withoutSmsConsent: 0
    },
    emailSubscribers: {
      total: 0,
      active: 0,
      unsubscribed: 0,
      byMonth: [],
      recentUnsubscribes: []
    },
    locations: {
      topCities: [],
      bestPerforming: []
    },
    seasonal: {
      trends: []
    }
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, selectedMonth]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Fetch user role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const role = profile?.role;
      setUserRole(role);
      
      // Only allow admin access
      if (role !== 'admin') {
        router.push('/');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const currentMonthStart = startOfMonth(selectedMonth);
      const currentMonthEnd = endOfMonth(selectedMonth);
      const previousMonthStart = startOfMonth(subMonths(selectedMonth, 1));
      const previousMonthEnd = endOfMonth(subMonths(selectedMonth, 1));

      // Fetch email subscriber leads
      const { data: emailSubscriberLeads, error: emailLeadsError } = await supabaseAdmin
        .from('email_subscribers')
        .select('id, name, email, created_at, sms_consent, phone, is_active, city, unsubscribed_at')
        .order('created_at', { ascending: false });

      if (emailLeadsError) {
        console.error('Error fetching email subscriber leads:', emailLeadsError);
        throw emailLeadsError;
      }

      // Fetch contact form leads from appointments table
      const { data: appointmentLeads, error: appointmentLeadsError } = await supabaseAdmin
        .from('appointments')
        .select('id, customer_name, customer_email, customer_phone, created_at, city, street_address, booking_type, status')
        .or('booking_type.eq.Ready to Hire,booking_type.eq.Contract Request')
        .order('created_at', { ascending: false });

      if (appointmentLeadsError) {
        console.error('Error fetching appointment leads:', appointmentLeadsError);
        // Don't throw - continue with email subscribers only
      }

      // Map appointment leads to match email subscriber lead structure
      const mappedAppointmentLeads = (appointmentLeads || []).map(apt => ({
        id: apt.id,
        name: apt.customer_name || 'Unknown',
        email: apt.customer_email || null,
        phone: apt.customer_phone || null,
        created_at: apt.created_at,
        city: apt.city || null,
        sms_consent: false, // Default to false for contact form leads
        is_active: apt.status === 'pending' || apt.status === 'confirmed' ? true : false,
        unsubscribed_at: null,
        source: 'contact_form' // Track source
      }));

      // Only use contact form leads for total leads count (not email subscribers)
      const allLeads = mappedAppointmentLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest first

      // Keep email subscribers separate for email subscriber stats only
      const emailSubscriberLeadsOnly = (emailSubscriberLeads || []).map(lead => ({ ...lead, source: 'email_subscriber' }));

      console.log('Fetched email subscriber leads:', emailSubscriberLeads?.length || 0);
      console.log('Fetched contact form leads:', appointmentLeads?.length || 0);
      console.log('Total leads (contact forms only):', allLeads?.length || 0);

      // Fetch customers with full details
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('customers')
        .select('id, name, email, phone, address, status, created_at, price, service_type, frequency, last_service')
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        throw customersError;
      }

      console.log('Fetched customers:', customers?.length || 0, customers);

      // Calculate current month leads
      const currentMonthLeads = allLeads?.filter(l => {
        const date = parseISO(l.created_at);
        return date >= currentMonthStart && date <= currentMonthEnd;
      }) || [];

      // Calculate previous month leads
      const previousMonthLeads = allLeads?.filter(l => {
        const date = parseISO(l.created_at);
        return date >= previousMonthStart && date <= previousMonthEnd;
      }) || [];

      // Calculate leads by month (last 12 months)
      const leadsByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthLeads = allLeads?.filter(l => {
          const date = parseISO(l.created_at);
          return date >= monthStart && date <= monthEnd;
        }) || [];
        leadsByMonth.push({
          month: format(monthStart, 'MMM yyyy'),
          count: monthLeads.length
        });
      }

      // Find best/worst months
      const bestMonth = leadsByMonth.reduce((max, m) => m.count > max.count ? m : max, leadsByMonth[0] || {});
      const worstMonth = leadsByMonth.reduce((min, m) => m.count < min.count ? m : min, leadsByMonth[0] || {});

      // Calculate leads by city
      const leadsByCity = {};
      allLeads?.forEach(lead => {
        if (lead.city) {
          leadsByCity[lead.city] = (leadsByCity[lead.city] || 0) + 1;
        }
      });
      const leadsByCityArray = Object.entries(leadsByCity)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Pending leads (contact form leads with no customer match, sorted by oldest first)
      const pendingLeads = (allLeads || []).filter(lead => {
        // Check if email exists in customers
        const hasCustomer = (customers || []).some(c => {
          const customerEmail = c.email?.toLowerCase()?.trim();
          const leadEmail = lead.email?.toLowerCase()?.trim();
          return customerEmail && leadEmail && customerEmail === leadEmail;
        });
        
        // Only include contact form leads that haven't been converted to customers
        return !hasCustomer;
      })
      .sort((a, b) => {
        // Sort by oldest first (most urgent to follow up)
        return parseISO(a.created_at) - parseISO(b.created_at);
      })
      .slice(0, 20); // Show up to 20 pending leads

      console.log('Pending leads count:', pendingLeads.length);
      console.log('Pending leads:', pendingLeads);

      // Calculate revenue metrics
      const activeCustomers = customers?.filter(c => c.status === 'active') || [];
      const totalRevenue = activeCustomers.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
      const monthlyRevenue = activeCustomers.reduce((sum, c) => {
        const price = parseFloat(c.price) || 0;
        // Calculate monthly revenue based on frequency
        if (c.frequency === 'weekly') return sum + (price * 4);
        if (c.frequency === 'bi_weekly') return sum + (price * 2);
        if (c.frequency === 'monthly') return sum + price;
        if (c.frequency === 'seasonal') return sum + (price / 3); // Approximate
        return sum + price;
      }, 0);
      const averageCustomerValue = activeCustomers.length > 0 ? monthlyRevenue / activeCustomers.length : 0;

      // Revenue by service type
      const revenueByService = {};
      activeCustomers.forEach(c => {
        const price = parseFloat(c.price) || 0;
        const monthlyPrice = c.frequency === 'weekly' ? price * 4 : 
                           c.frequency === 'bi_weekly' ? price * 2 :
                           c.frequency === 'monthly' ? price :
                           c.frequency === 'seasonal' ? price / 3 : price;
        revenueByService[c.service_type] = (revenueByService[c.service_type] || 0) + monthlyPrice;
      });
      const revenueByServiceArray = Object.entries(revenueByService)
        .map(([service, revenue]) => ({ service, revenue: Math.round(revenue) }))
        .sort((a, b) => b.revenue - a.revenue);

      // Calculate revenue growth
      const currentMonthRevenue = activeCustomers.filter(c => {
        const date = parseISO(c.created_at);
        return date >= currentMonthStart && date <= currentMonthEnd;
      }).reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
      const previousMonthRevenue = activeCustomers.filter(c => {
        const date = parseISO(c.created_at);
        return date >= previousMonthStart && date <= previousMonthEnd;
      }).reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
        : currentMonthRevenue > 0 ? 100 : 0;

      // Customers by city (extract from address field)
      const customersByCity = {};
      customers?.forEach(customer => {
        // Try to extract city from address field (format: "123 Main St, City, RI 02903")
        if (customer.address) {
          const addressParts = customer.address.split(',');
          if (addressParts.length >= 2) {
            const city = addressParts[1]?.trim();
            if (city) {
              customersByCity[city] = (customersByCity[city] || 0) + 1;
            }
          }
        }
      });
      const customersByCityArray = Object.entries(customersByCity)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Best performing locations (combine leads + customers)
      const locationPerformance = {};
      leadsByCityArray.forEach(({ city, count }) => {
        locationPerformance[city] = { leads: count, customers: 0 };
      });
      customersByCityArray.forEach(({ city, count }) => {
        if (!locationPerformance[city]) {
          locationPerformance[city] = { leads: 0, customers: count };
        } else {
          locationPerformance[city].customers = count;
        }
      });
      const bestPerformingLocations = Object.entries(locationPerformance)
        .map(([city, data]) => ({
          city,
          leads: data.leads,
          customers: data.customers,
          score: data.leads + (data.customers * 2) // Weight customers more
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Customer retention rate
      const totalCustomersEver = customers?.length || 0;
      const activeCustomersCount = customers?.filter(c => c.status === 'active').length || 0;
      const retentionRate = totalCustomersEver > 0 
        ? ((activeCustomersCount / totalCustomersEver) * 100).toFixed(1)
        : 0;

      // Churn rate (cancelled customers)
      const cancelledCustomers = customers?.filter(c => c.status === 'cancelled').length || 0;
      const churnRate = totalCustomersEver > 0
        ? ((cancelledCustomers / totalCustomersEver) * 100).toFixed(1)
        : 0;

      // Average customer lifetime (days since creation for active customers)
      const customerLifetimes = activeCustomers.map(c => {
        const created = parseISO(c.created_at);
        return differenceInDays(new Date(), created);
      });
      const averageLifetime = customerLifetimes.length > 0
        ? Math.round(customerLifetimes.reduce((sum, days) => sum + days, 0) / customerLifetimes.length)
        : 0;

      // Repeat customer rate (customers with last_service date)
      const repeatCustomers = activeCustomers.filter(c => c.last_service).length;
      const repeatRate = activeCustomers.length > 0
        ? ((repeatCustomers / activeCustomers.length) * 100).toFixed(1)
        : 0;

      // Customers by month
      const customersByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthCustomers = customers?.filter(c => {
          const date = parseISO(c.created_at);
          return date >= monthStart && date <= monthEnd;
        }) || [];
        customersByMonth.push({
          month: format(monthStart, 'MMM yyyy'),
          count: monthCustomers.length
        });
      }

      // Pending customers to convert
      const pendingToConvert = customers?.filter(c => c.status === 'pending')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10) || [];

      // Phone stats (from contact form leads only)
      const phoneStats = allLeads?.filter(l => l.phone) || [];
      const phonesWithSmsConsent = phoneStats.filter(p => p.sms_consent === true).length;

      // Email subscribers stats (only from email_subscribers table, separate from leads)
      const activeSubscribers = emailSubscriberLeadsOnly.filter(e => e.is_active === true).length || 0;
      const unsubscribed = emailSubscriberLeadsOnly.filter(e => e.is_active === false).length || 0;

      // Recent unsubscribes (last 30 days) - only email subscribers
      const recentUnsubscribes = emailSubscriberLeadsOnly.filter(l => {
        if (!l.unsubscribed_at || l.is_active) return false;
        const unsubDate = parseISO(l.unsubscribed_at);
        return differenceInDays(new Date(), unsubDate) <= 30;
      }).slice(0, 10) || [];

      // Email subscribers by month (only email subscribers)
      const subscribersByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthSubscribers = emailSubscriberLeadsOnly.filter(l => {
          const date = parseISO(l.created_at);
          return date >= monthStart && date <= monthEnd;
        }) || [];
        subscribersByMonth.push({
          month: format(monthStart, 'MMM yyyy'),
          count: monthSubscribers.length
        });
      }

      // Seasonal trends (group by season)
      const seasonalData = {
        Spring: { months: ['Mar', 'Apr', 'May'], leads: 0, customers: 0 },
        Summer: { months: ['Jun', 'Jul', 'Aug'], leads: 0, customers: 0 },
        Fall: { months: ['Sep', 'Oct', 'Nov'], leads: 0, customers: 0 },
        Winter: { months: ['Dec', 'Jan', 'Feb'], leads: 0, customers: 0 }
      };

      leadsByMonth.forEach(({ month, count }) => {
        const monthAbbr = month.split(' ')[0];
        Object.keys(seasonalData).forEach(season => {
          if (seasonalData[season].months.includes(monthAbbr)) {
            seasonalData[season].leads += count;
          }
        });
      });

      customersByMonth.forEach(({ month, count }) => {
        const monthAbbr = month.split(' ')[0];
        Object.keys(seasonalData).forEach(season => {
          if (seasonalData[season].months.includes(monthAbbr)) {
            seasonalData[season].customers += count;
          }
        });
      });

      const seasonalTrends = Object.entries(seasonalData).map(([season, data]) => ({
        season,
        leads: data.leads,
        customers: data.customers
      }));

      // Calculate growth rates
      const leadsGrowth = previousMonthLeads.length > 0
        ? ((currentMonthLeads.length - previousMonthLeads.length) / previousMonthLeads.length * 100).toFixed(1)
        : currentMonthLeads.length > 0 ? 100 : 0;

      const customersGrowth = customersByMonth.length >= 2
        ? ((customersByMonth[customersByMonth.length - 1].count - customersByMonth[customersByMonth.length - 2].count) / 
           (customersByMonth[customersByMonth.length - 2].count || 1) * 100).toFixed(1)
        : 0;

      setAnalytics({
        leads: {
          currentMonth: currentMonthLeads.length,
          previousMonth: previousMonthLeads.length,
          total: allLeads?.length || 0,
          byMonth: leadsByMonth,
          bestMonth,
          worstMonth,
          byCity: leadsByCityArray,
          pendingFollowUp: pendingLeads
        },
        revenue: {
          total: Math.round(totalRevenue),
          monthly: Math.round(monthlyRevenue),
          averageCustomerValue: Math.round(averageCustomerValue),
          byServiceType: revenueByServiceArray,
          growthRate: parseFloat(revenueGrowth)
        },
        customers: {
          total: customers?.length || 0,
          active: activeCustomers.length,
          pending: customers?.filter(c => c.status === 'pending').length || 0,
          cancelled: cancelledCustomers,
          byMonth: customersByMonth,
          byCity: customersByCityArray,
          retentionRate: parseFloat(retentionRate),
          churnRate: parseFloat(churnRate),
          averageLifetime,
          repeatRate: parseFloat(repeatRate),
          pendingToConvert
        },
        phoneNumbers: {
          total: phoneStats.length,
          withSmsConsent: phonesWithSmsConsent,
          withoutSmsConsent: phoneStats.length - phonesWithSmsConsent
        },
        emailSubscribers: {
          total: emailSubscriberLeadsOnly?.length || 0,
          active: activeSubscribers,
          unsubscribed,
          byMonth: subscribersByMonth,
          recentUnsubscribes
        },
        locations: {
          topCities: leadsByCityArray,
          bestPerforming: bestPerformingLocations
        },
        seasonal: {
          trends: seasonalTrends
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      // Set error state to display to user
      setAnalytics(prev => ({
        ...prev,
        error: error.message || 'Failed to load analytics data'
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatServiceType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'green' }) => {
    const isPositive = trendValue >= 0;
    const colorClasses = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600'
    };
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{Math.abs(trendValue)}%</span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="ml-4">
              <div className={`rounded-full p-3 ${colorClasses[color]}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const leadsGrowth = analytics.leads.previousMonth > 0
    ? ((analytics.leads.currentMonth - analytics.leads.previousMonth) / analytics.leads.previousMonth * 100).toFixed(1)
    : analytics.leads.currentMonth > 0 ? 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Business insights and metrics</p>
              {analytics.error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {analytics.error}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="month"
                value={format(selectedMonth, 'yyyy-MM')}
                onChange={(e) => setSelectedMonth(parseISO(e.target.value + '-01'))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Leads"
            value={analytics.leads.total.toLocaleString()}
            subtitle={`${analytics.leads.currentMonth} this month`}
            icon={ChartBarIcon}
            trend={parseFloat(leadsGrowth) >= 0}
            trendValue={parseFloat(leadsGrowth)}
            color="green"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(analytics.revenue.monthly)}
            subtitle={`Avg: ${formatCurrency(analytics.revenue.averageCustomerValue)}/customer`}
            icon={CurrencyDollarIcon}
            trend={analytics.revenue.growthRate >= 0}
            trendValue={analytics.revenue.growthRate}
            color="blue"
          />
          <StatCard
            title="Total Customers"
            value={analytics.customers.total.toLocaleString()}
            subtitle={`${analytics.customers.active} active, ${analytics.customers.pending} pending`}
            icon={UserGroupIcon}
            color="purple"
          />
          <StatCard
            title="Retention Rate"
            value={`${analytics.customers.retentionRate}%`}
            subtitle={`Churn: ${analytics.customers.churnRate}%`}
            icon={CheckCircleIcon}
            color="green"
          />
        </div>

        {/* Revenue & Service Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Service Type */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Service Type</h2>
            <div className="space-y-3">
              {analytics.revenue.byServiceType.length > 0 ? (
                analytics.revenue.byServiceType.map((item, index) => {
                  const maxRevenue = Math.max(...analytics.revenue.byServiceType.map(s => s.revenue));
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{formatServiceType(item.service)}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-20 text-right">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No revenue data available</p>
              )}
            </div>
          </div>

          {/* Average Customer Value */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Metrics</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Average Customer Value</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(analytics.revenue.averageCustomerValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Monthly revenue per customer</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.customers.repeatRate}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Avg Lifetime</p>
                  <p className="text-2xl font-bold text-gray-600">{analytics.customers.averageLifetime}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Cities - Leads */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Cities - Leads</h2>
            <div className="space-y-3">
              {analytics.locations.topCities.length > 0 ? (
                analytics.locations.topCities.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{item.city}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.count} leads</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No city data available</p>
              )}
            </div>
          </div>

          {/* Top Cities - Customers */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Cities - Customers</h2>
            <div className="space-y-3">
              {analytics.customers.byCity.length > 0 ? (
                analytics.customers.byCity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{item.city}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.count} customers</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No city data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Best Performing Locations */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Best Performing Locations</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.locations.bestPerforming.map((location, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{location.city}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{location.leads}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{location.customers}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">{location.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Seasonal Trends</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.seasonal.trends.map((season, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-gray-600 mb-2">{season.season}</p>
                <p className="text-2xl font-bold text-gray-900">{season.leads}</p>
                <p className="text-xs text-gray-500">leads</p>
                <p className="text-lg font-semibold text-green-700 mt-1">{season.customers}</p>
                <p className="text-xs text-gray-500">customers</p>
              </div>
            ))}
          </div>
        </div>

        {/* Best/Worst Months */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ArrowUpIcon className="h-5 w-5 text-green-600 mr-2" />
              Best Month for Leads
            </h2>
            {analytics.leads.bestMonth && (
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-green-600">{analytics.leads.bestMonth.month}</p>
                <p className="text-lg text-gray-600 mt-2">{analytics.leads.bestMonth.count} leads</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ArrowDownIcon className="h-5 w-5 text-red-600 mr-2" />
              Worst Month for Leads
            </h2>
            {analytics.leads.worstMonth && (
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-red-600">{analytics.leads.worstMonth.month}</p>
                <p className="text-lg text-gray-600 mt-2">{analytics.leads.worstMonth.count} leads</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Leads */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                Pending Leads
              </h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                {analytics.leads.pendingFollowUp.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.leads.pendingFollowUp.length > 0 ? (
                analytics.leads.pendingFollowUp.map((lead, index) => (
                  <Link 
                    key={lead.id || index} 
                    href={`/customers?search=${encodeURIComponent(lead.email || '')}`}
                    className="block p-2 bg-yellow-50 rounded text-sm hover:bg-yellow-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{lead.name || lead.email || 'No name/email'}</p>
                    <p className="text-xs text-gray-500">{lead.email}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(lead.created_at), 'MMM d, yyyy')}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">No pending leads</p>
              )}
            </div>
          </div>

          {/* Pending Customers */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                Pending to Convert
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                {analytics.customers.pendingToConvert.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.customers.pendingToConvert.length > 0 ? (
                analytics.customers.pendingToConvert.map((customer, index) => (
                  <Link key={index} href="/customers" className="block p-2 bg-blue-50 rounded text-sm hover:bg-blue-100">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.service_type} • {formatCurrency(customer.price)}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">No pending customers</p>
              )}
            </div>
          </div>

          {/* Recent Unsubscribes */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                Recent Unsubscribes
              </h2>
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                {analytics.emailSubscribers.recentUnsubscribes.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.emailSubscribers.recentUnsubscribes.length > 0 ? (
                analytics.emailSubscribers.recentUnsubscribes.map((subscriber, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded text-sm">
                    <p className="font-medium text-gray-900">{subscriber.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">
                      {subscriber.unsubscribed_at ? format(parseISO(subscriber.unsubscribed_at), 'MMM d, yyyy') : 'Unknown'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent unsubscribes</p>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Leads by Month */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leads by Month</h2>
            <div className="space-y-3">
              {analytics.leads.byMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(item.count / Math.max(...analytics.leads.byMonth.map(m => m.count), 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customers by Month */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customers by Month</h2>
            <div className="space-y-3">
              {analytics.customers.byMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(item.count / Math.max(...analytics.customers.byMonth.map(m => m.count), 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Subscribers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.leads.byMonth.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.emailSubscribers.byMonth[index]?.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.customers.byMonth[index]?.count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
