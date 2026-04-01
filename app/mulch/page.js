"use client";

import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { IMAGES } from '@/utils/constants';

export default function MulchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <header className="bg-gray-800 text-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Mulch Selection</h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Explore the different colors and styles of mulch we offer to enhance your landscape.
            </p>
          </div>
        </header>

        {/* Black Mulch Gallery Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Black Mulch</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Classic and versatile, black mulch provides a clean look and helps retain soil moisture.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {IMAGES.BLACK_MULCH.map((image, index) => (
                <div key={`black-${index}`} className="relative aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <Image
                    src={image}
                    alt={`Black mulch installation ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    priority={index < 3} // Prioritize loading first few images
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Red Mulch Gallery Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Red Mulch</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Add a vibrant pop of color to your landscape with our rich red mulch.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {IMAGES.RED_MULCH.map((image, index) => (
                <div key={`red-${index}`} className="relative aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <Image
                    src={image}
                    alt={`Red mulch installation ${index + 1}`}
                    fill
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brown Mulch Gallery Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Brown Mulch</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A natural and earthy tone, brown mulch complements a wide range of plantings.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {IMAGES.BROWN_MULCH.map((image, index) => (
                <div key={`brown-${index}`} className="relative aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <Image
                    src={image}
                    alt={`Brown mulch installation ${index + 1}`}
                    fill
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dark Brown Mulch Gallery Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Dark Brown Mulch</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Achieve a rich, sophisticated look with our deep dark brown mulch.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {IMAGES.DARK_BROWN_MULCH.map((image, index) => (
                <div key={`dark-brown-${index}`} className="relative aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <Image
                    src={image}
                    alt={`Dark brown mulch installation ${index + 1}`}
                    fill
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
} 