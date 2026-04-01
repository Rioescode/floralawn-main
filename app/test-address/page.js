"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAddressPage() {
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        if (!user) {
          setMessage('No user logged in');
          setLoading(false);
          return;
        }
        
        setUser(user);
        
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        console.log('Profile data:', profile);
        setAddress(profile.address || '');
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setMessage(`Error: ${error.message}`);
        setLoading(false);
      }
    };
    
    getUser();
  }, []);
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ address })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setMessage('Address saved successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Test Address Field</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}
      
      {user ? (
        <div>
          <p className="mb-2">User ID: {user.id}</p>
          <p className="mb-4">Email: {user.email}</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            {loading ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      ) : (
        <p>Please log in to test the address field.</p>
      )}
    </div>
  );
} 