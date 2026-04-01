import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Service duration in hours (default 2 hours per appointment)
const SERVICE_DURATION_HOURS = 2;

// Working hours
const WORKING_HOURS = {
  start: 8, // 8 AM
  end: 18   // 6 PM
};

// Days of week we work (0 = Sunday, 1 = Monday, etc.)
const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Monday to Saturday

// Helper function to determine if a date is Week 1 or Week 2
function getWeekNumber(date) {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7) % 2 === 0 ? 2 : 1;
}

// Helper function to get day name from date
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Helper function to calculate dates for scheduled_day pattern
function getDatesForScheduledDay(scheduledDay, startDate, endDate) {
  const dates = [];
  const [dayName, weekStr] = scheduledDay.split(' Week ');
  const targetWeek = weekStr ? parseInt(weekStr) : null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayNameOfDate = getDayName(date);
    const weekOfDate = getWeekNumber(date);
    
    if (dayNameOfDate === dayName) {
      if (targetWeek === null || weekOfDate === targetWeek) {
        dates.push(new Date(date));
      }
    }
  }
  
  return dates;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all appointments in the date range
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('date, status')
      .gte('date', new Date(startDate).toISOString())
      .lte('date', new Date(endDate + 'T23:59:59').toISOString())
      .in('status', ['pending', 'confirmed']);

    if (appointmentsError) throw appointmentsError;

    // Fetch all active customers with scheduled services
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, next_service, scheduled_day, frequency, status')
      .eq('status', 'active');

    if (customersError) throw customersError;

    // Group appointments by date and time slot
    const bookedSlots = {};
    
    (appointments || []).forEach(apt => {
      const date = new Date(apt.date);
      const dateKey = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      if (!bookedSlots[dateKey]) {
        bookedSlots[dateKey] = new Set();
      }
      
      // Mark the time slot and adjacent slots as booked (buffer time)
      for (let h = hour; h < hour + SERVICE_DURATION_HOURS; h++) {
        bookedSlots[dateKey].add(h);
      }
    });

    // Process customer scheduled services - group by date first
    const customerDatesByDay = {};
    
    (customers || []).forEach(customer => {
      const customerDates = [];
      
      // Add next_service date if it's in range
      if (customer.next_service) {
        const nextServiceDate = new Date(customer.next_service);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (nextServiceDate >= start && nextServiceDate <= end) {
          customerDates.push(nextServiceDate);
          
          // If frequency is weekly or bi_weekly, calculate recurring dates
          if (customer.frequency === 'weekly') {
            let recurringDate = new Date(nextServiceDate);
            recurringDate.setDate(recurringDate.getDate() + 7);
            while (recurringDate <= end) {
              customerDates.push(new Date(recurringDate));
              recurringDate.setDate(recurringDate.getDate() + 7);
            }
          } else if (customer.frequency === 'bi_weekly') {
            let recurringDate = new Date(nextServiceDate);
            recurringDate.setDate(recurringDate.getDate() + 14);
            while (recurringDate <= end) {
              customerDates.push(new Date(recurringDate));
              recurringDate.setDate(recurringDate.getDate() + 14);
            }
          }
        }
      }
      
      // Add dates from scheduled_day pattern
      if (customer.scheduled_day) {
        const scheduledDates = getDatesForScheduledDay(customer.scheduled_day, startDate, endDate);
        customerDates.push(...scheduledDates);
      }
      
      // Group dates by day
      customerDates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0];
        if (!customerDatesByDay[dateKey]) {
          customerDatesByDay[dateKey] = 0;
        }
        customerDatesByDay[dateKey]++;
      });
    });
    
    // Mark booked slots based on number of customers per day
    // Each customer service takes ~1-2 hours, so we block hours proportionally
    Object.entries(customerDatesByDay).forEach(([dateKey, customerCount]) => {
      if (!bookedSlots[dateKey]) {
        bookedSlots[dateKey] = new Set();
      }
      
      // Calculate how many hours to block based on customer count
      // Assume each customer takes 1.5 hours on average
      const hoursToBlock = Math.ceil(customerCount * 1.5);
      const startHour = WORKING_HOURS.start;
      
      // Block hours starting from the beginning of the day
      // This ensures we don't overbook
      for (let i = 0; i < hoursToBlock && (startHour + i) < WORKING_HOURS.end; i++) {
        bookedSlots[dateKey].add(startHour + i);
      }
    });

    // Generate available dates and times
    const availableDates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Skip if not a working day
      if (!WORKING_DAYS.includes(dayOfWeek)) continue;
      
      // Skip past dates
      if (date < new Date().setHours(0, 0, 0, 0)) continue;
      
      const bookedHours = bookedSlots[dateKey] || new Set();
      const availableTimes = [];
      
      // Check each hour in working hours
      for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
        // Check if this hour and next hour are available (for 2-hour service)
        let isAvailable = true;
        for (let h = hour; h < hour + SERVICE_DURATION_HOURS && h < WORKING_HOURS.end; h++) {
          if (bookedHours.has(h)) {
            isAvailable = false;
            break;
          }
        }
        
        if (isAvailable) {
          const timeStr = hour === 12 
            ? '12:00 PM'
            : hour > 12 
              ? `${hour - 12}:00 PM`
              : `${hour}:00 AM`;
          availableTimes.push(timeStr);
        }
      }
      
      if (availableTimes.length > 0) {
        availableDates.push({
          date: dateKey,
          times: availableTimes
        });
      }
    }

    return NextResponse.json({
      availableDates,
      bookedSlots: Object.fromEntries(
        Object.entries(bookedSlots).map(([date, hours]) => [date, Array.from(hours)])
      )
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check availability' },
      { status: 500 }
    );
  }
}

