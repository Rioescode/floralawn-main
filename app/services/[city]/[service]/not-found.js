import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ServiceNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Service Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          Sorry, we couldn't find the service you're looking for.
        </p>
        <div className="space-y-4">
          <Link
            href="/services"
            className="inline-block bg-[#FF5733] text-white px-8 py-3 rounded-lg hover:bg-[#E64A2E] transition-colors"
          >
            View All Services
          </Link>
          <div>
            <Link
              href="/"
              className="inline-block text-[#FF5733] hover:text-[#E64A2E] mt-4"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 