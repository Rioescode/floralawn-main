import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import DumpsterForm from './DumpsterForm';

export default function DumpsterList() {
  const [editingDumpster, setEditingDumpster] = useState(null);

  return (
    <div className="space-y-6">
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
                    <div className="flex items-center gap-1">
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
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                            return;
                          }
                          try {
                            const { error: deleteError } = await supabase
                              .from('dumpster_rentals')
                              .delete()
                              .eq('id', dumpster.id)
                              .eq('owner_id', user.id);

                            if (deleteError) throw deleteError;

                            // Delete associated images from storage
                            for (const image of dumpster.images) {
                              await supabase.storage
                                .from('dumpster-images')
                                .remove([image])
                                .catch(console.error);
                            }

                            loadDumpsters(); // Refresh the list
                          } catch (err) {
                            console.error('Error deleting dumpster:', err);
                            setError(err.message);
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="Delete listing"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 