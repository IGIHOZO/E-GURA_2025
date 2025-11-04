const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const {
  categories: hierarchicalCategories,
  getMainCategories,
  getSubcategories,
  getCategoryById,
  searchCategories
} = require('../config/categories');

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Get all categories (admin - includes inactive)
router.get('/admin/all', async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ displayOrder: 1, name: 1 });
    
    // Update product counts
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category.name });
      category.productCount = count;
      await category.save();
    }
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch category' });
  }
});

// Create category (admin)
router.post('/admin', async (req, res) => {
  try {
    const { name, description, image, icon, displayOrder } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const category = new Category({
      name,
      description,
      image,
      icon,
      displayOrder: displayOrder || 0,
      isActive: true
    });
    
    await category.save();
    
    console.log('✅ Category created:', category.name);
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// Update category (admin)
router.put('/admin/:id', async (req, res) => {
  try {
    const { name, description, image, icon, displayOrder, isActive } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image, icon, displayOrder, isActive },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    console.log('✅ Category updated:', category.name);
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// Delete category (admin)
router.delete('/admin/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Please reassign products first.`
      });
    }
    
    await category.deleteOne();
    
    console.log('✅ Category deleted:', category.name);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// Seed default categories (run once)
router.post('/admin/seed', async (req, res) => {
  try {
    const defaultCategories = [
      { name: 'Dresses', description: 'Beautiful dresses for all occasions', icon: '👗', displayOrder: 1 },
      { name: 'Tops', description: 'Stylish tops and blouses', icon: '👚', displayOrder: 2 },
      { name: 'Bottoms', description: 'Pants, skirts, and shorts', icon: '👖', displayOrder: 3 },
      { name: 'Outerwear', description: 'Jackets and coats', icon: '🧥', displayOrder: 4 },
      { name: 'Accessories', description: 'Complete your look', icon: '👜', displayOrder: 5 },
      { name: 'Shoes', description: 'Footwear for every style', icon: '👠', displayOrder: 6 },
      { name: 'Bags', description: 'Handbags and purses', icon: '👛', displayOrder: 7 },
      { name: 'Jewelry', description: 'Beautiful jewelry pieces', icon: '💍', displayOrder: 8 },
      { name: 'Swimwear', description: 'Beachwear and swimsuits', icon: '👙', displayOrder: 9 },
      { name: 'Activewear', description: 'Sportswear and gym clothes', icon: '🏃', displayOrder: 10 }
    ];
    
    const created = [];
    for (const cat of defaultCategories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const category = new Category(cat);
        await category.save();
        created.push(category);
      }
    }
    
    res.json({
      success: true,
      message: `Seeded ${created.length} categories`,
      data: created
    });
  } catch (error) {
    console.error('Seed categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed categories' });
  }
});

// ============================================
// HIERARCHICAL CATEGORIES WITH SUBCATEGORIES
// ============================================

/**
 * Get hierarchical categories (main categories with subcategories)
 * GET /api/categories/hierarchical
 */
router.get('/hierarchical/all', (req, res) => {
  try {
    res.json({
      success: true,
      total: hierarchicalCategories.length,
      categories: hierarchicalCategories
    });
  } catch (error) {
    console.error('❌ Get hierarchical categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hierarchical categories',
      error: error.message
    });
  }
});

/**
 * Get main categories only
 * GET /api/categories/hierarchical/main
 */
router.get('/hierarchical/main', (req, res) => {
  try {
    const mainCategories = getMainCategories();
    
    res.json({
      success: true,
      total: mainCategories.length,
      categories: mainCategories
    });
  } catch (error) {
    console.error('❌ Get main categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get main categories',
      error: error.message
    });
  }
});

/**
 * Get subcategories for a main category
 * GET /api/categories/hierarchical/:categoryId/subcategories
 */
router.get('/hierarchical/:categoryId/subcategories', (req, res) => {
  try {
    const { categoryId } = req.params;
    const subcategories = getSubcategories(categoryId);
    
    if (!subcategories || subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or has no subcategories'
      });
    }
    
    const category = getCategoryById(categoryId);
    
    res.json({
      success: true,
      categoryId,
      categoryName: category?.name,
      total: subcategories.length,
      subcategories
    });
  } catch (error) {
    console.error('❌ Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subcategories',
      error: error.message
    });
  }
});

/**
 * Search hierarchical categories
 * GET /api/categories/hierarchical/search?q=query
 */
router.get('/hierarchical/search/query', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    const results = searchCategories(q);
    
    res.json({
      success: true,
      query: q,
      total: results.length,
      results
    });
  } catch (error) {
    console.error('❌ Search hierarchical categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search categories',
      error: error.message
    });
  }
});

module.exports = router;
