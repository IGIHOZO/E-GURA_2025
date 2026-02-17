/**
 * Update Sales Count from Orders
 * Calculates real salesCount from delivered/shipped/confirmed orders
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function updateSalesCount() {
  console.log('🔄 Updating product sales counts from orders...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // First, check current state
    const [currentState] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN "salesCount" > 0 THEN 1 ELSE 0 END) as products_with_sales
      FROM "Products"
    `);
    console.log('📊 Current state:');
    console.log(`   Total products: ${currentState[0].total_products}`);
    console.log(`   Products with salesCount > 0: ${currentState[0].products_with_sales}\n`);

    // Check orders
    const [orderStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('delivered', 'shipped', 'confirmed') THEN 1 END) as completed_orders
      FROM "Orders"
    `);
    console.log('📦 Order stats:');
    console.log(`   Total orders: ${orderStats[0].total_orders}`);
    console.log(`   Completed orders: ${orderStats[0].completed_orders}\n`);

    // Calculate sales from orders
    const [salesData] = await sequelize.query(`
      WITH order_items AS (
        SELECT 
          COALESCE(item->>'productId', item->>'id') as product_id,
          COALESCE((item->>'quantity')::int, 1) as quantity
        FROM "Orders" o,
             jsonb_array_elements(o.items) as item
        WHERE o.status IN ('delivered', 'shipped', 'confirmed')
          AND o.items IS NOT NULL
      ),
      product_sales AS (
        SELECT 
          product_id,
          SUM(quantity) as total_sold
        FROM order_items
        WHERE product_id IS NOT NULL
        GROUP BY product_id
      )
      SELECT 
        p.id,
        p.name,
        p."salesCount" as current_count,
        COALESCE(ps.total_sold, 0) as actual_sold
      FROM "Products" p
      LEFT JOIN product_sales ps ON p.id::text = ps.product_id
      WHERE COALESCE(ps.total_sold, 0) > 0 OR p."salesCount" > 0
      ORDER BY COALESCE(ps.total_sold, 0) DESC
      LIMIT 20
    `);

    if (salesData.length > 0) {
      console.log('📈 Products with sales:');
      salesData.forEach(p => {
        const status = p.current_count == p.actual_sold ? '✓' : '⚠️';
        console.log(`   ${status} ${p.name.substring(0, 30)}... - DB: ${p.current_count}, Actual: ${p.actual_sold}`);
      });
    }

    // Update salesCount for all products
    console.log('\n🔄 Updating salesCount for all products...');
    
    const [updateResult] = await sequelize.query(`
      WITH order_items AS (
        SELECT 
          COALESCE(item->>'productId', item->>'id') as product_id,
          COALESCE((item->>'quantity')::int, 1) as quantity
        FROM "Orders" o,
             jsonb_array_elements(o.items) as item
        WHERE o.status IN ('delivered', 'shipped', 'confirmed')
          AND o.items IS NOT NULL
      ),
      product_sales AS (
        SELECT 
          product_id,
          SUM(quantity) as total_sold
        FROM order_items
        WHERE product_id IS NOT NULL
        GROUP BY product_id
      )
      UPDATE "Products" p
      SET "salesCount" = COALESCE(ps.total_sold, 0),
          "updatedAt" = NOW()
      FROM product_sales ps
      WHERE p.id::text = ps.product_id
        AND p."salesCount" != COALESCE(ps.total_sold, 0)
      RETURNING p.id, p.name, p."salesCount"
    `);

    console.log(`✅ Updated ${updateResult.length} products with real sales counts\n`);

    if (updateResult.length > 0) {
      console.log('📋 Updated products:');
      updateResult.slice(0, 10).forEach(p => {
        console.log(`   - ${p.name.substring(0, 40)}... → ${p.salesCount} sold`);
      });
      if (updateResult.length > 10) {
        console.log(`   ... and ${updateResult.length - 10} more`);
      }
    }

    // Verify final state
    const [finalState] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN "salesCount" > 0 THEN 1 ELSE 0 END) as products_with_sales,
        SUM("salesCount") as total_sales
      FROM "Products"
    `);
    console.log('\n📊 Final state:');
    console.log(`   Products with salesCount > 0: ${finalState[0].products_with_sales}`);
    console.log(`   Total sales recorded: ${finalState[0].total_sales}`);

    console.log('\n✅ Sales count update complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

updateSalesCount();
