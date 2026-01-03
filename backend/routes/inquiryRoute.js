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
  updateInquiry // <--- DINAGDAG NA IMPORT
} = require('../controller/inquiryController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

router.get('/analytics', getInquiryAnalytics);
router.get('/by-date-range', getInquiriesByDateRange);
router.get('/stats', getInquiryStats);

router.post('/', createInquiry);
router.post('/upload-application', upload.any(), createInquiryWithUploads); 

router.get('/email/:email', getInquiriesByEmail);
router.get('/', getAllInquiries);
router.get('/:id', getInquiry);
router.delete('/:id', deleteInquiry);

// ✅ UPDATE ROUTE (Para sa EditAirline.jsx)
// Gagamit ng uploadEvidence dahil 'evidence' ang field name sa frontend
router.put('/update/:id', uploadEvidence.single('evidence'), updateInquiry); 

// ✅ ARCHIVE ROUTE
router.put('/:id/archive', toggleArchive); 

router.put('/:id/status', uploadEvidence.single('evidence'), updateInquiryStatus);
router.put('/:id/pay', markAsPaid);
router.put('/:id/confirm-payment', confirmPayment);
router.put('/:id/deliver-documents', uploadDocuments.array('documents', 10), deliverDocuments);

module.exports = router;