const Document = require('../models/document');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents';
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and Word documents are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

const uploadDocuments = async (req, res) => {
  try {
    const { inquiryId, userId } = req.body;

    if (!inquiryId || !userId) {
      return res.status(400).json({ message: 'Inquiry ID and User ID are required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = req.files.map(file => ({
      inquiryId,
      userId,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileType: file.mimetype,
      uploadDate: new Date()
    }));

    const savedDocuments = await Document.insertMany(documents);

    res.status(201).json({
      success: true,
      message: 'Documents uploaded successfully!',
      documents: savedDocuments
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload documents' });
  }
};

const getDocumentsByInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;

    const documents = await Document.find({ inquiryId }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

const getUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    const documents = await Document.find({ userId }).sort({ uploadDate: -1 });

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({ message: 'Failed to fetch user documents' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

module.exports = {
  upload,
  uploadDocuments,
  getDocumentsByInquiry,
  getUserDocuments,
  deleteDocument
};