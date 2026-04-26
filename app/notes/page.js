'use client';

import { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import { supabase } from '@/lib/supabase';
import { PlusIcon, XMarkIcon, PencilIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'general'
  });

  const priorities = [
    { value: 'high', label: 'High Priority', color: 'bg-red-100 border-red-300 text-red-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 border-green-300 text-green-800' }
  ];

  const categories = [
    { value: 'general', label: '📝 General', color: 'bg-gray-200' },
    { value: 'same_day', label: '⚡ Same Day', color: 'bg-red-200' },
    { value: 'one_time', label: '🔄 One Time', color: 'bg-blue-200' },
    { value: 'weekly', label: '📅 Weekly', color: 'bg-green-200' },
    { value: 'urgent', label: '🚨 Urgent', color: 'bg-orange-200' },
    { value: 'follow_up', label: '📞 Follow Up', color: 'bg-purple-200' }
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('job_notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('job_notes')
        .insert([{
          title: newNote.title,
          content: newNote.content,
          priority: newNote.priority,
          category: newNote.category,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      setNotes([data[0], ...notes]);
      setNewNote({ title: '', content: '', priority: 'medium', category: 'general' });
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setExtractingText(true);
    
    try {
      // Convert image to base64
      const base64 = await convertToBase64(file);
      
      // Call OpenAI Vision API to extract text
      const response = await fetch('/api/extract-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          prompt: `Extract all text from this image and organize it into job notes. For each note you find, provide:
          1. A short title (max 50 characters)
          2. The full content/details
          3. Suggest a category: same_day, one_time, weekly, urgent, follow_up, or general
          4. Suggest a priority: high, medium, or low
          
          Format your response as a JSON array of objects with these fields: title, content, category, priority
          
          Example format:
          [
            {
              "title": "Lawn mowing at 123 Main St",
              "content": "Customer called about weekly lawn service. Large yard, needs edging too.",
              "category": "weekly",
              "priority": "medium"
            }
          ]`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from image');
      }

      const result = await response.json();
      
      if (result.notes && result.notes.length > 0) {
        // Add all extracted notes to the database
        const notesToAdd = result.notes.map(note => ({
          title: note.title || 'Extracted Note',
          content: note.content || '',
          priority: note.priority || 'medium',
          category: note.category || 'general',
          created_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
          .from('job_notes')
          .insert(notesToAdd)
          .select();

        if (error) throw error;
        
        // Add new notes to the beginning of the list
        setNotes([...data, ...notes]);
        
        alert(`Successfully extracted ${result.notes.length} notes from your photo!`);
      } else {
        alert('No text could be extracted from the image. Please try a clearer photo.');
      }
      
    } catch (error) {
      console.error('Error extracting text:', error);
      alert('Error extracting text from image. Please try again.');
    } finally {
      setExtractingText(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const updateNote = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('job_notes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setNotes(notes.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('job_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getPriorityColor = (priority) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📝 Job Notes Board</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quick notes for same-day jobs, one-time services, and weekly planning
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setIsAddingNote(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Note
          </button>
          
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={extractingText}
            />
            <button
              disabled={extractingText}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              {extractingText ? (
                <>
                  <DocumentTextIcon className="w-5 h-5 animate-spin" />
                  Extracting Text...
                </>
              ) : (
                <>
                  <PhotoIcon className="w-5 h-5" />
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extraction Status */}
        {extractingText && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 animate-pulse" />
              <p className="text-blue-800 font-medium">
                🤖 AI is reading your photo and extracting notes...
              </p>
            </div>
            <p className="text-blue-600 text-sm mt-2">
              This may take a few seconds. Please wait.
            </p>
          </div>
        )}

        {/* Add Note Modal */}
        {isAddingNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Add New Note</h3>
                <button
                  onClick={() => setIsAddingNote(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    placeholder="Job title or quick description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newNote.priority}
                    onChange={(e) => setNewNote({...newNote, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Additional details, address, customer info..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addNote}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium"
                >
                  Add Note
                </button>
                <button
                  onClick={() => setIsAddingNote(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {notes.map((note) => {
            const categoryInfo = getCategoryInfo(note.category);
            return (
              <div
                key={note.id}
                className={`${categoryInfo.color} rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 relative`}
              >
                {/* Priority Badge */}
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getPriorityColor(note.priority)}`}>
                  {priorities.find(p => p.value === note.priority)?.label}
                </div>
                
                {/* Category Badge */}
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {categoryInfo.label}
                </div>
                
                {/* Title */}
                <h3 className="font-bold text-gray-800 mb-2 text-lg">{note.title}</h3>
                
                {/* Content */}
                {note.content && (
                  <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                )}
                
                {/* Date */}
                <p className="text-xs text-gray-600 mb-3">{formatDate(note.created_at)}</p>
                
                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingNote(note)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {notes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No notes yet</h3>
            <p className="text-gray-500">Add your first job note or upload a photo to get started!</p>
          </div>
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Edit Note</h3>
                <button
                  onClick={() => setEditingNote(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingNote.category}
                    onChange={(e) => setEditingNote({...editingNote, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingNote.priority}
                    onChange={(e) => setEditingNote({...editingNote, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editingNote.content || ''}
                    onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => updateNote(editingNote.id, {
                    title: editingNote.title,
                    content: editingNote.content,
                    priority: editingNote.priority,
                    category: editingNote.category
                  })}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 