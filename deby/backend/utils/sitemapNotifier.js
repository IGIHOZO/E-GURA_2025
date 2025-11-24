/**
 * Sitemap Notifier Utility
 * Automatically pings search engines when content is updated
 */

const http = require('http');
const https = require('https');

const SITE_URL = 'https://egura.rw';
const SITEMAP_URL = `${SITE_URL}/api/sitemap`;

/**
 * Ping Google about sitemap update
 */
async function pingGoogle() {
  return new Promise((resolve, reject) => {
    const pingUrl = `http://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    
    http.get(pingUrl, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Google notified about sitemap update');
        resolve(true);
      } else {
        console.warn(`⚠️ Google ping returned status ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error('❌ Error pinging Google:', err.message);
      reject(err);
    });
  });
}

/**
 * Ping Bing about sitemap update
 */
async function pingBing() {
  return new Promise((resolve, reject) => {
    const pingUrl = `http://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    
    http.get(pingUrl, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Bing notified about sitemap update');
        resolve(true);
      } else {
        console.warn(`⚠️ Bing ping returned status ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error('❌ Error pinging Bing:', err.message);
      reject(err);
    });
  });
}

/**
 * Notify all search engines about sitemap update
 */
async function notifySearchEngines() {
  try {
    console.log('📡 Notifying search engines about sitemap update...');
    
    const results = await Promise.allSettled([
      pingGoogle(),
      pingBing()
    ]);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    console.log(`✅ Successfully notified ${successful}/2 search engines`);
    
    return successful > 0;
  } catch (error) {
    console.error('❌ Error notifying search engines:', error);
    return false;
  }
}

/**
 * Notify about new blog post
 * This will ping search engines to re-crawl the sitemap
 */
async function notifyNewBlogPost(blogPost) {
  try {
    console.log(`📝 New blog post created: "${blogPost.title}"`);
    console.log(`🔗 URL: ${SITE_URL}/blog/${blogPost.slug || blogPost.id}`);
    
    // Wait a moment to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Notify search engines
    await notifySearchEngines();
    
    return true;
  } catch (error) {
    console.error('❌ Error in blog post notification:', error);
    return false;
  }
}

/**
 * Notify about new product
 */
async function notifyNewProduct(product) {
  try {
    console.log(`📦 New product added: "${product.name}"`);
    console.log(`🔗 URL: ${SITE_URL}/product/${product.id}`);
    
    // Notify search engines
    await notifySearchEngines();
    
    return true;
  } catch (error) {
    console.error('❌ Error in product notification:', error);
    return false;
  }
}

/**
 * Manual sitemap submission to Google Search Console
 * Note: Requires API setup in Google Search Console
 */
async function submitToGoogleSearchConsole() {
  // This requires Google Search Console API setup
  // For now, we'll just log the instruction
  console.log('ℹ️  To manually submit sitemap to Google Search Console:');
  console.log('   1. Visit: https://search.google.com/search-console');
  console.log(`   2. Add sitemap: ${SITEMAP_URL}`);
  console.log('   3. Google will automatically crawl it periodically');
}

module.exports = {
  pingGoogle,
  pingBing,
  notifySearchEngines,
  notifyNewBlogPost,
  notifyNewProduct,
  submitToGoogleSearchConsole
};
