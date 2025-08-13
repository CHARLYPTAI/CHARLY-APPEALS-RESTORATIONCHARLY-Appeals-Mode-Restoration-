import React from 'react';
import { IntelligentCanvas } from '@/components/v2/IntelligentCanvas';

export default function TestV2Single() {
  console.log("🧪 Testing single V2 component");
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          V2 Component Test - IntelligentCanvas Only
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">IntelligentCanvas Test</h2>
          <IntelligentCanvas mode="portfolio">
            <div className="p-4 bg-blue-50 rounded">
              <p>Test content inside IntelligentCanvas</p>
            </div>
          </IntelligentCanvas>
        </div>
      </div>
    </div>
  );
}