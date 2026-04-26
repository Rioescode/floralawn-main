"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Navigation from '@/components/Navigation';

const imageLoader = ({ src }) => {
  return src;
};

export default function FreeStuff() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    location: '',
    images: [],
    condition: 'good'
  });
  const [pickupPhoto, setPickupPhoto] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchItems();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchItems = async () => {
    try {
      console.log('Fetching items...');
      const { data, error } = await supabase
        .from('community_free_items_with_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      console.log('Fetched items:', data);
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Each image must be less than 2MB');
        continue;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('free_items')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('free_items')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    setNewItem(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to post items');
      return;
    }

    try {
      console.log('Submitting new item:', newItem);
      const { error } = await supabase
        .from('community_free_items')
        .insert([
          {
            ...newItem,
            user_id: user.id,
            status: 'available'
          }
        ]);

      if (error) throw error;
      console.log('Item submitted successfully');

      setNewItem({
        title: '',
        description: '',
        location: '',
        images: [],
        condition: 'good'
      });
      setShowAddModal(false);
      await fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item. Please try again.');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('community_free_items')
        .update({
          title: newItem.title,
          description: newItem.description,
          location: newItem.location,
          condition: newItem.condition,
          images: newItem.images,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNewItem({
        title: '',
        description: '',
        location: '',
        images: [],
        condition: 'good'
      });
      setEditingItem(null);
      setShowAddModal(false);
      await fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item. Please try again.');
    }
  };

  const handleStatusChange = async (item) => {
    try {
      console.log('Updating status for item:', item.id);
      const newStatus = item.status === 'available' ? 'taken' : 'available';
      const user = await supabase.auth.getUser();
      
      if (!user.data?.user) {
        alert('Please sign in to reserve items');
        return;
      }

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'taken') {
        updateData.reserved_by = user.data.user.id;
        updateData.reservation_expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
      } else {
        updateData.reserved_by = null;
        updateData.reservation_expires_at = null;
        updateData.pickup_photo = null;
        updateData.pickup_confirmed_at = null;
      }

      const { data: updatedItems, error } = await supabase
        .from('community_free_items')
        .update(updateData)
        .eq('id', item.id)
        .select('*');

      if (error) {
        console.error('Error updating item status:', error);
        alert(`Error updating item status: ${error.message}`);
        return;
      }

      if (!updatedItems?.[0]) {
        console.error('No updated item data returned');
        return;
      }

      // Update local state
      setItems(prevItems => 
        prevItems.map(i => 
          i.id === item.id ? { ...i, ...updatedItems[0] } : i
        )
      );

      console.log('Item status updated successfully');
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
      alert('Error updating item status. Please try again.');
    }
  };

  const handleReserveItem = async (item) => {
    if (!user) {
      alert('Please sign in to reserve items');
      return;
    }

    try {
      console.log('Attempting to reserve item:', item.id);
      const reservationExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      // First update the table
      const { data: updateData, error: updateError } = await supabase
        .from('community_free_items')
        .update({
          status: 'taken',
          reserved_by: user.id,
          reservation_expires_at: reservationExpiry.toISOString()
        })
        .eq('id', item.id)
        .is('reserved_by', null) // Only if not already reserved
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Update successful:', updateData);

      // Then fetch the updated data from the view
      const { data: updatedItems, error: fetchError } = await supabase
        .from('community_free_items_with_profiles')
        .select('*')
        .eq('id', item.id);
      
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Fetched updated item:', updatedItems);
      
      // Update local state with the fetched data
      if (updatedItems?.[0]) {
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id 
              ? updatedItems[0]
              : prevItem
          )
        );
      } else {
        throw new Error('No updated data returned');
      }
    } catch (error) {
      console.error('Error reserving item:', error);
      alert('Error reserving item. It might have been taken by someone else.');
    }
  };

  const handleConfirmPickup = async (item) => {
    if (!user) return;

    try {
      console.log('Confirming pickup for item:', item.id);
      
      // Check if photo is uploaded
      if (!pickupPhoto) {
        alert('Please upload a photo of the item you picked up. This helps build trust in our community.');
        return;
      }

      // Upload photo to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pickup-photos')
        .upload(`${item.id}-${Date.now()}`, pickupPhoto);

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pickup-photos')
        .getPublicUrl(uploadData.path);
      
      // Update item with photo and confirmation
      const { error: updateError } = await supabase
        .from('community_free_items')
        .update({
          pickup_confirmed_at: new Date().toISOString(),
          pickup_photo: publicUrl
        })
        .eq('id', item.id)
        .eq('reserved_by', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Fetch updated data
      const { data: updatedItems, error: fetchError } = await supabase
        .from('community_free_items_with_profiles')
        .select('*')
        .eq('id', item.id);
      
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Pickup confirmed:', updatedItems);
      setPickupPhoto(null);
      
      // Update local state
      if (updatedItems?.[0]) {
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id 
              ? updatedItems[0]
              : prevItem
          )
        );
      } else {
        throw new Error('No updated data returned');
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
      alert('Error confirming pickup. Please try again.');
    }
  };

  // Add photo upload handler
  const handlePickupPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setPickupPhoto(file);
      } else {
        alert('Please upload an image file');
        e.target.value = '';
      }
    }
  };

  // Add this to check for expired reservations
  useEffect(() => {
    const checkExpiredReservations = async () => {
      try {
        const { data: expiredItems, error } = await supabase
          .from('community_free_items')
          .select('id')
          .eq('status', 'taken')
          .is('pickup_confirmed_at', null)
          .lt('reservation_expires_at', new Date().toISOString());

        if (error) throw error;

        if (expiredItems.length > 0) {
          const { error: updateError } = await supabase
            .from('community_free_items')
            .update({
              status: 'available',
              reserved_by: null,
              reservation_expires_at: null
            })
            .in('id', expiredItems.map(item => item.id));

          if (updateError) throw updateError;
          await fetchItems();
        }
      } catch (error) {
        console.error('Error checking expired reservations:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiredReservations, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Free Items</h1>
            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#FF5733] text-white px-4 py-2 rounded-full hover:bg-[#E64A2E] transition-colors"
              >
                List Free Item
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {item.images?.[0] && (
                  <div 
                    className="relative h-48 w-full cursor-pointer"
                    onClick={() => {
                      setSelectedImage(item.images[0]);
                      setShowImageModal(true);
                    }}
                  >
                    <Image
                      loader={imageLoader}
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover hover:opacity-90 transition-opacity"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'available' ? 'Available' : 'Taken'}
                      </span>
                      {user?.id === item.user_id && (
                        <button
                          onClick={() => {
                            setNewItem({
                              title: item.title,
                              description: item.description,
                              location: item.location,
                              condition: item.condition,
                              images: item.images || []
                            });
                            setEditingItem(item);
                            setShowAddModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-[#FF5733] transition-colors"
                          title="Edit item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Condition: </span>
                    <span className="text-sm text-gray-600 capitalize">{item.condition}</span>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {item.avatar_url ? (
                        <img
                          src={item.avatar_url}
                          alt={item.display_name}
                          className="w-6 h-6 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-[#FF5733] text-white rounded-full flex items-center justify-center text-xs">
                          {item.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        Posted by {item.display_name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#FF5733]">
                      {item.location}
                    </span>
                  </div>

                  {/* Reservation Status and Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {item.status === 'available' ? (
                      user && user.id !== item.user_id && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Reserve button clicked for item:', item.id);
                            handleReserveItem(item);
                          }}
                          className="w-full bg-[#FF5733] text-white px-4 py-2 rounded-full hover:bg-[#E64A2E] transition-colors"
                        >
                          Reserve Item
                        </button>
                      )
                    ) : (
                      <div className="space-y-3">
                        {item.reserved_by === user?.id && !item.pickup_confirmed_at && (
                          <>
                            <div className="text-sm text-gray-600">
                              Reserved for you - Please pick up within{' '}
                              <span className="font-medium">
                                {new Date(item.reservation_expires_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="mt-3 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Upload Pickup Photo
                                </label>
                                <div className="text-xs text-red-600 mb-2">
                                  ⚠️ Warning: Please upload a real photo of the item. Fake photos may result in restrictions on reserving future items.
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePickupPhotoUpload}
                                  className="w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-[#FF5733] file:text-white
                                    hover:file:bg-[#E64A2E]"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Confirm pickup button clicked for item:', item.id);
                                  handleConfirmPickup(item);
                                }}
                                className="w-full bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
                                disabled={!pickupPhoto}
                              >
                                Confirm Pickup
                              </button>
                            </div>
                          </>
                        )}
                        {item.pickup_confirmed_at && (
                          <div className="space-y-2">
                            <div className="text-sm text-green-600 font-medium">
                              Pickup confirmed at {new Date(item.pickup_confirmed_at).toLocaleString()}
                            </div>
                            {item.pickup_photo && (
                              <div 
                                className="relative h-48 w-full mt-2 cursor-pointer"
                                onClick={() => {
                                  setSelectedImage(item.pickup_photo);
                                  setShowImageModal(true);
                                }}
                              >
                                <Image
                                  loader={imageLoader}
                                  src={item.pickup_photo}
                                  alt="Pickup confirmation"
                                  fill
                                  className="object-cover rounded hover:opacity-90 transition-opacity"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {item.reserved_by && item.reserved_by !== user?.id && (
                          <div className="text-sm text-gray-600">
                            Reserved by another user until{' '}
                            <span className="font-medium">
                              {new Date(item.reservation_expires_at).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Owner Controls */}
                    {user?.id === item.user_id && (
                      <div className="mt-3">
                        {item.status === 'taken' && !item.pickup_confirmed_at && (
                          <div className="text-sm text-gray-600 mb-2">
                            Reserved until {new Date(item.reservation_expires_at).toLocaleTimeString()}
                          </div>
                        )}
                        <button
                          onClick={() => handleStatusChange(item)}
                          className={`w-full text-sm font-medium px-4 py-2 rounded-full ${
                            item.status === 'available'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } transition-colors`}
                        >
                          Mark as {item.status === 'available' ? 'Taken' : 'Available'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {editingItem ? 'Edit Item' : 'List Free Item'}
                </h2>
                <form onSubmit={editingItem ? handleEdit : handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                        value={newItem.title}
                        onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                        rows="3"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                        value={newItem.location}
                        onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condition</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF5733] focus:ring-[#FF5733]"
                        value={newItem.condition}
                        onChange={(e) => setNewItem(prev => ({ ...prev, condition: e.target.value }))}
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-[#FF5733] file:text-white
                          hover:file:bg-[#E64A2E]"
                      />
                    </div>
                    {newItem.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {newItem.images.map((url, index) => (
                          <div key={index} className="relative w-20 h-20">
                            <Image
                              loader={imageLoader}
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                            <button
                              type="button"
                              onClick={() => setNewItem(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index)
                              }))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#FF5733] text-white px-4 py-2 rounded-full hover:bg-[#E64A2E] transition-colors"
                    >
                      {editingItem ? 'Save Changes' : 'Post Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingItem(null);
                        setNewItem({
                          title: '',
                          description: '',
                          location: '',
                          images: [],
                          condition: 'good'
                        });
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              loader={imageLoader}
              src={selectedImage}
              alt="Full size image"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
              unoptimized
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
} 