"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import DumpsterForm from '@/app/marketplace/components/DumpsterForm';

export default function DumpsterList() {
  const [dumpsters, setDumpsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDumpster, setSelectedDumpster] = useState(null);
  const [editingDumpster, setEditingDumpster] = useState(null);
  const [bookingDates, setBookingDates] = useState({ start: '', end: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadDumpsters();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadDumpsters = async () => {
    try {
      const { data, error } = await supabase
        .from('dumpster_rentals_with_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDumpsters(data || []);
    } catch (err) {
      console.error('Error loading dumpsters:', err.message);
      setError(`Failed to load dumpsters: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = (start, end, rate) => {
    const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    return (days * rate).toFixed(2);
  };

  const handleBooking = async (dumpsterId) => {
    if (!user) {
      setError('Please sign in to book a dumpster');
      return;
    }

    if (!bookingDates.start || !bookingDates.end) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      const dumpster = dumpsters.find(d => d.id === dumpsterId);
      const totalPrice = calculateTotalPrice(
        bookingDates.start,
        bookingDates.end,
        dumpster.daily_rate
      );

      // Start a transaction to update both tables
      const { error: bookingError } = await supabase.rpc('book_dumpster', {
        p_dumpster_id: dumpsterId,
        p_renter_id: user.id,
        p_start_date: bookingDates.start,
        p_end_date: bookingDates.end,
        p_total_price: totalPrice
      });

      if (bookingError) throw bookingError;

      setSuccess('Booking request submitted successfully!');
      setSelectedDumpster(null);
      setBookingDates({ start: '', end: '' });
      loadDumpsters(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnbook = async (dumpsterId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to manage dumpsters');
        return;
      }

      const { error } = await supabase.rpc('unbook_dumpster', {
        p_dumpster_id: dumpsterId,
        p_owner_id: user.id
      });

      if (error) throw error;

      setSuccess('Dumpster has been successfully unbooked');
      loadDumpsters(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733] mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {editingDumpster ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Edit Dumpster</h3>
            <button
              onClick={() => setEditingDumpster(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <DumpsterForm 
            dumpster={editingDumpster}
            onSuccess={() => {
              setEditingDumpster(null);
              loadDumpsters();
            }}
          />
        </div>
      ) : (
        dumpsters.map((dumpster) => (
          <div key={dumpster.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Dumpster Images */}
            <div className="relative h-48 group cursor-pointer" onClick={() => setSelectedImage(dumpster.images[0])}>
              {dumpster.images?.length > 0 ? (
                <>
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dumpster-images/${dumpster.images[0]}`}
                    alt={dumpster.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-dumpster.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ArrowsPointingOutIcon className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-[#FF5733] text-white px-3 py-1 rounded-full text-sm font-medium">
                ${dumpster.daily_rate}/day
              </div>
              {dumpster.availability_status === 'rented' && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Currently Rented
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{dumpster.title}</h3>
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="text-sm">{dumpster.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {dumpster.size}
                  </span>
                  {user?.id === dumpster.owner_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDumpster(dumpster);
                      }}
                      className="p-1 text-gray-500 hover:text-[#FF5733] transition-colors"
                      title="Edit listing"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-4 text-gray-600">{dumpster.description}</p>

              {/* Owner Info */}
              <div className="mt-4 flex items-center gap-2">
                {dumpster.avatar_url ? (
                  <img
                    src={dumpster.avatar_url}
                    alt={dumpster.display_name}
                    className="w-8 h-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#FF5733] text-white rounded-full flex items-center justify-center text-sm">
                    {dumpster.display_name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  Listed by {dumpster.display_name}
                </span>
              </div>

              {dumpster.features.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {dumpster.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        <CheckCircleIcon className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">
                  {dumpster.owner?.full_name || dumpster.owner?.email || 'Anonymous'}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(dumpster.created_at).toLocaleDateString()}
                </span>
              </div>

              {dumpster.availability_status === 'available' ? (
                selectedDumpster === dumpster.id ? (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingDates.start}
                          onChange={(e) => setBookingDates(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          min={bookingDates.start || new Date().toISOString().split('T')[0]}
                          value={bookingDates.end}
                          onChange={(e) => setBookingDates(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF5733]"
                        />
                      </div>
                    </div>

                    {bookingDates.start && bookingDates.end && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Total Price:</span>
                          <span className="text-lg font-bold text-[#FF5733]">
                            ${calculateTotalPrice(bookingDates.start, bookingDates.end, dumpster.daily_rate)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleBooking(dumpster.id)}
                        className="flex-1 bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#E64A2E]"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDumpster(null);
                          setBookingDates({ start: '', end: '' });
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedDumpster(dumpster.id)}
                    className="mt-6 w-full bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#E64A2E]"
                  >
                    Book Now
                  </button>
                )
              ) : (
                <div className="mt-6 space-y-2">
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                  >
                    Currently Unavailable
                  </button>
                  
                  {/* Show unbook button only for the owner */}
                  {user?.id === dumpster.owner_id && (
                    <button
                      onClick={() => handleUnbook(dumpster.id)}
                      className="w-full bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Cancel Booking & Make Available
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dumpster-images/${selectedImage}`}
              alt="Dumpster full view"
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-dumpster.jpg';
              }}
            />
          </div>
        </div>
      )}

      {!loading && dumpsters.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No dumpsters available</h3>
          <p className="text-gray-500">Be the first to list a dumpster for rent!</p>
        </div>
      )}
    </div>
  );
} 