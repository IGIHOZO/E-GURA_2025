import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadProducts().catch(error => {
      console.error('Error loading products:', error);
    });
  }, []);

  const loadOrders = async () => {
    try {
      // Try to fetch from API first
      try {
        const response = await fetch('/api/admin/orders/all');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.orders) {
            console.log('Loaded orders from API:', data.orders.length);
            setOrders(data.orders);
            return;
          }
        }
      } catch (apiError) {
        console.log('API not available, using localStorage:', apiError.message);
      }
      
      // Fallback to localStorage
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      const allOrders = [...savedOrders, ...adminOrders];
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => (o.id || o._id) === (order.id || order._id))
      );
      
      setOrders(uniqueOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const loadCustomers = async () => {
    try {
      // Try to fetch from API first
      try {
        const response = await fetch('/api/admin/customers');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.customers) {
            console.log('Loaded customers from API:', data.customers.length);
            setCustomers(data.customers);
            return;
          }
        }
      } catch (apiError) {
        console.log('API not available for customers:', apiError.message);
      }
      
      // Fallback to localStorage
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      setCustomers(customers);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadProducts = async () => {
    try {
      // Try to get products from API first
      let apiProducts = [];
      try {
        const response = await productsAPI.getAll({ limit: 50 });
        apiProducts = response.data || [];
        console.log('API products loaded:', apiProducts);
      } catch (apiError) {
        console.log('API failed, using localStorage only:', apiError);
      }
      
      // Get products from localStorage (admin added products)
      let localProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
      console.log('Loading products from localStorage:', localProducts);
      
      // Combine API products with local products
      let products = [...apiProducts, ...localProducts];
      console.log('All products combined:', products);
      
      // If no products exist, add some sample products for testing
       if (products.length === 0) {
         const sampleProducts = [
                       {
              id: 'product-1',
              name: 'Sample Product 1',
              description: 'A sample product for testing',
              price: 25000,
              mainImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
              image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
              category: 'Sample'
            },
            {
              id: 'product-2',
              name: 'Sample Product 2',
              description: 'Another sample product for testing',
              price: 35000,
              mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
              image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
              category: 'Sample'
            },
            {
              id: 'product-3',
              name: 'Sample Product 3',
              description: 'A third sample product for testing',
              price: 45000,
              mainImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
              image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
              category: 'Sample'
            }
         ];
        
        localStorage.setItem('adminProducts', JSON.stringify(sampleProducts));
        products = sampleProducts;
        console.log('Added sample products for testing');
      }
      
      setProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      
      const updatedSavedOrders = savedOrders.map(order => {
        if ((order.id || order._id) === orderId) {
          return { ...order, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return order;
      });
      
      const updatedAdminOrders = adminOrders.map(order => {
        if ((order.id || order._id) === orderId) {
          return { ...order, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return order;
      });
      
      localStorage.setItem('orders', JSON.stringify(updatedSavedOrders));
      localStorage.setItem('adminOrders', JSON.stringify(updatedAdminOrders));
      
      setOrders(prevOrders => prevOrders.map(order => {
        if ((order.id || order._id) === orderId) {
          return { ...order, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return order;
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const viewOrderDetails = (order) => {
    console.log('Viewing order details for:', order.id, 'Products available:', products.length);
    console.log('All products:', products);
    console.log('Order items:', order.items);
    
    // Enhance order items with product images if they don't have them
    const enhancedOrder = { ...order };
    if (enhancedOrder.items && enhancedOrder.items.length > 0) {
      enhancedOrder.items = enhancedOrder.items.map((item, index) => {
        console.log('Processing item:', item.name, 'Item ID:', item.id, 'Product ID:', item.productId);
        
        // Try multiple ways to find the product
        let product = null;
        
        // Method 1: Direct ID match
        if (item.id) {
          product = products.find(p => p.id === item.id || p._id === item.id);
          if (product) console.log('Found product by direct ID match');
        }
        
        // Method 2: Product ID match
        if (!product && item.productId) {
          product = products.find(p => p.id === item.productId || p._id === item.productId);
          if (product) console.log('Found product by product ID match');
        }
        
        // Method 3: Name match (case insensitive)
        if (!product && item.name) {
          product = products.find(p => 
            p.name && p.name.toLowerCase() === item.name.toLowerCase()
          );
          if (product) console.log('Found product by exact name match');
        }
        
        // Method 4: Partial name match
        if (!product && item.name) {
          product = products.find(p => 
            p.name && p.name.toLowerCase().includes(item.name.toLowerCase())
          );
          if (product) console.log('Found product by partial name match');
        }
        
        // Method 5: If no product found, use sample products based on index
        if (!product && products.length > 0) {
          product = products[index % products.length];
          console.log('Using sample product as fallback');
        }
        
        // Try to get the actual product image first
        let finalImage = null;
        
        // First, try to get image from the item itself (if it was saved with the order)
        if (item.mainImage || item.image || item.productImage || item.images?.[0] || item.imageUrl) {
          finalImage = item.mainImage || item.image || item.productImage || item.images?.[0] || item.imageUrl;
          console.log('Using saved image for item:', item.name, 'Image URL:', finalImage);
        }
        // If no saved image, try to get from the found product
        else if (product && (product.mainImage || product.image || product.images?.[0])) {
          finalImage = product.mainImage || product.image || product.images?.[0];
          console.log('Using product image for item:', item.name, 'Image URL:', finalImage);
        }
        // If still no image, use a fallback based on product name
        else {
          finalImage = `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop`;
          console.log('Using fallback image for item:', item.name, 'Image URL:', finalImage);
        }
        
        return {
          ...item,
          mainImage: finalImage,
          image: finalImage,
          productImage: finalImage,
          images: [finalImage]
        };
      });
    }
    
    setSelectedOrder(enhancedOrder);
    setShowOrderDetails(true);
  };

  // Search functions
  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredOrders(orders);
      setFilteredProducts(products);
      setFilteredCustomers(customers);
      return;
    }

    const lowerTerm = term.toLowerCase();

    // Filter orders
    const filteredOrders = orders.filter(order => 
      (order.id || order._id || '').toLowerCase().includes(lowerTerm) ||
      (order.shippingAddress?.firstName || '').toLowerCase().includes(lowerTerm) ||
      (order.shippingAddress?.lastName || '').toLowerCase().includes(lowerTerm) ||
      (order.shippingAddress?.phone || '').toLowerCase().includes(lowerTerm) ||
      (order.status || '').toLowerCase().includes(lowerTerm) ||
      (order.total || order.subtotal || '').toString().includes(lowerTerm)
    );
    setFilteredOrders(filteredOrders);

    // Filter products
    const filteredProducts = products.filter(product => 
      (product.name || '').toLowerCase().includes(lowerTerm) ||
      (product.description || '').toLowerCase().includes(lowerTerm) ||
      (product.price || '').toString().includes(lowerTerm) ||
      (product.category || '').toLowerCase().includes(lowerTerm)
    );
    setFilteredProducts(filteredProducts);

    // Filter customers
    const filteredCustomers = customers.filter(customer => 
      (customer.name || '').toLowerCase().includes(lowerTerm) ||
      (customer.phoneNumber || '').toLowerCase().includes(lowerTerm) ||
      (customer.email || '').toLowerCase().includes(lowerTerm)
    );
    setFilteredCustomers(filteredCustomers);
  };

  // Initialize filtered data when data loads
  useEffect(() => {
    setFilteredOrders(orders);
    setFilteredProducts(products);
    setFilteredCustomers(customers);
  }, [orders, products, customers]);

  // Debug function to test with real products
  const createTestOrderWithRealProducts = () => {
    if (products.length === 0) {
      console.log('No products available for test order');
      return;
    }
    
    const testProduct = products[0]; // Use the first available product
    console.log('Creating test order with real product:', testProduct);
    
    const testOrder = {
      id: `test-order-${Date.now()}`,
      orderNumber: `TEST-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      total: testProduct.price * 2,
      subtotal: testProduct.price * 2,
      paymentMethod: 'Mobile Money',
      shippingAddress: {
        firstName: 'Test',
        lastName: 'Customer',
        phone: '0782013955',
        address: 'Test Address',
        city: 'Kigali'
      },
      items: [
        {
          ...testProduct,
          id: testProduct.id || testProduct._id,
          productId: testProduct.id || testProduct._id,
          quantity: 2,
          mainImage: testProduct.mainImage,
          image: testProduct.image,
          productImage: testProduct.productImage,
          images: testProduct.images || [testProduct.mainImage || testProduct.image]
        }
      ]
    };
    
    console.log('Test order created:', testOrder);
    
    // Add to orders
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(testOrder);
    localStorage.setItem('orders', JSON.stringify(existingOrders));
    
    const existingAdminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    existingAdminOrders.push(testOrder);
    localStorage.setItem('adminOrders', JSON.stringify(existingAdminOrders));
    
    // Reload orders
    loadOrders();
    
    console.log('Test order added successfully');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
            Manage your E-Gura Store
          </p>
          
          {/* Search Bar */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search orders, products, customers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}>
                🔍
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          {[
            { name: 'Total Sales', value: '2,450,000 RWF', color: '#10b981' },
            { name: 'Orders', value: searchTerm ? `${filteredOrders.length}/${orders.length}` : orders.length.toString(), color: '#3b82f6' },
            { name: 'Products', value: searchTerm ? `${filteredProducts.length}/${products.length}` : products.length.toString(), color: '#8b5cf6' },
            { name: 'Customers', value: searchTerm ? `${filteredCustomers.length}/${customers.length}` : customers.length.toString(), color: '#f59e0b' }
          ].map((stat, index) => (
            <div key={stat.name} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>
                {stat.name}
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', padding: '0 24px' }}>
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'products', name: 'Products' },
                { id: 'orders', name: 'Orders' },
                { id: 'customers', name: 'Customers' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 8px',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#8b5cf6' : 'transparent'}`,
                    color: activeTab === tab.id ? '#8b5cf6' : '#6b7280',
                    fontWeight: '500',
                    fontSize: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginRight: '32px'
                  }}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Recent Activity
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#6b7280' }}>
                      Welcome to your admin dashboard! You have {orders.length} orders and {customers.length} customers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Products ({searchTerm ? filteredProducts.length : products.length})
                  {searchTerm && <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'normal' }}> of {products.length}</span>}
                </h3>
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <p style={{ color: '#6b7280' }}>
                      {searchTerm ? `No products found matching "${searchTerm}"` : 'No products found.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {filteredProducts.map((product) => (
                      <div key={product.id} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                          {product.name}
                        </h4>
                        <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                          {product.description}
                        </p>
                        <p style={{ margin: 0, fontWeight: '600', color: '#111827' }}>
                          RWF {product.price?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Orders ({searchTerm ? filteredOrders.length : orders.length})
                    {searchTerm && <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'normal' }}> of {orders.length}</span>}
                  </h3>
                                     <div style={{ display: 'flex', gap: '8px' }}>
                     <button
                       onClick={loadOrders}
                       style={{
                         backgroundColor: '#8b5cf6',
                         color: 'white',
                         padding: '8px 16px',
                         borderRadius: '8px',
                         border: 'none',
                         cursor: 'pointer',
                         fontWeight: '500'
                       }}
                     >
                       Refresh Orders
                     </button>
                     <button
                       onClick={createTestOrderWithRealProducts}
                       style={{
                         backgroundColor: '#10b981',
                         color: 'white',
                         padding: '8px 16px',
                         borderRadius: '8px',
                         border: 'none',
                         cursor: 'pointer',
                         fontWeight: '500'
                       }}
                     >
                       Create Test Order
                     </button>
                   </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <p style={{ color: '#6b7280' }}>
                      {searchTerm ? `No orders found matching "${searchTerm}"` : 'No orders found.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Order ID</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Customer</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Items</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Total</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Status</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id || order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ fontWeight: '500', color: '#111827' }}>#{order.id || order._id}</span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div>
                                <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px 0' }}>
                                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                </p>
                                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                  {order.shippingAddress?.phone}
                                </p>
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                              {order.items?.length || 0} items
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                              RWF {(order.total || order.subtotal || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{
                                backgroundColor: order.status === 'paid' ? '#dcfce7' : 
                                               order.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                color: order.status === 'paid' ? '#166534' : 
                                       order.status === 'pending' ? '#92400e' : '#dc2626',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                              }}>
                                {order.status || 'pending'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => viewOrderDetails(order)}
                                  style={{
                                    color: '#8b5cf6',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                  }}
                                >
                                  View Details
                                </button>
                                <select 
                                  value={order.status || 'pending'}
                                  onChange={(e) => updateOrderStatus(order.id || order._id, e.target.value)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  All Customers ({searchTerm ? filteredCustomers.length : customers.length})
                  {searchTerm && <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'normal' }}> of {customers.length}</span>}
                </h3>
                {filteredCustomers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <p style={{ color: '#6b7280' }}>
                      {searchTerm ? `No customers found matching "${searchTerm}"` : 'No customers found.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Customer</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Phone</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Email</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((customer, index) => (
                          <tr key={customer.id || customer._id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '16px 24px' }}>{customer.name || 'N/A'}</td>
                            <td style={{ padding: '16px 24px' }}>{customer.phoneNumber || 'N/A'}</td>
                            <td style={{ padding: '16px 24px' }}>{customer.email || 'N/A'}</td>
                            <td style={{ padding: '16px 24px' }}>
                              {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '95%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                   Order Details - #{selectedOrder.orderNumber || selectedOrder.id || selectedOrder._id}
                 </h2>
                                   <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      ×
                    </button>
                  </div>
               </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Order Information */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Order Information
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Order ID</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0, fontWeight: '500' }}>
                        {selectedOrder.id || selectedOrder._id}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Order Number</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0, fontWeight: '500' }}>
                        {selectedOrder.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Status</p>
                      <span style={{
                        backgroundColor: selectedOrder.status === 'paid' ? '#dcfce7' : 
                                         selectedOrder.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: selectedOrder.status === 'paid' ? '#166534' : 
                               selectedOrder.status === 'pending' ? '#92400e' : '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {selectedOrder.status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Date</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Payment Method</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                        {selectedOrder.paymentMethod || 'Mobile Money'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Total Amount</p>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, fontWeight: '600' }}>
                        RWF {(selectedOrder.total || selectedOrder.subtotal || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Customer Information
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Name</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0, fontWeight: '500' }}>
                        {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName} {selectedOrder.customerInfo?.firstName} {selectedOrder.customerInfo?.lastName}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Phone</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                        {selectedOrder.shippingAddress?.phone || selectedOrder.customerInfo?.phone}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Email</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                        {selectedOrder.shippingAddress?.email || selectedOrder.customerInfo?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Address</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                        {selectedOrder.shippingAddress?.address || selectedOrder.customerInfo?.address || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>City</p>
                      <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
                        {selectedOrder.shippingAddress?.city || selectedOrder.customerInfo?.city || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Order Items ({selectedOrder.items.length})
                  </h3>
                  
                  
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                             <thead>
                         <tr style={{ backgroundColor: '#f9fafb' }}>
                           <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#374151', width: '60px' }}>
                             Image
                           </th>
                           <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                             Product Details
                           </th>
                           <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                             Price
                           </th>
                           <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                             Quantity
                           </th>
                           <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                             Total
                           </th>
                         </tr>
                       </thead>
                      <tbody>
                                                 {selectedOrder.items.map((item, index) => (
                           <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                             {/* Image Column */}
                             <td style={{ padding: '12px', textAlign: 'center' }}>
                               <div style={{ position: 'relative', display: 'inline-block' }}>
                                 <div style={{
                                   width: '60px',
                                   height: '60px',
                                   borderRadius: '8px',
                                   backgroundColor: `#${['FF6B6B', '4ECDC4', '45B7D1', '96CEB4'][index % 4]}`,
                                   border: '2px solid #d1d5db',
                                   boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   color: 'white',
                                   fontWeight: 'bold',
                                   fontSize: '20px'
                                 }}>
                                   {item.name?.charAt(0) || 'P'}
                                 </div>
                                                                   <img
                                    src={item.mainImage || item.image || item.productImage || item.images?.[0] || item.imageUrl || `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop`}
                                    alt={item.name || 'Product'}
                                    title={`Image for ${item.name || 'Product'}`}
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      backgroundColor: '#e5e7eb',
                                      border: '2px solid #d1d5db',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                      display: 'block',
                                      minWidth: '60px',
                                      minHeight: '60px',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      zIndex: 1
                                    }}
                                    onError={(e) => {
                                      console.log('Image failed to load for item:', item.name, 'Trying fallback...');
                                      // Try a different fallback if the first one fails
                                      if (e.target.src.includes('unsplash')) {
                                        e.target.src = `https://picsum.photos/60/60?random=${index + 100}`;
                                      } else {
                                        e.target.src = `https://source.unsplash.com/60x60/?product,${encodeURIComponent(item.name || 'product')}&sig=${index}`;
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log('Image loaded successfully for item:', item.name, 'URL:', e.target.src);
                                    }}
                                  />
                                 {/* Image indicator */}
                                 <div style={{
                                   position: 'absolute',
                                   top: '-4px',
                                   right: '-4px',
                                   width: '16px',
                                   height: '16px',
                                   borderRadius: '50%',
                                   backgroundColor: item.mainImage || item.image || item.productImage || item.images?.[0] || item.imageUrl ? '#10b981' : '#f59e0b',
                                   border: '2px solid white',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   fontSize: '8px',
                                   color: 'white',
                                   fontWeight: 'bold'
                                 }}>
                                   {item.mainImage || item.image || item.productImage || item.images?.[0] || item.imageUrl ? '✓' : '!'}
                                 </div>
                               </div>
                             </td>
                             {/* Product Details Column */}
                             <td style={{ padding: '12px' }}>
                               <div>
                                 <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 4px 0', fontSize: '14px' }}>
                                   {item.name || 'Product'}
                                 </p>
                                 {item.size && (
                                   <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>
                                     Size: {item.size}
                                   </p>
                                 )}
                                 {item.color && (
                                   <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                                     Color: {item.color}
                                   </p>
                                 )}
                                 {/* Image source info for debugging */}
                                 <p style={{ fontSize: '10px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                                   Image: {item.mainImage || item.image || item.productImage || item.images?.[0] || item.imageUrl ? 'Available' : 'Placeholder'}
                                 </p>
                               </div>
                             </td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>
                              RWF {item.price?.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '500', color: '#111827' }}>
                              RWF {(item.price * item.quantity)?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 