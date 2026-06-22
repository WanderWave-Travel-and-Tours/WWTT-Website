/**
 * payloadCrypto.js (frontend) — decrypts AES-256-GCM payloads from the API.
 *
 * Key derivation flow:
 *   1. On first decrypt call, fetch GET /api/crypto/session-hint  { salt, ts, iter, sig }
 *   2. Derive session key:  PBKDF2(VITE_PAYLOAD_CLIENT_KEY, salt, 300k, SHA-256, 256 bits)
 *   3. Cache CryptoKey — subsequent decryptions are instant
 *   4. On decryption failure (server restarted → new key), refresh hint and retry once
 *
 * Uses the native Web Crypto API — no external dependencies.
 */

// ---------------------------------------------------------------------------
// Key expansion map  (short wire name → original field name)
// Must be the exact inverse of KEY_MAP in backend/utils/payloadCrypto.js
// ---------------------------------------------------------------------------
const EXPAND_MAP = {
    i:    '_id',
    e:    'email',
    n:    'fullName',
    u:    'username',
    tk:   'token',
    r:    'role',
    d:    'data',
    m:    'message',
    st:   'status',
    ok:   'success',
    a:    'isActive',
    ar:   'isArchive',
    ca:   'createdAt',
    ua:   'updatedAt',
    fv:   'favorites',
    pi:   'promo_id',
    pt:   'package_title',
    pl:   'package_location',
    it:   'itemType',
    pd:   'packageDetails',
    'if': 'isFavorited',
    ex:   'exists',
    us:   'user',
    ac:   'action',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CLIENT_KEY_HEX = import.meta.env.VITE_PAYLOAD_CLIENT_KEY;
const API_BASE       = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

function hexToBytes(hex) {
    const b = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return b;
}

function base64ToBytes(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function deriveFromHint(saltHex, iter) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw', hexToBytes(CLIENT_KEY_HEX), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: iter, hash: 'SHA-256' },
        keyMaterial,
        256
    );
    return crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['decrypt']);
}

// ---------------------------------------------------------------------------
// Session key — fetched + derived once, cached for the page lifetime
// ---------------------------------------------------------------------------
let _keyPromise = null;

async function fetchAndDeriveKey() {
    const res  = await fetch(`${API_BASE}/api/crypto/session-hint`);
    const hint = await res.json();
    return deriveFromHint(hint.salt, hint.iter ?? 300_000);
}

// Call early (e.g. from main.jsx) to warm the key before any API calls land
export function initSessionKey() {
    if (!_keyPromise) _keyPromise = fetchAndDeriveKey();
    return _keyPromise;
}

// Forces a re-fetch (server restarted → new session salt)
export async function refreshSessionKey() {
    _keyPromise = fetchAndDeriveKey();
    return _keyPromise;
}

async function getKey() {
    if (!_keyPromise) _keyPromise = fetchAndDeriveKey();
    return _keyPromise;
}

// ---------------------------------------------------------------------------
// Key expansion — reverse of backend minifyKeys
// ---------------------------------------------------------------------------
function expandKeys(value) {
    if (Array.isArray(value)) return value.map(expandKeys);
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[EXPAND_MAP[k] ?? k] = expandKeys(v);
        }
        return out;
    }
    return value;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isEncryptedPayload(data) {
    return (
        data !== null &&
        typeof data === 'object' &&
        typeof data.p  === 'string' &&
        typeof data.iv === 'string' &&
        typeof data.t  === 'string'
    );
}

export async function decrypt(envelope, { retry = true } = {}) {
    const { p, iv, t } = envelope;
    const key = await getKey();

    const cipherBytes = base64ToBytes(p);
    const tagBytes    = base64ToBytes(t);
    const ivBytes     = base64ToBytes(iv);

    // Web Crypto AES-GCM expects ciphertext ‖ auth-tag as a single buffer
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
    combined.set(cipherBytes);
    combined.set(tagBytes, cipherBytes.length);

    try {
        const buf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
            key,
            combined
        );
        return expandKeys(JSON.parse(new TextDecoder().decode(buf)));
    } catch (err) {
        // Decryption failed — server may have restarted with a new session key.
        // Refresh once and retry; if it still fails, propagate the error.
        if (retry) {
            await refreshSessionKey();
            return decrypt(envelope, { retry: false });
        }
        throw err;
    }
}
