import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface QueryLog {
  sessionId: string;
  query: string;
  filters: Record<string, any>;
  resultsCount: number;
  latency: number;
  userAgent: string;
  error?: string;
  timestamp: Date;
}

interface QueryAnalytics {
  totalQueries: number;
  uniqueUsers: number;
  avgLatency: number;
  zeroResultQueries: number;
  topQueries: Array<{
    query: string;
    count: number;
    avgLatency: number;
  }>;
  queriesByHour: Array<{
    hour: number;
    count: number;
  }>;
}

interface PerformanceAnalytics {
  avgQueryLatency: number;
  p95Latency: number;
  errorRate: number;
  throughput: number; // queries per minute
  uptime: number;
}

export class AnalyticsService {
  private queryLogs: QueryLog[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  async logQuery(queryData: QueryLog) {
    try {
      // Add to in-memory log
      this.queryLogs.push(queryData);

      // Keep only recent logs
      if (this.queryLogs.length > this.maxLogs) {
        this.queryLogs = this.queryLogs.slice(-this.maxLogs);
      }

      // In production, you might want to store this in a separate analytics database
      // For now, we'll use MongoDB
      if (mongoose.connection.readyState === 1) {
        await this.storeQueryLog(queryData);
      }

      logger.debug('Query logged:', {
        query: queryData.query,
        results: queryData.resultsCount,
        latency: queryData.latency
      });

    } catch (error) {
      logger.error('Failed to log query:', error);
    }
  }

  private async storeQueryLog(queryData: QueryLog) {
    try {
      // Use the existing MongoDB connection
      const db = mongoose.connection.db;
      const collection = db.collection('search_analytics');

      await collection.insertOne({
        ...queryData,
        createdAt: new Date()
      });

    } catch (error) {
      logger.error('Failed to store query log in MongoDB:', error);
    }
  }

  async getQueryAnalytics(startDate: Date, endDate: Date, limit: number = 100): Promise<QueryAnalytics> {
    try {
      // Filter logs by date range
      const filteredLogs = this.queryLogs.filter(log =>
        log.timestamp >= startDate && log.timestamp <= endDate
      );

      if (filteredLogs.length === 0) {
        return {
          totalQueries: 0,
          uniqueUsers: 0,
          avgLatency: 0,
          zeroResultQueries: 0,
          topQueries: [],
          queriesByHour: []
        };
      }

      // Calculate metrics
      const totalQueries = filteredLogs.length;
      const uniqueUsers = new Set(filteredLogs.map(log => log.sessionId)).size;
      const avgLatency = filteredLogs.reduce((sum, log) => sum + log.latency, 0) / totalQueries;
      const zeroResultQueries = filteredLogs.filter(log => log.resultsCount === 0).length;

      // Top queries
      const queryCounts = new Map<string, { count: number; totalLatency: number }>();
      filteredLogs.forEach(log => {
        const existing = queryCounts.get(log.query) || { count: 0, totalLatency: 0 };
        queryCounts.set(log.query, {
          count: existing.count + 1,
          totalLatency: existing.totalLatency + log.latency
        });
      });

      const topQueries = Array.from(queryCounts.entries())
        .map(([query, data]) => ({
          query,
          count: data.count,
          avgLatency: data.totalLatency / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      // Queries by hour
      const hourCounts = new Map<number, number>();
      filteredLogs.forEach(log => {
        const hour = log.timestamp.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const queriesByHour = Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);

      return {
        totalQueries,
        uniqueUsers,
        avgLatency,
        zeroResultQueries,
        topQueries,
        queriesByHour
      };

    } catch (error) {
      logger.error('Failed to get query analytics:', error);
      throw error;
    }
  }

  async getPerformanceAnalytics(startDate: Date, endDate: Date): Promise<PerformanceAnalytics> {
    try {
      const filteredLogs = this.queryLogs.filter(log =>
        log.timestamp >= startDate && log.timestamp <= endDate
      );

      if (filteredLogs.length === 0) {
        return {
          avgQueryLatency: 0,
          p95Latency: 0,
          errorRate: 0,
          throughput: 0,
          uptime: 100
        };
      }

      // Calculate latency metrics
      const latencies = filteredLogs.map(log => log.latency).sort((a, b) => a - b);
      const avgQueryLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;

      // P95 latency (95th percentile)
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[Math.min(p95Index, latencies.length - 1)];

      // Error rate
      const errorCount = filteredLogs.filter(log => log.error).length;
      const errorRate = (errorCount / filteredLogs.length) * 100;

      // Throughput (queries per minute)
      const timeSpan = (endDate.getTime() - startDate.getTime()) / (1000 * 60); // minutes
      const throughput = filteredLogs.length / Math.max(timeSpan, 1);

      // Uptime (assuming 100% for now - in production, track service uptime)
      const uptime = 100;

      return {
        avgQueryLatency,
        p95Latency,
        errorRate,
        throughput,
        uptime
      };

    } catch (error) {
      logger.error('Failed to get performance analytics:', error);
      throw error;
    }
  }

  getRecentLogs(limit: number = 100): QueryLog[] {
    return this.queryLogs.slice(-limit);
  }

  clearLogs() {
    this.queryLogs = [];
    logger.info('Analytics logs cleared');
  }
}
