const express = require('express');
const router = express.Router();
const {
  getPassports,
  getPassport,
  createPassport,
  updatePassport,
  deletePassport,
  initializePassport
} = require('../controller/passportController');
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

// Public passport-service catalog — read by the public /other-services page.
// Same-origin gate only; mutations are admin-only.
router.get('/', requireSameOrigin, getPassports);
router.get('/:id', requireSameOrigin, getPassport);
router.post('/', authMiddleware, createPassport);
router.put('/:id', authMiddleware, updatePassport);
router.delete('/:id', authMiddleware, deletePassport);
router.post('/initialize', authMiddleware, initializePassport);

module.exports = router;