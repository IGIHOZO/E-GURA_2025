const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { notifyNewBlogPost } = require('../utils/sitemapNotifier');

// Path to store blog posts
const BLOG_FILE = path.join(__dirname, '../data/blog-posts.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper function to read blog posts
const readBlogPosts = () => {
  try {
    if (fs.existsSync(BLOG_FILE)) {
      const data = fs.readFileSync(BLOG_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
};

// Helper function to write blog posts
const writeBlogPosts = (posts) => {
  try {
    fs.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing blog posts:', error);
    return false;
  }
};

/**
 * GET /api/blog/posts
 * Get all blog posts
 */
router.get('/posts', (req, res) => {
  try {
    const posts = readBlogPosts();
    // Sort by date, newest first
    posts.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    
    res.json({
      success: true,
      posts,
      count: posts.length
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error.message
    });
  }
});

/**
 * GET /api/blog/posts/:id
 * Get a single blog post
 */
router.get('/posts/:id', (req, res) => {
  try {
    const posts = readBlogPosts();
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error.message
    });
  }
});

/**
 * POST /api/blog/posts
 * Create a new blog post
 */
router.post('/posts', (req, res) => {
  try {
    const { title, content, metaDescription, keywords, hashtags, category, seoScore, image } = req.body;
    
    const posts = readBlogPosts();
    
    const newPost = {
      id: `post-${Date.now()}`,
      title,
      content,
      metaDescription,
      keywords: keywords || [],
      hashtags: hashtags || [],
      category: category || 'General',
      seoScore: seoScore || 0,
      image: image || generateDefaultImage(category),
      author: 'E-Gura Team',
      publishedDate: new Date().toISOString(),
      views: 0,
      likes: 0,
      slug: generateSlug(title)
    };
    
    posts.unshift(newPost); // Add to beginning
    
    const success = writeBlogPosts(posts);
    
    if (success) {
      console.log('✅ Blog post created:', newPost.id);
      
      // Automatically notify search engines about new blog post
      notifyNewBlogPost(newPost).catch(err => {
        console.warn('⚠️ Failed to notify search engines:', err.message);
      });
      
      res.json({
        success: true,
        message: 'Blog post created successfully',
        post: newPost
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save blog post'
      });
    }
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message
    });
  }
});

/**
 * DELETE /api/blog/posts/:id
 * Delete a blog post
 */
router.delete('/posts/:id', (req, res) => {
  try {
    let posts = readBlogPosts();
    const initialLength = posts.length;
    
    posts = posts.filter(p => p.id !== req.params.id);
    
    if (posts.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    const success = writeBlogPosts(posts);
    
    if (success) {
      console.log('🗑️ Blog post deleted:', req.params.id);
      
      // Notify search engines about sitemap update
      const { notifySearchEngines } = require('../utils/sitemapNotifier');
      notifySearchEngines().catch(err => {
        console.warn('⚠️ Failed to notify search engines:', err.message);
      });
      
      res.json({
        success: true,
        message: 'Blog post deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog post'
      });
    }
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post',
      error: error.message
    });
  }
});

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to generate default image based on category
function generateDefaultImage(category) {
  const categoryImages = {
    'product-daily': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
    'how-to-shop': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    'trending-products': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
    'best-deals': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
    'kigali-trends': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
    'product-review': 'https://images.unsplash.com/photo-1556740714-a8395b3bf30f?w=800&h=600&fit=crop'
  };
  
  return categoryImages[category] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop';
}

module.exports = router;
