// Test Portfolio resilience to malformed data
import { normalizeProperty, fmtNumber, fmtUSD } from './charly_ui/src/pages/Portfolio.tsx';

console.log('🧪 PORTFOLIO RESILIENCE TEST');
console.log('='.repeat(50));

// Test malformed property data
const testCases = [
  // Missing fields
  { id: '1', address: '123 Main St' },
  // Wrong field names (snake_case from API)
  { 
    property_id: '2', 
    address: '456 Oak Ave',
    current_assessment: 500000,
    market_value: 450000,
    square_footage: 2500,
    year_built: 1995
  },
  // Null/undefined values
  {
    id: '3',
    address: '789 Pine Rd',
    currentAssessment: null,
    estimatedValue: undefined,
    squareFootage: 'invalid',
    yearBuilt: null
  }
];

console.log('Testing data normalization...');
testCases.forEach((testCase, index) => {
  try {
    const normalized = normalizeProperty(testCase);
    console.log(`✅ Case ${index + 1}: Normalized successfully`);
    console.log(`   Address: ${normalized.address}`);
    console.log(`   Current Assessment: ${fmtUSD(normalized.currentAssessment)}`);
    console.log(`   Square Footage: ${fmtNumber(normalized.squareFootage)}`);
    console.log(`   Year Built: ${normalized.yearBuilt ?? '—'}`);
  } catch (error) {
    console.log(`❌ Case ${index + 1}: Failed - ${error.message}`);
  }
  console.log('');
});

console.log('✅ Portfolio resilience test complete!');