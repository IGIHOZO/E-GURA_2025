#!/usr/bin/env node
/**
 * Warm up frequently accessed API endpoints to prime multi-tier cache.
 * Usage:
 *   node scripts/warm-cache.js --baseUrl=http://localhost:5000
 */

const axios = require('axios');

const DEFAULT_BASE = process.env.WARM_CACHE_BASE_URL || 'http://localhost:5000';
const baseUrlArg = process.argv.find(arg => arg.startsWith('--baseUrl='));
const BASE_URL = baseUrlArg ? baseUrlArg.replace('--baseUrl=', '') : DEFAULT_BASE;

const endpoints = [
  '/api/products/featured',
  '/api/products/new-arrivals',
  '/api/products/sale',
  '/api/products/flash-deals?limit=8',
  '/api/products/trending?limit=10',
  '/api/products/best-deals?limit=10',
  '/api/products/categories',
  '/api/products?limit=20&sort=featured',
  '/api/categories',
  '/api/categories/all',
  '/api/categories/search/query?q=shoe',
  '/api/search/products?query=shoe&limit=12',
  '/api/search/products?query=dress&limit=12&sortBy=price-low',
  '/api/search/recommendations?category=women&limit=8'
];

const request = async (path) => {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const duration = Date.now() - start;
    return {
      path,
      status: res.status,
      duration,
      cache: res.headers['x-cache'] || 'unknown'
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      path,
      error: error.message,
      duration
    };
  }
};

const warmCache = async () => {
  console.log(`🔥 Warming cache for ${endpoints.length} endpoints`);
  console.log(`🔗 Base URL: ${BASE_URL}`);
  const results = [];

  for (const path of endpoints) {
    const result = await request(path);
    results.push(result);
    if (result.error) {
      console.error(`❌ ${path} failed in ${result.duration}ms (${result.error})`);
    } else {
      console.log(`✅ ${path} -> ${result.status} in ${result.duration}ms [cache=${result.cache}]`);
    }
  }

  const successes = results.filter(r => !r.error);
  const failures = results.filter(r => r.error);
  const avg = successes.length
    ? Math.round(successes.reduce((sum, r) => sum + r.duration, 0) / successes.length)
    : 0;

  console.log('\n📊 Warm-up summary:');
  console.log(`   Success: ${successes.length}/${results.length}`);
  console.log(`   Failures: ${failures.length}`);
  console.log(`   Avg duration: ${avg} ms`);

  if (failures.length) {
    process.exitCode = 1;
  }
};

warmCache();

