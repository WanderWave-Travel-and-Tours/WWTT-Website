const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const { feedbackLimiter } = require('../middleware/rateLimiters');

// Server-side input ceilings. The frontend enforces these via maxLength / file-size
// checks, but a direct API call bypasses the UI entirely, so we re-validate here.
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 1000;
const VALID_CATEGORIES = ['bug', 'suggestion', 'general'];
// A 5MB image is ~6.8MB once base64-encoded; cap the encoded string a bit above that.
const MAX_SCREENSHOT_CHARS = 7 * 1024 * 1024;

// ============================================
// HELPER FUNCTION: Create Activity Log
// ============================================
const createActivityLog = async (action, description, details, req, severity = 'INFO') => {
  try {
    const adminToken = req.headers.authorization?.split(' ')[1];
    let adminInfo = null;
    let adminId = null;
    let userName = 'System';

    if (adminToken) {
      try {
        const jwt = require('jsonwebtoken');
        // Siguraduhing tama ang secret key mo dito
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'wanderwaveph_admin25');
        adminId = decoded.id || decoded.userId || decoded._id;
        userName = decoded.username || decoded.email || 'Admin';
        
        // Try to get full admin info from database
        try {
          const Admin = require('../models/admin');
          const admin = await Admin.findById(adminId).select('username email fullName');
          if (admin) {
            userName = admin.fullName || admin.username || admin.email;
          }
        } catch (err) {
          console.log('⚠️ Could not fetch admin details for logs:', err.message);
        }
      } catch (err) {
        console.log('⚠️ Token verification failed for activity logging:', err.message);
      }
    }

    // Pag-map ng data base sa structure ng ActivityLog.js model mo
    const activityLog = new ActivityLog({
      action: action,
      module: 'Feedback',
      entity: 'Feedback',
      entityId: details.feedbackId || null,
      user: userName,
      userId: adminId,
      adminId: adminId,
      severity: severity,
      description: description,
      ipAddress: req.ip || req.connection.remoteAddress || 'N/A',
      userAgent: req.get('user-agent') || 'N/A',
      method: req.method,
      endpoint: req.originalUrl,
      // Mapping for inquiry-specific/feedback fields
      clientName: details.feedbackName || details.name || null,
      clientEmail: details.email || null,
      details: {
        ...details,
        recordTitle: details.feedbackName || details.name || 'Feedback',
        recordId: details.feedbackId || null,
        method: req.method,
        endpoint: req.originalUrl
      }
    });

    await activityLog.save();
    console.log('✅ Activity log created:', action, '-', description);
  } catch (error) {
    console.error('❌ Error creating activity log:', error);
  }
};

