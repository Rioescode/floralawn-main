'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  GiftIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ShareIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function ReferralProgramPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <GiftIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Referral Program</h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8">
              Refer friends and earn rewards! Share your unique code and get rewarded when they sign up.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Your Code</h3>
                <p className="text-gray-600">
                  Sign up and receive your unique referral code (e.g., FLORA123456)
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Share With Friends</h3>
                <p className="text-gray-600">
                  Share your code via email, social media, or word of mouth
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                <p className="text-gray-600">
                  When they sign up and complete their first service, you both get rewarded!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Progressive Rewards */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Progressive Reward System</h2>
            <p className="text-center text-gray-600 mb-12">
              The more referrals you get, the more you earn! Rewards increase with each successful referral.
            </p>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
                Fast Growth (First 5 Referrals)
              </h3>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5].map((num) => {
                  const amount = 20 + (num * 5);
                  return (
                    <div key={num} className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">{num}{num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'}</div>
                      <div className="text-2xl font-bold text-green-600">${amount}</div>
                      <div className="text-xs text-gray-500">+$5</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
                Steady Growth (6th - 25th Referrals)
              </h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-4 mb-4">
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => {
                  const amount = 45 + ((num - 5) * 2);
                  return (
                    <div key={num} className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-xs text-gray-600 mb-1">{num}{num === 11 ? 'th' : num === 12 ? 'th' : num === 13 ? 'th' : 'th'}</div>
                      <div className="text-lg font-bold text-blue-600">${amount}</div>
                      <div className="text-xs text-gray-500">+$2</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 text-center">
                16th-24th: +$2 each • 25th+: Maximum $100 per referral
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Join?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Share</h3>
                    <p className="text-gray-600">
                      Get a unique code you can share anywhere - email, social media, or in person
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Credits</h3>
                    <p className="text-gray-600">
                      Rewards are automatically applied as credits to your next service
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <UserGroupIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Help Friends Save</h3>
                    <p className="text-gray-600">
                      Your friends get discounts on their first service when they use your code
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <ShareIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Your Progress</h3>
                    <p className="text-gray-600">
                      Monitor your referrals and rewards in your dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Program Details</h2>
            <div className="bg-white rounded-lg shadow-md p-8">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Rewards are awarded after the referee completes their first paid service</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Service credits are automatically applied to your next scheduled service</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Rewards are typically processed within 7-14 business days after referral completion</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Service credits cannot be exchanged for cash and are non-transferable</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Service credits expire if not used within 90 days of being awarded</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Only one reward per referral - the same person cannot be referred multiple times</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You must be an active customer with scheduled services to receive and use service credits</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-green-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Sign up today and get your unique referral code!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg"
              >
                Sign Up Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-700 text-white rounded-lg font-semibold text-lg hover:bg-green-800 transition-colors shadow-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

