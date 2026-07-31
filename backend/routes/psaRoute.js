const express = require('express');
const router = express.Router();
const {
  getPSADocuments,
  getPSADocument,
  createPSA,
  updatePSA,
  deletePSA
} = require('../controller/psaController');
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

// Public PSA-service catalog — read by the public /other-services page.
// Same-origin gate only; mutations are admin-only.
router.get('/', requireSameOrigin, getPSADocuments);
router.get('/:id', requireSameOrigin, getPSADocument);
router.post('/', authMiddleware, createPSA);
router.put('/:id', authMiddleware, updatePSA);
router.delete('/:id', authMiddleware, deletePSA);

module.exports = router;