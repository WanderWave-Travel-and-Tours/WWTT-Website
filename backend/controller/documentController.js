const Document = require('../models/document');
const { cloudinary } = require('../config/cloudinary');

// ✅ UPLOAD DOCUMENTS FUNCTION (FIXED)
const uploadDocuments = async (req, res) => {
  try {
    console.log('📥 ===== UPLOAD REQUEST START =====');
    console.log('📋 Body:', req.body);
    console.log('📁 Files:', req.files ? req.files.length : 0);
    
    // Log each file detail
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, idx) => {
        console.log(`File ${idx + 1}:`, {
          originalname: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });
      });
    }

    const { inquiryId, userId } = req.body;

    if (!inquiryId) {
      return res.status(400).json({ 
        success: false,
        message: 'Inquiry ID is required',
        received: { inquiryId, userId }
      });
    }

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required',
        received: { inquiryId, userId }
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    let sections = [];
    if (req.body.sections) {
      sections = Array.isArray(req.body.sections) ? req.body.sections : [req.body.sections];
    }

    console.log('📋 Processing', req.files.length, 'files');
    console.log('📋 Sections:', sections);

    const documents = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
      try {
        const file = req.files[i];
        const section = sections[i] || 'General Documents';

        console.log(`\n💾 Saving file ${i + 1}/${req.files.length}:`);
        console.log('   Original name:', file.originalname);
        console.log('   Cloudinary path:', file.path);
        console.log('   Cloudinary filename:', file.filename);
        console.log('   Section:', section);

        // ✅ Verify file was uploaded to Cloudinary
        if (!file.path || !file.filename) {
          throw new Error(`File ${file.originalname} was not uploaded to Cloudinary`);
        }

        // ✅ Create document - WITHOUT filePath
        const document = await Document.create({
          inquiryId,
          userId,
          fileName: file.filename,        // Cloudinary generated name
          originalName: file.originalname, // User's original filename
          fileUrl: file.path,              // Full Cloudinary URL
          filePublicId: file.filename,     // For deletion later
          fileSize: file.size,
          fileType: file.mimetype,
          section: section,
          uploadDate: new Date()
        });

        documents.push(document);
        console.log(`   ✅ Saved to database with ID: ${document._id}`);

      } catch (fileError) {
        console.error(`   ❌ Error processing file ${i + 1}:`, fileError);
        errors.push({
          file: req.files[i]?.originalname || 'unknown',
          error: fileError.message
        });
      }
    }

    console.log('\n📊 Upload Summary:');
    console.log(`   Success: ${documents.length}/${req.files.length}`);
    console.log(`   Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('   Error details:', errors);
    }
    console.log('===== UPLOAD REQUEST END =====\n');

    if (documents.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'All uploads failed',
        errors: errors
      });
    }

    res.status(201).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      documents: documents,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ FATAL UPLOAD ERROR:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to upload documents',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getDocumentsByInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const documents = await Document.find({ inquiryId }).sort({ uploadDate: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

const getUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await Document.find({ userId }).sort({ uploadDate: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user documents' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { documentId, id } = req.params;
    const docId = documentId || id;

    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete from Cloudinary
    if (document.filePublicId) {
      try {
        await cloudinary.uploader.destroy(document.filePublicId, { 
          resource_type: 'auto'
        });
        console.log('✅ File deleted from Cloudinary:', document.filePublicId);
      } catch (err) {
        console.error('❌ Failed to delete file from Cloudinary:', err);
      }
    }

    await Document.findByIdAndDelete(docId);
    console.log('✅ Document deleted from database');

    res.json({ success: true, message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

const getDocumentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await Document.find({ userId })
      .populate('inquiryId', 'serviceName status')
      .sort({ uploadDate: -1 });

    res.json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    console.error('Get documents by user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.json({ success: true, message: 'Document status updated', data: document });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ CRITICAL - SIGURADUHING NASA MODULE.EXPORTS LAHAT NG FUNCTIONS
module.exports = {
  uploadDocuments,
  getDocumentsByInquiry,
  getUserDocuments,
  getDocumentsByUser,
  deleteDocument,
  updateDocumentStatus,
  getAllDocuments
};