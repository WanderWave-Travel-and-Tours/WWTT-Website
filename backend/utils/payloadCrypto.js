/**
 * payloadCrypto.js — AES-256-GCM response payload encryption + key minification.
 *
 * Security note: This is an obfuscation layer. The matching decryption key lives
 * in the frontend build, so a determined attacker can extract it. Real protection
 * is HTTPS + JWT auth. This layer prevents casual Network-tab inspection only.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES   = 12;   // 96-bit IV recommended for GCM
const TAG_BYTES  = 16;   // 128-bit auth tag

// ---------------------------------------------------------------------------
// Key setup — fail fast at startup if the env var is missing or wrong length
// ---------------------------------------------------------------------------
const RAW_KEY = process.env.PAYLOAD_ENCRYPTION_KEY;
if (!RAW_KEY || RAW_KEY.length !== 64) {
    throw new Error(
        'PAYLOAD_ENCRYPTION_KEY env var is required and must be a 64-char hex string.\n' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
}
const KEY = Buffer.from(RAW_KEY, 'hex');

// ---------------------------------------------------------------------------
// Key minification map  (original field name → short wire name)
// Keep this in sync with EXPAND_MAP in frontend/src/utils/payloadCrypto.js
// ---------------------------------------------------------------------------
const KEY_MAP = {
    _id:              'i',
    id:               'i',
    email:            'e',
    fullName:         'n',
    username:         'u',
    token:            'tk',
    role:             'r',
    data:             'd',
    message:          'm',
    status:           'st',
    success:          'ok',
    isActive:         'a',
    isArchive:        'ar',
    createdAt:        'ca',
    updatedAt:        'ua',
    favorites:        'fv',
    promo_id:         'pi',
    package_title:    'pt',
    package_location: 'pl',
    itemType:         'it',
    packageDetails:   'pd',
    isFavorite:       'if',
    isFavorited:      'if',
    exists:           'ex',
    user:             'us',
    action:           'ac',
};

// ---------------------------------------------------------------------------
// Recursively replace keys in an object/array
// ---------------------------------------------------------------------------
function minifyKeys(value) {
    if (Array.isArray(value)) return value.map(minifyKeys);
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[KEY_MAP[k] ?? k] = minifyKeys(v);
        }
        return out;
    }
    return value;
}

// ---------------------------------------------------------------------------
// Encrypt a payload object → { p, iv, t }
//   p  = ciphertext (base64)
//   iv = initialisation vector (base64)
//   t  = GCM auth tag (base64)
// ---------------------------------------------------------------------------
function encrypt(payload) {
    const iv     = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const plaintext = JSON.stringify(minifyKeys(payload));
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
        p:  encrypted.toString('base64'),
        iv: iv.toString('base64'),
        t:  tag.toString('base64'),
    };
}

// ---------------------------------------------------------------------------
// Decrypt a { p, iv, t } envelope back to the original object
// (Useful for testing or webhook verification)
// ---------------------------------------------------------------------------
function decrypt(envelope) {
    const { p, iv, t } = envelope;
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        KEY,
        Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(t, 'base64'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(p, 'base64')),
        decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8'));
}

module.exports = { encrypt, decrypt, minifyKeys };