// ============================================
// POST - Submit New Feedback
// ============================================
router.post('/', feedbackLimiter, async (req, res) => {
  try {
    const { category, message, name, rating, screenshot, technicalData, email } = req.body;

    if (!category || !message) {
      return res.status(400).json({ success: false, message: 'Category and message are required' });
    }

    // Re-validate everything server-side — the UI limits are bypassable via direct API calls.
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback category' });
    }
    if (typeof message !== 'string' || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, message: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters` });
    }
    if (name && (typeof name !== 'string' || name.length > MAX_NAME_LENGTH)) {
      return res.status(400).json({ success: false, message: `Name must be at most ${MAX_NAME_LENGTH} characters` });
    }
    const numericRating = Number(rating) || 0;
    if (numericRating < 0 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
    }
    if (screenshot != null) {
      if (typeof screenshot !== 'string' || screenshot.length > MAX_SCREENSHOT_CHARS) {
        return res.status(400).json({ success: false, message: 'Screenshot is invalid or too large' });
      }
    }

    const newFeedback = new Feedback({
      category,
      message: message.trim(),
      name: name?.trim() || 'Anonymous',
      email: email || '',
      rating: numericRating,
      screenshot: screenshot || null,
      technicalData: {
        url: technicalData?.url || '',
        browser: technicalData?.browser || '',
        screenSize: technicalData?.screenSize || '',
        timestamp: technicalData?.timestamp || new Date().toISOString(),
        language: technicalData?.language || '',
        platform: technicalData?.platform || ''
      },
      status: 'new',
      isArchive: 'No'
    });

    const savedFeedback = await newFeedback.save();
    console.log('✅ Feedback submitted:', savedFeedback._id);

    // 📝 LOG ACTIVITY: CREATE
    await createActivityLog(
      'CREATE',
      `New feedback submitted from ${savedFeedback.name}`,
      {
        feedbackId: savedFeedback._id,
        feedbackName: savedFeedback.name,
        email: savedFeedback.email,
        category: savedFeedback.category,
        rating: savedFeedback.rating,
        affectedRecords: 1
      },
      req,
      'SUCCESS'
    );

    res.status(201).json({ success: true, message: 'Feedback submitted successfully', feedback: savedFeedback });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // 📝 LOG ERROR
    await createActivityLog(
      'CREATE',
      'Failed to submit feedback',
      {
        errorMessage: error.message,
        affectedRecords: 0
      },
      req,
      'ERROR'
    );
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// GET - Fetch All Feedbacks
// ============================================
router.get('/', async (req, res) => {
  try {
    // Kinukuha lang ang feedbacks pero HINDI na nagla-log sa ActivityLog
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    
    res.status(200).json({ success: true, count: feedbacks.length, feedbacks: feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// PATCH - Archive Feedback
// ============================================
router.patch('/:id/archive', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { 
        isArchive: 'Yes', 
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    console.log('📦 Feedback Archived:', req.params.id);

    // 📝 LOG ACTIVITY: ARCHIVE
    await createActivityLog(
      'ARCHIVE',
      `Archived feedback from ${feedback.name}`,
      {
        feedbackId: feedback._id,
        feedbackName: feedback.name,
        email: feedback.email,
        category: feedback.category,
        rating: feedback.rating,
        affectedRecords: 1
      },
      req,
      'WARNING'
    );

    res.status(200).json({
      success: true,
      message: 'Feedback archived successfully',
      feedback: feedback
    });

  } catch (error) {
    console.error('Error archiving feedback:', error);
    
    // 📝 LOG ERROR
    await createActivityLog(
      'ARCHIVE',
      'Failed to archive feedback',
      {
        feedbackId: req.params.id,
        errorMessage: error.message,
        affectedRecords: 0
      },
      req,
      'ERROR'
    );
    
    res.status(500).json({ success: false, message: 'Server error while archiving' });
  }
});

// ============================================
// PATCH - Restore Feedback
// ============================================
router.patch('/:id/restore', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isArchive: 'No' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    console.log('♻️ Feedback Restored:', req.params.id);

    // 📝 LOG ACTIVITY: RESTORE
    await createActivityLog(
      'RESTORE',
      `Restored feedback from ${feedback.name}`,
      {
        feedbackId: feedback._id,
        feedbackName: feedback.name,
        email: feedback.email,
        category: feedback.category,
        rating: feedback.rating,
        affectedRecords: 1
      },
      req,
      'SUCCESS'
    );

    res.status(200).json({
      success: true,
      message: 'Feedback restored successfully',
      feedback: feedback
    });

  } catch (error) {
    console.error('Error restoring feedback:', error);
    
    // 📝 LOG ERROR
    await createActivityLog(
      'RESTORE',
      'Failed to restore feedback',
      {
        feedbackId: req.params.id,
        errorMessage: error.message,
        affectedRecords: 0
      },
      req,
      'ERROR'
    );
    
    res.status(500).json({ success: false, message: 'Server error while restoring' });
  }
});

// ============================================
// DELETE - Permanently Delete Feedback
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // 📝 LOG ACTIVITY: DELETE
    await createActivityLog(
      'DELETE',
      `Permanently deleted feedback from ${feedback.name}`,
      {
        feedbackId: req.params.id,
        feedbackName: feedback.name,
        email: feedback.email,
        category: feedback.category,
        rating: feedback.rating,
        affectedRecords: 1
      },
      req,
      'WARNING'
    );

    res.status(200).json({ success: true, message: 'Feedback deleted permanently' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    
    // 📝 LOG ERROR
    await createActivityLog(
      'DELETE',
      'Failed to delete feedback',
      {
        feedbackId: req.params.id,
        errorMessage: error.message,
        affectedRecords: 0
      },
      req,
      'ERROR'
    );
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// GET - Admin Stats
// ============================================
router.get('/admin/stats', async (req, res) => {
  try {
    const matchQuery = { isArchive: { $ne: 'Yes' } };

    const totalFeedback = await Feedback.countDocuments(matchQuery);
    const bugReports = await Feedback.countDocuments({ ...matchQuery, category: 'bug' });
    const suggestions = await Feedback.countDocuments({ ...matchQuery, category: 'suggestion' });
    const general = await Feedback.countDocuments({ ...matchQuery, category: 'general' });

    const feedbackWithRatings = await Feedback.find({ ...matchQuery, rating: { $gt: 0 } });
    const avgRating = feedbackWithRatings.length > 0
      ? feedbackWithRatings.reduce((sum, f) => sum + f.rating, 0) / feedbackWithRatings.length
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        total: totalFeedback,
        bugs: bugReports,
        suggestions: suggestions,
        general: general,
        avgRating: avgRating.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;