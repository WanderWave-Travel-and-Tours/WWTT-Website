// Regression test for the public /api/transfers margin leak.
// GET /api/transfers was returning supplier cost and markup for every listing to
// unauthenticated callers (visible by pasting the URL into a browser).
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cookieParser = require('cookie-parser');

const Transfer = require('../models/transfer');
const transferRoute = require('../routes/transferBookingRoute');

const SECRET_FIELDS = [
  'oneWaySupplierRate', 'oneWayMarkupValue', 'oneWayMarkupType',
  'roundtripSupplierRate', 'roundtripMarkupValue', 'roundtripMarkupType',
];

let mongo, app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/transfers', transferRoute);

  await Transfer.create({
    title: 'Private Van', packageDestination: 'CORON', category: 'Local Transfer',
    pax: 10,
    oneWaySupplierRate: 2500, oneWayMarkupValue: 1000, oneWayMarkupType: 'peso',
    oneWayPrice: 3500,
    roundtripSupplierRate: 5000, roundtripMarkupValue: 2000,
    roundtripMarkupType: 'peso', roundtripPrice: 7000,
    isActive: true, isArchive: 'No',
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('GET /api/transfers (anonymous)', () => {
  test('does not leak supplier cost or markup fields', async () => {
    const res = await request(app).get('/api/transfers');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const t of res.body.data) {
      for (const f of SECRET_FIELDS) expect(t).not.toHaveProperty(f);
    }
    // The raw payload must not contain the values either.
    expect(JSON.stringify(res.body)).not.toContain('2500');
  });

  test('still returns the selling price the public site renders', async () => {
    const res = await request(app).get('/api/transfers');
    const t = res.body.data[0];
    expect(t.oneWayPrice).toBe(3500);
    expect(t.roundtripPrice).toBe(7000);
    expect(t.title).toBe('Private Van');
  });

  test('a forged/garbage token does not unlock cost fields', async () => {
    const res = await request(app)
      .get('/api/transfers')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(200);
    for (const f of SECRET_FIELDS) expect(res.body.data[0]).not.toHaveProperty(f);
  });
});

describe('GET /api/transfers/:id (anonymous)', () => {
  test('does not leak margin fields on the detail route', async () => {
    const list = await request(app).get('/api/transfers');
    const id = list.body.data[0]._id;
    const res = await request(app).get(`/api/transfers/${id}`);
    expect(res.status).toBe(200);
    for (const f of SECRET_FIELDS) expect(res.body.data).not.toHaveProperty(f);
    expect(res.body.data.oneWayPrice).toBe(3500);
  });
});
