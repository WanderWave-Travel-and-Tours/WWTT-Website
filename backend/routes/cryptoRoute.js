const express = require('express');
const router  = express.Router();
const { getSessionHint } = require('../utils/payloadCrypto');

// GET /api/crypto/session-hint
// Public — sends PBKDF2 salt + HMAC signature so the browser can derive the
// session key independently. Must NOT be encrypted (bootstrap: client has no
// key yet). res.locals.skipEncrypt tells encryptResponse middleware to pass through.
router.get('/session-hint', (req, res) => {
    res.locals.skipEncrypt = true;
    res.json(getSessionHint());
});

module.exports = router;
