import React, { useState } from 'react';

const TimeSuggestionForm = ({ jobId, onSubmit, onCancel }) => {
  const [suggestion, setSuggestion] = useState({
    date: '',
    time: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(jobId, suggestion);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={suggestion.date}
          onChange={(e) => setSuggestion({ ...suggestion, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Time</label>
        <input
          type="time"
          value={suggestion.time}
          onChange={(e) => setSuggestion({ ...suggestion, time: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Message (optional)</label>
        <textarea
          value={suggestion.message}
          onChange={(e) => setSuggestion({ ...suggestion, message: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows="3"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default TimeSuggestionForm; 