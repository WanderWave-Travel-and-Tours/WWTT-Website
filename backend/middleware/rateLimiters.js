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

module.exports = { authLimiter };
