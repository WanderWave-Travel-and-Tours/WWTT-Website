const express = require('express');
const { 
  upload, 
  uploadDocuments, 
  getDocumentsByInquiry, 
  getDocumentsByUser,
  getUserDocuments,
  deleteDocument,
  updateDocumentStatus,
  getAllDocuments
} = require('../controller/documentController');

const router = express.Router();
router.post('/upload', upload.array('documents', 10), uploadDocuments);
router.get('/inquiry/:inquiryId', getDocumentsByInquiry);
router.get('/user/:userId', getUserDocuments);
router.delete('/:documentId', deleteDocument);
router.get('/', getAllDocuments);
router.delete('/:id', deleteDocument);
router.put('/:id/status', updateDocumentStatus);

module.exports = router;