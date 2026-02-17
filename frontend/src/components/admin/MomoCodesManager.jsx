import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const MomoCodesManager = () => {
  const [momoCodes, setMomoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '250',
    accountName: '',
    description: '',
    isActive: true,
    isPrimary: false,
    displayOrder: 0,
    network: 'MTN',
    instructions: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMomoCodes();
  }, []);

  const loadMomoCodes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      console.log('Loading MOMO codes with token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('/api/momo-codes/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('MOMO codes response:', response.data);
      
      if (response.data.success) {
        const codes = response.data.data;
        console.log('Loaded MOMO codes:', codes);
        console.log('MOMO code IDs:', codes.map(code => ({ id: code.id, _id: code._id, phoneNumber: code.phoneNumber })));
        setMomoCodes(codes);
      }
    } catch (error) {
      console.error('Error loading MOMO codes:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to load MOMO codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!/^250\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be in format 250XXXXXXXXX';
    }
    if (!formData.accountName.trim()) newErrors.accountName = 'Account name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingCode) {
        // Update existing code
        const codeId = editingCode.id || editingCode._id;
        console.log('Updating MOMO code with ID:', codeId);
        await axios.put(`/api/momo-codes/admin/${codeId}`, formData, config);
        alert('MOMO code updated successfully!');
      } else {
        // Create new code
        await axios.post('/api/momo-codes/admin', formData, config);
        alert('MOMO code created successfully!');
      }

      setShowModal(false);
      setEditingCode(null);
      resetForm();
      loadMomoCodes();
    } catch (error) {
      console.error('Error saving MOMO code:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          `Failed to save MOMO code (${error.response?.status || 'Unknown error'})`;
      alert(errorMessage);
    }
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      name: code.name,
      phoneNumber: code.phoneNumber,
      accountName: code.accountName,
      description: code.description || '',
      isActive: code.isActive,
      isPrimary: code.isPrimary,
      displayOrder: code.displayOrder,
      network: code.network,
      instructions: code.instructions || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this MOMO code?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      console.log('Deleting MOMO code with ID:', id);
      console.log('Using token:', token ? 'Present' : 'Missing');
      
      const response = await axios.delete(`/api/momo-codes/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete response:', response.data);
      alert('MOMO code deleted successfully!');
      loadMomoCodes();
    } catch (error) {
      console.error('Error deleting MOMO code:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          `Failed to delete MOMO code (${error.response?.status || 'Unknown error'})`;
      alert(errorMessage);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/momo-codes/admin/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadMomoCodes();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/momo-codes/admin/${id}/set-primary`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Primary MOMO code updated successfully!');
      loadMomoCodes();
    } catch (error) {
      console.error('Error setting primary:', error);
      alert(error.response?.data?.message || 'Failed to set as primary');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '250',
      accountName: '',
      description: '',
      isActive: true,
      isPrimary: false,
      displayOrder: 0,
      network: 'MTN',
      instructions: ''
    });
    setErrors({});
  };

  const handleAddNew = () => {
    setEditingCode(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading MOMO codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MOMO Codes Management</h2>
          <p className="text-gray-600 mt-1">Manage mobile money payment codes for customers</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add MOMO Code
        </button>
      </div>

      {/* MOMO Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {momoCodes.map((code) => (
          <motion.div
            key={code.id || code._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-purple-300 transition-all p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${code.network === 'MTN' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <PhoneIcon className={`h-6 w-6 ${code.network === 'MTN' ? 'text-yellow-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{code.name}</h3>
                  <p className="text-sm text-gray-600">{code.network} Mobile Money</p>
                </div>
              </div>
              
              {/* Status badges */}
              <div className="flex flex-col gap-1">
                {code.isPrimary && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <StarIcon className="h-3 w-3" />
                    Primary
                  </span>
                )}
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                  code.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {code.isActive ? (
                    <>
                      <CheckCircleIcon className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-3 w-3" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Phone Number</p>
                <p className="text-lg font-bold text-gray-900">{code.phoneNumber}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Account Name</p>
                <p className="text-gray-900">{code.accountName}</p>
              </div>

              {code.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-sm text-gray-600">{code.description}</p>
                </div>
              )}

              {code.instructions && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Instructions</p>
                  <p className="text-sm text-gray-600">{code.instructions}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700">Display Order</p>
                <p className="text-sm text-gray-600">{code.displayOrder}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(code)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              
              <button
                onClick={() => handleToggleStatus(code.id || code._id)}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                  code.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {code.isActive ? (
                  <>
                    <EyeSlashIcon className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4" />
                    Activate
                  </>
                )}
              </button>

              {!code.isPrimary && code.isActive && (
                <button
                  onClick={() => handleSetPrimary(code.id || code._id)}
                  className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  title="Set as Primary"
                >
                  <StarIcon className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => handleDelete(code.id || code._id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {momoCodes.length === 0 && (
        <div className="text-center py-12">
          <PhoneIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No MOMO codes yet</h3>
          <p className="text-gray-600 mb-4">Add your first mobile money payment code to get started.</p>
          <button
            onClick={handleAddNew}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add First MOMO Code
          </button>
        </div>
      )}

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
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingCode ? 'Edit MOMO Code' : 'Add New MOMO Code'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Uwase Store Account"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="250788123456"
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Account holder name"
                    />
                    {errors.accountName && <p className="text-red-500 text-sm mt-1">{errors.accountName}</p>}
                  </div>

                  {/* Network */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <select
                      value={formData.network}
                      onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="MTN">MTN</option>
                      <option value="AIRTEL">Airtel</option>
                    </select>
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Optional description for this MOMO account"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Special instructions for customers using this MOMO code"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as Primary</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    {editingCode ? 'Update MOMO Code' : 'Create MOMO Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                  >
                    Cancel
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

export default MomoCodesManager;
