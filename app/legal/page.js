import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: 'Legal Documents | RIJunkworks',
  description: 'Legal agreements and policies for RIJunkworks customers and service providers.',
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#6B7280] mb-8">Legal Documents</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Documents */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-[#6B7280] mb-4">For Customers</h2>
            <p className="text-gray-600 mb-6">
              Legal documents for customers using our junk removal services
            </p>
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/legal/customer/service-agreement"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Service Agreement →
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/customer/liability-waiver"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Liability Waiver →
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Privacy Policy →
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-of-service"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Terms of Service →
                </Link>
              </li>
            </ul>
          </div>

          {/* Professional Documents */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-[#6B7280] mb-4">For Service Providers</h2>
            <p className="text-gray-600 mb-6">
              Legal documents for professional junk removal contractors
            </p>
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/legal/pro/contractor-agreement"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Contractor Agreement →
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/pro/service-standards"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Service Standards →
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/pro/insurance-requirements"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Insurance Requirements →
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Privacy Policy →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Common Documents */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[#6B7280] mb-4">Additional Resources</h2>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/legal/dispute-resolution"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Dispute Resolution Policy →
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/payment-terms"
                  className="text-[#FF5733] hover:underline font-medium"
                >
                  Payment Terms →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 