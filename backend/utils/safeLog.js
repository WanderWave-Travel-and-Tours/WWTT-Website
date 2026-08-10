// Redacting logger helpers.
//
// Request bodies across this app carry passwords, JWTs, OTPs, payment details
// and passenger PII. Anything written with console.log lands in the hosting
// provider's log stream, which is retained and readable by anyone with
// dashboard access — a durable copy of credentials living outside the database.
//
// Use redactBody(req.body) instead of logging a body directly. Sensitive values
// are replaced with '[REDACTED]' while the surrounding shape stays intact, so
// logs remain useful for debugging malformed requests.

// Matched case-insensitively as a substring of the key name, so `password`,
// `newPassword`, `confirmPassword` and `password_hash` are all covered.
const SENSITIVE_KEY_PATTERNS = [
    'password', 'passwd', 'secret', 'token', 'authorization', 'auth',
    'otp', 'pin', 'cvv', 'cvc', 'cardnumber', 'card_number', 'cardno',
    'apikey', 'api_key', 'accesskey', 'access_key', 'privatekey', 'private_key',
    'sessionid', 'session_id', 'cookie', 'signature', 'clientsecret',
    'passport', 'passportnumber', 'ssn', 'taxid',
];

function isSensitiveKey(key) {
    const k = String(key).toLowerCase();
    return SENSITIVE_KEY_PATTERNS.some(p => k.includes(p));
}

/**
 * Deep-clone a value with sensitive fields replaced by '[REDACTED]'.
 * Depth-limited and cycle-safe so a hostile or recursive payload cannot
 * hang the logger.
 */
function redactBody(value, depth = 0, seen = new WeakSet()) {
    if (depth > 6) return '[TRUNCATED]';
    if (value === null || typeof value !== 'object') return value;

    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    if (Array.isArray(value)) {
        // Cap array output — booking payloads can carry long passenger lists.
        const capped = value.slice(0, 20).map(v => redactBody(v, depth + 1, seen));
        if (value.length > 20) capped.push(`[+${value.length - 20} more]`);
        return capped;
    }

    const out = {};
    for (const [k, v] of Object.entries(value)) {
        out[k] = isSensitiveKey(k) ? '[REDACTED]' : redactBody(v, depth + 1, seen);
    }
    return out;
}

/** Just the top-level key names — the safest option when shape is all you need. */
function bodyKeys(body) {
    return body && typeof body === 'object' ? Object.keys(body) : [];
}

module.exports = { redactBody, bodyKeys, isSensitiveKey };
