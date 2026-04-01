// Professional contractor agreement
// (Create new file with professional-specific terms) 

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { businessInfo } from "@/utils/business-info";

export const metadata = {
  title: 'Professional Service Agreement | RIYardworks',
  description: 'Terms and conditions for service providers working with RIYardworks.',
};

export default function ContractorAgreement() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Professional Contractor Agreement</h1>

      <div className="prose prose-lg">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="font-medium text-amber-800">
            IMPORTANT: By using our platform, you explicitly agree to all terms in this agreement. We are solely a connection platform between professionals and customers. We do not guarantee work, verify credentials, handle payments, or participate in service delivery.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4">1. Platform Role & Limitations</h2>
        <p className="mb-6">
          You explicitly acknowledge and agree that:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>The platform is solely a connection service between professionals and customers</li>
          <li>We do not guarantee any amount of work or income</li>
          <li>We do not verify credentials, licenses, or insurance coverage</li>
          <li>We are not responsible for any customer interactions, disputes, or outcomes</li>
          <li>We do not participate in or guarantee any payments</li>
          <li>We make no warranties about customer reliability or job completion</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">2. Independent Contractor Status</h2>
        <p className="mb-6">
          You acknowledge that you are an independent contractor and not an employee of the platform. This agreement does not create an employer-employee relationship, partnership, or joint venture between you and the platform. You are solely responsible for your business operations, including all tax obligations, insurance, and compliance requirements.
        </p>

        <h2 className="text-xl font-semibold mb-4">3. Professional Obligations</h2>
        <p className="mb-6">
          As a professional contractor, you agree to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Maintain all required licenses, permits, and certifications</li>
          <li>Carry appropriate insurance coverage</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Perform services with professional skill and care</li>
          <li>Maintain accurate records of all work performed</li>
          <li>Handle all payment transactions professionally and provide receipts to customers</li>
          <li>Never misrepresent your qualifications or capabilities</li>
          <li>Report any significant incidents or customer disputes to the platform</li>
          <li>Maintain professional conduct at all times</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">4. Insurance & Liability</h2>
        <p className="mb-6">
          You must maintain, at your own expense and provide proof upon request:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>General liability insurance (minimum $1,000,000 coverage)</li>
          <li>Professional liability insurance (minimum $1,000,000 coverage)</li>
          <li>Workers' compensation insurance (if you have employees)</li>
          <li>Commercial vehicle insurance (if using vehicles for service)</li>
          <li>Any additional insurance required by local regulations</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">5. Service Standards & Safety</h2>
        <p className="mb-6">
          You agree to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Arrive on time for scheduled appointments</li>
          <li>Communicate professionally with customers</li>
          <li>Complete work within agreed timeframes</li>
          <li>Maintain cleanliness and safety at work sites</li>
          <li>Follow industry best practices and standards</li>
          <li>Provide clear pricing and payment terms to customers</li>
          <li>Handle payment collection professionally and securely</li>
          <li>Use appropriate safety equipment and procedures</li>
          <li>Never perform work beyond your capabilities or qualifications</li>
          <li>Document any pre-existing damage or issues before work begins</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">6. Payment & Financial Responsibility</h2>
        <p className="mb-6">
          You explicitly understand and agree that:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>All payments are handled directly between you and the customer</li>
          <li>The platform never participates in payment processing or disputes</li>
          <li>You are solely responsible for collecting payment from customers</li>
          <li>You must provide clear receipts for all services rendered</li>
          <li>You are responsible for all taxes on your earnings</li>
          <li>You must maintain proper records of all transactions</li>
          <li>Any payment disputes are solely between you and the customer</li>
          <li>The platform cannot assist in collecting unpaid debts</li>
          <li>You should establish clear payment terms before starting work</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">7. Confidentiality & Data Protection</h2>
        <p className="mb-6">
          You agree to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Maintain strict confidentiality of customer information</li>
          <li>Not share customer data with third parties</li>
          <li>Protect customer personal and financial information</li>
          <li>Use customer information only for service delivery</li>
          <li>Delete customer information when no longer needed</li>
          <li>Report any data breaches immediately</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">8. Non-Circumvention & Platform Integrity</h2>
        <p className="mb-6">
          You agree not to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Circumvent the platform by directly soliciting platform customers for 12 months</li>
          <li>Share platform customer lists or contact information</li>
          <li>Encourage customers to bypass the platform</li>
          <li>Misrepresent your relationship with the platform</li>
          <li>Damage the platform's reputation or relationships</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">9. Termination & Suspension</h2>
        <p className="mb-6">
          The platform reserves the right to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Terminate or suspend your account immediately for violations</li>
          <li>Remove your listings without prior notice</li>
          <li>Restrict your access to certain features</li>
          <li>Report serious violations to authorities</li>
          <li>Maintain records of terminated accounts</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4">10. Indemnification & Legal</h2>
        <p className="mb-6">
          You agree to:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Indemnify and hold the platform harmless from all claims</li>
          <li>Cover all legal costs related to your services</li>
          <li>Resolve disputes directly with customers</li>
          <li>Not involve the platform in customer disputes</li>
          <li>Accept full responsibility for your services</li>
          <li>Defend the platform against any claims related to your services</li>
        </ul>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-700">By using our platform, you acknowledge:</p>
          <ul className="list-disc pl-6 mt-2 text-gray-600">
            <li>You have read and understood this entire agreement</li>
            <li>You accept all terms and conditions</li>
            <li>You understand the platform's limited role</li>
            <li>You accept full responsibility for your services</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
} 