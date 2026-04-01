<div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Social Media Links
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="url"
                        placeholder="Facebook URL"
                        value={profileForm.social_media?.facebook || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, facebook: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                      />
                      <input
                        type="url"
                        placeholder="Instagram URL"
                        value={profileForm.social_media?.instagram || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, instagram: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                      />
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        value={profileForm.social_media?.linkedin || ''}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, linkedin: e.target.value }
                        })}
                        className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm(profile);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF5733] text-white px-6 py-2 rounded-lg hover:bg-[#FF5733]/90 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <img 
                    src={getProfileImage(profile, user)}
                    alt={profile?.business_name || user?.email}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{profile?.business_name}</h3>
                    <p className="text-gray-600 mt-2">{profile?.business_description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700">Service Areas</h4>
                    <p className="text-gray-600 mt-1">{profile?.service_area?.join(', ')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Years of Experience</h4>
                    <p className="text-gray-600 mt-1">{profile?.years_experience}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">License Number</h4>
                    <p className="text-gray-600 mt-1">{profile?.license_number}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Insurance Information</h4>
                    <p className="text-gray-600 mt-1">{profile?.insurance_info}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Contact Information</h4>
                    <div className="space-y-1 mt-1">
                      <p className="text-gray-600">Email: {profile?.contact_email}</p>
                      <p className="text-gray-600">Phone: {profile?.contact_phone}</p>
                      <p className="text-gray-600">Website: {profile?.website_url}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Social Media</h4>
                    <div className="space-y-1 mt-1">
                      {profile?.social_media?.facebook && (
                        <a href={profile.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Facebook</a>
                      )}
                      {profile?.social_media?.instagram && (
                        <a href={profile.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Instagram</a>
                      )}
                      {profile?.social_media?.linkedin && (
                        <a href={profile.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">LinkedIn</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* My Bids Section */}
      {activeSection === 'bids' && (
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                <span className="text-[#FF5733]">My Bids</span>
                </h2>
                <div className="bg-[#FF5733]/10 px-4 py-2 rounded-full">
                <span className="text-[#FF5733] font-medium">Total Bids: {myBids.length}</span>
                </div>
              </div>

            {myBids.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-5xl mb-4">🤝</div>
                  <p className="text-gray-500 text-lg">You haven't placed any bids yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Your bid history will appear here</p>
          </div>
        ) : (
                <div className="grid gap-6">
                {myBids.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-800 hover:text-[#FF5733] transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-500">Posted by:</span>
                            <span className="font-medium text-gray-700">{job.customer.full_name}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                            job.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                            job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        {job.bids?.filter(bid => bid.professional_id === user.id).map(bid => (
                            <span key={bid.id} className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                              bid.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              bid.status === 'rejected' ? 'bg-red-50 text-red-800 border border-red-100' :
                              'bg-amber-50 text-amber-800 border border-amber-100'
                            }`}>
                            Bid {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Budget</div>
                        <div className="text-lg font-semibold space-y-1">
                          <div className="text-gray-800">Customer: ${job.budget}</div>
                          {job.bids?.filter(bid => bid.professional_id === user.id).map(bid => (
                            <div key={bid.id} className="text-[#FF5733]">Your Bid: ${bid.amount}</div>
                          ))}
                        </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Needed By</div>
                          <div className="text-lg font-semibold text-gray-800">
                            {new Date(job.date_needed).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                          <div className="text-lg font-semibold text-gray-800">{job.location}</div>
                        </div>
                      </div>

                    {/* Photos Gallery */}
                    {job.job_photos && job.job_photos.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Job Photos</h4>
                        <div className="grid grid-cols-5 gap-4">
                          {job.job_photos.map((photo, index) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.photo_url}
                                alt={`Job photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo.photo_url, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Your Bid Details</h4>
                      {job.bids?.filter(bid => bid.professional_id === user.id).map(bid => (
                          <div key={bid.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-baseline space-x-2">
                                  <span className="text-sm font-medium text-gray-500">Your Bid:</span>
                                  <span className="text-xl font-bold text-[#FF5733]">${bid.amount}</span>
                                </div>
                                <p className="text-gray-600 text-sm">{bid.message}</p>
                              </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {new Date(bid.created_at).toLocaleDateString()}
                              </span>
                              {bid.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setSelectedJob(job.id);
                                    setBidForm({
                                      amount: bid.amount,
                                      message: bid.message
                                    });
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Update Bid
                                </button>
                              )}
                            </div>
                      </div>

                          {selectedJob === job.id && (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleBidSubmit(job.id, true);
                              }}
                              className="mt-4 space-y-4"
                            >
                  <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Bid Amount ($)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={bidForm.amount}
                                  onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                                  className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                                  placeholder="Enter your new bid amount"
                                />
                                      </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Message</label>
                                <textarea
                                  value={bidForm.message}
                                  onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                                  className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                                  rows="3"
                                  placeholder="Update your bid message..."
                                />
                                    </div>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJob(null);
                                    setBidForm({ amount: '', message: '' });
                                  }}
                                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 bg-[#FF5733] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#FF5733]/90"
                                >
                                  Update Bid
                                </button>
                                  </div>
                            </form>
                          )}
                          </div>
                        ))}
                      </div>

                          {/* Time Suggestions Section */}
                          {job.time_suggestions && job.time_suggestions.length > 0 && (
                        <div className="mt-6 border-t border-gray-100 pt-6">
                              <h4 className="font-semibold text-gray-800 mb-4">Time Suggestions</h4>
                          <div className="space-y-4">
                                {job.time_suggestions
                                  .filter(suggestion => suggestion.professional_id === user.id)
                                  .map(suggestion => (
                                    <div key={suggestion.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                              suggestion.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                              suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {suggestion.status}
                                      </span>
                                    </div>
                                          <div className="text-gray-600">
                                            <div>Date: {suggestion.suggested_date}</div>
                                            <div>Time: {suggestion.suggested_time}</div>
                                  </div>
                                          {suggestion.message && (
                                            <p className="mt-2 text-gray-600 text-sm bg-gray-50 p-2 rounded-lg">
                                              {suggestion.message}
                                            </p>
                                          )}
                                </div>
                                        {suggestion.status === 'pending' && (
                                          <button
                                            onClick={() => {
                                              setSelectedJob(`time_${job.id}`);
                                              setTimeSuggestion({
                                                date: suggestion.suggested_date,
                                                time: suggestion.suggested_time,
                                                message: suggestion.message || ''
                                              });
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            Update Time
                                          </button>
                                        )}
                                      </div>
                                      {selectedJob === `time_${job.id}` && (
                                        <form 
                                          onSubmit={(e) => {
                                            e.preventDefault();
                                            handleTimeSuggestion(job.id, suggestion.id);
                                          }}
                                          className="mt-4 space-y-4"
                                        >
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                                              <input
                                                type="date"
                                                required
                                                value={timeSuggestion.date}
                                                onChange={(e) => setTimeSuggestion({...timeSuggestion, date: e.target.value})}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                                              <input
                                                type="time"
                                                required
                                                value={timeSuggestion.time}
                                                onChange={(e) => setTimeSuggestion({...timeSuggestion, time: e.target.value})}
                                                className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">New Message</label>
                                            <textarea
                                              value={timeSuggestion.message}
                                              onChange={(e) => setTimeSuggestion({...timeSuggestion, message: e.target.value})}
                                              className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
                                              rows="3"
                                              placeholder="Update your time suggestion message..."
                                            />
                                          </div>
                                          <div className="flex gap-4">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedJob(null);
                                                setTimeSuggestion({ date: '', time: '', message: '' });
                                              }}
                                              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="submit"
                                              className="flex-1 bg-[#FF5733] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#FF5733]/90"
                                            >
                                              Update Time
                                            </button>
                                          </div>
                                        </form>
                                      )}
                              </div>
                            ))}
                          </div>
                            </div>
                          )}

                    {/* Add New Bid Button */}
                    {job.status === 'open' && !job.bids?.some(bid => bid.professional_id === user.id) && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setSelectedJob(job.id);
                            setBidForm({ amount: '', message: '' });
                          }}
                          className="w-full bg-[#FF5733] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#FF5733]/90"
                        >
                          Place New Bid
                        </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* My Jobs Section */}
        {activeSection === 'jobs' && (
          <section className="mb-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800">
                  <span className="text-[#FF5733]">My Jobs</span>
                </h2>
                <div className="bg-[#FF5733]/10 px-4 py-2 rounded-full">
                  <span className="text-[#FF5733] font-medium">Active Jobs: {myJobs.length}</span>
                </div>
              </div>

              {myJobs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-500 text-lg">You don't have any active jobs yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Jobs you're working on will appear here</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {myJobs.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-800 hover:text-[#FF5733] transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
                        <button
                          onClick={() => handleShowCustomerProfile(job.customer)}
                          className="text-sm text-gray-500 hover:text-[#FF5733] flex items-center gap-1"
                        >
                          <span>Customer: {job.customer.full_name}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                  </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status === 'in_progress' ? 'in progress' : job.status}
                  </span>
                </div>

                      <div className="mt-6 grid grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Budget</div>
                        <div className="text-lg font-semibold space-y-1">
                          <div className="text-gray-800">Customer: ${job.budget}</div>
                          {job.bids?.map(bid => 
                            bid.professional_id === user.id && (
                              <div key={bid.id} className="text-[#FF5733]">Your Bid: ${bid.amount}</div>
                            )
                          )}
                        </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Needed By</div>
                          <div className="text-lg font-semibold text-gray-800">
                            {new Date(job.date_needed).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                          <div className="text-lg font-semibold text-gray-800">{job.location}</div>
                        </div>
                </div>

                {job.status === 'in_progress' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Suggest New Time</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date</label>
                          <input
                            type="date"
                            value={timeSuggestion.date}
                            onChange={(e) => setTimeSuggestion({...timeSuggestion, date: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time</label>
                          <input
                            type="time"
                            value={timeSuggestion.time}
                            onChange={(e) => setTimeSuggestion({...timeSuggestion, time: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                            <textarea
                              value={timeSuggestion.message}
                              onChange={(e) => setTimeSuggestion({...timeSuggestion, message: e.target.value})}
                              placeholder="Explain why you need to change the time..."
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              rows="3"
                            />
                      </div>
                      <button
                        onClick={() => handleTimeSuggestion(job.id)}
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Suggest Time
                      </button>
                    </div>

                    {job.time_suggestions && job.time_suggestions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Suggested Times</h4>
                        <div className="space-y-2">
                          {job.time_suggestions.map(suggestion => (
                            <div key={suggestion.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">
                                  {suggestion.suggested_date} at {suggestion.suggested_time}
                                </span>
                                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                  suggestion.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  suggestion.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {suggestion.status}
                                </span>
                              </div>
                                  <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {new Date(suggestion.created_at).toLocaleDateString()}
                              </span>
                                    {suggestion.status === 'pending' && (
                                      <button
                                        onClick={() => {
                                          setSelectedJob(`time_${job.id}`);
                                          setTimeSuggestion({
                                            date: suggestion.suggested_date,
                                            time: suggestion.suggested_time,
                                            message: suggestion.message || ''
                                          });
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Update Time
                                      </button>
                                    )}
                                  </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Upload Photos</h4>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(job.id, e.target.files[0])}
                        disabled={uploadingPhoto}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    {job.job_photos && job.job_photos.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Job Photos</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {job.job_photos.map(photo => (
                            <img
                              key={photo.id}
                              src={photo.photo_url}
                              alt="Job progress"
                              className="w-full h-32 object-cover rounded"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <CompletionChecklist 
                        onAccept={handleCompletionChecklist(job.id)} 
                        initialState={completionChecklists[job.id]}
                      />
                    </div>

                    <button
                      onClick={() => markJobComplete(job.id)}
                      disabled={loading || !completionChecklists[job.id] || !Object.values(completionChecklists[job.id] || {}).every(Boolean)}
                      className={`w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                        loading ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Completing...' : 'Mark as Complete'}
                    </button>
                  </div>
                )}

                {job.status === 'completed' && job.job_photos && job.job_photos.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Completed Work Photos</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {job.job_photos.map(photo => (
                        <img
                          key={photo.id}
                          src={photo.photo_url}
                          alt="Completed work"
                          className="w-full h-32 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {job.reviews && job.reviews.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Customer Reviews</h4>
                    <div className="space-y-4">
                      {job.reviews.map(review => (
                        <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-yellow-400">
                                  {'★'.repeat(review.rating)}
                                  <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  by {review.reviewer.full_name}
                                </span>
                              </div>
                              <p className="mt-2 text-gray-700">{review.comment}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
            </div>
          </section>
        )}

        {/* Available Jobs Section */}
        {activeSection === 'available' && (
        <AvailableJobsSection
          jobs={jobs}
          user={user}
          supabase={supabase}
          loadJobs={loadJobs}
          setToast={setToast}
        />
      )}

      {/* Customer Profile Modal */}
      {showCustomerProfile && (
        <CustomerProfileModal
          customer={selectedCustomer}
          onClose={() => setShowCustomerProfile(false)}
        />
      )}
    </div>
  );
} 