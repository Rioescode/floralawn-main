'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from "@/components/Footer";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/context/AuthContext';

export default function DumpLocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: 'RI',
    zipcode: '',
    type: 'landfill',
    hours: '',
    fees: '',
    notes: '',
    verified: false
  });
  const [expandedHours, setExpandedHours] = useState({});

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('dump_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('dump_locations')
        .insert([{
          ...newLocation,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setLocations([data[0], ...locations]);
      setShowAddForm(false);
      setNewLocation({
        name: '',
        address: '',
        city: '',
        state: 'RI',
        zipcode: '',
        type: 'landfill',
        hours: '',
        fees: '',
        notes: '',
        verified: false
      });
    } catch (err) {
      console.error('Error adding location:', err);
      alert('Failed to add location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('update_dump_location', {
        p_location_id: editingLocation.id,
        p_name: editingLocation.name,
        p_address: editingLocation.address,
        p_city: editingLocation.city,
        p_state: editingLocation.state,
        p_zipcode: editingLocation.zipcode,
        p_type: editingLocation.type,
        p_hours: editingLocation.hours,
        p_fees: editingLocation.fees,
        p_notes: editingLocation.notes,
        p_verified: editingLocation.verified
      });

      if (error) throw error;

      setLocations(locations.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...editingLocation } : loc
      ));
      setEditingLocation(null);
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('delete_dump_location', {
        p_location_id: locationId
      });

      if (error) throw error;

      setLocations(locations.filter(loc => loc.id !== locationId));
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dump Locations & Landfills</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#FF5733] text-white px-4 py-2 rounded-lg hover:bg-[#E64A2E] transition-colors"
          >
            Add Location
          </button>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Location</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={newLocation.type}
                      onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    >
                      <option value="landfill">Landfill</option>
                      <option value="transfer_station">Transfer Station</option>
                      <option value="recycling_center">Recycling Center</option>
                      <option value="composting">Composting Facility</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={newLocation.city}
                      onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={newLocation.state}
                      onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zipcode
                    </label>
                    <input
                      type="text"
                      required
                      value={newLocation.zipcode}
                      onChange={(e) => setNewLocation({ ...newLocation, zipcode: e.target.value })}
                      placeholder="e.g., 02888"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operating Hours
                    </label>
                    <textarea
                      value={newLocation.hours}
                      onChange={(e) => setNewLocation({ ...newLocation, hours: e.target.value })}
                      rows={7}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                      placeholder="Enter hours for each day, one per line:
Monday 6 AM–3:45 PM
Tuesday 6 AM–3:45 PM
Wednesday 6 AM–3:45 PM
Thursday 6 AM–3:45 PM
Friday 6 AM–3:45 PM
Saturday 6 AM–12 PM
Sunday Closed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fees
                    </label>
                    <input
                      type="text"
                      value={newLocation.fees}
                      onChange={(e) => setNewLocation({ ...newLocation, fees: e.target.value })}
                      placeholder="e.g., $50/ton"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={newLocation.notes}
                      onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                      placeholder="Enter any additional information about the location..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#E64A2E] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingLocation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Location</h2>
                <button onClick={() => setEditingLocation(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <form onSubmit={handleEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editingLocation.name}
                      onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={editingLocation.type}
                      onChange={(e) => setEditingLocation({ ...editingLocation, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    >
                      <option value="landfill">Landfill</option>
                      <option value="transfer_station">Transfer Station</option>
                      <option value="recycling_center">Recycling Center</option>
                      <option value="composting">Composting Facility</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={editingLocation.address}
                      onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={editingLocation.city}
                      onChange={(e) => setEditingLocation({ ...editingLocation, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={editingLocation.state}
                      onChange={(e) => setEditingLocation({ ...editingLocation, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zipcode
                    </label>
                    <input
                      type="text"
                      required
                      value={editingLocation.zipcode}
                      onChange={(e) => setEditingLocation({ ...editingLocation, zipcode: e.target.value })}
                      placeholder="e.g., 02888"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operating Hours
                    </label>
                    <textarea
                      value={editingLocation.hours}
                      onChange={(e) => setEditingLocation({ ...editingLocation, hours: e.target.value })}
                      rows={7}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                      placeholder="Enter hours for each day, one per line:
Monday 6 AM–3:45 PM
Tuesday 6 AM–3:45 PM
Wednesday 6 AM–3:45 PM
Thursday 6 AM–3:45 PM
Friday 6 AM–3:45 PM
Saturday 6 AM–12 PM
Sunday Closed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fees
                    </label>
                    <input
                      type="text"
                      value={editingLocation.fees}
                      onChange={(e) => setEditingLocation({ ...editingLocation, fees: e.target.value })}
                      placeholder="e.g., $50/ton"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={editingLocation.notes}
                      onChange={(e) => setEditingLocation({ ...editingLocation, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                      placeholder="Enter any additional information about the location..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingLocation(null)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#E64A2E] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5733] mx-auto"></div>
          </div>
        ) : locations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <div key={location.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{location.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${location.type === 'landfill' ? 'bg-blue-100 text-blue-800' :
                          location.type === 'transfer_station' ? 'bg-purple-100 text-purple-800' :
                          location.type === 'recycling_center' ? 'bg-green-100 text-green-800' :
                          location.type === 'composting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {location.type.replace('_', ' ')}
                      </span>
                      {location.verified && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  {user && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLocation(location)}
                        className="p-1 text-gray-500 hover:text-[#FF5733] transition-colors"
                        title="Edit location"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete location"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">{location.address}</p>
                      <p className="text-gray-600">{location.city}, {location.state} {location.zipcode}</p>
                    </div>
                  </div>
                  
                  {location.hours && (
                    <div className="flex items-start gap-2">
                      <button 
                        onClick={() => setExpandedHours(prev => ({...prev, [location.id]: !prev[location.id]}))}
                        className="flex items-start gap-2 w-full text-left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-700">Hours</p>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-4 w-4 transform transition-transform ${expandedHours[location.id] ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          <div className={`grid grid-cols-1 gap-1 overflow-hidden transition-all duration-300 ${expandedHours[location.id] ? 'max-h-[500px] mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                            {location.hours.split('\n').map((day, index) => {
                              const [dayName, hours] = day.split(' ', 2);
                              return (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600 font-medium w-24">{dayName}</span>
                                  <span className="text-gray-600">{hours || 'Closed'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                  
                  {location.fees && (
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium text-gray-700">Fees:</span> {location.fees}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {location.notes && (
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-600">{location.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${location.name} ${location.address} ${location.city} ${location.state}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View on Google Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No locations added yet. Be the first to add one!</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
} 