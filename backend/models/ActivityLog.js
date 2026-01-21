// backend/models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'LOGIN', 'LOGOUT', 'RESTORE', 'VIEW', 'EXPORT', 'IMPORT', 'UPLOAD', 'FEATURE', 'UNFEATURE']
    },

    module: {
        type: String,
        required: true,
        enum: [
            // Auth & Users
            'Auth', 
            'Users',
            'Admin Management',
            
            // Core Booking Systems
            'Bookings',
            'Packages', 
            'Services', 
            'Hotels',      
            'Tours',
            'Favorites',
            
            // Marketing & Content
            'Promos', 
            'Blogs', 
            'Testimonials',
            'Posters', 
            'Gallery',
            
            // Specific Inquiry Types
            'Flight Booking',
            'Visa Application',
            'Passport',
            'PSA Documents',
            'CENOMAR',
            'General Inquiries',
            
            // ✅ ADDED: Feedback Module
            'Feedback',
            
            // System
            'System'
        ]
    },
    
    entity: { 
        type: String, 
        default: 'System' 
    },
    
    entityId: { 
        type: mongoose.Schema.Types.ObjectId, 
        default: null 
    },
    
    // Who performed the action
    user: { 
        type: String, 
        required: true 
    }, 
    
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        default: null 
    }, 
    
    adminId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin',
        default: null 
    },

    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default: 'INFO'
    },

    description: { 
        type: String, 
        required: true 
    },
    
    // Technical Details
    ipAddress: { type: String, default: 'N/A' },
    userAgent: { type: String, default: 'N/A' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Request Info
    method: { type: String, default: 'N/A' },
    endpoint: { type: String, default: 'N/A' },
    
    // Inquiry-specific fields
    inquiryType: { type: String, default: null },
    serviceName: { type: String, default: null },
    clientName: { type: String, default: null },
    clientEmail: { type: String, default: null },
    
    // File-related fields for EXPORT actions
    exportFormat: { type: String, default: null },
    fileName: { type: String, default: null },
    fileUrl: { type: String, default: null },
    filePath: { type: String, default: null },
    fileSize: { type: Number, default: null },
    sections: { type: String, default: null },
    exportedAt: { type: String, default: null },
    
    // Additional fields
    duration: { type: String, default: null },
    statusCode: { type: Number, default: null },
    errorMessage: { type: String, default: null },
    errorStack: { type: String, default: null }
}, {
    timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ module: 1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ severity: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);