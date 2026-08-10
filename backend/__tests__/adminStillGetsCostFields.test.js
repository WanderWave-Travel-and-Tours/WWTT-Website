// Verifies the public-projection fix did NOT break the admin pricing UI:
// an authenticated, active admin must still receive supplier/markup fields,
// otherwise TransferPricing.jsx / PricingCalculator.jsx lose their inputs.
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cookieParser = require('cookie-parser');

const Transfer = require('../models/transfer');
const Admin = require('../models/admin');
const transferRoute = require('../routes/transferBookingRoute');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderwaveph_admin25';
let mongo, app, adminToken;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/transfers', transferRoute);

  const admin = await Admin.create({
    username: 'testadmin', email: 'admin@test.local',
    password: 'hashed-placeholder', isActive: true,
  });
  adminToken = jwt.sign({ id: admin._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

  await Transfer.create({
    title: 'Private Van', packageDestination: 'CORON', pax: 10,
    oneWaySupplierRate: 2500, oneWayMarkupValue: 1000,
    oneWayMarkupType: 'peso', oneWayPrice: 3500,
    isActive: true, isArchive: 'No',
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('authenticated admin still receives supplier + markup fields', async () => {
  const res = await request(app)
    .get('/api/transfers')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.status).toBe(200);
  const t = res.body.data[0];
  expect(t.oneWaySupplierRate).toBe(2500);
  expect(t.oneWayMarkupValue).toBe(1000);
  expect(t.oneWayMarkupType).toBe('peso');
});

test('admin cookie auth works the same as the Bearer header', async () => {
  const res = await request(app)
    .get('/api/transfers')
    .set('Cookie', [`adminToken=${adminToken}`]);

  expect(res.status).toBe(200);
  expect(res.body.data[0].oneWaySupplierRate).toBe(2500);
});

test('an inactive admin is treated as anonymous', async () => {
  const inactive = await Admin.create({
    username: 'inactiveadmin', email: 'inactive@test.local',
    password: 'hashed-placeholder', isActive: false,
  });
  const token = jwt.sign({ id: inactive._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

  const res = await request(app)
    .get('/api/transfers')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.data[0]).not.toHaveProperty('oneWaySupplierRate');
});
