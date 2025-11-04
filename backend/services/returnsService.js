/**
 * Returns & Refund Management Service
 * Self-service portal for returns and refunds
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer not available for returns service');
}

class ReturnsService {
  constructor() {
    this.returns = new Map();
    this.refunds = new Map();
    
    // Return reasons
    this.returnReasons = [
      'Defective/Damaged product',
      'Wrong item received',
      'Size/fit issues',
      'Not as described',
      'Changed mind',
      'Better price elsewhere',
      'Quality not satisfactory',
      'Other'
    ];

    // Return statuses
    this.statuses = {
      REQUESTED: 'requested',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      IN_TRANSIT: 'in_transit',
      RECEIVED: 'received',
      REFUNDED: 'refunded',
      CANCELLED: 'cancelled'
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
      } catch (e) {
        console.warn('⚠️ Email setup failed for returns service');
      }
    }
  }

  /**
   * Create return request
   */
  async createReturnRequest(returnData) {
    const returnId = `RET${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Validate return eligibility
    const eligibility = this.checkEligibility(returnData.orderId, returnData.orderDate);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const returnRequest = {
      returnId,
      orderId: returnData.orderId,
      userId: returnData.userId,
      email: returnData.email,
      phone: returnData.phone,
      items: returnData.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        reason: item.reason,
        comments: item.comments
      })),
      totalRefundAmount: this.calculateRefundAmount(returnData.items),
      reason: returnData.reason,
      comments: returnData.comments,
      images: returnData.images || [], // Evidence photos
      status: this.statuses.REQUESTED,
      pickupAddress: returnData.pickupAddress,
      refundMethod: returnData.refundMethod || 'original_payment',
      history: [{
        status: this.statuses.REQUESTED,
        timestamp: new Date(),
        note: 'Return request submitted'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.returns.set(returnId, returnRequest);
    console.log('📦 Return request created:', returnId);

    // Send confirmation email
    await this.sendReturnConfirmation(returnId);

    // Auto-approve for certain reasons (can be manual review for others)
    if (returnData.reason === 'Defective/Damaged product' || 
        returnData.reason === 'Wrong item received') {
      setTimeout(() => this.approveReturn(returnId, 'Auto-approved'), 1000);
    }

    return returnRequest;
  }

  /**
   * Check return eligibility
   */
  checkEligibility(orderId, orderDate) {
    const orderDateTime = new Date(orderDate).getTime();
    const now = Date.now();
    const daysSincePurchase = (now - orderDateTime) / (1000 * 60 * 60 * 24);

    // Return policy: 14 days for most items
    const returnWindow = 14;

    if (daysSincePurchase > returnWindow) {
      return {
        eligible: false,
        reason: `Return window has expired. Returns accepted within ${returnWindow} days of delivery.`
      };
    }

    return {
      eligible: true,
      reason: 'Eligible for return'
    };
  }

  /**
   * Calculate refund amount
   */
  calculateRefundAmount(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Approve return request
   */
  async approveReturn(returnId, approverNote) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    returnRequest.status = this.statuses.APPROVED;
    returnRequest.approvedAt = new Date();
    returnRequest.approverNote = approverNote;
    returnRequest.history.push({
      status: this.statuses.APPROVED,
      timestamp: new Date(),
      note: approverNote || 'Return approved'
    });

    this.returns.set(returnId, returnRequest);
    console.log('✅ Return approved:', returnId);

    // Generate return shipping label
    returnRequest.returnLabel = this.generateReturnLabel(returnRequest);

    // Send approval email with return label
    await this.sendReturnApproval(returnId);

    return returnRequest;
  }

  /**
   * Reject return request
   */
  async rejectReturn(returnId, reason) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    returnRequest.status = this.statuses.REJECTED;
    returnRequest.rejectedAt = new Date();
    returnRequest.rejectionReason = reason;
    returnRequest.history.push({
      status: this.statuses.REJECTED,
      timestamp: new Date(),
      note: reason
    });

    this.returns.set(returnId, returnRequest);
    console.log('❌ Return rejected:', returnId);

    // Send rejection email
    await this.sendReturnRejection(returnId, reason);

    return returnRequest;
  }

  /**
   * Update return status
   */
  async updateReturnStatus(returnId, newStatus, note) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    returnRequest.status = newStatus;
    returnRequest.updatedAt = new Date();
    returnRequest.history.push({
      status: newStatus,
      timestamp: new Date(),
      note
    });

    this.returns.set(returnId, returnRequest);
    console.log(`📦 Return status updated: ${returnId} → ${newStatus}`);

    // If received, process refund
    if (newStatus === this.statuses.RECEIVED) {
      await this.processRefund(returnId);
    }

    // Send status update email
    await this.sendStatusUpdate(returnId);

    return returnRequest;
  }

  /**
   * Process refund
   */
  async processRefund(returnId) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    const refundId = `REF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const refund = {
      refundId,
      returnId,
      orderId: returnRequest.orderId,
      userId: returnRequest.userId,
      amount: returnRequest.totalRefundAmount,
      method: returnRequest.refundMethod,
      status: 'processing',
      processedAt: new Date(),
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      completedAt: null
    };

    this.refunds.set(refundId, refund);
    
    // Update return status
    returnRequest.refundId = refundId;
    returnRequest.status = this.statuses.REFUNDED;
    returnRequest.history.push({
      status: this.statuses.REFUNDED,
      timestamp: new Date(),
      note: `Refund initiated: ${refundId}`
    });
    this.returns.set(returnId, returnRequest);

    console.log('💰 Refund processed:', refundId);

    // Send refund confirmation
    await this.sendRefundConfirmation(returnId, refundId);

    // Simulate refund completion (in reality, integrate with payment gateway)
    setTimeout(() => {
      refund.status = 'completed';
      refund.completedAt = new Date();
      this.refunds.set(refundId, refund);
      console.log('✅ Refund completed:', refundId);
    }, 5000);

    return refund;
  }

  /**
   * Generate return shipping label
   */
  generateReturnLabel(returnRequest) {
    return {
      trackingNumber: `RTN${Date.now()}`,
      carrier: 'E-Gura Returns',
      pickupAddress: returnRequest.pickupAddress,
      returnAddress: {
        name: 'E-Gura Returns Center',
        street: 'KG 123 St',
        city: 'Kigali',
        country: 'Rwanda',
        phone: '+250 788 123 456'
      },
      instructions: 'Package your items securely. Our courier will pick up from your address.',
      pickupScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
    };
  }

  /**
   * Send return confirmation email
   */
  async sendReturnConfirmation(returnId) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest || !returnRequest.email) return;

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Return Request Received</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="font-size: 60px; margin-bottom: 10px;">📦</div>
          <h1 style="color: white; margin: 0;">Return Request Received</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Dear Customer,</p>
          <p>We've received your return request. Here are the details:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Return ID:</strong> ${returnRequest.returnId}</p>
            <p><strong>Order ID:</strong> ${returnRequest.orderId}</p>
            <p><strong>Status:</strong> ${returnRequest.status.toUpperCase()}</p>
            <p><strong>Refund Amount:</strong> ${returnRequest.totalRefundAmount.toLocaleString()} RWF</p>
          </div>

          <p>We're reviewing your request and will get back to you within 24 hours.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/returns/${returnRequest.returnId}" 
               style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">
              Track Return Status
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (returnRequest.email && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: '"E-Gura Returns" <returns@egura.com>',
          to: returnRequest.email,
          subject: 'Return Request Received - E-Gura Store',
          html: emailHTML
        });
        console.log('📧 Return confirmation sent:', returnRequest.email);
      } else {
        console.log('📧 [DEMO] Return confirmation queued for:', returnRequest.email);
      }
    } catch (error) {
      console.error('❌ Email failed:', error.message);
    }
  }

  /**
   * Send return approval email
   */
  async sendReturnApproval(returnId) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest) return;

    const label = returnRequest.returnLabel;
    const pickupDate = label.pickupScheduled.toLocaleDateString();

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Return Approved</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
          <h1 style="color: white; margin: 0;">Return Approved!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Great news! Your return request has been approved.</p>
          
          <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>📦 Pickup Scheduled</strong></p>
            <p style="margin: 5px 0 0 0;">Date: ${pickupDate}</p>
            <p style="margin: 5px 0 0 0;">Tracking: ${label.trackingNumber}</p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Return Instructions:</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Package items securely in original packaging</li>
              <li>Include all accessories and documentation</li>
              <li>Our courier will pick up from your address</li>
              <li>Refund will be processed within 7 days of receipt</li>
            </ol>
          </div>

          <p><strong>Refund Amount:</strong> ${returnRequest.totalRefundAmount.toLocaleString()} RWF</p>
        </div>
      </body>
      </html>
    `;

    try {
      if (returnRequest.email && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: '"E-Gura Returns" <returns@egura.com>',
          to: returnRequest.email,
          subject: '✅ Return Approved - E-Gura Store',
          html: emailHTML
        });
        console.log('📧 Approval email sent');
      } else {
        console.log('📧 [DEMO] Approval email queued for:', returnRequest.email);
      }
    } catch (error) {
      console.error('❌ Email failed:', error.message);
    }
  }

  /**
   * Send refund confirmation
   */
  async sendRefundConfirmation(returnId, refundId) {
    const returnRequest = this.returns.get(returnId);
    const refund = this.refunds.get(refundId);
    if (!returnRequest || !refund) return;

    const expectedDate = refund.expectedDate.toLocaleDateString();

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Refund Initiated</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="font-size: 60px; margin-bottom: 10px;">💰</div>
          <h1 style="color: white; margin: 0;">Refund Initiated!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Your refund has been initiated and will be processed soon.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Refund Details</strong></p>
            <p style="margin: 10px 0 0 0;">Refund ID: ${refundId}</p>
            <p style="margin: 5px 0 0 0;">Amount: <strong style="font-size: 24px; color: #f97316;">${refund.amount.toLocaleString()} RWF</strong></p>
            <p style="margin: 5px 0 0 0;">Expected by: ${expectedDate}</p>
          </div>

          <p>The refund will be processed to your original payment method within 5-7 business days.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/returns/${returnId}" 
               style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold;">
              View Details
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (returnRequest.email && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: '"E-Gura Refunds" <refunds@egura.com>',
          to: returnRequest.email,
          subject: '💰 Refund Initiated - E-Gura Store',
          html: emailHTML
        });
        console.log('📧 Refund confirmation sent');
      } else {
        console.log('📧 [DEMO] Refund confirmation queued for:', returnRequest.email);
      }
    } catch (error) {
      console.error('❌ Email failed:', error.message);
    }
  }

  /**
   * Send rejection email
   */
  async sendReturnRejection(returnId, reason) {
    const returnRequest = this.returns.get(returnId);
    if (!returnRequest) return;

    // Implement rejection email (similar to above)
    console.log('📧 Rejection email sent for:', returnId);
  }

  /**
   * Send status update
   */
  async sendStatusUpdate(returnId) {
    // Implement status update email
    console.log('📧 Status update sent for:', returnId);
  }

  /**
   * Get return request
   */
  getReturn(returnId) {
    return this.returns.get(returnId);
  }

  /**
   * Get user's returns
   */
  getUserReturns(userId) {
    return Array.from(this.returns.values()).filter(r => r.userId === userId);
  }

  /**
   * Get statistics
   */
  getStats() {
    const returns = Array.from(this.returns.values());
    const refunds = Array.from(this.refunds.values());

    return {
      returns: {
        total: returns.length,
        requested: returns.filter(r => r.status === this.statuses.REQUESTED).length,
        approved: returns.filter(r => r.status === this.statuses.APPROVED).length,
        rejected: returns.filter(r => r.status === this.statuses.REJECTED).length,
        refunded: returns.filter(r => r.status === this.statuses.REFUNDED).length
      },
      refunds: {
        total: refunds.length,
        processing: refunds.filter(r => r.status === 'processing').length,
        completed: refunds.filter(r => r.status === 'completed').length,
        totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0)
      }
    };
  }
}

module.exports = new ReturnsService();
