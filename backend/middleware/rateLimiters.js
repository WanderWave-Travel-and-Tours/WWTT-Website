const rateLimit = require('express-rate-limit');
const MongoRateLimitStore = require('./MongoRateLimitStore');

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 5;

const authLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max: AUTH_MAX_ATTEMPTS,
    standardHeaders: false,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again after 15 minutes.',
    },
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
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
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
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
});

module.exports = { authLimiter, apiLimiter, telemetryLimiter };
