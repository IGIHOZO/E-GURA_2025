/**
 * LocalStorage Cleanup Utility
 * Prevents quota exceeded errors by managing storage
 */

export const StorageCleanup = {
  /**
   * Clear old orders to free up space
   */
  clearOldOrders() {
    try {
      console.log('🧹 Cleaning up localStorage...');
      
      // Get current size
      const before = this.getStorageSize();
      console.log('📊 Storage before cleanup:', before);
      
      // Remove old/duplicate order arrays
      localStorage.removeItem('orders');
      localStorage.removeItem('customer_orders');
      localStorage.removeItem('all_orders');
      
      // Keep only adminOrders (last 50)
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      if (adminOrders.length > 50) {
        const recent = adminOrders.slice(-50); // Keep last 50
        localStorage.setItem('adminOrders', JSON.stringify(recent));
      }
      
      const after = this.getStorageSize();
      console.log('📊 Storage after cleanup:', after);
      console.log('✅ Freed up:', (before - after).toFixed(2), 'KB');
      
      return true;
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return false;
    }
  },

  /**
   * Get current localStorage size in KB
   */
  getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  },

  /**
   * Check if storage is getting full
   */
  isStorageFull() {
    const size = parseFloat(this.getStorageSize());
    return size > 4096; // Alert if over 4MB (limit is ~5MB)
  },

  /**
   * Clear all order data (emergency cleanup)
   */
  clearAllOrders() {
    console.log('🚨 Emergency cleanup - clearing all orders');
    localStorage.removeItem('orders');
    localStorage.removeItem('adminOrders');
    localStorage.removeItem('customer_orders');
    localStorage.removeItem('all_orders');
    console.log('✅ All order data cleared');
  },

  /**
   * Get storage usage report
   */
  getStorageReport() {
    const report = {
      total: this.getStorageSize(),
      isFull: this.isStorageFull(),
      items: {}
    };

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = (localStorage[key].length / 1024).toFixed(2);
        report.items[key] = `${size} KB`;
      }
    }

    return report;
  },

  /**
   * Auto cleanup if needed
   */
  autoCleanup() {
    if (this.isStorageFull()) {
      console.log('⚠️ Storage is full, auto-cleaning...');
      return this.clearOldOrders();
    }
    return false;
  }
};

// Auto-run cleanup on import
StorageCleanup.autoCleanup();

export default StorageCleanup;
