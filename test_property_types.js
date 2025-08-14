// Test script to verify property type crosswalk mappings work correctly
import { mapPropertyTypeLabelToBackend } from './charly_ui/src/config/property_type_crosswalk.ts';

// Test the 4 property types requested
const testCases = [
  { label: 'Warehouse/Distribution', expected: 'Industrial' },
  { label: 'Mixed-Use (Resi over Retail)', expected: 'Mixed Use' },
  { label: 'School / Church', expected: 'Special Purpose' },
  { label: 'Single-Family Residential', expected: 'Residential' }
];

console.log('='.repeat(50));
console.log('🧪 PROPERTY TYPE CROSSWALK SANITY TEST');
console.log('='.repeat(50));

testCases.forEach((testCase, index) => {
  const result = mapPropertyTypeLabelToBackend(testCase.label);
  const status = result === testCase.expected ? '✅' : '❌';
  
  console.log(`${index + 1}. ${status} "${testCase.label}" → "${result}"`);
  
  if (result !== testCase.expected) {
    console.log(`   Expected: "${testCase.expected}", Got: "${result}"`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('✅ CROSSWALK SANITY TEST COMPLETE');
console.log('='.repeat(50));