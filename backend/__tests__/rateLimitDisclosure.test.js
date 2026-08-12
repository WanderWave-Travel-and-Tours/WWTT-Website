// Verifies the 429 response discloses no throttle parameters, and that counters
// persist in Mongo (shared across instances) rather than process memory.
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MongoRateLimitStore = require('../middleware/MongoRateLimitStore');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('429 body leaks no window length, attempt count or reset time', async () => {
  const { authLimiter } = require('../middleware/rateLimiters');
  const app = express();
  app.set('trust proxy', 1);
  app.use('/api/login', authLimiter);
  // Must answer 401, not 200: authLimiter uses skipSuccessfulRequests, so only
  // failed attempts count toward the cap. A 200 stub would be refunded every
  // time and never trip the throttle.
  app.post('/api/login', (_q, r) => r.status(401).json({ ok: false }));

  let limited;
  for (let i = 0; i < 8; i++) {
    limited = await request(app).post('/api/login').send({});
    if (limited.status === 429) break;
  }

  expect(limited.status).toBe(429);

  const body = JSON.stringify(limited.body);
  // No window length in any common phrasing.
  expect(body).not.toMatch(/15 minutes/i);
  expect(body).not.toMatch(/minute/i);
  expect(body).not.toMatch(/\d+\s*(sec|min|hour)/i);
  // No attempt budget disclosed.
  expect(body).not.toMatch(/\b5\b/);
  expect(limited.body.message).toBe('Too many requests. Please try again later.');

  // Throttle headers stay suppressed.
  const headerNames = Object.keys(limited.headers).map(h => h.toLowerCase());
  expect(headerNames.some(h => h.startsWith('ratelimit'))).toBe(false);
  expect(headerNames.some(h => h.startsWith('x-ratelimit'))).toBe(false);
  expect(headerNames).not.toContain('retry-after');
});

test('counters live in Mongo, so they survive a process restart', async () => {
  const store = new MongoRateLimitStore();
  store.init({ windowMs: 60000 });

  const first = await store.increment('1.2.3.4');
  expect(first.totalHits).toBe(1);

  // A brand-new store instance = a restarted/second server instance.
  const restarted = new MongoRateLimitStore();
  restarted.init({ windowMs: 60000 });
  const second = await restarted.increment('1.2.3.4');

  // In-memory storage would reset this to 1.
  expect(second.totalHits).toBe(2);

  await restarted.resetKey('1.2.3.4');
});

test('two limiter instances share one counter (multi-instance host)', async () => {
  const a = new MongoRateLimitStore(); a.init({ windowMs: 60000 });
  const b = new MongoRateLimitStore(); b.init({ windowMs: 60000 });

  await a.increment('9.9.9.9');
  await b.increment('9.9.9.9');
  const third = await a.increment('9.9.9.9');

  expect(third.totalHits).toBe(3);
  await a.resetKey('9.9.9.9');
});
