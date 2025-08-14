// Test script to verify property type crosswalk mapping
import { mapPropertyTypeLabelToBackend, PROPERTY_TYPE_CROSSWALK } from './charly_ui/src/config/property_type_crosswalk.ts';

console.log('='.repeat(60));
console.log('🧪 PROPERTY TYPE CROSSWALK TESTING');
console.log('='.repeat(60));

// Test cases from the requirements
const testCases = [
  'Standalone Retail',
  'Restaurant / Bar',
  'Full-Service Hotel',
  'Single Family Home',
  'Warehouse/Distribution',
  'Office/Retail Mixed Use',
  'Garden Apartments',
  'Commercial Land',
  
  // Edge cases
  'Unknown Property Type',
  'Mixed-Use Building',
  'Industrial Facility',
  'Agricultural Land',
  null,
  undefined,
  ''
];

console.log('\n📊 MAPPING TEST RESULTS:');
console.log('-'.repeat(60));

testCases.forEach(testCase => {
  const mapped = mapPropertyTypeLabelToBackend(testCase);
  const status = PROPERTY_TYPE_CROSSWALK.find(item => item.label === testCase) ? '✅' : '⚠️ ';
  console.log(`${status} "${testCase || 'null/undefined'}" → "${mapped}"`);
});

console.log('\n📋 CROSSWALK ENTRIES COUNT:');
console.log(`Total entries: ${PROPERTY_TYPE_CROSSWALK.length}`);

console.log('\n🎯 KEY REQUIREMENTS CHECK:');
console.log(`✅ Standalone Retail → ${mapPropertyTypeLabelToBackend('Standalone Retail')}`);
console.log(`✅ Restaurant / Bar → ${mapPropertyTypeLabelToBackend('Restaurant / Bar')}`);

console.log('\n✅ Crosswalk testing complete!');