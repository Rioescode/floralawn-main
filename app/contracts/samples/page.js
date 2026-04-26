'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { DocumentTextIcon, ClipboardIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { CONTRACT_TEMPLATES, fillContractTemplate } from '../templates';

export default function ContractSamplesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState({
    CUSTOMER_NAME: 'John Doe',
    PROPERTY_ADDRESS: '123 Main Street',
    CITY: 'Providence',
    PHONE: '(401) 555-0123',
    EMAIL: 'john.doe@example.com',
    PROPERTY_SIZE: '1/2 acre',
    FREQUENCY: 'Weekly',
    DAY_OF_WEEK: 'Monday',
    START_DATE: new Date().toLocaleDateString(),
    MONTHLY_PRICE: '150',
    SPECIAL_INSTRUCTIONS: 'Please avoid the flower bed near the front door.'
  });
  const router = useRouter();

  const handleUseTemplate = (templateKey) => {
    // Store template selection and redirect to contracts page
    sessionStorage.setItem('selectedContractTemplate', templateKey);
    router.push('/contracts');
  };

  const handlePreview = (templateKey) => {
    const template = CONTRACT_TEMPLATES[templateKey];
    const filled = fillContractTemplate(template.content, previewData);
    setSelectedTemplate({ ...template, filledContent: filled });
  };

  const handlePrint = () => {
    if (selectedTemplate) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedTemplate.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1 { color: #22C55E; }
              h2 { color: #111827; margin-top: 20px; }
              pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            <h1>${selectedTemplate.title}</h1>
            <pre>${selectedTemplate.filledContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <DocumentTextIcon className="w-10 h-10 text-green-600" />
            Contract Samples
          </h1>
          <p className="text-gray-600">
            Choose from professional contract templates for different service types
          </p>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(CONTRACT_TEMPLATES).map(([key, template]) => (
            <div key={key} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">{template.title}</h2>
              <p className="text-gray-600 text-sm mb-4">
                {key === 'basic_weekly' && 'Perfect for simple weekly lawn mowing services'}
                {key === 'comprehensive_monthly' && 'Complete lawn care package with all services included'}
                {key === 'seasonal_contract' && 'Full-season contract covering spring, summer, and fall services'}
                {key === 'commercial_contract' && 'Professional contract for business properties'}
                {key === 'simple_agreement' && 'Quick and simple agreement for basic services'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(key)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ClipboardIcon className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleUseTemplate(key)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <PrinterIcon className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {selectedTemplate.filledContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use These Templates</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-2">
            <li>Click "Preview" to see a sample contract with example data</li>
            <li>Click "Use Template" to select a template for sending to customers</li>
            <li>When sending contracts, replace placeholders like [CUSTOMER_NAME] with actual customer information</li>
            <li>Customize the terms and pricing based on your specific agreement with each customer</li>
            <li>Print contracts for physical signatures or send via email/SMS for digital acceptance</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}

