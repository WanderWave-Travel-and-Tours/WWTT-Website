const express = require('express');
const router = express.Router();
const {
  getPSADocuments,
  getPSADocument,
  createPSA,
  updatePSA,
  deletePSA
} = require('../controller/psaController');

router.get('/', getPSADocuments);
router.get('/:id', getPSADocument);
router.post('/', createPSA);
router.put('/:id', updatePSA);
router.delete('/:id', deletePSA);

module.exports = router;