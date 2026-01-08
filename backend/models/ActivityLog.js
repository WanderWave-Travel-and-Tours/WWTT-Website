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
            
            // Core Booking Systems
            'Bookings',
            'Packages', 
            'Services', 
            'Hotels',      
            'Tours',
            
            // Marketing & Content
            'Promos', 
            'Blogs', 
            'Testimonials',
            'Posters', 
            'Gallery',
            
            // 🔥 SPECIFIC INQUIRY TYPES (INSTEAD OF GENERIC "Inquiries")
            'Flight Booking',       // For FLIGHT_BOOKING inquiries
            'Visa Application',     // For VISA inquiries
            'Passport',            // For PASSPORT inquiries
            'PSA Documents',       // For PSA inquiries
            'CENOMAR',            // For CENOMAR inquiries
            'General Inquiries',   // For other/general inquiries
            
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

    user: {
        type: String, 
        required: true,
        default: 'System'
    },
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },

    severity: {
        type: String,
        enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
        default: 'INFO'
    },
    
    description: {
        type: String,
        required: true
    },
    
    ipAddress: { 
        type: String, 
        default: 'N/A' 
    },
    
    userAgent: { 
        type: String, 
        default: 'N/A' 
    },
    
    // 🔥 ENHANCED DETAILS FIELD
    details: {
        recordTitle: { type: String, default: null },
        recordId: { type: String, default: null },
        changes: { type: Object, default: null },
        affectedRecords: { type: Number, default: 1 },
        method: { type: String, default: 'N/A' },
        endpoint: { type: String, default: 'N/A' },
        
        // Inquiry-specific fields
        inquiryType: { type: String, default: null },      // 🔥 Store original inquiry type
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
    }
}, {
    timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ module: 1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ 'details.fileUrl': 1 });
activityLogSchema.index({ 'details.inquiryType': 1 }); // 🔥 NEW: Index for inquiry types

module.exports = mongoose.model('ActivityLog', activityLogSchema);