// Simple test to verify component imports work
import React from 'react';
import { AttorneyExecutiveDashboard } from './components/AttorneyExecutiveDashboard';
import { AnalystValuationWorkbench } from './components/AnalystValuationWorkbench';

export function TestComponents() {
  return (
    <div>
      <h1>Component Test</h1>
      <AttorneyExecutiveDashboard />
      <AnalystValuationWorkbench />
    </div>
  );
}