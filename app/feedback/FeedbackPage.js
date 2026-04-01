"use client";

import { useState } from 'react';
import FeedbackForm from '../components/FeedbackForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link 
          href="/marketplace" 
          className="inline-flex items-center text-gray-600 hover:text-[#FF5733] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Marketplace
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Feedback</h1>
        
        <FeedbackForm />
      </div>
    </div>
  );
} 