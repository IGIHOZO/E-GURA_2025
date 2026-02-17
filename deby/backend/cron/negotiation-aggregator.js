const mongoose = require('mongoose');
const analyticsService = require('../services/analyticsService');
const negotiationService = require('../services/negotiationService');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

/**
 * Daily aggregation cron job
 * Run this daily to aggregate negotiation analytics
 * 
 * Usage:
 * - Manual: node cron/negotiation-aggregator.js
 * - Cron: 0 2 * * * node /path/to/negotiation-aggregator.js
 */

async function runDailyAggregation() {
  console.log(`[${new Date().toISOString()}] Starting daily negotiation analytics aggregation...`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Aggregate analytics
    console.log(`Aggregating data for ${yesterday.toDateString()}...`);
    const results = await analyticsService.aggregateDailyAnalytics(yesterday);
    console.log(`✓ Aggregated ${results.length} SKUs`);

    // Cleanup expired negotiations
    console.log('Cleaning up expired negotiations...');
    const expiredCount = await negotiationService.cleanupExpired();
    console.log(`✓ Cleaned up ${expiredCount} expired negotiations`);

    // Summary
    console.log('\n========================================');
    console.log('Aggregation Summary');
    console.log('========================================');
    console.log(`Date: ${yesterday.toDateString()}`);
    console.log(`SKUs Processed: ${results.length}`);
    console.log(`Expired Sessions Cleaned: ${expiredCount}`);
    
    if (results.length > 0) {
      const totalNegotiations = results.reduce((sum, r) => sum + r.totalNegotiations, 0);
      const totalAccepted = results.reduce((sum, r) => sum + r.acceptedCount, 0);
      const avgConversion = totalNegotiations > 0 ? (totalAccepted / totalNegotiations * 100) : 0;
      
      console.log(`Total Negotiations: ${totalNegotiations}`);
      console.log(`Total Accepted: ${totalAccepted}`);
      console.log(`Avg Conversion Rate: ${avgConversion.toFixed(1)}%`);
    }

    console.log('========================================');
    console.log(`[${new Date().toISOString()}] Aggregation completed successfully`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Aggregation failed:`, error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runDailyAggregation();
}

module.exports = { runDailyAggregation };
