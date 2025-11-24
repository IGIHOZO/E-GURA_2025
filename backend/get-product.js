const axios = require('axios');

async function getProduct() {
  try {
<<<<<<< HEAD
    const response = await axios.get('https://egura.rw/api/admin/products');
=======
    const response = await axios.get('http://localhost:5000/api/products');
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
