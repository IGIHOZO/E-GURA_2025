// Comprehensive Analytics Tracking Utility
// Supports GA4, Consent Mode v2, and Server-Side Tagging

class AnalyticsTracker {
  constructor() {
    this.consentMode = 'denied';
    this.initialized = false;
    this.eventQueue = [];
  }

  // Initialize analytics with consent mode v2
  initialize(consentStatus = 'denied') {
    this.consentMode = consentStatus;
    
    // Set default consent state (Consent Mode v2)
    if (window.gtag) {
      window.gtag('consent', 'default', {
        'ad_storage': consentStatus,
        'ad_user_data': consentStatus,
        'ad_personalization': consentStatus,
        'analytics_storage': consentStatus,
        'functionality_storage': 'granted',
        'personalization_storage': consentStatus,
        'security_storage': 'granted',
        'wait_for_update': 500
      });
      
      this.initialized = true;
      console.log('📊 Analytics initialized with consent mode:', consentStatus);
      
      // Process queued events
      this.processQueue();
    }
  }

  // Update consent
  updateConsent(granted = true) {
    const status = granted ? 'granted' : 'denied';
    this.consentMode = status;
    
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': status,
        'ad_user_data': status,
        'ad_personalization': status,
        'analytics_storage': status,
        'personalization_storage': status
      });
      
      console.log('📊 Consent updated:', status);
    }
    
    // Save to localStorage (safely)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('analytics_consent', status);
      }
    } catch (error) {
      console.warn('Failed to save consent to localStorage:', error);
    }
  }

  // Generic event tracking
  trackEvent(eventName, params = {}) {
    const event = {
      name: eventName,
      params: {
        ...params,
        timestamp: new Date().toISOString(),
        consent_mode: this.consentMode,
        page_url: window.location.href,
        page_title: document.title
      }
    };

    if (!this.initialized || !window.gtag) {
      this.eventQueue.push(event);
      console.log('📊 Event queued:', eventName, params);
      return;
    }

    window.gtag('event', eventName, event.params);
    console.log('📊 Event tracked:', eventName, params);

    // Also send to server-side tracking endpoint if available
    this.sendToServer(event);
  }

  // Process queued events
  processQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (window.gtag) {
        window.gtag('event', event.name, event.params);
        console.log('📊 Queued event processed:', event.name);
      }
    }
  }

  // Send to server-side tracking
  async sendToServer(event) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Server-side tracking error:', error);
    }
  }

  // E-commerce Events

  // View item list
  viewItemList(items, listName = 'product_list') {
    this.trackEvent('view_item_list', {
      item_list_name: listName,
      items: items.map((item, index) => ({
        item_id: item._id || item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        currency: 'RWF',
        index: index
      }))
    });
  }

  // View item
  viewItem(product) {
    this.trackEvent('view_item', {
      currency: 'RWF',
      value: product.price,
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1
      }]
    });
  }

  // Add to cart
  addToCart(product, quantity = 1) {
    this.trackEvent('add_to_cart', {
      currency: 'RWF',
      value: product.price * quantity,
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: quantity
      }]
    });
  }

  // Remove from cart
  removeFromCart(product, quantity = 1) {
    this.trackEvent('remove_from_cart', {
      currency: 'RWF',
      value: product.price * quantity,
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        quantity: quantity
      }]
    });
  }

  // View cart
  viewCart(cartItems, totalValue) {
    this.trackEvent('view_cart', {
      currency: 'RWF',
      value: totalValue,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  }

  // Begin checkout
  beginCheckout(cartItems, totalValue) {
    this.trackEvent('begin_checkout', {
      currency: 'RWF',
      value: totalValue,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  }

  // Add shipping info
  addShippingInfo(shippingMethod, shippingCost, cartItems, totalValue) {
    this.trackEvent('add_shipping_info', {
      currency: 'RWF',
      value: totalValue,
      shipping_tier: shippingMethod,
      shipping_cost: shippingCost,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  }

  // Add payment info
  addPaymentInfo(paymentMethod, cartItems, totalValue) {
    this.trackEvent('add_payment_info', {
      currency: 'RWF',
      value: totalValue,
      payment_type: paymentMethod,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  }

  // Purchase
  purchase(orderId, cartItems, totalValue, tax = 0, shipping = 0) {
    this.trackEvent('purchase', {
      transaction_id: orderId,
      currency: 'RWF',
      value: totalValue,
      tax: tax,
      shipping: shipping,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  }

  // Quiz Events

  // Quiz start
  quizStart(quizName) {
    this.trackEvent('quiz_start', {
      quiz_name: quizName,
      engagement_type: 'interactive'
    });
  }

  // Quiz answer
  quizAnswer(quizName, questionNumber, answer) {
    this.trackEvent(`quiz_answer_${questionNumber}`, {
      quiz_name: quizName,
      question_number: questionNumber,
      answer: answer
    });
  }

  // Quiz complete
  quizComplete(quizName, results) {
    this.trackEvent('quiz_complete', {
      quiz_name: quizName,
      results: results,
      engagement_type: 'interactive'
    });
  }

  // Bundle Events

  // Bundle add
  bundleAdd(bundleName, items, totalValue) {
    this.trackEvent('bundle_add', {
      bundle_name: bundleName,
      currency: 'RWF',
      value: totalValue,
      items: items
    });
  }

  // Search
  search(searchTerm, results = 0) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: results
    });
  }

  // User Engagement

  // Page view
  pageView(pagePath, pageTitle) {
    this.trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  // CTA click
  ctaClick(ctaName, location) {
    this.trackEvent('cta_click', {
      cta_name: ctaName,
      cta_location: location
    });
  }

  // Video engagement
  videoPlay(videoName, duration) {
    this.trackEvent('video_start', {
      video_name: videoName,
      video_duration: duration
    });
  }

  videoComplete(videoName, duration) {
    this.trackEvent('video_complete', {
      video_name: videoName,
      video_duration: duration
    });
  }

  // Social share
  share(method, contentType, contentId) {
    this.trackEvent('share', {
      method: method,
      content_type: contentType,
      content_id: contentId
    });
  }

  // Wishlist
  addToWishlist(product) {
    this.trackEvent('add_to_wishlist', {
      currency: 'RWF',
      value: product.price,
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price
      }]
    });
  }

  // User signup
  signup(method) {
    this.trackEvent('sign_up', {
      method: method
    });
  }

  // User login
  login(method) {
    this.trackEvent('login', {
      method: method
    });
  }

  // A/B Testing

  // Track experiment view
  experimentView(experimentId, variantId) {
    this.trackEvent('experiment_view', {
      experiment_id: experimentId,
      variant_id: variantId
    });
  }

  // Track experiment conversion
  experimentConversion(experimentId, variantId, conversionType) {
    this.trackEvent('experiment_conversion', {
      experiment_id: experimentId,
      variant_id: variantId,
      conversion_type: conversionType
    });
  }

  // Performance Metrics

  // Track page load time
  trackPageLoad(loadTime) {
    this.trackEvent('page_load', {
      load_time: loadTime,
      metric_type: 'performance'
    });
  }

  // Track LCP (Largest Contentful Paint)
  trackLCP(lcp) {
    this.trackEvent('web_vitals_lcp', {
      value: lcp,
      metric_type: 'performance'
    });
  }

  // Track FID (First Input Delay)
  trackFID(fid) {
    this.trackEvent('web_vitals_fid', {
      value: fid,
      metric_type: 'performance'
    });
  }

  // Track CLS (Cumulative Layout Shift)
  trackCLS(cls) {
    this.trackEvent('web_vitals_cls', {
      value: cls,
      metric_type: 'performance'
    });
  }

  // Track TTI (Time to Interactive)
  trackTTI(tti) {
    this.trackEvent('web_vitals_tti', {
      value: tti,
      metric_type: 'performance'
    });
  }
}

// Create singleton instance
const analytics = new AnalyticsTracker();

// Initialize on load with saved consent (only in browser)
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const savedConsent = localStorage.getItem('analytics_consent');
    analytics.initialize(savedConsent || 'denied');
  } catch (error) {
    console.warn('Failed to initialize analytics:', error);
    analytics.initialize('denied');
  }
}

// Export singleton
export default analytics;

// Also export class for testing
export { AnalyticsTracker };
