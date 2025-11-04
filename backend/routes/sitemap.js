const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { sequelize } = require('../models-postgres');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/sitemap
 * Generate dynamic XML sitemap for SEO
 */
router.get('/', async (req, res) => {
  try {
    console.log('📄 Generating comprehensive sitemap...');

    // Fetch all products
    const products = await Product.findAll({
      attributes: ['id', 'name', 'updatedAt', 'category'],
      order: [['updatedAt', 'DESC']]
    });

    // Get unique categories
    const categoriesResult = await Product.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      where: {
        category: {
          [sequelize.Op.ne]: null
        }
      }
    });

    const categories = categoriesResult.map(c => c.category).filter(Boolean);
    
    // Get blog posts
    let blogPosts = [];
    try {
      const blogFile = path.join(__dirname, '../data/blog-posts.json');
      if (fs.existsSync(blogFile)) {
        const data = fs.readFileSync(blogFile, 'utf8');
        blogPosts = JSON.parse(data);
      }
    } catch (error) {
      console.log('No blog posts found, skipping...');
    }

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  
  <!-- Homepage -->
  <url>
    <loc>https://egura.rw/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
  <!-- Shop Page -->
  <url>
    <loc>https://egura.rw/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
  <!-- AI Features -->
  <url>
    <loc>https://egura.rw/virtual-tryon</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
  <!-- Blog -->
  <url>
    <loc>https://egura.rw/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
  <!-- About & Contact -->
  <url>
    <loc>https://egura.rw/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>https://egura.rw/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>https://egura.rw/cart</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://egura.rw/tracking</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Categories -->
  ${categories.map(category => `
  <url>
    <loc>https://egura.rw/shop?category=${encodeURIComponent(category)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- Products -->
  ${products.map(product => `
  <url>
    <loc>https://egura.rw/product/${product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>
  </url>`).join('')}
  
  <!-- Blog Posts -->
  ${blogPosts.map(post => `
  <url>
    <loc>https://egura.rw/blog/${post.slug || post.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${new Date(post.publishedDate).toISOString().split('T')[0]}</lastmod>
  </url>`).join('')}
  
</urlset>`;

    console.log(`✅ Sitemap generated: ${products.length} products, ${categories.length} categories, ${blogPosts.length} blog posts`);

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
