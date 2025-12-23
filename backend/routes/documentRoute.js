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
const { uploadDocument } = require('../config/cloudinary');

const router = express.Router();
router.post('/upload', upload.array('documents', 10), uploadDocuments);
router.get('/inquiry/:inquiryId', getDocumentsByInquiry);
router.get('/user/:userId', getUserDocuments);
router.delete('/:documentId', deleteDocument);
router.get('/', getAllDocuments);
router.delete('/:id', deleteDocument);
router.put('/:id/status', updateDocumentStatus);
router.post('/add', uploadDocument.single('image'), uploadDocuments);
router.put('/update/:id', uploadDocument.single('image'), uploadDocuments);

module.exports = router;