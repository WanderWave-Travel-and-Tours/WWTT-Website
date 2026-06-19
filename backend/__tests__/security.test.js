/**
 * Security regression tests for:
 *   FIX 1 — IDOR on password-update route
 *   FIX 2 — Unauthenticated GET /api/users
 *   FIX 3 — Rate-limiting on auth-sensitive routes
 *
 * Uses mongodb-memory-server so no real DB is needed.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ── inline test app (mirrors server.js without actually listening) ──
const express = require('express');
const usersRouter = require('../routes/usersRouter');
const authRoute = require('../routes/authRoute');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/users', usersRouter);
    app.use('/api/auth', authRoute);
    return app;
}

// ── helpers ──
const USER_JWT_SECRET =
    process.env.USER_JWT_SECRET || process.env.JWT_SECRET || 'wanderwaveph_user25';

const ADMIN_JWT_SECRET =
    process.env.JWT_SECRET || 'wanderwaveph_admin25';

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = buildApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // Clear collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// ── helpers ──
async function createUser(overrides = {}) {
    const User = require('../models/user');
    const hashed = await bcrypt.hash('Password123!', 10);
    return User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: hashed,
        role: 'user',
        isActive: true,
        isArchive: 'No',
        ...overrides,
    });
}

function userToken(userId) {
    return jwt.sign({ id: userId }, USER_JWT_SECRET, { expiresIn: '1h' });
}

function adminToken(adminId) {
    // Admin model is separate, but for route-level tests we only need a
    // structurally valid admin JWT; the middleware looks up Admin.findById.
    // We stub that via the real Admin model by creating one first.
    return jwt.sign({ id: adminId }, ADMIN_JWT_SECRET, { expiresIn: '1h' });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — Unauthenticated GET /api/users should return 401
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/users (FIX 2 — auth gate)', () => {
    test('returns 401 when no token is provided', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });

    test('returns 401 when a user (non-admin) JWT is provided', async () => {
        const user = await createUser();
        const token = userToken(user._id);

        // verifyUserJWT would pass but the route uses authMiddleware (admin)
        // so a user token should be rejected by the admin middleware
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`);

        // Admin middleware looks up the Admin model — user._id won't exist there
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — PUT /api/users/update-password (no :id, identity from JWT)
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/users/update-password (FIX 1 — IDOR eliminated)', () => {
    test('returns 401 when no token is provided', async () => {
        const res = await request(app)
            .put('/api/users/update-password')
            .send({ currentPassword: 'Password123!', newPassword: 'NewPass456!' });

        expect(res.status).toBe(401);
    });

    test('returns 401 when currentPassword is wrong', async () => {
        const user = await createUser();
        const token = userToken(user._id);

        const res = await request(app)
            .put('/api/users/update-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'wrongpassword', newPassword: 'NewPass456!' });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Incorrect current password/i);
    });

    test('succeeds and there is no :id field in the route — caller cannot target another user', async () => {
        // Create two users
        const owner = await createUser({ email: 'owner@example.com', username: 'owner' });
        const User = require('../models/user');
        const hashed = await bcrypt.hash('OtherPass1!', 10);
        const other = await User.create({
            fullName: 'Other User',
            email: 'other@example.com',
            username: 'otheruser',
            password: hashed,
            role: 'user',
            isActive: true,
            isArchive: 'No',
        });

        // Authenticate as `owner` and try to change a password
        const token = userToken(owner._id);

        const res = await request(app)
            .put('/api/users/update-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'Password123!', newPassword: 'NewPass456!' });

        // Should only have changed owner's password — there is no way to supply
        // other._id to this route because the :id param no longer exists.
        expect(res.status).toBe(200);

        // Verify `other`'s password is unchanged
        const freshOther = await User.findById(other._id).select('+password');
        const otherUnchanged = await bcrypt.compare('OtherPass1!', freshOther.password);
        expect(otherUnchanged).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — Rate-limiting on /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login (FIX 3 — rate limiting)', () => {
    test('returns 429 after exceeding 5 attempts within the window', async () => {
        // Fire 6 requests rapidly; the 6th must be 429
        const payload = {
            email: 'nobody@example.com',
            password: 'badpass',
            recaptchaToken: 'test-token',
        };

        let lastStatus;
        for (let i = 0; i < 6; i++) {
            const res = await request(app)
                .post('/api/auth/login')
                .send(payload);
            lastStatus = res.status;
        }

        expect(lastStatus).toBe(429);
    });
});
