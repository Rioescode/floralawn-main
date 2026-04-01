import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { businessInfo } from "@/utils/business-info";

export const metadata = {
  title: 'Liability Waiver | RIYardworks',
  description: 'Customer liability waiver and release of claims for lawn care and landscaping services.',
};

export default function LiabilityWaiver() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Liability Waiver</h1>

      <div className="prose prose-lg">
        <h2 className="text-xl font-semibold mb-4">1. Acknowledgment of Risks</h2>
        <p className="mb-6">
          By using our services, you acknowledge that home improvement and repair work involves inherent risks. These risks may include, but are not limited to, property damage, personal injury, or unforeseen complications during the work process.
        </p>

        <h2 className="text-xl font-semibold mb-4">2. Assumption of Risk</h2>
        <p className="mb-6">
          You voluntarily agree to assume all risks associated with the services provided through our platform, whether known or unknown, and accept full responsibility for any damages or injuries that may occur.
        </p>

        <h2 className="text-xl font-semibold mb-4">3. Release of Liability</h2>
        <p className="mb-6">
          You agree to release, waive, discharge, and covenant not to sue the platform, its officers, employees, and agents from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained by you or your property.
        </p>

        <h2 className="text-xl font-semibold mb-4">4. Indemnification</h2>
        <p className="mb-6">
          You agree to indemnify and hold harmless the platform from any loss, liability, damage, or costs that may be incurred due to your participation in or use of the services.
        </p>

        <h2 className="text-xl font-semibold mb-4">5. Property Access</h2>
        <p className="mb-6">
          You acknowledge that by engaging a service provider through our platform, you are granting them necessary access to your property to perform the requested services. You are responsible for ensuring the safety and security of your property and belongings.
        </p>

        <h2 className="text-xl font-semibold mb-4">6. Insurance</h2>
        <p className="mb-6">
          While our professionals are required to maintain their own insurance, you understand that this does not replace your responsibility to maintain appropriate property and liability insurance coverage.
        </p>

        <h2 className="text-xl font-semibold mb-4">7. Severability</h2>
        <p className="mb-6">
          If any portion of this waiver is found to be void or unenforceable, the remaining portions shall remain in full force and effect.
        </p>

        <h2 className="text-xl font-semibold mb-4">8. Acknowledgment</h2>
        <p className="mb-6">
          By accepting this waiver, you acknowledge that you have read and understood its contents, and are waiving substantial legal rights, including the right to sue. You acknowledge that you are accepting this waiver voluntarily and without any inducement.
        </p>

        <div className="mt-8 text-sm text-gray-600">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
} 