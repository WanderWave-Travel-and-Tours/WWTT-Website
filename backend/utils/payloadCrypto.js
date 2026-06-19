const crypto = require('crypto');

const ALGORITHM   = 'aes-256-gcm';
const IV_BYTES    = 12;
const PBKDF2_ITER = 300_000;
const PBKDF2_LEN  = 32;

// Shared with frontend via VITE_PAYLOAD_CLIENT_KEY — used as PBKDF2 input
const CLIENT_KEY_HEX = process.env.PAYLOAD_CLIENT_KEY;
if (!CLIENT_KEY_HEX || CLIENT_KEY_HEX.length !== 64) {
    throw new Error(
        'PAYLOAD_CLIENT_KEY must be a 64-char hex string in .env\n' +
        'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
}

// Backend-only — signs session hints so a MITM cannot substitute a rogue salt
const HMAC_SECRET_HEX = process.env.PAYLOAD_HMAC_SECRET;
if (!HMAC_SECRET_HEX || HMAC_SECRET_HEX.length !== 64) {
    throw new Error(
        'PAYLOAD_HMAC_SECRET must be a 64-char hex string in .env\n' +
        'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
}

const CLIENT_KEY  = Buffer.from(CLIENT_KEY_HEX, 'hex');
const HMAC_SECRET = Buffer.from(HMAC_SECRET_HEX, 'hex');

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
// Session state — derived ONCE at startup via PBKDF2, never per-request
// ---------------------------------------------------------------------------
let _sessionKey  = null;
let _sessionSalt = null;
let _sessionTs   = null;

function initSession() {
    _sessionSalt = crypto.randomBytes(16);
    _sessionTs   = Date.now();
    // pbkdf2Sync is acceptable here: called once at server startup
    _sessionKey  = crypto.pbkdf2Sync(CLIENT_KEY, _sessionSalt, PBKDF2_ITER, PBKDF2_LEN, 'sha256');
    return _sessionKey;
}

// Returns the hint the frontend needs to derive the same session key
function getSessionHint() {
    if (!_sessionKey) initSession();
    const saltHex = _sessionSalt.toString('hex');
    const sig = crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(saltHex + String(_sessionTs))
        .digest('hex');
    return { salt: saltHex, ts: _sessionTs, iter: PBKDF2_ITER, sig };
}

// ---------------------------------------------------------------------------
// Encrypt / decrypt using the session key
// ---------------------------------------------------------------------------
function encrypt(payload) {
    if (!_sessionKey) initSession();
    const iv     = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, _sessionKey, iv);
    const plain  = JSON.stringify(minifyKeys(payload));
    const enc    = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return {
        p:  enc.toString('base64'),
        iv: iv.toString('base64'),
        t:  cipher.getAuthTag().toString('base64'),
    };
}

function decrypt(envelope) {
    if (!_sessionKey) throw new Error('Session not initialized');
    const decipher = crypto.createDecipheriv(
        ALGORITHM, _sessionKey, Buffer.from(envelope.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(envelope.t, 'base64'));
    const dec = Buffer.concat([
        decipher.update(Buffer.from(envelope.p, 'base64')),
        decipher.final(),
    ]);
    return JSON.parse(dec.toString('utf8'));
}

module.exports = { encrypt, decrypt, minifyKeys, initSession, getSessionHint };
