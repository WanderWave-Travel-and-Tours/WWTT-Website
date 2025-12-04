const express = require('express');
const { getPSADocuments } = require('../controller/psaController');
const router = express.Router();

router.get('/service/:serviceId', getPSADocuments);

module.exports = router;