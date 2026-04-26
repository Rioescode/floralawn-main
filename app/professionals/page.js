"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoginForm from '@/app/marketplace/components/LoginForm';
import RegisterForm from '@/app/marketplace/components/RegisterForm';

export default function ProfessionalsPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navigation />
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Schedule Your Lawn Care Service</h1>
          <p className="text-lg text-gray-600 mb-8">
            Book your lawn care and landscaping services with our professional team. We offer flexible scheduling to meet your needs.
          </p>
          
          <div className="flex justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRegister(true)}
              className="bg-[#FF5733] text-white px-10 py-4 rounded-xl text-xl font-semibold shadow-lg hover:bg-[#FF5733]/90 transition-colors"
            >
              Start Earning Today
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogin(true)}
              className="bg-white text-gray-900 px-10 py-4 rounded-xl text-xl font-semibold shadow-lg hover:bg-gray-100 transition-colors"
            >
              Pro Login
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Lawn Care Services?
            </h2>
            <p className="text-xl text-gray-600">
              Professional lawn care and landscaping services for your home or business
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-[#FF5733] text-4xl mb-4">💰</div>
              <h3 className="text-2xl font-semibold mb-4">Increased Revenue</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Access to high-value jobs</li>
                <li>• Set your own competitive rates</li>
                <li>• No subscription fees</li>
                <li>• Get paid quickly and securely</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-[#FF5733] text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-semibold mb-4">Quality Leads</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Pre-qualified customers</li>
                <li>• Detailed job descriptions</li>
                <li>• Local jobs in your area</li>
                <li>• Regular job notifications</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-[#FF5733] text-4xl mb-4">⚡️</div>
              <h3 className="text-2xl font-semibold mb-4">Easy Management</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• Simple bidding system</li>
                <li>• Automated scheduling</li>
                <li>• Mobile-friendly dashboard</li>
                <li>• Real-time notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Tools for Your Business
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage and grow your business in one place
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">📱</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Professional Dashboard</h3>
                  <p className="text-gray-600">Manage all your jobs, bids, and customer communications in one intuitive interface</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">📅</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
                  <p className="text-gray-600">Built-in calendar and scheduling tools to manage your appointments efficiently</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Business Analytics</h3>
                  <p className="text-gray-600">Track your performance, earnings, and customer satisfaction in real-time</p>
                </div>
              </div>
            </div>
            <div className="space-y-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">⭐️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Review System</h3>
                  <p className="text-gray-600">Build your reputation with verified customer reviews and ratings</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">💳</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                  <p className="text-gray-600">Get paid quickly and securely through our integrated payment system</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF5733] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">📸</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Photo Documentation</h3>
                  <p className="text-gray-600">Easy photo upload and storage for job documentation and customer approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Pros Are Saying
            </h2>
            <p className="text-xl text-gray-600">
              Join hundreds of successful junk removal professionals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-600 mb-6">"Since joining the platform, my business has grown by 200%. The quality of leads and the easy-to-use system makes it a no-brainer for any junk removal pro."</p>
              <div className="font-semibold">Mike R.</div>
              <div className="text-sm text-gray-500">Providence, RI</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-600 mb-6">"The platform has streamlined my entire business. From bidding to payment collection, everything is smooth and professional."</p>
              <div className="font-semibold">Sarah L.</div>
              <div className="text-sm text-gray-500">Warwick, RI</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-600 mb-6">"The support team is amazing, and the steady stream of jobs keeps my crew busy. Best decision I made for my business."</p>
              <div className="font-semibold">John D.</div>
              <div className="text-sm text-gray-500">Newport, RI</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join today and get your first month of premium features free
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRegister(true)}
              className="bg-[#FF5733] text-white px-10 py-4 rounded-xl text-xl font-semibold shadow-lg hover:bg-[#FF5733]/90 transition-colors"
            >
              Get Started Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onShowRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
        />
      )}
      
      <Footer />
    </div>
  );
} 