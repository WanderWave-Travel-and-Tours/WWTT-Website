const express = require('express');
const { 
  upload, 
  uploadDocuments, 
  getDocumentsByInquiry, 
  getUserDocuments,
  deleteDocument 
} = require('../controller/documentController');

const router = express.Router();
router.post('/upload', upload.array('documents', 10), uploadDocuments);
router.get('/inquiry/:inquiryId', getDocumentsByInquiry);
router.get('/user/:userId', getUserDocuments);
router.delete('/:documentId', deleteDocument);

module.exports = router;