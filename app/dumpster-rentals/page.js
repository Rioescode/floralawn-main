"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DumpsterForm from "@/app/components/DumpsterForm";
import DumpsterList from "@/app/components/DumpsterList";

export default function DumpsterRentalsPage() {
  const [refreshList, setRefreshList] = useState(false);

  const handleDumpsterAdded = () => {
    setRefreshList(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dumpster Rentals
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Need a dumpster or have one to rent? Connect with local providers and find the perfect solution for your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Listing Form */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <DumpsterForm onSuccess={handleDumpsterAdded} />
          </div>

          {/* Right Column - Available Dumpsters */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Dumpsters</h2>
            <DumpsterList key={refreshList} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 