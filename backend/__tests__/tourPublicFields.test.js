// Regression test for the public /api/tours margin leak.
// getAllTours/getTourById used an unprojected Tour.find(), returning sellerPrice
// and markup. models/tour.js derives price = sellerPrice + markup, so exposing
// either component publishes the exact cost basis.
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cookieParser = require('cookie-parser');

const Tour = require('../models/tour');
const tourRoutes = require('../routes/tourRoutes');

let mongo, app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/tours', tourRoutes);

  await Tour.create({
    title: 'Island Hopping', destination: 'CORON',
    image: 'https://example.test/tour.jpg', duration: '1 Day',
    price: 2000,                    // overwritten by the pre-save hook below
    sellerPrice: 1200, markup: 800, // price derives to 2000
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('GET /api/tours/all (anonymous)', () => {
  test('does not leak sellerPrice or markup', async () => {
    const res = await request(app).get('/api/tours/all');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const t of res.body.data) {
      expect(t).not.toHaveProperty('sellerPrice');
      expect(t).not.toHaveProperty('markup');
    }
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('1200');
    expect(raw).not.toContain('800');
  });

  test('still returns the derived selling price', async () => {
    const res = await request(app).get('/api/tours/all');
    expect(res.body.data[0].price).toBe(2000);
    expect(res.body.data[0].title).toBe('Island Hopping');
  });
});

describe('GET /api/tours/:id (anonymous)', () => {
  test('does not leak cost fields on the detail route', async () => {
    const list = await request(app).get('/api/tours/all');
    const id = list.body.data[0]._id;
    const res = await request(app).get(`/api/tours/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('sellerPrice');
    expect(res.body.data).not.toHaveProperty('markup');
    expect(res.body.data.price).toBe(2000);
  });
});
