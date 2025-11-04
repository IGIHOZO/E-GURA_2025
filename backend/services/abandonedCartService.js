/**
 * Abandoned Cart Recovery Service
 * Track and recover abandoned carts with automated follow-ups
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer not available for abandoned cart service');
}

class AbandonedCartService {
  constructor() {
    this.abandonedCarts = new Map();
    this.recoveryAttempts = new Map();
    
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
        console.warn('⚠️ Email setup failed for abandoned cart');
      }
    }
  }

  /**
   * Track cart activity
   */
  trackCart(userId, cartData) {
    const cart = {
      userId,
      items: cartData.items,
      subtotal: cartData.subtotal,
      email: cartData.email,
      phone: cartData.phone,
      lastActivity: new Date(),
      status: 'active',
      createdAt: this.abandonedCarts.get(userId)?.createdAt || new Date()
    };

    this.abandonedCarts.set(userId, cart);
    console.log('🛒 Cart tracked for user:', userId);
  }

  /**
   * Mark cart as abandoned (no activity for 30 min)
   */
  markAsAbandoned(userId) {
    const cart = this.abandonedCarts.get(userId);
    if (!cart) return;

    const inactiveTime = Date.now() - cart.lastActivity.getTime();
    
    if (inactiveTime > 30 * 60 * 1000 && cart.status === 'active') {
      cart.status = 'abandoned';
      cart.abandonedAt = new Date();
      this.abandonedCarts.set(userId, cart);
      
      console.log('⚠️ Cart abandoned:', userId);
      
      // Trigger recovery sequence
      this.initiateRecovery(userId);
    }
  }

  /**
   * Initiate automated recovery sequence
   */
  async initiateRecovery(userId) {
    const cart = this.abandonedCarts.get(userId);
    if (!cart || cart.status !== 'abandoned') return;

    const attempts = this.recoveryAttempts.get(userId) || [];
    
    // Recovery sequence: 1hr, 24hr, 72hr
    const sequences = [
      { delay: 1 * 60 * 60 * 1000, message: '1-hour reminder' },      // 1 hour
      { delay: 24 * 60 * 60 * 1000, message: '24-hour reminder' },    // 24 hours
      { delay: 72 * 60 * 60 * 1000, message: '72-hour final offer' }  // 72 hours
    ];

    for (const sequence of sequences) {
      if (!attempts.some(a => a.type === sequence.message)) {
        setTimeout(() => {
          this.sendRecoveryMessage(userId, sequence.message);
        }, sequence.delay);
      }
    }
  }

  /**
   * Send recovery email/SMS
   */
  async sendRecoveryMessage(userId, type) {
    const cart = this.abandonedCarts.get(userId);
    if (!cart || cart.status === 'recovered') return;

    const attempts = this.recoveryAttempts.get(userId) || [];
    
    // Generate discount based on attempt
    const discountCode = this.generateRecoveryDiscount(attempts.length);
    
    // Email template
    const emailHTML = this.generateRecoveryEmail(cart, discountCode, type);
    
    try {
      // Send email (if configured)
      if (cart.email && this.emailTransporter) {
        await this.emailTransporter.sendMail({
          from: '"E-Gura Store" <noreply@egura.com>',
          to: cart.email,
          subject: this.getSubjectLine(type, discountCode),
          html: emailHTML
        });
        console.log('📧 Recovery email sent:', cart.email);
      } else {
        console.log('📧 [DEMO] Recovery email queued for:', cart.email, '- Type:', type, '- Code:', discountCode);
      }

      // Log SMS attempt (integrate with SMS API like Twilio)
      if (cart.phone) {
        console.log('📱 SMS recovery queued:', cart.phone);
        // await this.sendSMS(cart.phone, discountCode);
      }

      // Track attempt
      attempts.push({
        type,
        discountCode,
        sentAt: new Date()
      });
      this.recoveryAttempts.set(userId, attempts);

    } catch (error) {
      console.error('❌ Recovery message failed:', error.message);
    }
  }

  /**
   * Generate recovery discount code
   */
  generateRecoveryDiscount(attemptNumber) {
    const discounts = ['COMEBACK10', 'SAVE15', 'LASTCHANCE20'];
    return discounts[Math.min(attemptNumber, discounts.length - 1)];
  }

  /**
   * Generate recovery email HTML
   */
  generateRecoveryEmail(cart, discountCode, type) {
    const itemsList = cart.items.map(item => `
      <tr>
        <td style="padding: 10px;">
          <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
        </td>
        <td style="padding: 10px;">
          <strong>${item.name}</strong><br>
          <span style="color: #666;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 10px; text-align: right;">
          <strong>${item.price.toLocaleString()} RWF</strong>
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Complete Your Purchase</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">You Left Items in Your Cart!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi there! 👋</p>
          <p>We noticed you left some great items in your cart. Don't miss out!</p>
          
          <table style="width: 100%; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background: #f0f0f0;">
                <td colspan="2" style="padding: 15px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 15px; text-align: right;"><strong>${cart.subtotal.toLocaleString()} RWF</strong></td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>🎁 Special Offer for You!</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #f97316;"><strong>Use code: ${discountCode}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Save up to 20% on your order!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4000'}/checkout?recovery=${cart.userId}" 
               style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              Complete My Purchase
            </a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center;">
            This offer expires in 24 hours. Act fast!
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          <p>E-Gura Store | Kigali, Rwanda</p>
          <p>You received this email because you have items in your cart.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get email subject line
   */
  getSubjectLine(type, discountCode) {
    const subjects = {
      '1-hour reminder': `Don't forget! Your cart is waiting 🛒`,
      '24-hour reminder': `⏰ Still thinking? Here's ${discountCode} for you!`,
      '72-hour final offer': `🔥 Final Chance! ${discountCode} expires soon`
    };
    return subjects[type] || 'Your cart is waiting!';
  }

  /**
   * Mark cart as recovered
   */
  markAsRecovered(userId) {
    const cart = this.abandonedCarts.get(userId);
    if (cart) {
      cart.status = 'recovered';
      cart.recoveredAt = new Date();
      this.abandonedCarts.set(userId, cart);
      console.log('✅ Cart recovered:', userId);
    }
  }

  /**
   * Get abandonment stats
   */
  getStats() {
    const carts = Array.from(this.abandonedCarts.values());
    return {
      total: carts.length,
      active: carts.filter(c => c.status === 'active').length,
      abandoned: carts.filter(c => c.status === 'abandoned').length,
      recovered: carts.filter(c => c.status === 'recovered').length,
      recoveryRate: carts.filter(c => c.status === 'recovered').length / 
                     Math.max(carts.filter(c => c.status === 'abandoned').length, 1) * 100
    };
  }

  /**
   * Cross-sell recommendations for abandoned cart
   */
  getCrossSellRecommendations(cart) {
    // AI-based cross-selling (simplified version)
    const categories = cart.items.map(item => item.category);
    const recommendations = [
      { category: 'electronics', crossSell: ['accessories', 'cables', 'cases'] },
      { category: 'audio', crossSell: ['headphones', 'speakers', 'cables'] },
      { category: 'computers', crossSell: ['mouse', 'keyboard', 'monitor'] }
    ];

    const crossSells = [];
    for (const cat of categories) {
      const rec = recommendations.find(r => r.category === cat);
      if (rec) {
        crossSells.push(...rec.crossSell);
      }
    }

    return [...new Set(crossSells)]; // Remove duplicates
  }
}

// Auto-check for abandoned carts every 15 minutes
const abandonedCartService = new AbandonedCartService();
setInterval(() => {
  for (const userId of abandonedCartService.abandonedCarts.keys()) {
    abandonedCartService.markAsAbandoned(userId);
  }
}, 15 * 60 * 1000);

module.exports = abandonedCartService;
