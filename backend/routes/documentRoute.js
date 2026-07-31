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
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

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

// Main upload route - multiple documents — customer-facing (booking flow),
// same-origin gate only.
router.post('/upload', requireSameOrigin, handleUpload, uploadDocuments);

// Signed view/download URLs — read unauthenticated by the customer dashboard
// for the customer's OWN uploaded documents (booking evidence, IDs, passports).
// Same-origin gate only; a real per-user ownership check would need the
// caller to be tied to a session, which these routes don't currently carry.
router.get('/:documentId/view', requireSameOrigin, getSignedViewUrl);
router.get('/:documentId/download', requireSameOrigin, getSignedDownloadUrl);

// Get routes
// /inquiry/:inquiryId is read unauthenticated by the customer dashboard for
// the customer's own inquiry's documents — same-origin only.
// /user/:userId and the full list are admin/back-office views — admin-gated.
router.get('/inquiry/:inquiryId', requireSameOrigin, getDocumentsByInquiry);
router.get('/user/:userId', authMiddleware, getUserDocuments);
router.get('/', authMiddleware, getAllDocuments);

// Update and delete routes — admin only
router.put('/:id/status', authMiddleware, updateDocumentStatus);
router.delete('/:documentId', authMiddleware, deleteDocument);
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;