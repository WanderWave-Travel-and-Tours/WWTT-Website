const express = require('express');
const router = express.Router();
const {
  getCENOMARDocuments,
  getCENOMARDocument,
  createCENOMAR,
  updateCENOMAR,
  deleteCENOMAR
} = require('../controller/cenomarController');
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

// Public CENOMAR-service catalog — read by the public /other-services page.
// Same-origin gate only; mutations are admin-only.
router.get('/', requireSameOrigin, getCENOMARDocuments);
router.get('/:id', requireSameOrigin, getCENOMARDocument);
router.post('/', authMiddleware, createCENOMAR);
router.put('/:id', authMiddleware, updateCENOMAR);
router.delete('/:id', authMiddleware, deleteCENOMAR);

module.exports = router;