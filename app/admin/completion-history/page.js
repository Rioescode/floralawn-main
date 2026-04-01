'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/app/admin/error-boundary';
import '@/lib/error-handler';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isPast, isToday } from 'date-fns';
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function CompletionHistoryContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [completionData, setCompletionData] = useState({});
  const [weekStats, setWeekStats] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && selectedWeek) {
      fetchCompletionData();
    }
  }, [user, selectedWeek]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      setUser(currentUser);
      
      // Set default week to current week
      const today = new Date();
      setSelectedWeek(today);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletionData = async () => {
    if (!selectedWeek) return;

    try {
      setLoading(true);
      
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // Sunday
      
      // Fetch completion records for the week
      const { data, error } = await supabaseAdmin
        .from('daily_completion_records')
        .select('*')
        .gte('record_date', weekStart.toISOString().split('T')[0])
        .lte('record_date', weekEnd.toISOString().split('T')[0])
        .order('record_date', { ascending: true })
        .order('day_name', { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped = {};
      let totalCompleted = 0;
      let totalMissed = 0;
      let totalRevenue = 0;

      data?.forEach(record => {
        const dateKey = record.record_date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            dayName: record.day_name,
            completed: [],
            missed: [],
            moved: []
          };
        }

        if (record.status === 'completed') {
          grouped[dateKey].completed.push(record);
          totalCompleted++;
          totalRevenue += parseFloat(record.scheduled_price || 0);
        } else if (record.status === 'missed') {
          grouped[dateKey].missed.push(record);
          totalMissed++;
        } else if (record.status === 'moved') {
          grouped[dateKey].moved.push(record);
        }
      });

      setCompletionData(grouped);
      setWeekStats({
        totalCompleted,
        totalMissed,
        totalRevenue,
        totalCustomers: totalCompleted + totalMissed,
        completionRate: totalCompleted + totalMissed > 0 
          ? ((totalCompleted / (totalCompleted + totalMissed)) * 100).toFixed(1)
          : 0
      });
    } catch (error) {
      console.error('Error fetching completion data:', error);
      alert('Error loading completion history');
    } finally {
      setLoading(false);
    }
  };

  const archivePastDays = async () => {
    try {
      setArchiving(true);
      
      // Get all past days from the last 30 days
      const today = new Date();
      const daysToArchive = [];
      
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        daysToArchive.push(date.toISOString().split('T')[0]);
      }

      // Archive each day
      for (const date of daysToArchive) {
        const { error } = await supabaseAdmin.rpc('archive_daily_completions', {
          p_date: date
        });
        
        if (error) {
          console.error(`Error archiving ${date}:`, error);
        }
      }

      alert('Past days archived successfully!');
      await fetchCompletionData();
    } catch (error) {
      console.error('Error archiving:', error);
      alert('Error archiving past days');
    } finally {
      setArchiving(false);
    }
  };

  const getWeekDays = () => {
    if (!selectedWeek) return [];
    
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
  };

  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const week = Math.ceil(date.getDate() / 7);
    return `${dayName} Week ${week}`;
  };

  if (loading && !completionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completion history...</p>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Completion History</h1>
            <p className="mt-2 text-sm text-gray-600">Track completed and missed customers by week</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedWeek ? format(selectedWeek, 'yyyy-MM-dd') : ''}
              onChange={(e) => setSelectedWeek(new Date(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={archivePastDays}
              disabled={archiving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-5 w-5" />
              {archiving ? 'Archiving...' : 'Archive Past Days'}
            </button>
          </div>
        </div>

        {/* Week Stats */}
        {weekStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Customers</div>
              <div className="text-2xl font-bold text-gray-900">{weekStats.totalCustomers}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-green-600">{weekStats.totalCompleted}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Missed</div>
              <div className="text-2xl font-bold text-red-600">{weekStats.totalMissed}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Completion Rate</div>
              <div className="text-2xl font-bold text-blue-600">{weekStats.completionRate}%</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">${weekStats.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Daily Breakdown */}
        <div className="space-y-4">
          {weekDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = completionData[dateKey];
            const isPastDay = isPast(day) && !isToday(day);
            const dayName = getDayName(day);

            return (
              <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                <div className={`px-6 py-4 border-b ${isPastDay ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {format(day, 'EEEE, MMMM dd, yyyy')}
                      </h3>
                      <p className="text-sm text-gray-500">{dayName}</p>
                    </div>
                    {dayData && (
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600 font-medium">
                          ✓ {dayData.completed.length} Completed
                        </span>
                        <span className="text-red-600 font-medium">
                          ✗ {dayData.missed.length} Missed
                        </span>
                        {dayData.moved.length > 0 && (
                          <span className="text-yellow-600 font-medium">
                            ↻ {dayData.moved.length} Moved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {dayData ? (
                  <div className="p-6">
                    {/* Completed Customers */}
                    {dayData.completed.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <CheckCircleIcon className="h-5 w-5" />
                          Completed ({dayData.completed.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayData.completed.map((record) => (
                            <div key={record.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="font-medium text-gray-900">{record.customer_name}</div>
                              <div className="text-xs text-gray-600 mt-1">{record.service_type}</div>
                              <div className="text-xs text-green-700 mt-1">${parseFloat(record.scheduled_price).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missed Customers */}
                    {dayData.missed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <XCircleIcon className="h-5 w-5" />
                          Missed ({dayData.missed.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayData.missed.map((record) => (
                            <div key={record.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="font-medium text-gray-900">{record.customer_name}</div>
                              <div className="text-xs text-gray-600 mt-1">{record.service_type}</div>
                              <div className="text-xs text-red-700 mt-1">${parseFloat(record.scheduled_price).toFixed(2)}</div>
                              {record.customer_email && (
                                <div className="text-xs text-gray-500 mt-1">{record.customer_email}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayData.completed.length === 0 && dayData.missed.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No records for this day</p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {isPastDay ? 'No records archived for this day. Click "Archive Past Days" to generate records.' : 'No data available for this day'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CompletionHistoryPage() {
  return (
    <ErrorBoundary>
      <CompletionHistoryContent />
    </ErrorBoundary>
  );
}

