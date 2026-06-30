const express = require('express');
const multer = require('multer');
const {
  uploadDocuments,
  getDocumentsByInquiry,
  getDocumentsByUser,
  getUserDocuments,
  deleteDocument,
  updateDocumentStatus,
  getAllDocuments,
  // ⭐ FIX #3: Import new functions
  getSignedViewUrl,
  getSignedDownloadUrl
} = require('../controller/documentController');
const { uploadDocument } = require('../config/cloudinary');

const router = express.Router();

// Wraps the multer/Cloudinary middleware so file-size and format rejections
// return clean JSON instead of falling through to Express's default HTML
// error page (which breaks the frontend's response.json() parse).
const handleUpload = (req, res, next) => {
  uploadDocument.array('documents', 10)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Each file must be 10MB or smaller.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
  });
};

// Main upload route - multiple documents
router.post('/upload', handleUpload, uploadDocuments);

// ⭐⭐⭐ FIX: ADD THESE TWO ROUTES FOR SIGNED URLS ⭐⭐⭐
router.get('/:documentId/view', getSignedViewUrl);
router.get('/:documentId/download', getSignedDownloadUrl);

// Get routes
router.get('/inquiry/:inquiryId', getDocumentsByInquiry);
router.get('/user/:userId', getUserDocuments);
router.get('/', getAllDocuments);

// Update and delete routes
router.put('/:id/status', updateDocumentStatus);
router.delete('/:documentId', deleteDocument);
router.delete('/:id', deleteDocument);

module.exports = router;