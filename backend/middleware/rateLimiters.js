const rateLimit = require('express-rate-limit');

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 5;

const authLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max: AUTH_MAX_ATTEMPTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts from this IP. Please try again after 15 minutes.',
    },
});

// Global limiter applied to all /api/ routes — 100 requests per 15-minute window per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
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
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
});

module.exports = { authLimiter, apiLimiter, telemetryLimiter };
