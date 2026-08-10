// Proves a request arrived through our Cloudflare Worker rather than being sent
// straight to the Render origin.
//
// The Worker injects X-Origin-Secret server-side (see withOriginSecret() in
// cloudflare-worker-wanderwave/worker.js). The value lives ONLY in Cloudflare's
// encrypted secret store and Render's environment — it is never shipped to a
// browser, so unlike an API key bundled into the frontend it cannot be lifted
// out of DevTools. That is the whole reason this works where the previously
// removed AES layer did not (see the note at the top of server.js).
//
// What this does and does not do:
//   • Blocks direct https://wanderwaveph.onrender.com/api/... calls.        ✓
//   • Replaces the spoofable Origin/Referer check in requireSameOrigin.js.  ✓
//   • Does NOT stop someone curling https://wanderwaveph.com/api/... —
//     Cloudflare adds the header for anyone. Rate-limit that at the edge.
//
// ROLLOUT: ships in warn-only mode. With ORIGIN_SECRET_ENFORCE unset it logs
// violations and lets them through, so you can watch for legitimate callers
// that would break (a missed hardcoded URL, a GHL page hitting Render direct)
// before anything starts returning 403.
const crypto = require('crypto');

const SECRET = process.env.ORIGIN_SHARED_SECRET || '';
const ENFORCE = process.env.ORIGIN_SECRET_ENFORCE === 'true';

// Paths that must stay reachable without the header. PayMongo calls the webhook
// directly from their own infrastructure and never traverses the Worker.
const EXEMPT_PATHS = ['/payment/webhook'];

// Constant-time comparison so response latency can't be used to recover the
// secret byte by byte. timingSafeEqual throws on length mismatch, so the
// lengths are checked first — that length check is itself non-secret.
function safeEqual(candidate, expected) {
    const a = Buffer.from(String(candidate || ''), 'utf8');
    const b = Buffer.from(String(expected || ''), 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function requireOriginSecret(req, res, next) {
    // Not configured yet → no-op, so deploying this file alone changes nothing.
    if (!SECRET) return next();

    // req.path here is relative to the '/api/' mount point.
    if (EXEMPT_PATHS.includes(req.path)) return next();

    // Browser preflights never carry custom headers; blocking them would break
    // legitimate cross-origin requests before the real request is ever sent.
    if (req.method === 'OPTIONS') return next();

    if (safeEqual(req.headers['x-origin-secret'], SECRET)) return next();

    if (!ENFORCE) {
        console.warn(
            `[origin-secret] WARN-ONLY: missing/invalid header on ${req.method} ${req.originalUrl}` +
            ` — would 403 once ORIGIN_SECRET_ENFORCE=true`
        );
        return next();
    }

    // Deliberately generic: naming the header would tell an attacker exactly
    // what to forge. No hint that a secret exists at all.
    return res.status(403).json({
        status: 'error',
        message: 'Forbidden.',
    });
}

module.exports = requireOriginSecret;
