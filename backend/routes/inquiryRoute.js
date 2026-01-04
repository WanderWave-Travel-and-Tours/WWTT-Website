const express = require('express');
const {
  createInquiry,
  createInquiryWithUploads, 
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats,
  markAsPaid,
  confirmPayment,
  deliverDocuments,
  getInquiryAnalytics,
  getInquiriesByDateRange,
  toggleArchive,
  updateInquiry // <--- IMPORTED
} = require('../controller/inquiryController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Siguraduhin na exist ang upload directory
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
 
const evidenceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'evidence-' + Date.now() + path.extname(file.originalname));
  }
});

const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    // Standard format para sa documents
    cb(null, 'doc-' + Date.now() + '-' + file.originalname);
  }
});

const uploadEvidence = multer({ storage: evidenceStorage });
const uploadDocuments = multer({ 
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const upload = multer({ storage: documentStorage });
const router = express.Router();

// Analytics and Stats Routes
router.get('/analytics', getInquiryAnalytics);
router.get('/by-date-range', getInquiriesByDateRange);
router.get('/stats', getInquiryStats);

// Creation Routes
router.post('/', createInquiry);
router.post('/upload-application', upload.any(), createInquiryWithUploads); 

// Retrieval and Delete Routes
router.get('/email/:email', getInquiriesByEmail);
router.get('/', getAllInquiries);
router.get('/:id', getInquiry);
router.delete('/:id', deleteInquiry);

// ✅ UPDATED UPDATE ROUTE
// Binago mula .single() patungong .any() para matanggap lahat ng Visa fields
// (Passport, Photo, ITR, atbp.) mula sa EditVisa.jsx
router.put('/update/:id', upload.any(), updateInquiry);

// Archive and Status Routes
router.put('/:id/archive', toggleArchive); 
router.put('/:id/status', uploadEvidence.single('evidence'), updateInquiryStatus);

// Payment and Document Delivery Routes
router.put('/:id/pay', markAsPaid);
router.put('/:id/confirm-payment', confirmPayment);
router.put('/:id/deliver-documents', uploadDocuments.array('documents', 10), deliverDocuments);

module.exports = router;