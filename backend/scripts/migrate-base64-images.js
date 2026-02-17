/**
 * Base64 Image Migration Script
 * Converts all existing Base64 images to file-based storage
 * Run: node scripts/migrate-base64-images.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const Product = require('../models-postgres/Product');
const { convertBase64ToFile, isBase64Image } = require('../services/imageUploadService');

const BATCH_SIZE = 10; // Process 10 products at a time
const DRY_RUN = process.argv.includes('--dry-run');

async function migrateProduct(product) {
  const updates = {};
  let hasChanges = false;

  console.log(`\n📦 Processing: ${product.name} (${product.id})`);

  // Check and migrate mainImage
  if (isBase64Image(product.mainImage)) {
    console.log(`   🔄 Main image is Base64 (${(product.mainImage.length / 1024).toFixed(1)}KB)`);
    
    if (!DRY_RUN) {
      const result = await convertBase64ToFile(product.mainImage, product.id);
      if (result && result.medium) {
        updates.mainImage = result.medium;
        hasChanges = true;
        console.log(`   ✅ Converted to: ${result.medium}`);
      } else {
        console.log(`   ⚠️ Failed to convert main image`);
      }
    } else {
      console.log(`   [DRY RUN] Would convert main image`);
      hasChanges = true;
    }
  }

  // Check and migrate images array
  if (product.images && Array.isArray(product.images)) {
    const migratedImages = [];
    let hasBase64Images = false;

    for (let i = 0; i < product.images.length; i++) {
      const img = product.images[i];
      
      if (isBase64Image(img)) {
        hasBase64Images = true;
        console.log(`   🔄 Image[${i}] is Base64 (${(img.length / 1024).toFixed(1)}KB)`);
        
        if (!DRY_RUN) {
          const result = await convertBase64ToFile(img, `${product.id}-${i}`);
          if (result && result.medium) {
            migratedImages.push(result.medium);
            console.log(`   ✅ Converted to: ${result.medium}`);
          } else {
            console.log(`   ⚠️ Failed to convert image[${i}]`);
          }
        } else {
          console.log(`   [DRY RUN] Would convert image[${i}]`);
        }
      } else {
        migratedImages.push(img);
      }
    }

    if (hasBase64Images) {
      updates.images = migratedImages;
      hasChanges = true;
    }
  }

  // Check variants for base64 images
  if (product.variants && Array.isArray(product.variants)) {
    const migratedVariants = [];
    let hasBase64Variants = false;

    for (const variant of product.variants) {
      const migratedVariant = { ...variant };
      
      if (variant.image && isBase64Image(variant.image)) {
        hasBase64Variants = true;
        console.log(`   🔄 Variant image is Base64`);
        
        if (!DRY_RUN) {
          const result = await convertBase64ToFile(variant.image, `${product.id}-variant`);
          if (result && result.medium) {
            migratedVariant.image = result.medium;
            console.log(`   ✅ Converted variant image to: ${result.medium}`);
          }
        } else {
          console.log(`   [DRY RUN] Would convert variant image`);
        }
      }
      
      migratedVariants.push(migratedVariant);
    }

    if (hasBase64Variants) {
      updates.variants = migratedVariants;
      hasChanges = true;
    }
  }

  // Apply updates
  if (hasChanges && !DRY_RUN) {
    await product.update(updates);
    console.log(`   ✅ Product updated`);
  }

  return hasChanges;
}

async function analyzeProducts() {
  console.log('\n📊 Analyzing products for Base64 images...\n');
  
  const products = await Product.findAll();
  
  let totalProducts = 0;
  let productsWithBase64 = 0;
  let totalBase64Size = 0;
  let base64MainImages = 0;
  let base64AdditionalImages = 0;

  for (const product of products) {
    totalProducts++;
    let hasBase64 = false;

    if (isBase64Image(product.mainImage)) {
      hasBase64 = true;
      base64MainImages++;
      totalBase64Size += product.mainImage.length;
    }

    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        if (isBase64Image(img)) {
          hasBase64 = true;
          base64AdditionalImages++;
          totalBase64Size += img.length;
        }
      }
    }

    if (hasBase64) {
      productsWithBase64++;
    }
  }

  console.log('═══════════════════════════════════════════');
  console.log('            ANALYSIS RESULTS');
  console.log('═══════════════════════════════════════════');
  console.log(`Total products:              ${totalProducts}`);
  console.log(`Products with Base64:        ${productsWithBase64}`);
  console.log(`Base64 main images:          ${base64MainImages}`);
  console.log(`Base64 additional images:    ${base64AdditionalImages}`);
  console.log(`Total Base64 data size:      ${(totalBase64Size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Avg Base64 per product:      ${productsWithBase64 > 0 ? (totalBase64Size / productsWithBase64 / 1024).toFixed(1) : 0} KB`);
  console.log('═══════════════════════════════════════════\n');

  return { totalProducts, productsWithBase64, totalBase64Size };
}

async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       BASE64 IMAGE MIGRATION SCRIPT');
  console.log('       Converts Base64 images to file storage');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Analyze first
    const analysis = await analyzeProducts();

    if (analysis.productsWithBase64 === 0) {
      console.log('✅ No Base64 images found. Nothing to migrate.');
      process.exit(0);
    }

    if (DRY_RUN) {
      console.log('Run without --dry-run to perform the migration.');
      process.exit(0);
    }

    // Confirm migration
    console.log('\n🚀 Starting migration...\n');

    // Get all products with potential Base64 images
    const products = await Product.findAll();
    
    let migrated = 0;
    let failed = 0;
    let skipped = 0;

    // Process in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      console.log(`\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(products.length / BATCH_SIZE)} ---`);

      for (const product of batch) {
        try {
          const wasChanged = await migrateProduct(product);
          if (wasChanged) {
            migrated++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`   ❌ Error migrating ${product.id}:`, error.message);
          failed++;
        }
      }

      // Small delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('            MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log(`Products migrated:  ${migrated}`);
    console.log(`Products skipped:   ${skipped}`);
    console.log(`Products failed:    ${failed}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the migration
runMigration();
