import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Junk Removal Cost Guide | RIJunkRemovall',
  description: 'Comprehensive guide to junk removal costs. Learn about pricing factors, average costs, and how to get the best value for your junk removal needs.',
};

export default function CostGuidePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Junk Removal Cost Guide
          </h1>
          
          <div className="prose max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">How We Price Junk Removal</h2>
            <p className="mb-6">
              Our junk removal pricing is based on the volume of items to be removed and any special handling requirements. 
              We provide transparent, upfront pricing with no hidden fees.
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-4">Basic Price Guide</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center">
                  <span>Small Load (1/8 truck)</span>
                  <span className="font-semibold">$125-175</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Quarter Load (1/4 truck)</span>
                  <span className="font-semibold">$175-225</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Half Load (1/2 truck)</span>
                  <span className="font-semibold">$275-350</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Full Load (whole truck)</span>
                  <span className="font-semibold">$450-575</span>
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Factors That Affect Price</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>Volume of items</li>
              <li>Type of items</li>
              <li>Location and accessibility</li>
              <li>Labor requirements</li>
              <li>Disposal fees</li>
            </ul>

            <div className="bg-[#FF5733] text-white p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-2">Get Your Free Quote</h3>
              <p className="mb-4">
                Contact us for an accurate quote based on your specific needs.
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