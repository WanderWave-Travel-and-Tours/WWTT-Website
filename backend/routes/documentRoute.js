const express = require('express');
const { 
  uploadDocuments, 
  getDocumentsByInquiry, 
  getDocumentsByUser,
  getUserDocuments,
  deleteDocument,
  updateDocumentStatus,
  getAllDocuments
} = require('../controller/documentController');
const { uploadDocument } = require('../config/cloudinary');

const router = express.Router();

// Main upload route - multiple documents
router.post('/upload', uploadDocument.array('documents', 10), uploadDocuments);

// Get routes
router.get('/inquiry/:inquiryId', getDocumentsByInquiry);
router.get('/user/:userId', getUserDocuments);
router.get('/', getAllDocuments);

// Update and delete routes
router.put('/:id/status', updateDocumentStatus);
router.delete('/:documentId', deleteDocument);
router.delete('/:id', deleteDocument);

module.exports = router;