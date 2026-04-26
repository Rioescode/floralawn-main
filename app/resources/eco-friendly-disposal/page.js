import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Eco-Friendly Disposal Practices | RIJunkRemovall',
  description: 'Learn about our environmentally responsible disposal methods. We prioritize recycling and donation to minimize landfill impact.',
};

export default function EcoFriendlyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Eco-Friendly Disposal
          </h1>
          
          <div className="prose max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Our Environmental Commitment</h2>
            <p className="mb-6">
              At RIJunkRemovall, we're committed to environmentally responsible disposal practices. 
              We prioritize recycling and donation whenever possible to minimize landfill impact.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Recycling Process</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">1.</span>
                    Sorting of recyclable materials
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">2.</span>
                    Proper material separation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">3.</span>
                    Partnership with recycling centers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">4.</span>
                    Documentation of disposal
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Donation Program</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">1.</span>
                    Assessment of item condition
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">2.</span>
                    Local charity partnerships
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">3.</span>
                    Direct delivery to organizations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">4.</span>
                    Tax deduction documentation
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-[#FF5733] text-white p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-2">Support Our Green Initiative</h3>
              <p className="mb-4">
                Choose eco-friendly junk removal for your next cleanup project.
              </p>
              <a 
                href="tel:4013890913"
                className="inline-block bg-white text-[#FF5733] px-6 py-3 rounded-lg font-medium"
              >
                Call (401) 389-0913
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 