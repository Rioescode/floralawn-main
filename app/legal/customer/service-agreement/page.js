import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { businessInfo } from "@/utils/business-info";

export const metadata = {
  title: 'Service Agreement | RIJunkworks',
  description: 'Terms and conditions for customers using RIJunkworks junk removal services.',
};

export default function CustomerServiceAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Customer Service Agreement</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="font-medium text-amber-800">
              IMPORTANT: RIJunkworks is a connection platform only. We connect customers with independent service providers. 
              We do not provide services directly, handle payments, or guarantee work quality. All services are provided by 
              independent contractors who are solely responsible for their work.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Platform Role & Limitations</h2>
            <p className="text-gray-600 mb-4">You explicitly acknowledge and understand that:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>We are solely a platform connecting customers with independent service providers</li>
              <li>We do not provide junk removal services directly</li>
              <li>We do not employ or control service providers</li>
              <li>We do not guarantee service quality or completion</li>
              <li>We do not handle payments or financial transactions</li>
              <li>We are not responsible for any property damage or disputes</li>
              <li>We do not verify provider credentials or insurance (though providers agree to maintain them)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Customer Responsibilities</h2>
            <p className="text-gray-600 mb-4">As a customer, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide accurate information about items for removal</li>
              <li>Ensure safe access to items requiring removal</li>
              <li>Clearly identify items to be removed</li>
              <li>Secure or remove valuable items from the work area</li>
              <li>Obtain necessary permits or HOA approvals if required</li>
              <li>Make your own assessment of service provider suitability</li>
              <li>Handle all payments directly with service providers</li>
              <li>Document any pre-existing property damage</li>
              <li>Report any issues directly to the service provider</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Payment Terms</h2>
            <p className="text-gray-600 mb-4">You understand and agree that:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>All payments are handled directly between you and the service provider</li>
              <li>We do not process payments or handle financial transactions</li>
              <li>Service providers set their own rates and payment terms</li>
              <li>You should discuss pricing and payment terms before work begins</li>
              <li>You should obtain written estimates for large jobs</li>
              <li>You should request receipts for all payments</li>
              <li>Payment disputes must be resolved directly with the service provider</li>
              <li>We cannot assist with payment disputes or refunds</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Service Arrangements</h2>
            <p className="text-gray-600 mb-4">Regarding service arrangements:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>All service details are arranged directly with providers</li>
              <li>Scheduling is handled between you and the provider</li>
              <li>Service scope should be clearly defined before work begins</li>
              <li>Any changes should be agreed upon with the provider</li>
              <li>Cancellations should be handled directly with the provider</li>
              <li>The platform is not involved in service delivery</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Liability & Insurance</h2>
            <p className="text-gray-600 mb-4">Regarding liability:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Service providers are required to maintain their own insurance</li>
              <li>The platform does not provide any insurance coverage</li>
              <li>You should verify provider insurance if concerned</li>
              <li>Property damage claims must be filed with the provider</li>
              <li>We are not liable for any damages or losses</li>
              <li>You may wish to check your homeowner's insurance</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Dispute Resolution</h2>
            <p className="text-gray-600 mb-4">In case of disputes:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>All disputes should be addressed directly with the provider</li>
              <li>We do not mediate disputes between parties</li>
              <li>Document any issues with photos and written communication</li>
              <li>Consider local consumer protection resources if needed</li>
              <li>Legal action should be directed at the service provider</li>
              <li>The platform is not a party to service disputes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Platform Usage</h2>
            <p className="text-gray-600 mb-4">When using our platform:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Provide accurate information in all communications</li>
              <li>Do not share provider contact information</li>
              <li>Report suspicious activity to the platform</li>
              <li>Use the platform's messaging system when possible</li>
              <li>Maintain professional communication</li>
              <li>Follow platform guidelines and policies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              For platform-related questions only (not service issues), contact:
            </p>
            <div className="text-gray-600">
              <p>RIJunkworks</p>
              <p>{businessInfo.address.street}</p>
              <p>{businessInfo.address.city}, {businessInfo.address.state} {businessInfo.address.zip}</p>
              <p>Email: {businessInfo.email}</p>
            </div>
          </section>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-700">By using our platform, you acknowledge:</p>
            <ul className="list-disc pl-6 mt-2 text-gray-600">
              <li>You have read and understood this entire agreement</li>
              <li>You understand we are only a connection platform</li>
              <li>You accept responsibility for service arrangements</li>
              <li>You will resolve any issues directly with providers</li>
              <li>You understand our limitation of liability</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 