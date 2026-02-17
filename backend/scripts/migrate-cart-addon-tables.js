/**
 * Migration Script: Create Cart Add-On Tables
 * Creates CartEvents and ProductRelations tables for intelligent suggestions
 * 
 * Run: node scripts/migrate-cart-addon-tables.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function migrate() {
  console.log('🚀 Starting Cart Add-On Tables Migration...\n');

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Create CartEvents table
    console.log('📦 Creating CartEvents table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "CartEvents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionId" VARCHAR(255) NOT NULL,
        "userId" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
        "productId" UUID NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE,
        "eventType" VARCHAR(20) NOT NULL CHECK ("eventType" IN ('add', 'remove', 'view', 'purchase')),
        "quantity" INTEGER DEFAULT 1,
        "cartSnapshot" JSONB,
        "metadata" JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "idx_cart_events_session" ON "CartEvents"("sessionId");
      CREATE INDEX IF NOT EXISTS "idx_cart_events_user" ON "CartEvents"("userId");
      CREATE INDEX IF NOT EXISTS "idx_cart_events_product" ON "CartEvents"("productId");
      CREATE INDEX IF NOT EXISTS "idx_cart_events_type" ON "CartEvents"("eventType");
      CREATE INDEX IF NOT EXISTS "idx_cart_events_created" ON "CartEvents"("createdAt");
    `);
    console.log('✅ CartEvents table created\n');

    // Create ProductRelations table
    console.log('📦 Creating ProductRelations table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ProductRelations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" UUID NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE,
        "relatedProductId" UUID NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE,
        "relationType" VARCHAR(50) NOT NULL CHECK ("relationType" IN (
          'copurchase', 'essential', 'compatible', 'category_match', 'complement', 'upgrade', 'bundle'
        )),
        "score" DECIMAL(5,4) DEFAULT 0,
        "copurchaseCount" INTEGER DEFAULT 0,
        "confidenceLevel" DECIMAL(5,4) DEFAULT 0,
        "metadata" JSONB,
        "isActive" BOOLEAN DEFAULT true,
        "lastCalculated" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "unique_product_relation" UNIQUE ("productId", "relatedProductId")
      );

      CREATE INDEX IF NOT EXISTS "idx_product_relations_product" ON "ProductRelations"("productId");
      CREATE INDEX IF NOT EXISTS "idx_product_relations_related" ON "ProductRelations"("relatedProductId");
      CREATE INDEX IF NOT EXISTS "idx_product_relations_type" ON "ProductRelations"("productId", "relationType");
      CREATE INDEX IF NOT EXISTS "idx_product_relations_score" ON "ProductRelations"("score" DESC);
      CREATE INDEX IF NOT EXISTS "idx_product_relations_copurchase" ON "ProductRelations"("copurchaseCount" DESC);
    `);
    console.log('✅ ProductRelations table created\n');

    // Verify tables exist
    const [cartEventsCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'CartEvents'
      );
    `);
    
    const [productRelationsCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ProductRelations'
      );
    `);

    console.log('📋 Migration Summary:');
    console.log(`   CartEvents table: ${cartEventsCheck[0]?.exists ? '✅ Created' : '❌ Failed'}`);
    console.log(`   ProductRelations table: ${productRelationsCheck[0]?.exists ? '✅ Created' : '❌ Failed'}`);

    // Calculate initial relationships from existing orders
    console.log('\n📊 Calculating initial product relationships from orders...');
    
    const [orderCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "Orders" WHERE status IN ('delivered', 'shipped', 'confirmed')
    `);
    console.log(`   Found ${orderCount[0]?.count || 0} completed orders`);

    if (parseInt(orderCount[0]?.count || 0) > 0) {
      await sequelize.query(`
        INSERT INTO "ProductRelations" 
        ("id", "productId", "relatedProductId", "relationType", "score", "copurchaseCount", "lastCalculated", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(),
          (item1->>'productId')::uuid,
          (item2->>'productId')::uuid,
          'copurchase',
          LEAST(1, COUNT(*)::decimal / 10),
          COUNT(*),
          NOW(),
          NOW(),
          NOW()
        FROM "Orders" o,
             jsonb_array_elements(o.items) AS item1,
             jsonb_array_elements(o.items) AS item2
        WHERE o.status IN ('delivered', 'shipped', 'confirmed')
          AND item1->>'productId' IS NOT NULL
          AND item2->>'productId' IS NOT NULL
          AND item1->>'productId' != item2->>'productId'
          AND (item1->>'productId')::uuid IN (SELECT id FROM "Products")
          AND (item2->>'productId')::uuid IN (SELECT id FROM "Products")
        GROUP BY item1->>'productId', item2->>'productId'
        HAVING COUNT(*) >= 2
        ON CONFLICT ("productId", "relatedProductId") 
        DO UPDATE SET 
          score = EXCLUDED.score,
          "copurchaseCount" = EXCLUDED."copurchaseCount",
          "lastCalculated" = NOW(),
          "updatedAt" = NOW()
      `);

      const [relationCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM "ProductRelations"
      `);
      console.log(`   Created ${relationCount[0]?.count || 0} product relationships`);
    } else {
      console.log('   No completed orders found - relationships will be calculated as orders come in');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test the /api/cart/addons endpoint');
    console.log('   3. Set up a cron job to run relationship recalculation periodically');
    console.log('      POST /api/cart/recalculate-relationships');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrate();
