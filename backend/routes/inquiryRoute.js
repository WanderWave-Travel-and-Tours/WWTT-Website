const express = require('express');
const {
  createInquiry,
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats
} = require('../controller/inquiryController');

const router = express.Router();

// Public routes
router.post('/', createInquiry);
router.get('/email/:email', getInquiriesByEmail);

// Admin routes (add authentication middleware later)
router.get('/', getAllInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiry);
router.put('/:id', updateInquiryStatus);
router.delete('/:id', deleteInquiry);

module.exports = router;