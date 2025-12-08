const express = require('express');
const router = express.Router();
const {
  getCENOMARDocuments,
  getCENOMARDocument,
  createCENOMAR,
  updateCENOMAR,
  deleteCENOMAR
} = require('../controller/cenomarController');

router.get('/', getCENOMARDocuments);
router.get('/:id', getCENOMARDocument);
router.post('/', createCENOMAR);
router.put('/:id', updateCENOMAR);
router.delete('/:id', deleteCENOMAR);

module.exports = router;