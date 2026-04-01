  {selectedEvent && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {showRescheduleForm ? 'Reschedule Job' : selectedEvent.title}
          </h3>
          <button 
            onClick={() => {
              setSelectedEvent(null);
              setShowRescheduleForm(false);
              setRescheduleForm({ date: '', time: '', reason: '' });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )} 