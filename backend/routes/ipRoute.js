// routes/ipRoute.js

const express = require('express');
const router = express.Router();
const ipController = require('../controller/ipController');

// ✅ CHECK IF CLIENT HAS OTC ACCESS
router.get('/check-otc-access', ipController.checkIPAccess);

module.exports = router;