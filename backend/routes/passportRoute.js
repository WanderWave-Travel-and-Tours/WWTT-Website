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

router.get('/', getPassports);
router.get('/:id', getPassport);
router.post('/', createPassport);
router.put('/:id', updatePassport);
router.delete('/:id', deletePassport);
router.post('/initialize', initializePassport);

module.exports = router;