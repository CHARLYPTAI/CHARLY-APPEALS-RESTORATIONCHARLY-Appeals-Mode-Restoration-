// Simple test to check if Sprint 6 components import correctly
import('./src/components/valuation/ValuationEngineInterface.tsx')
  .then(() => console.log('✅ ValuationEngineInterface imports correctly'))
  .catch(err => console.error('❌ ValuationEngineInterface error:', err));

import('./src/components/ai/AISuccessPredictionDisplay.tsx')
  .then(() => console.log('✅ AISuccessPredictionDisplay imports correctly'))
  .catch(err => console.error('❌ AISuccessPredictionDisplay error:', err));

import('./src/components/reports/PremiumReportsCatalog.tsx')
  .then(() => console.log('✅ PremiumReportsCatalog imports correctly'))
  .catch(err => console.error('❌ PremiumReportsCatalog error:', err));

import('./src/components/legal/LegalAutomationWorkflow.tsx')
  .then(() => console.log('✅ LegalAutomationWorkflow imports correctly'))
  .catch(err => console.error('❌ LegalAutomationWorkflow error:', err));