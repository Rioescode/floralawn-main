import React, { useState } from 'react';

export default function JobPostCard({ job, onBidSubmit, onTimeSuggestion }) {
  const [bidForm, setBidForm] = useState({
    amount: '',
    message: ''
  });
  const [timeSuggestion, setTimeSuggestion] = useState({
    date: '',
    time: '',
    message: ''
  });
  const [showBidForm, setShowBidForm] = useState(false);
  const [showTimeSuggestion, setShowTimeSuggestion] = useState(false);

  const handleBidSubmit = (e) => {
    e.preventDefault();
    onBidSubmit(job.id, bidForm);
    setBidForm({ amount: '', message: '' });
    setShowBidForm(false);
  };

  const handleTimeSuggestion = (e) => {
    e.preventDefault();
    onTimeSuggestion(job.id, timeSuggestion);
    setTimeSuggestion({ date: '', time: '', message: '' });
    setShowTimeSuggestion(false);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 hover:text-[#FF5733] transition-colors">
            {job.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
          {job.status}
        </span>
      </div>

      <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Budget</div>
          <div className="text-base md:text-lg font-semibold text-gray-800">${job.budget}</div>
        </div>
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Needed By</div>
          <div className="text-base md:text-lg font-semibold text-gray-800">
            {new Date(job.date_needed).toLocaleDateString()}
          </div>
        </div>
        <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
          <div className="text-base md:text-lg font-semibold text-gray-800">{job.location}</div>
        </div>
      </div>

      {/* Photos Gallery */}
      {job.job_photos && job.job_photos.length > 0 && (
        <div className="mt-4 md:mt-6">
          <h4 className="font-semibold text-gray-800 mb-3 md:mb-4">Job Photos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {job.job_photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={`Job photo ${index + 1}`}
                  className="w-full h-20 md:h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(photo.photo_url, '_blank')}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowBidForm(!showBidForm)}
          className="flex-1 bg-[#FF5733] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#FF5733]/90"
        >
          Place Bid
        </button>
        <button
          onClick={() => setShowTimeSuggestion(!showTimeSuggestion)}
          className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600"
        >
          Suggest Time
        </button>
      </div>

      {/* Bid Form */}
      {showBidForm && (
        <form onSubmit={handleBidSubmit} className="mt-4 md:mt-6 space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={bidForm.amount}
              onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
              className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
              placeholder="Enter your bid amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={bidForm.message}
              onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
              className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
              rows="3"
              placeholder="Add a message about your bid..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowBidForm(false)}
              className="flex-1 bg-gray-100 text-gray-600 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#FF5733] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#FF5733]/90"
            >
              Submit Bid
            </button>
          </div>
        </form>
      )}

      {/* Time Suggestion Form */}
      {showTimeSuggestion && (
        <form onSubmit={handleTimeSuggestion} className="mt-4 md:mt-6 space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Date</label>
            <input
              type="date"
              required
              value={timeSuggestion.date}
              onChange={(e) => setTimeSuggestion({ ...timeSuggestion, date: e.target.value })}
              className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Time</label>
            <input
              type="time"
              required
              value={timeSuggestion.time}
              onChange={(e) => setTimeSuggestion({ ...timeSuggestion, time: e.target.value })}
              className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={timeSuggestion.message}
              onChange={(e) => setTimeSuggestion({ ...timeSuggestion, message: e.target.value })}
              className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
              rows="3"
              placeholder="Add a message about your suggested time..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowTimeSuggestion(false)}
              className="flex-1 bg-gray-100 text-gray-600 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600"
            >
              Suggest Time
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 