// Quick test of Modern AI
const modernAI = require('./backend/services/modernAIBargaining');

console.log('Testing Modern AI...\n');

// Test 1: Basic offer
const result = modernAI.negotiate(
  600,    // product price
  60,     // customer offer (lowball)
  [],     // no history
  { name: 'Flash Disk', category: 'Electronics' }
);

console.log('Result:', JSON.stringify(result, null, 2));

console.log('\n✅ Modern AI is working!');
