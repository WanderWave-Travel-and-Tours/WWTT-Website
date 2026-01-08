const express = require('express');
const {
  createInquiry,
  createInquiryWithUploads, 
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats,
  markAsPaid,
  confirmPayment,
  deliverDocuments,
  getInquiryAnalytics,
  getInquiriesByDateRange,
  toggleArchive,
  updateInquiry
} = require('../controller/inquiryController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🔥 HELPER: MAP INQUIRY TYPE TO SPECIFIC MODULE NAME
const getModuleFromInquiryType = (inquiryType, serviceName) => {
  const typeMapping = {
    'FLIGHT_BOOKING': 'Flight Booking',
    'VISA': 'Visa Application',
    'PASSPORT': 'Passport',
    'PSA': 'PSA Documents',
    'CENOMAR': 'CENOMAR',
    'GENERAL': 'General Inquiries'
  };
  
  return typeMapping[inquiryType] || 'General Inquiries';
};

// Siguraduhin na exist ang upload directory
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
 
const evidenceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'evidence-' + Date.now() + path.extname(file.originalname));
  }
});

const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    cb(null, 'doc-' + Date.now() + '-' + file.originalname);
  }
});

const uploadEvidence = multer({ storage: evidenceStorage });
const uploadDocuments = multer({ 
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const upload = multer({ storage: documentStorage });
const router = express.Router();

// Analytics and Stats Routes
router.get('/analytics', getInquiryAnalytics);
router.get('/by-date-range', getInquiriesByDateRange);
router.get('/stats', getInquiryStats);

// Creation Routes
router.post('/', createInquiry);
router.post('/upload-application', upload.any(), createInquiryWithUploads); 

// Retrieval and Delete Routes
router.get('/email/:email', getInquiriesByEmail);
router.get('/', getAllInquiries);
router.get('/:id', getInquiry);
router.delete('/:id', deleteInquiry);

// ✅ UPDATE ROUTE
router.put('/update/:id', upload.any(), updateInquiry);

// Archive and Status Routes
router.put('/:id/archive', toggleArchive); 
router.put('/:id/status', uploadEvidence.single('evidence'), updateInquiryStatus);

// Payment and Document Delivery Routes
router.put('/:id/pay', markAsPaid);
router.put('/:id/confirm-payment', confirmPayment);
router.put('/:id/deliver-documents', uploadDocuments.array('documents', 10), deliverDocuments);

// ✅✅✅ REQUEST PAYMENT ROUTE (WITH SPECIFIC MODULE SUPPORT) ✅✅✅
router.post('/:id/request-payment', async (req, res) => {
  try {
    const { userEmail, adminId } = req.body;
    
    const Inquiry = require('../models/inquiry');
    const ActivityLog = require('../models/ActivityLog');
    
    // Get inquiry details
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inquiry not found' 
      });
    }

    // Update status to PAYMENT_PENDING
    inquiry.status = 'PAYMENT_PENDING';
    inquiry.updatedAt = Date.now();
    await inquiry.save();

    console.log(`✅ Payment requested for inquiry ${req.params.id}`);

    // 👇👇👇 ACTIVITY LOG START (PAYMENT REQUEST WITH SPECIFIC MODULE) 👇👇👇
    try {
      if (userEmail) {
        // 🔥 GET SPECIFIC MODULE NAME BASED ON INQUIRY TYPE
        const specificModule = getModuleFromInquiryType(
          inquiry.inquiryType || 'GENERAL', 
          inquiry.serviceName
        );
        
        await ActivityLog.create({
          action: 'UPDATE',
          module: specificModule,  // 🔥 SPECIFIC MODULE (e.g., "Flight Booking", "Visa Application")
          user: userEmail,
          userId: adminId || null,
          description: `Payment requested for ${specificModule.toLowerCase()}: ${inquiry.fullName}`,
          severity: 'INFO',
          details: {
            recordTitle: `${specificModule} - ${inquiry.fullName}`,
            recordId: inquiry._id.toString(),
            method: 'POST',
            action: 'Payment Request Sent',
            estimatedPrice: inquiry.estimatedPrice,
            inquiryType: inquiry.inquiryType,
            serviceName: inquiry.serviceName
          }
        });
        console.log(`✅ Activity Log saved: PAYMENT REQUEST ${specificModule}`);
      }
    } catch (logError) {
      console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({ 
      success: true, 
      message: 'Payment request sent successfully', 
      data: inquiry 
    });
    
  } catch (error) {
    console.error('❌ Error requesting payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error requesting payment',
      error: error.message 
    });
  }
});

module.exports = router;