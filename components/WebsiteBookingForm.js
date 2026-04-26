'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { sendNotification } from '@/lib/notifications';

const WEBSITE_SERVICES = {
  'Basic Website': {
    price: '$399',
    monthly: '$29/mo',
    description: 'Perfect for businesses that just need a simple, professional website',
    features: [
      '3-Page Custom Website',
      'Mobile-Friendly Design',
      'Domain Name (1 year)',
      'Business Email',
      'Contact Form',
      'Basic SEO Setup'
    ]
  },
  'Starter Package': {
    price: '$1,200',
    monthly: '$29/mo',
    description: 'For businesses ready to grow with digital marketing',
    features: [
      '5-Page Custom Website',
      'Mobile-First Design',
      'Basic SEO Package',
      'Contact Forms',
      'Business Email Setup',
      'Social Media Integration'
    ]
  },
  'Growth Package': {
    price: '$1,900',
    monthly: '$200/mo',
    description: 'Ideal for businesses ready to accelerate their online growth',
    features: [
      'Everything in Starter +',
      'AI Booking System',
      'Customer Portal',
      'Advanced SEO Package',
      'Content Strategy',
      'Email Marketing Setup'
    ]
  }
};

const INDUSTRIES = [
  'Landscaping & Lawn Care',
  'Home Services',
  'Construction',
  'Professional Services',
  'Healthcare',
  'Restaurant & Food',
  'Retail',
  'Automotive',
  'Real Estate',
  'Other'
];

export default function WebsiteBookingForm({ selectedDate, onSuccess }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    industry: '',
    websiteType: '',
    currentWebsite: '',
    monthlyBudget: '',
    competitors: '',
    targetArea: '',
    goals: '',
    timeline: 'Within 1 month',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setUser(user);
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            name: profile?.full_name || user.user_metadata?.full_name || '',
            phone: profile?.phone || '',
            businessName: profile?.business_name || ''
          }));
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'websiteType') {
      setSelectedPackage(WEBSITE_SERVICES[value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!user) {
        setError('Please log in to book a consultation.');
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          customer_id: user.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          service_type: 'Website Development',
          city: formData.targetArea,
          street_address: 'N/A - Website Consultation',
          date: selectedDate.toISOString(),
          notes: `Business Details:
- Business Name: ${formData.businessName}
- Industry: ${formData.industry}
- Target Service Area: ${formData.targetArea}

Package Selection:
- Website Package: ${formData.websiteType}
- Setup Fee: ${selectedPackage?.price}
- Monthly Fee: ${selectedPackage?.monthly}

Current Online Presence:
- Website: ${formData.currentWebsite || 'None'}
- Main Competitors: ${formData.competitors}

Project Details:
- Timeline: ${formData.timeline}
- Monthly Budget: ${formData.monthlyBudget}
- Business Goals: ${formData.goals}

Additional Notes:
${formData.notes}`,
          status: 'pending',
          booking_type: 'Website Consultation'
        }])
        .select()
        .single();

      if (error) throw error;

      const notificationMessage = `🌐 New Website Consultation!\n\n` +
        `👤 Customer: ${formData.name}\n` +
        `🏢 Business: ${formData.businessName}\n` +
        `🏭 Industry: ${formData.industry}\n` +
        `🏭 Phone: ${formData.phone}\n` +
        `📅 Date: ${format(selectedDate, 'PPpp')}\n` +
        `💻 Package: ${formData.websiteType}\n` +
        `💰 Setup: ${selectedPackage?.price}\n` +
        `💳 Monthly: ${selectedPackage?.monthly}\n` +
        `📍 Service Area: ${formData.targetArea}\n` +
        `⏰ Timeline: ${formData.timeline}\n` +
        `🎯 Goals: ${formData.goals}\n` +
        `🔗 Current Site: ${formData.currentWebsite || 'None'}\n` +
        `📝 Notes: ${formData.notes || 'No notes provided'}`;
      
      await sendNotification(notificationMessage);

      setFormData({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        industry: '',
        websiteType: '',
        currentWebsite: '',
        monthlyBudget: '',
        competitors: '',
        targetArea: '',
        goals: '',
        timeline: 'Within 1 month',
        notes: ''
      });
      setSelectedPackage(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to schedule consultation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold mb-2 text-gray-800">
          Selected Date & Time
        </label>
        <div className="p-3 bg-gray-50 rounded-xl text-gray-900 border-2 border-gray-200">
          {format(selectedDate, 'MMMM d, yyyy h:mm a')}
        </div>
        <p className="mt-2 text-sm text-gray-500 italic">
          * We'll confirm your preferred time or suggest alternatives based on availability.
        </p>
      </div>

      {/* Business Information Section */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Business Information</h3>
        
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="Your business name"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            required
          >
            <option value="">Select your industry</option>
            {INDUSTRIES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Target Service Area <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="targetArea"
            value={formData.targetArea}
            onChange={handleChange}
            placeholder="e.g., Rhode Island and Southern Massachusetts"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
              disabled={user?.email}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(401) 555-0123"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
              required
            />
          </div>
        </div>
      </div>

      {/* Package Selection Section */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Package Selection</h3>
        
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Website Package <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(WEBSITE_SERVICES).map(([key, details]) => (
              <div
                key={key}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.websiteType === key
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-500'
                }`}
                onClick={() => handleChange({ target: { name: 'websiteType', value: key } })}
              >
                <div className="text-lg font-semibold mb-1">{key}</div>
                <div className="text-sm text-gray-600 mb-2">{details.description}</div>
                <div className="text-green-600 font-semibold mb-1">{details.price}</div>
                <div className="text-sm text-gray-500">{details.monthly}</div>
                <ul className="mt-3 space-y-2">
                  {details.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Online Presence */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Current Online Presence</h3>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Current Website URL
          </label>
          <input
            type="url"
            name="currentWebsite"
            value={formData.currentWebsite}
            onChange={handleChange}
            placeholder="https://your-website.com (if any)"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Main Competitors (Optional)
          </label>
          <input
            type="text"
            name="competitors"
            value={formData.competitors}
            onChange={handleChange}
            placeholder="List your main competitors' websites"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400"
          />
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Project Details</h3>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            When do you want to launch? <span className="text-red-500">*</span>
          </label>
          <select
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            required
          >
            <option value="Within 1 month">Within 1 month</option>
            <option value="1-2 months">1-2 months</option>
            <option value="2-3 months">2-3 months</option>
            <option value="3+ months">3+ months</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Business Goals <span className="text-red-500">*</span>
          </label>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            placeholder="What are your main business goals for the new website?"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400 min-h-[100px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any other details or specific features you're looking for..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-gray-400 min-h-[100px]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all
          ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          }`}
      >
        {isSubmitting ? 'Scheduling...' : 'Schedule Website Consultation'}
      </button>

      <p className="text-sm text-gray-500 text-center">
        By scheduling a consultation, you agree to our terms of service and privacy policy.
      </p>
    </form>
  );
} 