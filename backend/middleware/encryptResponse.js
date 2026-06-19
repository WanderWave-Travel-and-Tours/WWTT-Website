/**
 * encryptResponse.js — Express middleware that wraps res.json() so every
 * successful (2xx) response is automatically encrypted before hitting the wire.
 *
 * Usage (global — apply once in server.js before your routers):
 *   app.use(encryptResponse);
 *
 * Usage (opt-in on a single route):
 *   router.get('/sensitive', encryptResponse, handler);
 *
 * To skip encryption on a specific route, set res.locals.skipEncrypt = true
 * inside your handler before calling res.json().
 */
const { encrypt } = require('../utils/payloadCrypto');

module.exports = function encryptResponse(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function encryptedJson(body) {
        // Skip: explicitly opted out
        if (res.locals.skipEncrypt) return originalJson(body);

        // Skip: nothing to encrypt
        if (body === null || body === undefined) return originalJson(body);

        // Skip: non-object primitives (shouldn't happen in a JSON API, but safe)
        if (typeof body !== 'object') return originalJson(body);

        // Skip: 4xx/5xx error responses (keeps error messages debuggable;
        // remove this condition if you want errors encrypted too)
        if (res.statusCode >= 400) return originalJson(body);

        try {
            return originalJson(encrypt(body));
        } catch (err) {
            // Never crash the response pipeline on encryption failure
            console.error('[encryptResponse] Encryption failed:', err.message);
            return originalJson(body);
        }
    };

    next();
};
