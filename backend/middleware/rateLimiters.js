const rateLimit = require('express-rate-limit');
const MongoRateLimitStore = require('./MongoRateLimitStore');

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 5;

// Generic 429 body shared by every limiter.
// Deliberately states no window length, no attempt count and no reset time:
// naming the window ("try again after 15 minutes") tells an attacker exactly
// how to pace a brute-force run so it never trips the throttle. The matching
// RateLimit-*/Retry-After headers stay suppressed via standardHeaders/
// legacyHeaders: false below for the same reason.
const GENERIC_LIMIT_MESSAGE = {
    success: false,
    message: 'Too many requests. Please try again later.',
};

const authLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max: AUTH_MAX_ATTEMPTS,
    standardHeaders: false,
    legacyHeaders: false,
    store: new MongoRateLimitStore(),
    message: GENERIC_LIMIT_MESSAGE,
});

// Global limiter applied to all /api/ routes — 600 requests per 15-minute window per IP.
// A single page load fans out many calls (packages, promos, tours, images, session-hint,
// page-view beacons, etc.), and shared IPs (offices, campuses) multiply that further.
// 100 was exhausted by normal browsing within minutes; 600 gives real headroom while
// still bounding abusive traffic.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: false,
    legacyHeaders: false,
    store: new MongoRateLimitStore(),
    message: GENERIC_LIMIT_MESSAGE,
});

// Telemetry limiter — stricter quota for open, high-frequency beacon endpoints
// (POST /api/page-views, /:id/stop, /:id/resume, /booking-count).
// These routes are unauthenticated and fire automatically in the browser, making
// them the most attractive target for volumetric flood attacks. The tighter cap
// prevents resource exhaustion without blocking legitimate browsing sessions.
const telemetryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: false,
    legacyHeaders: false,
    store: new MongoRateLimitStore(),
    message: GENERIC_LIMIT_MESSAGE,
});

module.exports = { authLimiter, apiLimiter, telemetryLimiter };
