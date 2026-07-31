const express = require('express');
const router = express.Router();
const visaController = require('../controller/visaController');
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

// Public visa-country catalog — read by the public /other-services page.
// Same-origin gate only; mutations are admin-only.
// NOTE: there is no GET /:id here. userDashboard.jsx calls
// GET /api/visas/:visaId, which already 404s (pre-existing bug, unrelated to
// this auth change) — it needs either a route added or the caller fixed.
router.get('/', requireSameOrigin, visaController.getVisas);
router.post('/add', authMiddleware, visaController.createVisa);
router.put('/:id', authMiddleware, visaController.updateVisa);
router.delete('/:id', authMiddleware, visaController.deleteVisa);

module.exports = router;