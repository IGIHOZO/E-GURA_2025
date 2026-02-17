/**
 * Migration Script: Base64 Images → Disk Files
 * 
 * Reads all products with base64-encoded images from PostgreSQL,
 * converts them to optimized WebP files on disk, and updates the
 * DB rows with URL paths served by nginx.
 *
 * Directory structure:
 *   /var/www/egura/uploads/products/thumb/{id}_main.webp
 *   /var/www/egura/uploads/products/medium/{id}_main.webp
 *   /var/www/egura/uploads/products/large/{id}_main.webp
 *   /var/www/egura/uploads/products/thumb/{id}_{index}.webp   (gallery)
 *   /var/www/egura/uploads/products/medium/{id}_{index}.webp
 *   /var/www/egura/uploads/products/large/{id}_{index}.webp
 *
 * URL pattern (served by nginx /uploads/ location):
 *   /uploads/products/medium/{id}_main.webp
 *
 * Usage:
 *   node scripts/migrate-images-to-disk.js
 *   node scripts/migrate-images-to-disk.js --dry-run   (preview only)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');
const Product = require('../models-postgres/Product');

// ─── Config ───────────────────────────────────────────────
const UPLOADS_ROOT = '/var/www/egura/uploads/products';
const URL_PREFIX = '/uploads/products'; // must match nginx location
const DRY_RUN = process.argv.includes('--dry-run');

const SIZES = {
  thumb:  { width: 200,  quality: 70 },
  medium: { width: 800,  quality: 80 },
  large:  { width: 1920, quality: 85 },
};

// ─── Helpers ──────────────────────────────────────────────

function isBase64(str) {
  return str && typeof str === 'string' && str.startsWith('data:');
}

/**
 * Decode a data-URI to a raw Buffer.
 * Handles both base64 and percent-encoded SVG data URIs.
 */
function decodeDataURI(dataUri) {
  // data:[<mediatype>][;base64],<data>
  const match = dataUri.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) throw new Error('Invalid data URI');

  const mimeType = match[1] || 'application/octet-stream';
  const isB64 = !!match[2];
  const payload = match[3];

  const buffer = isB64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload));

  return { buffer, mimeType };
}

/**
 * Convert an image buffer to WebP at multiple sizes, write to disk.
 * Returns the "medium" URL (used as the default display URL).
 */
async function saveImageToDisk(buffer, filename) {
  const results = {};

  for (const [sizeName, cfg] of Object.entries(SIZES)) {
    const outDir = path.join(UPLOADS_ROOT, sizeName);
    const outPath = path.join(outDir, `${filename}.webp`);

    await sharp(buffer)
      .resize({
        width: cfg.width,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: cfg.quality, effort: 4 })
      .toFile(outPath);

    results[sizeName] = `${URL_PREFIX}/${sizeName}/${filename}.webp`;
  }

  return results; // { thumb, medium, large }
}

