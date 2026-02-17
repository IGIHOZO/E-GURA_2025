// Test the customer orders API
const axios = require('axios');

async function testCustomerAPI() {
  console.log('\n🧪 TESTING CUSTOMER ORDERS API\n');
  
  const testPhone = '0782540683'; // rutijana's phone from previous logs
  const testPhone2 = '250782013955'; // alternative format
  
  try {
    // Test 1: Get orders by phone
    console.log('Test 1: Fetching orders for phone:', testPhone);
<<<<<<< HEAD
    const response1 = await axios.post('https://egura.rw/api/orders/customer-orders', {
=======
    const response1 = await axios.post('http://localhost:5000/api/orders/customer-orders', {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
      phone: testPhone
    });
    console.log('✅ Response:', response1.data);
    console.log('Orders found:', response1.data.count);
    
    // Test 2: Get orders by alternative phone format
    console.log('\nTest 2: Fetching orders for phone:', testPhone2);
<<<<<<< HEAD
    const response2 = await axios.post('https://egura.rw/api/orders/customer-orders', {
=======
    const response2 = await axios.post('http://localhost:5000/api/orders/customer-orders', {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
      phone: testPhone2
    });
    console.log('✅ Response:', response2.data);
    console.log('Orders found:', response2.data.count);
    
    // Test 3: Get customer stats
    console.log('\nTest 3: Fetching customer stats');
<<<<<<< HEAD
    const response3 = await axios.post('https://egura.rw/api/orders/customer-stats', {
=======
    const response3 = await axios.post('http://localhost:5000/api/orders/customer-stats', {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
      phone: testPhone
    });
    console.log('✅ Stats:', response3.data.stats);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCustomerAPI();
