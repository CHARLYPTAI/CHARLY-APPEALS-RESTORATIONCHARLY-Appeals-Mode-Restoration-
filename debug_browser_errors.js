// Simple test to check what's breaking
console.log('DEBUG: Starting basic test');

try {
  console.log('DEBUG: React available?', typeof React);
} catch (e) {
  console.error('DEBUG: React error:', e);
}

try {
  console.log('DEBUG: Document ready?', document.readyState);
} catch (e) {
  console.error('DEBUG: Document error:', e);
}

console.log('DEBUG: Test complete');