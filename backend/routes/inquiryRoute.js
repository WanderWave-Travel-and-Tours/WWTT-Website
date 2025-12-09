const express = require('express');
const {
  createInquiry,
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats,
  markAsPaid,
  confirmPayment,
  deliverDocuments
} = require('../controller/inquiryController');
const multer = require('multer');
const path = require('path');

// Storage for evidence files
const evidenceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'evidence-' + Date.now() + path.extname(file.originalname));
  }
});

// Storage for delivered documents
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    cb(null, 'doc-' + Date.now() + '-' + file.originalname);
  }
});

const uploadEvidence = multer({ storage: evidenceStorage });
const uploadDocuments = multer({ 
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

router.post('/', createInquiry);
router.get('/email/:email', getInquiriesByEmail);
router.get('/', getAllInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiry);
router.delete('/:id', deleteInquiry);
router.put('/:id/status', uploadEvidence.single('evidence'), updateInquiryStatus);
router.put('/:id/pay', markAsPaid);

// NEW ROUTES
router.put('/:id/confirm-payment', confirmPayment);
router.put('/:id/deliver-documents', uploadDocuments.array('documents', 10), deliverDocuments);

module.exports = router;