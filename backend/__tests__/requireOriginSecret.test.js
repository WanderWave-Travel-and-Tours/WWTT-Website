// Covers the three rollout states of the origin-secret gate.
// The module reads env vars at require() time, so each block sets process.env
// and re-requires with a reset module registry.
const request = require('supertest');
const express = require('express');

const SECRET = 'test-secret-value-abc123';

function buildApp({ secret, enforce }) {
  jest.resetModules();
  if (secret === undefined) delete process.env.ORIGIN_SHARED_SECRET;
  else process.env.ORIGIN_SHARED_SECRET = secret;

  if (enforce === undefined) delete process.env.ORIGIN_SECRET_ENFORCE;
  else process.env.ORIGIN_SECRET_ENFORCE = enforce;

  const mw = require('../middleware/requireOriginSecret');
  const app = express();
  app.use(express.json());
  app.use('/api/', mw);
  app.get('/api/tours/all', (_q, r) => r.json({ ok: true }));
  app.post('/api/payment/webhook', (_q, r) => r.json({ webhook: true }));
  return app;
}

afterAll(() => {
  delete process.env.ORIGIN_SHARED_SECRET;
  delete process.env.ORIGIN_SECRET_ENFORCE;
});

describe('secret not configured (safe to deploy early)', () => {
  test('allows every request through', async () => {
    const app = buildApp({});
    const res = await request(app).get('/api/tours/all');
    expect(res.status).toBe(200);
  });
});

describe('warn-only mode (ORIGIN_SECRET_ENFORCE unset)', () => {
  test('allows a request with no header, but logs a warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = buildApp({ secret: SECRET });

    const res = await request(app).get('/api/tours/all');
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toContain('WARN-ONLY');
    warn.mockRestore();
  });

  test('a correct header does not warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const app = buildApp({ secret: SECRET });

    const res = await request(app).get('/api/tours/all').set('X-Origin-Secret', SECRET);
    expect(res.status).toBe(200);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('enforcing mode (ORIGIN_SECRET_ENFORCE=true)', () => {
  test('blocks a request with no header', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).get('/api/tours/all');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden.');
  });

  test('blocks a wrong secret', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).get('/api/tours/all').set('X-Origin-Secret', 'wrong');
    expect(res.status).toBe(403);
  });

  test('blocks a same-length wrong secret (constant-time path)', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const sameLen = 'X'.repeat(SECRET.length);
    const res = await request(app).get('/api/tours/all').set('X-Origin-Secret', sameLen);
    expect(res.status).toBe(403);
  });

  test('allows the correct secret', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).get('/api/tours/all').set('X-Origin-Secret', SECRET);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('header name is case-insensitive', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).get('/api/tours/all').set('x-origin-secret', SECRET);
    expect(res.status).toBe(200);
  });

  test('403 body does not disclose the header name or that a secret exists', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).get('/api/tours/all');
    const body = JSON.stringify(res.body).toLowerCase();
    expect(body).not.toContain('secret');
    expect(body).not.toContain('x-origin');
    expect(body).not.toContain('cloudflare');
    expect(body).not.toContain('worker');
  });

  test('never echoes the real secret in the response', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).get('/api/tours/all').set('X-Origin-Secret', 'wrong');
    expect(JSON.stringify(res.body)).not.toContain(SECRET);
    expect(JSON.stringify(res.headers)).not.toContain(SECRET);
  });

  test('PayMongo webhook stays reachable without the header', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).post('/api/payment/webhook').send({});
    expect(res.status).toBe(200);
    expect(res.body.webhook).toBe(true);
  });

  test('CORS preflight is not blocked', async () => {
    const app = buildApp({ secret: SECRET, enforce: 'true' });
    const res = await request(app).options('/api/tours/all');
    expect(res.status).not.toBe(403);
  });
});
