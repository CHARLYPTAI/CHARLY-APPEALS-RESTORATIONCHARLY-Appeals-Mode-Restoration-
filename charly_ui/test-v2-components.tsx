// Quick test to verify V2 components work
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AttorneyExecutiveDashboard } from './src/components/AttorneyExecutiveDashboard';
import { AnalystValuationWorkbench } from './src/components/AnalystValuationWorkbench';

// Try to render components
try {
  const testDiv = document.createElement('div');
  const root = createRoot(testDiv);
  
  root.render(
    <>
      <AttorneyExecutiveDashboard />
      <AnalystValuationWorkbench />
    </>
  );
  
  console.log('✅ V2 components render without errors');
} catch (error) {
  console.error('❌ V2 component error:', error);
}