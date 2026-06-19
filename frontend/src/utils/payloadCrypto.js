/**
 * payloadCrypto.js (frontend) — decrypts AES-256-GCM payloads from the API
 * and expands minified keys back to their readable names.
 *
 * Uses the native Web Crypto API (no external dependencies).
 * Compatible with all modern browsers and Node 18+ (for Next.js SSR).
 */

// ---------------------------------------------------------------------------
// Key expansion map  (short wire name → original field name)
// Must be the exact inverse of KEY_MAP in backend/utils/payloadCrypto.js
// ---------------------------------------------------------------------------
const EXPAND_MAP = {
    i:  'id',
    e:  'email',
    n:  'fullName',
    u:  'username',
    tk: 'token',
    r:  'role',
    d:  'data',
    m:  'message',
    st: 'status',
    ok: 'success',
    a:  'isActive',
    ar: 'isArchive',
    ca: 'createdAt',
    ua: 'updatedAt',
    fv: 'favorites',
    pi: 'promo_id',
    pt: 'package_title',
    pl: 'package_location',
    it: 'itemType',
    pd: 'packageDetails',
    'if': 'isFavorited',
    ex: 'exists',
    us: 'user',
    ac: 'action',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function base64ToBytes(b64) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

// Cache the CryptoKey so we only import it once per page load
let _cachedKey = null;

async function getCryptoKey() {
    if (_cachedKey) return _cachedKey;

    const rawHex = import.meta.env.VITE_PAYLOAD_ENCRYPTION_KEY;
    if (!rawHex || rawHex.length !== 64) {
        throw new Error(
            'VITE_PAYLOAD_ENCRYPTION_KEY is missing or invalid. ' +
            'It must be a 64-char hex string matching the backend key.'
        );
    }

    _cachedKey = await crypto.subtle.importKey(
        'raw',
        hexToBytes(rawHex),
        { name: 'AES-GCM' },
        false,         // not extractable
        ['decrypt']
    );
    return _cachedKey;
}

// ---------------------------------------------------------------------------
// Recursively expand minified keys back to readable names
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

/**
 * Returns true if the response object looks like an encrypted envelope.
 * Used by the Axios interceptor to decide whether to decrypt.
 */
export function isEncryptedPayload(data) {
    return (
        data !== null &&
        typeof data === 'object' &&
        typeof data.p  === 'string' &&
        typeof data.iv === 'string' &&
        typeof data.t  === 'string'
    );
}

/**
 * Decrypts a { p, iv, t } envelope and returns the original JS object
 * with full readable key names.
 *
 * @param {{ p: string, iv: string, t: string }} envelope
 * @returns {Promise<object>}
 */
export async function decrypt(envelope) {
    const { p, iv, t } = envelope;

    const key        = await getCryptoKey();
    const cipherBytes = base64ToBytes(p);
    const tagBytes    = base64ToBytes(t);
    const ivBytes     = base64ToBytes(iv);

    // Web Crypto AES-GCM expects ciphertext || auth-tag as a single buffer
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
    combined.set(cipherBytes);
    combined.set(tagBytes, cipherBytes.length);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
        key,
        combined
    );

    const json = new TextDecoder().decode(decryptedBuffer);
    return expandKeys(JSON.parse(json));
}
