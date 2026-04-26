'use client';

import { useState } from 'react';

export default function LawnCalculator() {
  const [area, setArea] = useState(0);
  const [services, setServices] = useState([]);

  const commonServices = [
    { name: 'Lawn Mowing', baseRate: 45, ratePerSqFt: 0.005 },
    { name: 'Edging & Trimming', baseRate: 30, ratePerSqFt: 0.003 },
    { name: 'Fertilization', baseRate: 60, ratePerSqFt: 0.008 },
    { name: 'Aeration', baseRate: 75, ratePerSqFt: 0.01 },
    { name: 'Leaf Removal', baseRate: 50, ratePerSqFt: 0.006 },
    { name: 'Mulching', baseRate: 65, ratePerSqFt: 0.012 },
  ];

  const addService = (service) => {
    setServices([...services, service]);
  };

  const removeService = (index) => {
    const newServices = [...services];
    newServices.splice(index, 1);
    setServices(newServices);
  };

  const getEstimatedCost = () => {
    return services.reduce((total, service) => {
      return total + (service.baseRate + (area * service.ratePerSqFt));
    }, 0);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-2xl font-bold mb-4">Lawn Care Calculator</h3>
      <p className="text-gray-600 mb-6">Get an estimate for your lawn care needs</p>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lawn Size (Square Feet)
        </label>
        <input
          type="number"
          value={area}
          onChange={(e) => setArea(Number(e.target.value))}
          className="w-full rounded-lg border-gray-200 focus:border-[#FF5733] focus:ring-[#FF5733]"
          placeholder="Enter lawn size"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {commonServices.map((service) => (
          <button
            key={service.name}
            onClick={() => addService(service)}
            className="p-3 border rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors"
          >
            <span className="block font-medium">{service.name}</span>
            <span className="text-sm text-gray-500">From ${service.baseRate}</span>
          </button>
        ))}
      </div>

      {services.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Selected Services:</h4>
          <ul className="space-y-2">
            {services.map((service, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>{service.name} (From ${service.baseRate})</span>
                <button
                  onClick={() => removeService(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Total Estimated Cost:</span>
          <span>${getEstimatedCost()}</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          *This is a rough estimate. Final price may vary based on actual conditions and additional costs.
        </p>
      </div>
    </div>
  );
} 