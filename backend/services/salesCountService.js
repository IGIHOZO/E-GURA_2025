/**
 * Sales Count Service
 * Updates product salesCount when orders are completed
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Update salesCount for products in a completed order
 * @param {Object} order - Order object with items array
 */
async function updateSalesCountForOrder(order) {
  if (!order || !order.items || !Array.isArray(order.items)) {
    return;
  }

  try {
    for (const item of order.items) {
      const productId = item.productId || item.product || item.id;
      const quantity = item.quantity || 1;

      if (!productId) continue;

      await sequelize.query(`
        UPDATE "Products"
        SET "salesCount" = COALESCE("salesCount", 0) + :quantity,
            "updatedAt" = NOW()
        WHERE id = :productId::uuid
      `, {
        replacements: { productId, quantity },
        type: QueryTypes.UPDATE
      });

      console.log(`📈 Updated salesCount for product ${productId}: +${quantity}`);
    }
  } catch (error) {
    console.error('Error updating sales count:', error.message);
  }
}

/**
 * Recalculate all salesCount from orders (for data sync)
 */
async function recalculateAllSalesCount() {
  try {
    console.log('🔄 Recalculating all product sales counts...');

    // Reset all salesCount to 0 first
    await sequelize.query(`
      UPDATE "Products" SET "salesCount" = 0, "updatedAt" = NOW()
    `);

    // Calculate from completed orders
    const [result] = await sequelize.query(`
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
      SET "salesCount" = ps.total_sold,
          "updatedAt" = NOW()
      FROM product_sales ps
      WHERE p.id::text = ps.product_id
      RETURNING p.id, p.name, p."salesCount"
    `);

    console.log(`✅ Updated salesCount for ${result.length} products`);
    return result;
  } catch (error) {
    console.error('Error recalculating sales count:', error.message);
    throw error;
  }
}

module.exports = {
  updateSalesCountForOrder,
  recalculateAllSalesCount
};
