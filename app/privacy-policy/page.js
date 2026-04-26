import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { businessInfo } from "@/utils/business-info";

export const metadata = {
  title: 'Privacy Policy | Flora Lawn & Landscaping Inc',
  description: 'Learn how Flora Lawn & Landscaping Inc collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#6B7280] mb-8">Flora Lawn & Landscaping Inc Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Name and contact information (email, phone number)</li>
              <li>Service addresses and locations</li>
              <li>Payment information</li>
              <li>Service history and preferences</li>
              <li>Device and usage information when using our website</li>
              <li>SMS opt-in preferences and consent records</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">Your information helps us:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Process and fulfill service requests</li>
              <li>Communicate about appointments and services</li>
              <li>Send service completion notifications via SMS and email</li>
              <li>Improve our services and customer experience</li>
              <li>Send relevant marketing communications (with consent)</li>
              <li>Maintain security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">2.5. SMS Text Messaging</h2>
            <p className="text-gray-600 mb-4">
              When you provide your mobile phone number and opt in to receive SMS messages, we may use your phone number to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Send service completion notifications</li>
              <li>Send appointment confirmations and reminders</li>
              <li>Send marketing messages (only if you have opted in)</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
            <p className="text-gray-600 mb-4">
              <strong>Your Consent:</strong> By providing your phone number and checking the SMS opt-in box, you consent to receive automated text messages from Flora Lawn & Landscaping Inc. You are not required to consent to SMS messages as a condition of receiving our services.
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Opting Out:</strong> You can opt out at any time by replying "STOP" or "UNSUBSCRIBE" to any message, or by contacting us directly. Message and data rates may apply.
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Data Sharing:</strong> We use Twilio, a third-party SMS service provider, to send text messages. Twilio processes your phone number in accordance with their privacy policy. We do not sell your phone number to third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">3. Information Sharing</h2>
            <p className="text-gray-600 mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Service providers completing your requests</li>
              <li>Payment processors for transactions</li>
              <li>Analytics and security services</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Encryption of sensitive data</li>
              <li>Secure server infrastructure</li>
              <li>Regular security assessments</li>
              <li>Limited employee data access</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">5. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Access your personal information</li>
              <li>Request corrections to your data</li>
              <li>Delete your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>File a complaint with privacy authorities</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-4">
              Our website uses cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Remember your preferences</li>
              <li>Analyze website traffic</li>
              <li>Improve site performance</li>
              <li>Provide relevant content</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#6B7280] mb-4">7. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              For privacy-related inquiries, please contact us at:
            </p>
            <div className="text-gray-600">
              <p>Flora Lawn & Landscaping Inc</p>
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
