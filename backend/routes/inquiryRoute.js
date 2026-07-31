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
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

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

// Analytics and Stats Routes — admin dashboard only
router.get('/analytics', authMiddleware, getInquiryAnalytics);
router.get('/by-date-range', authMiddleware, getInquiriesByDateRange);
router.get('/stats', authMiddleware, getInquiryStats);

// Creation Routes — public inquiry forms (otherservices, flight booking modal)
router.post('/', requireSameOrigin, createInquiry);
router.post('/upload-application', requireSameOrigin, upload.any(), createInquiryWithUploads);

// Retrieval and Delete Routes
// /email/:email and /:id are read by the customer dashboard / payment-success
// page for the customer's OWN records — kept public (same-origin only) rather
// than admin-gated. Full list + delete are admin-only.
router.get('/email/:email', requireSameOrigin, getInquiriesByEmail);
router.get('/', authMiddleware, getAllInquiries);
router.get('/:id', requireSameOrigin, getInquiry);
router.delete('/:id', authMiddleware, deleteInquiry);

// ✅ UPDATE ROUTE — admin only
router.put('/update/:id', authMiddleware, upload.any(), updateInquiry);

// Archive and Status Routes — admin only
router.put('/:id/archive', authMiddleware, toggleArchive);
router.put('/:id/status', authMiddleware, uploadEvidence.single('evidence'), updateInquiryStatus);

// Payment and Document Delivery Routes
// /:id/pay is hit unauthenticated by the customer dashboard right after a
// PayMongo redirect (no session token available yet) — kept public
// (same-origin only). Confirm/deliver are admin actions.
router.put('/:id/pay', requireSameOrigin, markAsPaid);
router.put('/:id/confirm-payment', authMiddleware, confirmPayment);
router.put('/:id/deliver-documents', authMiddleware, uploadDocuments.array('documents', 10), deliverDocuments);

// ✅✅✅ REQUEST PAYMENT ROUTE (WITH SPECIFIC MODULE SUPPORT) ✅✅✅
router.post('/:id/request-payment', authMiddleware, async (req, res) => {
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