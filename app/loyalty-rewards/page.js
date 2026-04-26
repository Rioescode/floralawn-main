'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  StarIcon,
  GiftIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function LoyaltyRewardsPage() {
  const tiers = [
    {
      name: 'Bronze',
      color: 'from-amber-600 to-amber-800',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      points: '0-999',
      services: '0-7',
      benefits: ['Earn 1 point per $1 spent', 'Minimum 10 points per service', 'Track your progress']
    },
    {
      name: 'Silver',
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      points: '1,000-1,999',
      services: '8-14',
      benefits: ['All Bronze benefits', 'Priority customer support', 'Special seasonal offers']
    },
    {
      name: 'Gold',
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      points: '2,000-4,999',
      services: '15-24',
      benefits: ['All Silver benefits', 'Exclusive discounts', 'Early access to new services']
    },
    {
      name: 'Platinum',
      color: 'from-purple-500 to-purple-700',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      points: '5,000+',
      services: '25+',
      benefits: ['All Gold benefits', 'VIP treatment', 'Maximum rewards', 'Dedicated support']
    }
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <StarIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Loyalty Rewards Program</h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8">
              Earn points with every service and unlock exclusive rewards!
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              Join Now
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
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Earn Points</h3>
                <p className="text-gray-600">
                  Get 1 point for every $1 you spend on our services. Minimum 10 points per service.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Level Up</h3>
                <p className="text-gray-600">
                  Unlock higher tiers (Bronze → Silver → Gold → Platinum) as you earn more points.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <GiftIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Redeem Rewards</h3>
                <p className="text-gray-600">
                  Convert your points to service credits. 1 point = $0.02 (minimum 1,250 points = $25).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Loyalty Tiers</h2>
            <p className="text-center text-gray-600 mb-12">
              The more you use our services, the more you earn! Reach higher tiers for better benefits.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier) => (
                <div key={tier.name} className={`${tier.bgColor} rounded-xl p-6 shadow-md border-2 border-transparent hover:border-${tier.textColor.split('-')[1]}-300 transition-all`}>
                  <div className={`bg-gradient-to-br ${tier.color} text-white rounded-lg p-4 mb-4 text-center`}>
                    <StarIcon className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Points:</span> {tier.points}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Services:</span> {tier.services}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircleIcon className={`h-4 w-4 ${tier.textColor} flex-shrink-0 mt-0.5`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Point Value */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Point Value & Redemption</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Earning Points</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>1 point per $1 spent on services</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Minimum 10 points per service</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Points awarded automatically after service completion</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Redeeming Points</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>1 point = $0.02 in service credits</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Minimum redemption: 1,250 points ($25.00)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Credits applied automatically to your next service</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Program Benefits</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Automatic Enrollment</h3>
                  <p className="text-gray-600">
                    All customers are automatically enrolled when they sign up - no extra steps needed!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">1 Year Expiration</h3>
                  <p className="text-gray-600">
                    Points expire 1 year after being earned - use them before they expire!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Everything</h3>
                  <p className="text-gray-600">
                    View your points balance, tier status, and transaction history in your dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Redemption</h3>
                  <p className="text-gray-600">
                    Redeem points anytime through your dashboard - credits apply automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Program Terms</h2>
            <div className="bg-white rounded-lg shadow-md p-8">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Points are awarded automatically after service completion</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Minimum redemption is 1,250 points ($25.00)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Service credits cannot be exchanged for cash</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Credits are applied automatically to your next scheduled service</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Points expire 1 year after being earned - check your dashboard for expiration dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tier status is calculated based on total points earned or total services completed</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Program terms and point values are subject to change with notice</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-green-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start Earning Points Today!
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Sign up and automatically enroll in our loyalty rewards program
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
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

