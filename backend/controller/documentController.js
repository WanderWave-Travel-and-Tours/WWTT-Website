const Document = require('../models/document');
const { cloudinary } = require('../config/cloudinary');
const { redactBody } = require('../utils/safeLog');

// ✅ UPLOAD DOCUMENTS FUNCTION
// ✅ FIXED uploadDocuments function
const uploadDocuments = async (req, res) => {
  try {
    console.log('🔥 UPLOAD REQUEST START');
    console.log('📋 Body:', redactBody(req.body));
    console.log('📁 Files received:', req.files ? req.files.length : 0);
    console.log('=== UPLOAD REQUEST ===');
console.log('inquiryId:', req.body.inquiryId);
console.log('userId:', req.body.userId);
console.log('Files received:', req.files?.length || 0);


    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        console.log(`File ${i + 1}:`, {
          originalname: file.originalname,
          fieldname: file.fieldname,
          filename: file.filename,
          public_id: file.public_id,        // ← This is the correct one
          path: file.path,
          size: file.size
        });
      });
    }

    const { inquiryId, userId } = req.body;

    if (!inquiryId) return res.status(400).json({ success: false, message: 'inquiryId is required' });
    if (!userId || userId === 'undefined') return res.status(400).json({ success: false, message: 'userId is required' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const sections = Array.isArray(req.body.sections) ? req.body.sections : [req.body.sections || 'General Documents'];

    const documents = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const section = sections[i] || 'General Documents';

      const document = await Document.create({
        inquiryId,
        userId,
        fileName: file.filename,
        originalName: file.originalname,
        fileUrl: file.path,                    // Cloudinary secure_url
        filePublicId: file.public_id || file.filename,   // ← THIS WAS THE BUG
        fileSize: file.size,
        fileType: file.mimetype,
        section: section,
        uploadDate: new Date()
      });

      documents.push(document);
      console.log(`✅ Document saved → ID: ${document._id}`);
    }

    res.status(201).json({
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
      documents
    });

  } catch (error) {
    console.error('❌ FATAL UPLOAD ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
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

// Helper function to get resource type
const getResourceType = (fileType) => {
  if (!fileType) return 'raw';
  
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType === 'application/pdf') {
    return 'raw';
  } else if (fileType.includes('document') || fileType.includes('word')) {
    return 'raw';
  }
  
  return 'raw';
};

const getSignedViewUrl = async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log('🔍 Getting view URL for document:', documentId);

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    console.log('📄 File type:', document.fileType);
    console.log('📄 File URL:', document.fileUrl);

    // ✅ For images, return direct URL
    if (document.fileType && document.fileType.startsWith('image/')) {
      console.log('✅ Image file - returning direct URL');
      return res.json({
        success: true,
        url: document.fileUrl
      });
    }

    // ✅ For PDFs and other files, construct proper URL
    if (document.fileType === 'application/pdf') {
      console.log('📄 PDF file - constructing URL');
      
      // Extract public_id from the URL or use stored filePublicId
      let publicId = document.filePublicId;
      
      // If fileUrl exists, we can use it directly
      if (document.fileUrl) {
        // Replace /upload/ with /upload/fl_attachment/
        const viewUrl = document.fileUrl.replace('/upload/', '/upload/fl_attachment/');
        console.log('✅ PDF URL:', viewUrl);
        
        return res.json({
          success: true,
          url: viewUrl
        });
      }
    }

    // ✅ Fallback: return direct URL
    console.log('✅ Using direct URL as fallback');
    res.json({
      success: true,
      url: document.fileUrl
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get view URL',
      error: error.message
    });
  }
};

const getSignedDownloadUrl = async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log('⬇️ Getting download URL for document:', documentId);

    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    console.log('📄 File type:', document.fileType);

    // ✅ For all files, add download flag
    if (document.fileUrl) {
      // Add fl_attachment flag to force download
      const downloadUrl = document.fileUrl.replace(
        '/upload/', 
        `/upload/fl_attachment:${encodeURIComponent(document.originalName)}/`
      );
      
      console.log('✅ Download URL:', downloadUrl);
      
      return res.json({
        success: true,
        url: downloadUrl,
        fileName: document.originalName
      });
    }

    // Fallback
    res.json({
      success: true,
      url: document.fileUrl,
      fileName: document.originalName
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get download URL',
      error: error.message
    });
  }
};

module.exports = {
  uploadDocuments,
  getDocumentsByInquiry,
  getUserDocuments,
  getDocumentsByUser,
  deleteDocument,
  updateDocumentStatus,
  getAllDocuments,
  getSignedViewUrl,
  getSignedDownloadUrl
};