'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/app/admin/error-boundary';
import '@/lib/error-handler';
import { format, parseISO } from 'date-fns';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

function WorkRequestsContent() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workRequests, setWorkRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('in_progress'); // Default to in-progress
  const [serviceFilter, setServiceFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWorkRequests();
    }
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, serviceFilter, workRequests]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Fetch user role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      const role = profile?.role;

      // Only allow admin access
      if (role !== 'admin') {
        router.push('/');
        return;
      }

      setUser(currentUser);
      setUserRole(role);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch all appointments with status 'confirmed' or 'in_progress'
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .in('status', ['confirmed', 'in_progress'])
        .order('date', { ascending: true });

      if (error) throw error;

      setWorkRequests(data || []);
      setFilteredRequests(data || []);
    } catch (error) {
      console.error('Error fetching work requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = workRequests.filter(request => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        request.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.city?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

      // Service filter
      const matchesService = serviceFilter === 'all' || request.service_type === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });

    setFilteredRequests(filtered);
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      // Get the appointment details before updating
      const { data: appointment } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Update appointment status
      const { error } = await supabaseAdmin
        .from('appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If marking as completed, create completed_job record and award loyalty points
      if (newStatus === 'completed') {
        try {
          // Find customer by email or phone to get customer_id
          let customerId = appointment.customer_id;
          let customer = null;

          if (!customerId && (appointment.customer_email || appointment.customer_phone)) {
            let query = supabaseAdmin
              .from('customers')
              .select('id, user_id, price');
            
            if (appointment.customer_email) {
              query = query.eq('email', appointment.customer_email);
            } else if (appointment.customer_phone) {
              query = query.eq('phone', appointment.customer_phone);
            }
            
            const { data: customers } = await query.limit(1).maybeSingle();
            
            if (customers) {
              customer = customers;
              customerId = customers.id;
            }
          } else if (customerId) {
            const { data: cust } = await supabaseAdmin
              .from('customers')
              .select('id, user_id, price')
              .eq('id', customerId)
              .single();
            customer = cust;
          }

          // Get customer price or default amount
          const amountDue = customer?.price || 0;

          // Create completed_job record
          const { error: jobError } = await supabaseAdmin
            .from('completed_jobs')
            .insert({
              appointment_id: appointment.id,
              customer_id: customerId || null,
              customer_name: appointment.customer_name,
              customer_email: appointment.customer_email,
              customer_phone: appointment.customer_phone || null,
              customer_address: appointment.street_address || null,
              service_type: appointment.service_type,
              service_description: appointment.notes || null,
              job_date: appointment.date,
              completed_date: new Date().toISOString(),
              amount_due: amountDue,
              amount_paid: 0,
              payment_status: 'unpaid'
            });

          if (jobError) {
            console.error('Error creating completed job:', jobError);
            // Check if it's a duplicate (job already exists)
            if (!jobError.message.includes('duplicate') && !jobError.message.includes('unique')) {
              throw jobError;
            }
          }

          // Award loyalty points if customer has user_id
          if (customer && customer.user_id) {
            // Calculate points based on service price (1 point per $1, minimum 10)
            let pointsToAward = 10;
            if (customer.price) {
              pointsToAward = Math.max(10, Math.floor(customer.price));
            }

            // Award loyalty points
            const loyaltyResponse = await fetch('/api/loyalty', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'earn',
                userId: customer.user_id,
                customerId: customer.id,
                points: pointsToAward,
                serviceId: appointment.id,
                serviceType: appointment.service_type || 'Service',
                serviceDate: new Date().toISOString(),
                description: `Completed ${appointment.service_type || 'service'}`
              })
            });

            if (!loyaltyResponse.ok) {
              console.error('Failed to award loyalty points:', await loyaltyResponse.text());
            } else {
              console.log('Loyalty points awarded successfully');
            }
          }
        } catch (loyaltyError) {
          console.error('Error processing completion:', loyaltyError);
          // Don't fail the whole operation if loyalty points fail
        }
      }

      // Refresh the list
      fetchWorkRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const uniqueServices = [...new Set(workRequests.map(r => r.service_type))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Work Requests</h1>
          <p className="text-gray-600">Manage all confirmed and in-progress work requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workRequests.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workRequests.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Active</p>
                <p className="text-2xl font-bold text-gray-900">{workRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workRequests.filter(r => {
                    const requestDate = parseISO(r.date);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return requestDate >= weekStart && requestDate < weekEnd;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Services</option>
              {uniqueServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            <button
              onClick={fetchWorkRequests}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Work Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Work Requests ({filteredRequests.length})
            </h2>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No work requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.customer_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            {request.customer_email && (
                              <span className="flex items-center gap-1">
                                <EnvelopeIcon className="w-4 h-4" />
                                {request.customer_email}
                              </span>
                            )}
                          </div>
                          {request.customer_phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <PhoneIcon className="w-4 h-4" />
                              {request.customer_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.service_type || 'N/A'}</div>
                        {request.booking_type && (
                          <div className="text-xs text-gray-500">{request.booking_type}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.date ? format(parseISO(request.date), 'MMM d, yyyy') : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.date ? format(parseISO(request.date), 'h:mm a') : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {request.street_address || request.city || 'N/A'}
                        </div>
                        {request.city && request.street_address && (
                          <div className="text-xs text-gray-500">{request.city}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.notes || 'No notes'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-2">
                          {request.status === 'confirmed' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'in_progress')}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Mark In Progress
                            </button>
                          )}
                          {request.status === 'in_progress' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Completed
                            </button>
                          )}
                          <button
                            onClick={() => updateRequestStatus(request.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkRequestsPage() {
  return (
    <ErrorBoundary>
      <WorkRequestsContent />
    </ErrorBoundary>
  );
}

