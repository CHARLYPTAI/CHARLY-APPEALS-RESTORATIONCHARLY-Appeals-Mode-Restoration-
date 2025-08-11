// Test Card import
const fs = require('fs');

try {
  // Check if Card.tsx exists and is readable
  const cardContent = fs.readFileSync('./src/components/v2/Card.tsx', 'utf8');
  console.log('✅ Card.tsx is readable');
  
  // Check for export statements
  const exports = cardContent.match(/export \{[^}]+\}/g);
  console.log('Exports found:', exports);
  
  const metricCardMatch = cardContent.match(/export const MetricCard = React\.forwardRef/);
  console.log('MetricCard export found:', !!metricCardMatch);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}