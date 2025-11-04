import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const CategoryManager = ({ onCategoriesUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: '',
    displayOrder: 0,
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories/admin/all');
      if (response.data.success) {
        setCategories(response.data.data);
        if (onCategoriesUpdate) {
          onCategoriesUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        // Update
        await axios.put(`http://localhost:5000/api/categories/admin/${editingCategory._id}`, formData);
        alert('✅ Category updated successfully!');
      } else {
        // Create
        await axios.post('/api/categories/admin', formData);
        alert('✅ Category created successfully!');
      }

      resetForm();
      loadCategories();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('❌ ' + (error.response?.data?.message || 'Failed to save category'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (!confirm(`Delete category "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/categories/admin/${category._id}`);
      alert('✅ Category deleted successfully!');
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('❌ ' + (error.response?.data?.message || 'Failed to delete category'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      icon: '',
      displayOrder: 0,
      isActive: true
    });
    setEditingCategory(null);
  };

  const seedDefaultCategories = async () => {
    if (!confirm('Seed default categories? This will add 10 default categories.')) {
      return;
    }

    try {
      const response = await axios.post('/api/categories/admin/seed');
      alert('✅ ' + response.data.message);
      loadCategories();
    } catch (error) {
      console.error('Failed to seed categories:', error);
      alert('❌ Failed to seed categories');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          Categories ({categories.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={seedDefaultCategories}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all"
          >
            Seed Defaults
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <motion.div
            key={category._id}
            whileHover={{ scale: 1.02 }}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{category.icon || '📁'}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.productCount || 0} products</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Order: {category.displayOrder}</span>
              <span className={category.isActive ? 'text-green-600' : 'text-red-600'}>
                {category.isActive ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h3 className="text-2xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Dresses"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Brief description of the category"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon (Emoji)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="👗"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <label className="text-gray-700 font-medium">Active</label>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        {editingCategory ? 'Update' : 'Create'} Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryManager;
