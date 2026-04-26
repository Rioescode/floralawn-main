import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'What We Take - Accepted Items | RIJunkRemovall',
  description: 'Complete list of items we accept for junk removal. From furniture to appliances, learn what we can help you remove.',
};

export default function WhatWeTakePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            What We Take
          </h1>
          
          <div className="prose max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Accepted Items</h2>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Furniture (sofas, chairs, tables)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Appliances
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Electronics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Construction debris
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Yard waste
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Office equipment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Hot tubs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#FF5733]">✓</span>
                    Mattresses
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">Not Accepted</h2>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    Hazardous waste
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    Paint/chemicals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    Oil/gasoline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    Asbestos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    Medical waste
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-[#FF5733] text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Not Sure What We Take?</h3>
              <p className="mb-4">
                Contact us to discuss your specific items. We're happy to help determine what we can remove.
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