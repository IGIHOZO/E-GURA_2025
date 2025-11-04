/**
 * Order Tracking Service
 * Real-time order status tracking with notifications
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer not available - emails will be logged only');
}

class OrderTrackingService {
  constructor() {
    this.orders = new Map();
    this.trackingHistory = new Map();
    
    // Order statuses
    this.statuses = {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      PROCESSING: 'processing',
      SHIPPED: 'shipped',
      IN_TRANSIT: 'in_transit',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
      RETURNED: 'returned'
    };

    // Email transporter (optional)
    this.emailTransporter = null;
    if (nodemailer && process.env.SMTP_USER) {
      try {
        this.emailTransporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('✅ Email transporter initialized');
      } catch (e) {
        console.warn('⚠️ Email transporter failed:', e.message);
      }
    } else {
      console.log('📧 Email disabled (no SMTP config) - notifications will be logged');
    }
  }

  /**
   * Create tracking for new order
   */
  createTracking(orderData) {
    const trackingId = `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const tracking = {
      trackingId,
      orderId: orderData.orderId,
      userId: orderData.userId,
      email: orderData.email,
      phone: orderData.phone,
      status: this.statuses.PENDING,
      estimatedDelivery: this.calculateEstimatedDelivery(orderData.shippingAddress),
      currentLocation: 'Warehouse - Kigali',
      carrier: 'E-Gura Express',
      history: [{
        status: this.statuses.PENDING,
        location: 'Order Received',
        timestamp: new Date(),
        message: 'Your order has been received and is being processed'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.orders.set(trackingId, tracking);
    this.trackingHistory.set(orderData.orderId, [tracking.history[0]]);
    
    console.log('📦 Tracking created:', trackingId);
    
    // Send confirmation email
    this.sendStatusNotification(trackingId, 'order_confirmed');
    
    return tracking;
  }

  /**
   * Update order status
   */
  async updateStatus(trackingId, newStatus, location, message) {
    const tracking = this.orders.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking not found');
    }

    const statusUpdate = {
      status: newStatus,
      location,
      timestamp: new Date(),
      message: message || this.getDefaultMessage(newStatus)
    };

    tracking.status = newStatus;
    tracking.currentLocation = location;
    tracking.updatedAt = new Date();
    tracking.history.push(statusUpdate);

    this.orders.set(trackingId, tracking);
    
    const history = this.trackingHistory.get(tracking.orderId) || [];
    history.push(statusUpdate);
    this.trackingHistory.set(tracking.orderId, history);

    console.log(`📍 Status updated: ${trackingId} → ${newStatus}`);

    // Send notification
    await this.sendStatusNotification(trackingId, newStatus);

    return tracking;
  }

  /**
   * Get default status message
   */
  getDefaultMessage(status) {
    const messages = {
      [this.statuses.PENDING]: 'Your order has been received',
      [this.statuses.CONFIRMED]: 'Your order has been confirmed',
      [this.statuses.PROCESSING]: 'Your order is being prepared',
      [this.statuses.SHIPPED]: 'Your order has been shipped',
      [this.statuses.IN_TRANSIT]: 'Your order is on the way',
      [this.statuses.OUT_FOR_DELIVERY]: 'Your order is out for delivery',
      [this.statuses.DELIVERED]: 'Your order has been delivered',
      [this.statuses.CANCELLED]: 'Your order has been cancelled',
      [this.statuses.RETURNED]: 'Your order has been returned'
    };
    return messages[status] || 'Status updated';
  }

  /**
   * Calculate estimated delivery
   */
  calculateEstimatedDelivery(shippingAddress) {
    const now = new Date();
    let daysToAdd = 3; // Default 3 days

    if (shippingAddress.city === 'Kigali') {
      daysToAdd = 1; // Same day or next day for Kigali
    } else if (shippingAddress.city === 'Huye' || shippingAddress.city === 'Musanze') {
      daysToAdd = 2;
    }

    const deliveryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return deliveryDate;
  }

  /**
   * Send status notification via email/SMS
   */
  async sendStatusNotification(trackingId, status) {
    const tracking = this.orders.get(trackingId);
    if (!tracking) return;

    const emailHTML = this.generateTrackingEmail(tracking, status);

    try {
      // Send email
      if (tracking.email && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: '"E-Gura Store" <noreply@egura.com>',
          to: tracking.email,
          subject: this.getEmailSubject(status),
          html: emailHTML
        });
        console.log('📧 Tracking notification sent:', tracking.email);
      } else {
        console.log('📧 [DEMO] Email would be sent to:', tracking.email, '- Subject:', this.getEmailSubject(status));
      }

      // SMS notification (integrate with Twilio/AfricasTalking)
      if (tracking.phone) {
        const smsMessage = this.generateSMSMessage(tracking, status);
        console.log('📱 SMS queued:', tracking.phone, smsMessage);
        // await this.sendSMS(tracking.phone, smsMessage);
      }

    } catch (error) {
      console.error('❌ Notification failed:', error.message);
    }
  }

  /**
   * Generate tracking email
   */
  generateTrackingEmail(tracking, status) {
    const statusIcon = {
      'order_confirmed': '✅',
      'shipped': '🚚',
      'in_transit': '📦',
      'out_for_delivery': '🏃',
      'delivered': '🎉'
    };

    const icon = statusIcon[status] || '📦';
    const deliveryDate = tracking.estimatedDelivery.toLocaleDateString();

    const historyHTML = tracking.history.map(h => `
      <div style="display: flex; align-items: flex-start; margin-bottom: 20px; position: relative;">
        <div style="width: 12px; height: 12px; background: #f97316; border-radius: 50%; margin-right: 15px; margin-top: 5px; border: 3px solid #fed7aa;"></div>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: #1f2937;">${h.status.toUpperCase()}</div>
          <div style="color: #6b7280; font-size: 14px;">${h.location}</div>
          <div style="color: #9ca3af; font-size: 12px;">${h.timestamp.toLocaleString()}</div>
          <div style="color: #4b5563; font-size: 14px; margin-top: 5px;">${h.message}</div>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px; text-align: center;">
            <div style="font-size: 60px; margin-bottom: 10px;">${icon}</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Update!</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
              <div style="font-size: 14px; color: #92400e; margin-bottom: 5px;">Tracking Number</div>
              <div style="font-size: 24px; font-weight: bold; color: #78350f;">${tracking.trackingId}</div>
            </div>

            <div style="margin-bottom: 30px;">
              <div style="font-size: 16px; color: #6b7280; margin-bottom: 10px;">Current Status</div>
              <div style="font-size: 22px; font-weight: bold; color: #f97316;">${tracking.status.toUpperCase()}</div>
              <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">📍 ${tracking.currentLocation}</div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Estimated Delivery</div>
              <div style="font-size: 20px; font-weight: bold; color: #1f2937;">${deliveryDate}</div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 5px;">We'll notify you when your package arrives</div>
            </div>

            <!-- Tracking History -->
            <div style="margin-top: 30px;">
              <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Tracking History</h2>
              <div style="border-left: 2px solid #e5e7eb; padding-left: 20px;">
                ${historyHTML}
              </div>
            </div>

            <!-- Track Button -->
            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/track/${tracking.trackingId}" 
                 style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
                Track Your Order
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
          <p>E-Gura Store | Kigali, Rwanda</p>
          <p>Need help? Contact us at support@egura.com</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate SMS message
   */
  generateSMSMessage(tracking, status) {
    return `E-Gura: Your order ${tracking.trackingId} is ${status}. Current location: ${tracking.currentLocation}. Track: ${process.env.FRONTEND_URL}/track/${tracking.trackingId}`;
  }

  /**
   * Get email subject
   */
  getEmailSubject(status) {
    const subjects = {
      'order_confirmed': '✅ Order Confirmed - E-Gura Store',
      'shipped': '🚚 Your Order Has Been Shipped!',
      'in_transit': '📦 Your Order is On the Way',
      'out_for_delivery': '🏃 Out for Delivery Today!',
      'delivered': '🎉 Your Order Has Been Delivered!'
    };
    return subjects[status] || 'Order Update - E-Gura Store';
  }

  /**
   * Get tracking info
   */
  getTracking(trackingId) {
    return this.orders.get(trackingId);
  }

  /**
   * Get tracking by order ID
   */
  getTrackingByOrderId(orderId) {
    for (const [trackingId, tracking] of this.orders.entries()) {
      if (tracking.orderId === orderId) {
        return tracking;
      }
    }
    return null;
  }

  /**
   * Simulate shipment progress (for demo)
   */
  async simulateShipment(trackingId) {
    const steps = [
      { status: this.statuses.CONFIRMED, location: 'Warehouse - Kigali', delay: 0 },
      { status: this.statuses.PROCESSING, location: 'Processing Center', delay: 2000 },
      { status: this.statuses.SHIPPED, location: 'Distribution Hub', delay: 4000 },
      { status: this.statuses.IN_TRANSIT, location: 'En Route to Destination', delay: 6000 },
      { status: this.statuses.OUT_FOR_DELIVERY, location: 'Local Delivery Center', delay: 8000 },
      { status: this.statuses.DELIVERED, location: 'Delivered to Customer', delay: 10000 }
    ];

    for (const step of steps) {
      setTimeout(async () => {
        await this.updateStatus(trackingId, step.status, step.location);
      }, step.delay);
    }
  }

  /**
   * Get order statistics
   */
  getStats() {
    const orders = Array.from(this.orders.values());
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === this.statuses.PENDING).length,
      shipped: orders.filter(o => o.status === this.statuses.SHIPPED).length,
      delivered: orders.filter(o => o.status === this.statuses.DELIVERED).length,
      inTransit: orders.filter(o => o.status === this.statuses.IN_TRANSIT).length,
      cancelled: orders.filter(o => o.status === this.statuses.CANCELLED).length
    };
  }
}

module.exports = new OrderTrackingService();
