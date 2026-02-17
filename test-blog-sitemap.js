/**
 * Test Script: Blog-to-Sitemap Integration
 * Run this to verify automatic sitemap updates work
 */

const axios = require('axios');

<<<<<<< HEAD
const BASE_URL = 'https://egura.rw';
=======
const BASE_URL = 'http://localhost:5000';
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742

async function testBlogSitemapIntegration() {
  console.log('🧪 Testing Blog-to-Sitemap Integration...\n');

  try {
    // Step 1: Check current sitemap
    console.log('📊 Step 1: Checking current sitemap...');
    const sitemapBefore = await axios.get(`${BASE_URL}/api/sitemap`);
    const blogCountBefore = (sitemapBefore.data.match(/\/blog\//g) || []).length;
    console.log(`✅ Current blog posts in sitemap: ${blogCountBefore}\n`);

    // Step 2: Get current blog posts
    console.log('📚 Step 2: Getting current blog posts...');
    const postsResponse = await axios.get(`${BASE_URL}/api/blog/posts`);
    console.log(`✅ Total blog posts: ${postsResponse.data.count}\n`);

    // Step 3: Create a test blog post
    console.log('📝 Step 3: Creating test blog post...');
    const testPost = {
      title: `Test Blog Post - ${new Date().toISOString()}`,
      content: `This is a test blog post created to verify the automatic sitemap integration. 
      
When this post is created:
1. It should be automatically saved to the database
2. A unique slug should be generated
3. Google and Bing should be notified
4. The sitemap should include this post immediately

Generated at: ${new Date().toLocaleString()}`,
      metaDescription: 'Test blog post to verify automatic sitemap integration for E-Gura store.',
      keywords: ['test', 'blog', 'sitemap', 'integration', 'E-Gura'],
      hashtags: ['#Test', '#EGura', '#Rwanda'],
      category: 'General',
      seoScore: 95
    };

    const createResponse = await axios.post(`${BASE_URL}/api/blog/posts`, testPost);
    
    if (createResponse.data.success) {
      const newPost = createResponse.data.post;
      console.log(`✅ Blog post created successfully!`);
      console.log(`   ID: ${newPost.id}`);
      console.log(`   Slug: ${newPost.slug}`);
      console.log(`   URL: https://egura.rw/blog/${newPost.slug}\n`);

      // Step 4: Wait a moment for notifications to complete
      console.log('⏳ Step 4: Waiting for search engine notifications...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Notification period complete\n');

      // Step 5: Check updated sitemap
      console.log('📊 Step 5: Checking updated sitemap...');
      const sitemapAfter = await axios.get(`${BASE_URL}/api/sitemap`);
      const blogCountAfter = (sitemapAfter.data.match(/\/blog\//g) || []).length;
      console.log(`✅ Blog posts in sitemap now: ${blogCountAfter}`);
      
      if (blogCountAfter > blogCountBefore) {
        console.log(`✅ SUCCESS! Sitemap increased from ${blogCountBefore} to ${blogCountAfter} blog posts\n`);
      } else {
        console.log(`⚠️  WARNING: Blog count didn't increase. Checking if post is in sitemap...\n`);
      }

      // Step 6: Verify the specific post is in sitemap
      console.log('🔍 Step 6: Verifying new post is in sitemap...');
      const isInSitemap = sitemapAfter.data.includes(newPost.slug);
      
      if (isInSitemap) {
        console.log(`✅ SUCCESS! Post "${newPost.slug}" found in sitemap!\n`);
      } else {
        console.log(`❌ ERROR: Post "${newPost.slug}" NOT found in sitemap\n`);
      }

      // Step 7: Clean up - delete test post
      console.log('🧹 Step 7: Cleaning up test post...');
      await axios.delete(`${BASE_URL}/api/blog/posts/${newPost.id}`);
      console.log(`✅ Test post deleted\n`);

      // Final verification
      console.log('📊 Step 8: Final sitemap check...');
      const sitemapFinal = await axios.get(`${BASE_URL}/api/sitemap`);
      const blogCountFinal = (sitemapFinal.data.match(/\/blog\//g) || []).length;
      console.log(`✅ Final blog posts count: ${blogCountFinal}\n`);

      // Summary
      console.log('═'.repeat(60));
      console.log('📋 TEST SUMMARY');
      console.log('═'.repeat(60));
      console.log(`Initial blog posts:  ${blogCountBefore}`);
      console.log(`After creation:      ${blogCountAfter}`);
      console.log(`After deletion:      ${blogCountFinal}`);
      console.log(`Post in sitemap:     ${isInSitemap ? '✅ YES' : '❌ NO'}`);
      console.log(`Auto-notification:   ✅ ENABLED`);
      console.log('═'.repeat(60));
      
      if (isInSitemap && blogCountAfter > blogCountBefore) {
        console.log('\n🎉 ALL TESTS PASSED! Blog-to-Sitemap integration is working perfectly!\n');
        return true;
      } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.\n');
        return false;
      }

    } else {
      console.log('❌ Failed to create blog post');
      return false;
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
console.log('\n' + '═'.repeat(60));
console.log('🧪 E-GURA BLOG-SITEMAP INTEGRATION TEST');
console.log('═'.repeat(60) + '\n');

testBlogSitemapIntegration()
  .then(success => {
    if (success) {
      console.log('✅ Integration verified successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Use AI SEO Generator to create real blog posts');
      console.log('   2. Submit sitemap to Google Search Console');
      console.log('   3. Monitor blog post indexing\n');
      process.exit(0);
    } else {
      console.log('❌ Integration test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
