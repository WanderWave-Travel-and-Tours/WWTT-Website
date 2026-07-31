const express = require('express');
const router  = express.Router();
const { getSessionHint } = require('../utils/payloadCrypto');
const requireSameOrigin = require('../middleware/requireSameOrigin');

// GET /api/crypto/session-hint
// Must stay pre-auth (bootstrap: the browser needs this to derive the AES-GCM
// key before it can decrypt anything, including the login page's own traffic —
// requiring a login token here would be circular). requireSameOrigin still
// blocks direct curl/bot harvesting of the salt/iter/sig metadata, which is
// the concrete gap flagged in the WanderWave assessment (F-01).
// Must NOT be encrypted (bootstrap: client has no key yet). res.locals.skipEncrypt
// tells encryptResponse middleware to pass through.
router.get('/session-hint', requireSameOrigin, (req, res) => {
    res.locals.skipEncrypt = true;
    res.json(getSessionHint());
});

module.exports = router;