// ─── Main ─────────────────────────────────────────────────
async function migrate() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Image Migration: Base64 → Disk (WebP)');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('═══════════════════════════════════════════════\n');

  // Ensure output dirs exist
  for (const size of Object.keys(SIZES)) {
    fs.mkdirSync(path.join(UPLOADS_ROOT, size), { recursive: true });
  }

  await sequelize.authenticate();
  // Set a generous statement timeout for large blob reads
  await sequelize.query(`SET statement_timeout = '300s'`);
  console.log('✅ Database connected\n');

  // Count total products with base64
  const [[{ total }]] = await sequelize.query(
    `SELECT COUNT(*) as total FROM "Products" WHERE "mainImage" LIKE 'data:%' OR EXISTS (SELECT 1 FROM unnest(images) img WHERE img LIKE 'data:%')`
  );
  console.log(`Found ${total} products with base64 images to migrate.\n`);

  // Fetch ALL product ids first (lightweight)
  const [allProducts] = await sequelize.query(
    `SELECT id, name FROM "Products" ORDER BY "createdAt" DESC`
  );
  const products = allProducts;

  console.log(`Found ${products.length} products total.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let totalBytesSaved = 0;

  for (const product of products) {
    const { id, name } = product;
    let mainImage = null;
    let images = null;

    // Fetch heavy columns one product at a time
    const [[fullRow]] = await sequelize.query(
      `SELECT "mainImage", images FROM "Products" WHERE id = :id`,
      { replacements: { id } }
    );
    mainImage = fullRow.mainImage;
    images = fullRow.images;

    const hasBase64Main = isBase64(mainImage);
    const hasBase64Gallery = Array.isArray(images) && images.some(isBase64);

    if (!hasBase64Main && !hasBase64Gallery) {
      skipped++;
      continue;
    }

    console.log(`── [${migrated + 1}] ${name.substring(0, 60)}`);
    console.log(`   ID: ${id}`);

    let newMainImage = mainImage;
    let newImages = images ? [...images] : [];

    // ── Migrate mainImage ──
    if (hasBase64Main) {
      try {
        const origBytes = Buffer.byteLength(mainImage, 'utf8');
        const { buffer } = decodeDataURI(mainImage);
        const filename = `${id}_main`;

        if (DRY_RUN) {
          console.log(`   mainImage: ${(origBytes / 1024).toFixed(0)} KB → would convert to WebP`);
        } else {
          const urls = await saveImageToDisk(buffer, filename);
          newMainImage = urls.medium; // default display size
          const savedFile = path.join(UPLOADS_ROOT, 'medium', `${filename}.webp`);
          const newBytes = fs.statSync(savedFile).size;
          const saved = origBytes - newBytes;
          totalBytesSaved += saved;
          console.log(`   mainImage: ${(origBytes / 1024).toFixed(0)} KB → ${(newBytes / 1024).toFixed(0)} KB WebP (saved ${(saved / 1024).toFixed(0)} KB)`);
        }
      } catch (err) {
        console.error(`   ❌ mainImage error: ${err.message}`);
        errors++;
      }
    }

    // ── Migrate gallery images ──
    if (hasBase64Gallery) {
      for (let i = 0; i < newImages.length; i++) {
        if (!isBase64(newImages[i])) continue;
        try {
          const origBytes = Buffer.byteLength(newImages[i], 'utf8');
          const { buffer } = decodeDataURI(newImages[i]);
          const filename = `${id}_${i}`;

          if (DRY_RUN) {
            console.log(`   images[${i}]: ${(origBytes / 1024).toFixed(0)} KB → would convert to WebP`);
          } else {
            const urls = await saveImageToDisk(buffer, filename);
            newImages[i] = urls.medium;
            const savedFile = path.join(UPLOADS_ROOT, 'medium', `${filename}.webp`);
            const newBytes = fs.statSync(savedFile).size;
            const saved = origBytes - newBytes;
            totalBytesSaved += saved;
            console.log(`   images[${i}]: ${(origBytes / 1024).toFixed(0)} KB → ${(newBytes / 1024).toFixed(0)} KB WebP (saved ${(saved / 1024).toFixed(0)} KB)`);
          }
        } catch (err) {
          console.error(`   ❌ images[${i}] error: ${err.message}`);
          errors++;
        }
      }
    }

    // ── Update DB row ──
    if (!DRY_RUN) {
      try {
        const updateData = { mainImage: newMainImage };
        if (newImages && newImages.length > 0) {
          updateData.images = newImages;
        } else {
          updateData.images = null;
        }
        await Product.update(updateData, { where: { id } });
        console.log(`   ✅ DB updated`);
      } catch (err) {
        console.error(`   ❌ DB update error: ${err.message}`);
        errors++;
      }
    }

    migrated++;
    console.log('');
  }

  // ── Summary ──
  console.log('═══════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Products migrated: ${migrated}`);
  console.log(`  Products skipped (already URLs): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  if (!DRY_RUN) {
    console.log(`  Total DB storage freed: ${(totalBytesSaved / 1024 / 1024).toFixed(1)} MB`);
    // Count files on disk
    let diskFiles = 0;
    let diskBytes = 0;
    for (const size of Object.keys(SIZES)) {
      const dir = path.join(UPLOADS_ROOT, size);
      const files = fs.readdirSync(dir);
      diskFiles += files.length;
      for (const f of files) {
        diskBytes += fs.statSync(path.join(dir, f)).size;
      }
    }
    console.log(`  Files on disk: ${diskFiles} (${(diskBytes / 1024 / 1024).toFixed(1)} MB)`);
  }
  console.log('═══════════════════════════════════════════════\n');

  await sequelize.close();
  process.exit(errors > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
