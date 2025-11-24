const Negotiation = require('../models/Negotiation');
const NegotiationAnalytics = require('../models/NegotiationAnalytics');
const { Parser } = require('json2csv');

class AnalyticsService {
  /**
   * Aggregate daily analytics
   */
  async aggregateDailyAnalytics(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all negotiations for the day
    const negotiations = await Negotiation.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Group by SKU
    const skuGroups = {};
    
    negotiations.forEach(neg => {
      if (!skuGroups[neg.sku]) {
        skuGroups[neg.sku] = [];
      }
      skuGroups[neg.sku].push(neg);
    });

    // Aggregate for each SKU
    const results = [];
    
    for (const [sku, negs] of Object.entries(skuGroups)) {
      const analytics = await this.calculateAnalytics(sku, negs, startOfDay);
      results.push(analytics);
    }

    return results;
  }

  /**
   * Calculate analytics for a SKU
   */
  async calculateAnalytics(sku, negotiations, date) {
    const total = negotiations.length;
    const accepted = negotiations.filter(n => n.status === 'accepted').length;
    const rejected = negotiations.filter(n => n.status === 'rejected').length;
    const abandoned = negotiations.filter(n => n.status === 'abandoned' || n.status === 'expired').length;

    const conversionRate = total > 0 ? (accepted / total) * 100 : 0;

    // Calculate averages
    const completedNegs = negotiations.filter(n => 
      n.status === 'accepted' || n.status === 'rejected'
    );

    const avgRounds = completedNegs.length > 0
      ? completedNegs.reduce((sum, n) => sum + n.analytics.roundsUsed, 0) / completedNegs.length
      : 0;

    const acceptedNegs = negotiations.filter(n => n.status === 'accepted');
    
    const avgDiscountPct = acceptedNegs.length > 0
      ? acceptedNegs.reduce((sum, n) => sum + (n.analytics.discountPct || 0), 0) / acceptedNegs.length
      : 0;

    const avgMarginImpact = acceptedNegs.length > 0
      ? acceptedNegs.reduce((sum, n) => sum + (n.analytics.marginImpact || 0), 0) / acceptedNegs.length
      : 0;

    const avgTimeToDecision = completedNegs.length > 0
      ? completedNegs.reduce((sum, n) => sum + (n.analytics.timeToDecision || 0), 0) / completedNegs.length
      : 0;

    const totalRevenue = acceptedNegs.reduce((sum, n) => sum + (n.finalPrice || 0), 0);
    const totalDiscountGiven = acceptedNegs.reduce((sum, n) => sum + (n.analytics.discountGiven || 0), 0);

    // Round distribution
    const roundDistribution = {
      round1: negotiations.filter(n => n.analytics.roundsUsed === 1).length,
      round2: negotiations.filter(n => n.analytics.roundsUsed === 2).length,
      round3: negotiations.filter(n => n.analytics.roundsUsed === 3).length,
      round4Plus: negotiations.filter(n => n.analytics.roundsUsed >= 4).length
    };

    // Segment breakdown
    const segments = ['new', 'returning', 'vip'];
    const segmentBreakdown = {};
    
    segments.forEach(segment => {
      const segNegs = negotiations.filter(n => n.userSegment === segment);
      const segAccepted = segNegs.filter(n => n.status === 'accepted').length;
      const segAvgDiscount = segAccepted > 0
        ? segNegs.filter(n => n.status === 'accepted')
            .reduce((sum, n) => sum + (n.analytics.discountPct || 0), 0) / segAccepted
        : 0;

      segmentBreakdown[segment] = {
        count: segNegs.length,
        conversionRate: segNegs.length > 0 ? (segAccepted / segNegs.length) * 100 : 0,
        avgDiscount: segAvgDiscount
      };
    });

    // Perks usage
    const perksUsed = {
      freeShipping: 0,
      freeGift: 0,
      extendedWarranty: 0,
      bundle: 0
    };

    negotiations.forEach(neg => {
      neg.rounds.forEach(round => {
        if (round.aiResponse?.altPerks) {
          round.aiResponse.altPerks.forEach(perk => {
            if (perksUsed[perk.type] !== undefined) {
              perksUsed[perk.type]++;
            }
          });
        }
      });
    });

    // Fraud flags
    const fraudFlagCount = negotiations.reduce((sum, n) => sum + (n.fraudFlags?.length || 0), 0);

    // Save or update analytics
    const analytics = await NegotiationAnalytics.findOneAndUpdate(
      { date, sku },
      {
        totalNegotiations: total,
        acceptedCount: accepted,
        rejectedCount: rejected,
        abandonedCount: abandoned,
        conversionRate,
        avgRounds,
        avgDiscountPct,
        avgMarginImpact,
        avgTimeToDecision,
        totalRevenue,
        totalDiscountGiven,
        roundDistribution,
        segmentBreakdown,
        perksUsed,
        fraudFlagCount,
        metadata: {
          lastUpdated: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return analytics;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(startDate, endDate, sku = null) {
    const query = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (sku) {
      query.sku = sku;
    }

    const analytics = await NegotiationAnalytics.find(query).sort({ date: -1 });

    // Aggregate totals
    const totals = {
      totalNegotiations: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      abandonedCount: 0,
      totalRevenue: 0,
      totalDiscountGiven: 0,
      avgConversionRate: 0,
      avgDiscountPct: 0,
      avgRounds: 0,
      avgTimeToDecision: 0
    };

    analytics.forEach(a => {
      totals.totalNegotiations += a.totalNegotiations;
      totals.acceptedCount += a.acceptedCount;
      totals.rejectedCount += a.rejectedCount;
      totals.abandonedCount += a.abandonedCount;
      totals.totalRevenue += a.totalRevenue;
      totals.totalDiscountGiven += a.totalDiscountGiven;
    });

    if (analytics.length > 0) {
      totals.avgConversionRate = analytics.reduce((sum, a) => sum + a.conversionRate, 0) / analytics.length;
      totals.avgDiscountPct = analytics.reduce((sum, a) => sum + a.avgDiscountPct, 0) / analytics.length;
      totals.avgRounds = analytics.reduce((sum, a) => sum + a.avgRounds, 0) / analytics.length;
      totals.avgTimeToDecision = analytics.reduce((sum, a) => sum + a.avgTimeToDecision, 0) / analytics.length;
    }

    // Calculate lift (compare to baseline - would need historical data)
    const conversionLift = 0; // TODO: Compare to non-negotiation conversion rate

    return {
      totals,
      conversionLift,
      dailyData: analytics,
      dateRange: { startDate, endDate }
    };
  }

  /**
   * Export to CSV
   */
  async exportToCSV(startDate, endDate, sku = null) {
    const query = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (sku) {
      query.sku = sku;
    }

    const analytics = await NegotiationAnalytics.find(query).sort({ date: -1 }).lean();

    // Flatten data for CSV
    const flatData = analytics.map(a => ({
      date: a.date.toISOString().split('T')[0],
      sku: a.sku,
      totalNegotiations: a.totalNegotiations,
      acceptedCount: a.acceptedCount,
      rejectedCount: a.rejectedCount,
      abandonedCount: a.abandonedCount,
      conversionRate: a.conversionRate.toFixed(2),
      avgRounds: a.avgRounds.toFixed(2),
      avgDiscountPct: a.avgDiscountPct.toFixed(2),
      avgMarginImpact: a.avgMarginImpact.toFixed(2),
      avgTimeToDecision: a.avgTimeToDecision.toFixed(0),
      totalRevenue: a.totalRevenue,
      totalDiscountGiven: a.totalDiscountGiven,
      round1Count: a.roundDistribution.round1,
      round2Count: a.roundDistribution.round2,
      round3Count: a.roundDistribution.round3,
      round4PlusCount: a.roundDistribution.round4Plus,
      newCustomerCount: a.segmentBreakdown.new?.count || 0,
      newCustomerConversion: (a.segmentBreakdown.new?.conversionRate || 0).toFixed(2),
      returningCustomerCount: a.segmentBreakdown.returning?.count || 0,
      returningCustomerConversion: (a.segmentBreakdown.returning?.conversionRate || 0).toFixed(2),
      vipCustomerCount: a.segmentBreakdown.vip?.count || 0,
      vipCustomerConversion: (a.segmentBreakdown.vip?.conversionRate || 0).toFixed(2),
      freeShippingUsed: a.perksUsed.freeShipping,
      freeGiftUsed: a.perksUsed.freeGift,
      extendedWarrantyUsed: a.perksUsed.extendedWarranty,
      bundleUsed: a.perksUsed.bundle,
      fraudFlagCount: a.fraudFlagCount
    }));

    const parser = new Parser();
    const csv = parser.parse(flatData);
    
    return csv;
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeNegotiations = await Negotiation.countDocuments({
      status: 'active',
      createdAt: { $gte: last24h }
    });

    const recentAccepted = await Negotiation.countDocuments({
      status: 'accepted',
      acceptedAt: { $gte: last24h }
    });

    const avgResponseTime = await Negotiation.aggregate([
      {
        $match: {
          createdAt: { $gte: last24h },
          'rounds.processingTimeMs': { $exists: true }
        }
      },
      {
        $unwind: '$rounds'
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$rounds.processingTimeMs' }
        }
      }
    ]);

    return {
      activeNegotiations,
      recentAccepted,
      avgResponseTimeMs: avgResponseTime[0]?.avgTime || 0,
      timestamp: new Date()
    };
  }
}

module.exports = new AnalyticsService();
