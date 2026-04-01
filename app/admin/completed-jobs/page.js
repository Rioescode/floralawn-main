'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { format, parseISO } from 'date-fns';
import { ErrorBoundary } from '../error-boundary';
import '@/lib/error-handler';
import {
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CompletedJobsPage() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, paid, unpaid, partial
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCompletedJobs();
    }
  }, [user]);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, paymentFilter, serviceFilter, dateFilter, completedJobs]);

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

  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabaseAdmin
        .from('completed_jobs')
        .select('*')
        .order('job_date', { ascending: false });

      if (error) throw error;

      setCompletedJobs(data || []);
      setFilteredJobs(data || []);
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
      alert('Error fetching completed jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = completedJobs.filter(job => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

      // Payment filter
      const matchesPayment = paymentFilter === 'all' || job.payment_status === paymentFilter;

      // Service filter
      const matchesService = serviceFilter === 'all' || job.service_type === serviceFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const jobDate = new Date(job.job_date);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = jobDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = jobDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = jobDate >= monthAgo;
        }
      }

      return matchesSearch && matchesPayment && matchesService && matchesDate;
    });

    setFilteredJobs(filtered);
  };

  const updatePayment = async (jobId, amountPaid) => {
    try {
      const job = completedJobs.find(j => j.id === jobId);
      if (!job) return;

      const newAmountPaid = parseFloat(amountPaid) || 0;
      const totalPaid = parseFloat(job.amount_paid) + newAmountPaid;
      
      let paymentStatus = 'unpaid';
      if (totalPaid >= parseFloat(job.amount_due)) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      const { error } = await supabaseAdmin
        .from('completed_jobs')
        .update({
          amount_paid: totalPaid,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      await fetchCompletedJobs();
      setShowPaymentModal(false);
      setSelectedJob(null);
      setPaymentAmount('');
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  const markAsPaid = async (jobId) => {
    try {
      const job = completedJobs.find(j => j.id === jobId);
      if (!job) return;

      const { error } = await supabaseAdmin
        .from('completed_jobs')
        .update({
          amount_paid: job.amount_due,
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      await fetchCompletedJobs();
      alert('Job marked as paid!');
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error marking job as paid. Please try again.');
    }
  };

  const openInvoiceModal = (job) => {
    // Generate invoice number if not exists
    let invoiceNumber = job.invoice_number;
    if (!invoiceNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      invoiceNumber = `FL-${year}${month}${day}-${random}`;
    }

    setInvoiceData({
      jobId: job.id,
      customerEmail: job.customer_email,
      customerName: job.customer_name,
      customerPhone: job.customer_phone || '',
      customerAddress: job.customer_address || '',
      invoiceNumber: invoiceNumber,
      amountDue: parseFloat(job.balance_due || job.amount_due).toFixed(2),
      serviceType: job.service_type,
      serviceDescription: job.service_description || '',
      jobDate: job.job_date,
      paymentTerms: '30'
    });
    setShowInvoiceModal(true);
  };

  const sendInvoice = async () => {
    if (!invoiceData) return;

    try {
      setSendingInvoice(true);

      // Update job with invoice number and sent status
      const { error: updateError } = await supabaseAdmin
        .from('completed_jobs')
        .update({
          invoice_number: invoiceData.invoiceNumber,
          invoice_sent: true,
          invoice_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceData.jobId);

      if (updateError) throw updateError;

      // Send invoice email
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: invoiceData.jobId,
          customerEmail: invoiceData.customerEmail,
          customerName: invoiceData.customerName,
          invoiceNumber: invoiceData.invoiceNumber,
          amountDue: invoiceData.amountDue,
          serviceType: invoiceData.serviceType,
          jobDate: invoiceData.jobDate,
          serviceDescription: invoiceData.serviceDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invoice');
      }

      await fetchCompletedJobs();
      setShowInvoiceModal(false);
      setInvoiceData(null);
      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert(`Error sending invoice: ${error.message || 'Please try again.'}`);
    } finally {
      setSendingInvoice(false);
    }
  };

  const formatServiceType = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || type;
  };

  const getPaymentStatusBadge = (status) => {
    const configs = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      unpaid: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unpaid' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' }
    };
    const config = configs[status] || configs.unpaid;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completed jobs...</p>
        </div>
      </div>
    );
  }

  const totalAmountDue = filteredJobs.reduce((sum, job) => sum + parseFloat(job.balance_due || 0), 0);
  const totalAmountPaid = filteredJobs.reduce((sum, job) => sum + parseFloat(job.amount_paid || 0), 0);
  const unpaidJobsCount = filteredJobs.filter(job => job.payment_status === 'unpaid').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Completed Jobs</h1>
          <p className="mt-2 text-sm text-gray-600">Track all completed jobs and payment status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Jobs</div>
            <div className="text-2xl font-bold text-gray-900">{filteredJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Unpaid Jobs</div>
            <div className="text-2xl font-bold text-red-600">{unpaidJobsCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Amount Due</div>
            <div className="text-2xl font-bold text-red-600">${totalAmountDue.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Amount Paid</div>
            <div className="text-2xl font-bold text-green-600">${totalAmountPaid.toFixed(2)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Services</option>
                <option value="lawn_mowing">Lawn Mowing</option>
                <option value="spring_cleanup">Spring Cleanup</option>
                <option value="fall_cleanup">Fall Cleanup</option>
                <option value="snow_removal">Snow Removal</option>
                <option value="landscaping">Landscaping</option>
                <option value="mulch_installation">Mulch Installation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No completed jobs found.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{format(parseISO(job.job_date), 'MMM dd')}</div>
                        <div className="text-xs text-gray-500">{format(parseISO(job.job_date), 'yyyy')}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-gray-900">{job.customer_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={job.customer_email}>
                          {job.customer_email}
                        </div>
                        {job.customer_phone && (
                          <div className="text-xs text-gray-500">{job.customer_phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-900">{formatServiceType(job.service_type)}</div>
                        {job.service_description && (
                          <div className="text-xs text-gray-500 truncate max-w-[120px]" title={job.service_description}>
                            {job.service_description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        <div className="text-xs text-gray-500">Due: <span className="font-medium text-gray-900">${parseFloat(job.amount_due).toFixed(2)}</span></div>
                        <div className="text-xs text-gray-500">Paid: <span className="font-medium text-green-600">${parseFloat(job.amount_paid).toFixed(2)}</span></div>
                        <div className="text-sm font-semibold text-red-600 mt-1">
                          Balance: ${parseFloat(job.balance_due || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {getPaymentStatusBadge(job.payment_status)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {job.invoice_sent ? (
                          <div className="text-xs">
                            <div className="text-green-600 font-medium">✓ Sent</div>
                            {job.invoice_number && (
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-[100px]" title={job.invoice_number}>
                                {job.invoice_number}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not sent</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {job.payment_status !== 'paid' ? (
                          <div className="flex flex-col gap-1">
                            {parseFloat(job.balance_due || 0) > 0 && (
                              <button
                                onClick={() => openInvoiceModal(job)}
                                disabled={sendingInvoice}
                                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                title="Review & Send Invoice"
                              >
                                <EnvelopeIcon className="h-3 w-3" />
                                Invoice
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setShowPaymentModal(true);
                              }}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                              title="Record Payment"
                            >
                              Record
                            </button>
                            <button
                              onClick={() => markAsPaid(job.id)}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                              title="Mark as Paid"
                            >
                              Paid
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Complete</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Record Payment</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Customer: <span className="font-medium">{selectedJob.customer_name}</span></p>
              <p className="text-sm text-gray-600 mb-2">Amount Due: <span className="font-medium">${parseFloat(selectedJob.balance_due || 0).toFixed(2)}</span></p>
              <p className="text-sm text-gray-600 mb-4">Amount Paid So Far: <span className="font-medium">${parseFloat(selectedJob.amount_paid).toFixed(2)}</span></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={selectedJob.balance_due}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (paymentAmount && parseFloat(paymentAmount) > 0) {
                    updatePayment(selectedJob.id, paymentAmount);
                  } else {
                    alert('Please enter a valid payment amount');
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Record Payment
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedJob(null);
                  setPaymentAmount('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Review Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Invoice</h2>
            
            {/* Editable Invoice Fields */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={invoiceData.customerName}
                  onChange={(e) => setInvoiceData({...invoiceData, customerName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                <input
                  type="email"
                  value={invoiceData.customerEmail}
                  onChange={(e) => setInvoiceData({...invoiceData, customerEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <input
                  type="text"
                  value={formatServiceType(invoiceData.serviceType)}
                  onChange={(e) => setInvoiceData({...invoiceData, serviceType: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Description</label>
                <textarea
                  value={invoiceData.serviceDescription}
                  onChange={(e) => setInvoiceData({...invoiceData, serviceDescription: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Service description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Due</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceData.amountDue}
                    onChange={(e) => setInvoiceData({...invoiceData, amountDue: parseFloat(e.target.value).toFixed(2)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (days)</label>
                  <input
                    type="number"
                    value={invoiceData.paymentTerms}
                    onChange={(e) => setInvoiceData({...invoiceData, paymentTerms: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Preview</h3>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="mb-4">
                  <div className="text-sm text-gray-600">Invoice #: <span className="font-medium">{invoiceData.invoiceNumber}</span></div>
                  <div className="text-sm text-gray-600">Date: <span className="font-medium">{format(new Date(), 'MMM dd, yyyy')}</span></div>
                </div>
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-900">Bill To:</div>
                  <div className="text-sm text-gray-700">{invoiceData.customerName}</div>
                  <div className="text-sm text-gray-700">{invoiceData.customerEmail}</div>
                </div>
                <div className="mb-4 border-t pt-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">Service:</div>
                  <div className="text-sm text-gray-700">{formatServiceType(invoiceData.serviceType)}</div>
                  {invoiceData.serviceDescription && (
                    <div className="text-xs text-gray-600 mt-1">{invoiceData.serviceDescription}</div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount Due:</span>
                    <span className="text-red-600">${invoiceData.amountDue}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">Payment Terms: Net {invoiceData.paymentTerms} days</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={sendInvoice}
                disabled={sendingInvoice}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <EnvelopeIcon className="h-5 w-5" />
                {sendingInvoice ? 'Sending...' : 'Send Invoice'}
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceData(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}


