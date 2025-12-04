const express = require('express');
const {
  getAllServices,
  getServicesByCategory,
  getService,
  createService,
  updateService,
  deleteService
} = require('../controller/serviceController');

const router = express.Router();

// Public routes
router.get('/', getAllServices);
router.get('/category/:category', getServicesByCategory);
router.get('/:id', getService);

// Admin routes (add authentication middleware later)
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;