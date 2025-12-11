const express = require('express');
const router = express.Router();
const visaController = require('../controller/visaController'); 

router.get('/', visaController.getVisas);
router.post('/add', visaController.createVisa);
router.put('/:id', visaController.updateVisa);
router.delete('/:id', visaController.deleteVisa);
 
module.exports = router;