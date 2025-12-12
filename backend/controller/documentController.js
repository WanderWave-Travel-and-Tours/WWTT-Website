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

// ✅ FIXED: Upload documents with proper field mapping
const uploadDocuments = async (req, res) => {
  try {
    console.log('📥 Upload request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { inquiryId, userId } = req.body;

    if (!inquiryId || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Inquiry ID and User ID are required' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    // Get sections array
    let sections = [];
    if (req.body.sections) {
      sections = Array.isArray(req.body.sections) ? req.body.sections : [req.body.sections];
    }

    console.log('📁 Processing', req.files.length, 'files');
    console.log('📋 Sections:', sections);

    // Save documents to database
    const documents = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const section = sections[i] || 'General Documents';

      console.log(`Saving file ${i + 1}:`, file.originalname);

      // ✅ Create document with ALL required fields from schema
      const document = await Document.create({
        inquiryId,
        userId,
        fileName: file.filename,           // ✅ Multer generated filename
        originalName: file.originalname,   // ✅ Original filename
        fileUrl: `/uploads/documents/${file.filename}`,  // ✅ Public URL
        filePath: file.path,               // ✅ Full filesystem path
        fileSize: file.size,
        fileType: file.mimetype,
        section: section,
        uploadDate: new Date()
      });

      documents.push(document);
      console.log(`✅ File ${i + 1} saved:`, document.originalName);
    }

    console.log(`✅ ${documents.length} documents uploaded successfully`);

    res.status(201).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      documents: documents
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to upload documents' 
    });
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch documents' 
    });
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user documents' 
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { documentId, id } = req.params;
    const docId = documentId || id;

    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: 'Document not found' 
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(docId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete document' 
    });
  }
};

const getDocumentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const documents = await Document.find({ userId })
      .populate('inquiryId', 'serviceName status')
      .sort({ uploadDate: -1 });

    res.json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Get documents by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const document = await Document.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document status updated',
      data: document
    });

  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const documents = await Document.find(query)
      .populate('inquiryId', 'serviceName fullName email')
      .populate('userId', 'fullName email')
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  upload,
  uploadDocuments,
  getDocumentsByInquiry,
  getUserDocuments,
  getDocumentsByUser,
  deleteDocument,
  updateDocumentStatus,
  getAllDocuments
};