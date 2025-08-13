import React, { useState } from 'react';
import { Appeals } from './Appeals';

export default function TestAppeals() {
  console.log('TestAppeals component rendering...');
  const [showAppeals, setShowAppeals] = useState(false);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Appeals Test Page</h1>
      <p>This is a simple test page to verify Appeals component works.</p>
      
      <div className="mt-4 space-y-4">
        <button 
          onClick={() => setShowAppeals(!showAppeals)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {showAppeals ? 'Hide Appeals Component' : 'Show Appeals Component'}
        </button>
        
        <button 
          onClick={() => {
            import('../pages/Appeals').then(module => {
              console.log('Appeals module loaded:', module);
            }).catch(err => {
              console.error('Failed to load Appeals module:', err);
            });
          }}
          className="bg-green-500 text-white px-4 py-2 rounded ml-2"
        >
          Test Load Appeals Module
        </button>
      </div>

      {showAppeals && (
        <div className="mt-8 border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Appeals Component:</h2>
          <Appeals />
        </div>
      )}
    </div>
  );
}