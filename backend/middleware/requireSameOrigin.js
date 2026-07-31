// Blocks requests that don't carry an Origin/Referer from our own site.
// Purpose: stop casual scraping/direct-URL access to public GET endpoints
// (packages/all, search, destinations, etc.) — NOT a real auth boundary.
// The data itself must stay public (browsers, GHL static pages, and the
// React app all consume it without logging in), so this only raises the
// bar against curl/Postman/bots that don't bother spoofing headers; it
// cannot stop a determined attacker who sets Origin/Referer manually.
const ALLOWED_HOSTS = new Set([
    'wanderwaveph.com',
    'www.wanderwaveph.com',
    'wanderwaveph.onrender.com',
    'localhost',
    '127.0.0.1',
]);

function hostFromUrl(value) {
    try {
        return new URL(value).hostname;
    } catch {
        return null;
    }
}

function requireSameOrigin(req, res, next) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    const host = (origin && hostFromUrl(origin)) || (referer && hostFromUrl(referer));

    if (host && ALLOWED_HOSTS.has(host)) {
        return next();
    }

    return res.status(403).json({
        status: 'error',
        message: 'Direct access to this endpoint is not allowed.',
    });
}

module.exports = requireSameOrigin;
