const express = require('express');
const {
  getAllServices,
  getServicesByCategory,
  getService,
  createService,
  updateService,
  deleteService,
  getAllServicesForAdmin
} = require('../controller/serviceController');

const router = express.Router();

router.get('/', getAllServices);
router.get('/category/:category', getServicesByCategory);
router.get('/:id', getService);

router.get('/admin/all', getAllServicesForAdmin);

router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;