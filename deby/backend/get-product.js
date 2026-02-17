const axios = require('axios');

async function getProduct() {
  try {
    const response = await axios.get('http://localhost:5000/api/products');
    const products = response.data.products || response.data.data || response.data;
    
    if (products && products.length > 0) {
      console.log('✅ First product:');
      console.log('ID:', products[0].id);
      console.log('Name:', products[0].name);
      console.log('Price:', products[0].price);
    } else {
      console.log('❌ No products found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getProduct();
