'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Calendar({ onDateSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    const [hours, minutes] = time.match(/(\d+):(\d+) (AM|PM)/).slice(1);
    let hour = parseInt(hours);
    if (time.includes('PM') && hour !== 12) hour += 12;
    if (time.includes('AM') && hour === 12) hour = 0;
    
    const dateWithTime = new Date(selectedDate);
    dateWithTime.setHours(hour, 0, 0, 0);
    onDateSelect(dateWithTime);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`
                  group relative p-2 sm:p-3 rounded-xl text-center transition-all duration-200
                  ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
                  ${isTodayDate ? 'ring-2 ring-green-500 bg-green-50 text-green-600' : ''}
                  ${isSelected ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' : 'hover:bg-gray-50 hover:shadow-md cursor-pointer bg-white'}
                `}
              >
                <div className="flex flex-col items-center">
                  <span className="text-base sm:text-lg font-semibold">
                    {format(day, 'd')}
                  </span>
                </div>
                <div className={`absolute inset-0 rounded-xl border-2 border-transparent ${!isSelected && 'group-hover:border-gray-200'} transition-colors`} />
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-4 sm:mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Select Time</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`
                    py-2 px-3 text-sm font-medium rounded-lg transition-colors
                    ${selectedTime === time 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 italic">
              Note: Selected time is your preferred time. We'll confirm availability and may suggest alternative times if needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 