require('dotenv').config();
const { Order, Product } = require('./models-postgres');

async function fixOrderImages() {
  try {
    console.log('🔧 Starting order image fix...\n');

    // Get all orders
    const orders = await Order.findAll();
    console.log(`📦 Found ${orders.length} orders to process\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      let needsUpdate = false;
      const updatedItems = [];

      for (const item of order.items) {
        // Check if item is missing images
        if (!item.image && !item.mainImage && item.productId) {
          console.log(`🔍 Fetching product data for: ${item.name} (${item.productId})`);
          
          // Fetch product from database
          const product = await Product.findByPk(item.productId);
          
          if (product) {
            console.log(`✅ Found product! Adding images...`);
            updatedItems.push({
              ...item,
              image: product.mainImage || product.images?.[0] || null,
              mainImage: product.mainImage || product.images?.[0] || null,
              images: product.images || [],
              productImage: product.mainImage || product.images?.[0] || null,
              description: product.description || item.description,
              category: product.category || item.category
            });
            needsUpdate = true;
          } else {
            console.log(`⚠️  Product not found in database`);
            updatedItems.push(item);
          }
        } else {
          updatedItems.push(item);
        }
      }

      // Update order if needed
      if (needsUpdate) {
        await order.update({ items: updatedItems });
        fixedCount++;
        console.log(`✅ Fixed order ${order.orderNumber}\n`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n🎉 Fix completed!');
    console.log(`✅ Fixed: ${fixedCount} orders`);
    console.log(`⏭️  Skipped: ${skippedCount} orders (already had images)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrderImages();
