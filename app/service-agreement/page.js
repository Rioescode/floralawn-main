import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { businessInfo } from "@/utils/business-info";

export const metadata = {
  title: 'Service Agreement | RIYardworks',
  description: 'Terms and conditions for customers using RIYardworks lawn care and landscaping services.',
};

export default function ContractorAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#6B7280] mb-8">Service Agreement</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">1. Service Overview</h2>
            <p className="text-gray-600 mb-4">
              This Agreement outlines the terms between RIYardworks ("Company") and the Customer for lawn care and landscaping services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Professional lawn maintenance and landscaping services</li>
              <li>Regular scheduled maintenance available</li>
              <li>Environmentally responsible practices</li>
              <li>Licensed and insured service providers</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">2. Pricing & Payment</h2>
            <p className="text-gray-600 mb-4">Payment terms and conditions:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>All payments are handled directly between customers and service providers</li>
              <li>RIYardworks does not process or handle any payments</li>
              <li>Payment is due upon service completion, directly to the service provider</li>
              <li>Payment methods accepted are determined by individual service providers</li>
              <li>Service providers will provide estimates before work begins</li>
              <li>Any payment disputes must be resolved directly between customer and service provider</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">3. Customer Responsibilities</h2>
            <p className="text-gray-600 mb-4">Customer agrees to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide accurate item descriptions</li>
              <li>Ensure property access during service</li>
              <li>Identify items for removal</li>
              <li>Secure valuable items nearby</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">4. Service Standards</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Professional and courteous service</li>
              <li>Clean and careful removal process</li>
              <li>Property protection measures</li>
              <li>Complete cleanup after removal</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">5. Cancellation Policy</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>24-hour notice for cancellations</li>
              <li>Rescheduling options available</li>
              <li>Weather-related accommodations</li>
              <li>Late cancellation fees may apply</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">6. Satisfaction Guarantee</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>100% satisfaction guaranteed</li>
              <li>On-site issue resolution</li>
              <li>Customer support available</li>
              <li>Service quality commitment</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">7. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              For questions about our services or this agreement, contact:
            </p>
            <div className="text-gray-600">
              <p>RIYardworks</p>
              <p>{businessInfo.address.street}</p>
              <p>{businessInfo.address.city}, {businessInfo.address.state} {businessInfo.address.zip}</p>
              <p>Phone: {businessInfo.phone}</p>
              <p>Email: {businessInfo.email}</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
} 